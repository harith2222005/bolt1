import express from 'express';
import crypto from 'crypto';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import Link from '../models/Link.js';
import File from '../models/File.js';
import User from '../models/User.js';

const router = express.Router();

// GridFS setup
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

// Generate unique link ID
const generateLinkId = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Create new link
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      fileId,
      customName,
      expirationType = 'none',
      expirationValue,
      accessLimit,
      verificationType = 'none',
      verificationValue,
      accessScope = 'public',
      allowedUsers = [],
      downloadAllowed = false,
      description = ''
    } = req.body;

    // Validate required fields
    if (!fileId || !customName) {
      return res.status(400).json({
        success: false,
        message: 'File ID and custom name are required'
      });
    }

    // Check if file exists and user has access
    const file = await File.findOne({
      _id: fileId,
      isActive: true
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    if (file.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this file'
      });
    }

    // Validate expiration settings
    if (expirationType === 'duration' && (!expirationValue || expirationValue <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Valid expiration duration is required'
      });
    }

    if (expirationType === 'date' && (!expirationValue || new Date(expirationValue) <= new Date())) {
      return res.status(400).json({
        success: false,
        message: 'Valid future expiration date is required'
      });
    }

    // Validate verification settings
    if (verificationType !== 'none' && !verificationValue) {
      return res.status(400).json({
        success: false,
        message: 'Verification value is required when verification is enabled'
      });
    }

    // Validate allowed users for selected access scope
    if (accessScope === 'selected' && (!allowedUsers || allowedUsers.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'At least one user must be selected for selected access scope'
      });
    }

    // Create the link
    const link = new Link({
      linkId: generateLinkId(),
      customName,
      file: fileId,
      createdBy: req.user._id,
      expirationType,
      expirationValue: expirationType === 'date' ? new Date(expirationValue).getTime() : expirationValue,
      accessLimit,
      verificationType,
      verificationValue,
      accessScope,
      allowedUsers: accessScope === 'selected' ? allowedUsers : [],
      downloadAllowed,
      description
    });

    await link.save();
    await req.user.addActivityLog('link_create', `Created link: ${customName}`, req);

    // Populate the response
    await link.populate([
      { path: 'file', select: 'customFilename originalFilename mimetype size' },
      { path: 'createdBy', select: 'username email' },
      { path: 'allowedUsers', select: 'username email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Link created successfully',
      link
    });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating link'
    });
  }
});

// Get user's links
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      active = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {
      createdBy: req.user._id
    };

    if (search) {
      query.$or = [
        { customName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (active !== '') {
      query.isActive = active === 'true';
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const links = await Link.find(query)
      .populate('file', 'customFilename originalFilename mimetype size')
      .populate('createdBy', 'username email')
      .populate('allowedUsers', 'username email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Link.countDocuments(query);

    res.json({
      success: true,
      links,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching links'
    });
  }
});

// Get recent links (for home dashboard)
router.get('/recent', authenticate, async (req, res) => {
  try {
    const links = await Link.find({
      createdBy: req.user._id
    })
    .populate('file', 'customFilename originalFilename mimetype size')
    .populate('createdBy', 'username email')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      links
    });
  } catch (error) {
    console.error('Get recent links error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent links'
    });
  }
});

