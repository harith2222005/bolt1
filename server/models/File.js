import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  customFilename: {
    type: String,
    required: [true, 'Custom filename is required'],
    trim: true,
    maxlength: [255, 'Filename cannot exceed 255 characters']
  },
  originalFilename: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gridfsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  favorite: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Index for faster queries
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ customFilename: 'text', description: 'text' });
fileSchema.index({ favorite: 1, uploadedBy: 1 });

// Virtual for file links count
fileSchema.virtual('linksCount', {
  ref: 'Link',
  localField: '_id',
  foreignField: 'file',
  count: true
});

// Ensure virtual fields are serialized
fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

export default mongoose.model('File', fileSchema);