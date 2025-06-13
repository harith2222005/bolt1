import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
// auth.js or wherever you need JWT_SECRET
import { 
  JWT_SECRET, 
  JWT_EXPIRES_IN,
  CLIENT_URL,
  MONGODB_URI,
  PORT,
  NODE_ENV
} from '../config.js';


import { authenticate } from '../middleware/auth.js';

const router = express.Router();
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
// Generate JWT token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists'
      });
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      activityLogs: [{ action: 'register' }]
    });

    await user.save();
    await user.addActivityLog('register', 'Account created', req);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please login.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [{ username }, { email: username }],
      isActive: true
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login and add activity log
    user.lastLogin = new Date();
    await user.addActivityLog('login', 'User logged in', req);

    // Generate token
    const token = generateToken(user._id);

    // In login route response:
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax', // Changed from 'strict' for better compatibility
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Logout (client-side token removal, but we log the activity)
router.post('/logout', authenticate, async (req, res) => {
  try {
    await req.user.addActivityLog('logout', 'User logged out', req);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (username && username !== req.user.username) {
      updateData.username = username;
    }
    if (email && email !== req.user.email) {
      updateData.email = email;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes to update'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    await user.addActivityLog('profile_update', 'Profile updated', req);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update'
    });
  }
});

export default router;