// Access link (public endpoint)
router.get('/access/:linkId', optionalAuth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { password, username } = req.query;

    const link = await Link.findOne({ 
      linkId,
      isActive: true 
    }).populate('file').populate('allowedUsers', 'username email');

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found or inactive'
      });
    }

    // Check if link is expired
    if (link.isExpired()) {
      return res.status(410).json({
        success: false,
        message: 'Link has expired'
      });
    }

    // Check access limit
    if (link.isAccessLimitReached()) {
      return res.status(429).json({
        success: false,
        message: 'Access limit reached for this link'
      });
    }

    // Check access scope
    if (link.accessScope === 'users' && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access this link'
      });
    }

    if (link.accessScope === 'selected') {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access this link'
        });
      }
      
      const isAllowed = link.allowedUsers.some(
        allowedUser => allowedUser._id.toString() === req.user._id.toString()
      );
      
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this link'
        });
      }
    }

    // Check verification
    if (link.verificationType === 'password') {
      if (!password || password !== link.verificationValue) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    if (link.verificationType === 'username') {
      if (!username || username !== link.verificationValue) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username'
        });
      }
    }

    // Log the access
    await link.addAccessLog(req.user, req);

    // Return link info and file metadata (but not the actual file)
    res.json({
      success: true,
      link: {
        id: link._id,
        customName: link.customName,
        description: link.description,
        downloadAllowed: link.downloadAllowed,
        file: {
          id: link.file._id,
          customFilename: link.file.customFilename,
          originalFilename: link.file.originalFilename,
          mimetype: link.file.mimetype,
          size: link.file.size
        }
      }
    });
  } catch (error) {
    console.error('Access link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error accessing link'
    });
  }
});

// Download file via link
router.get('/download/:linkId', optionalAuth, async (req, res) => {
  try {
    const { linkId } = req.params;
    const { password, username } = req.query;

    const link = await Link.findOne({ 
      linkId,
      isActive: true 
    }).populate('file').populate('allowedUsers', 'username email');

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found or inactive'
      });
    }

    // Check if download is allowed
    if (!link.downloadAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Download is not allowed for this link'
      });
    }

    // All the same checks as access endpoint
    if (link.isExpired()) {
      return res.status(410).json({
        success: false,
        message: 'Link has expired'
      });
    }

    if (link.isAccessLimitReached()) {
      return res.status(429).json({
        success: false,
        message: 'Access limit reached for this link'
      });
    }

    if (link.accessScope === 'users' && !req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (link.accessScope === 'selected') {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      const isAllowed = link.allowedUsers.some(
        allowedUser => allowedUser._id.toString() === req.user._id.toString()
      );
      
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access this link'
        });
      }
    }

    if (link.verificationType === 'password') {
      if (!password || password !== link.verificationValue) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }

    if (link.verificationType === 'username') {
      if (!username || username !== link.verificationValue) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username'
        });
      }
    }

    // Create download stream from GridFS
    const downloadStream = gfsBucket.openDownloadStream(link.file.gridfsId);

    downloadStream.on('error', (error) => {
      console.error('Download stream error:', error);
      res.status(404).json({
        success: false,
        message: 'File not found in storage'
      });
    });

    // Set headers for file download
    res.set({
      'Content-Type': link.file.mimetype,
      'Content-Disposition': `attachment; filename="${link.file.originalFilename}"`
    });

    // Log the download access
    await link.addAccessLog(req.user, req);

    // Increment file download count
    link.file.downloadCount += 1;
    await link.file.save();

    // Pipe the file to response
    downloadStream.pipe(res);

  } catch (error) {
    console.error('Download via link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during download'
    });
  }
});

// Toggle link active status
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const link = await Link.findOne({
      _id: req.params.id
    });

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    // Check permissions
    if (link.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    link.isActive = !link.isActive;
    await link.save();

    res.json({
      success: true,
      message: `Link ${link.isActive ? 'activated' : 'deactivated'} successfully`,
      link
    });
  } catch (error) {
    console.error('Toggle link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error toggling link status'
    });
  }
});

// Delete link
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);

    if (!link) {
      return res.status(404).json({
        success: false,
        message: 'Link not found'
      });
    }

    // Check permissions
    if (link.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'superuser') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Link.findByIdAndDelete(req.params.id);
    await req.user.addActivityLog('link_delete', `Deleted link: ${link.customName}`, req);

    res.json({
      success: true,
      message: 'Link deleted successfully'
    });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting link'
    });
  }
});

// Get all links (superuser only)
router.get('/admin/all', authenticate, authorize('superuser'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { customName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const links = await Link.find(query)
      .populate('file', 'customFilename originalFilename')
      .populate('createdBy', 'username email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Link.countDocuments(query);

    res.json({
      success: true,
      links,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin get links error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching links'
    });
  }
});

export default router;