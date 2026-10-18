import mongoose from 'mongoose';

const reelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    url: {
      type: String,
      required: [true, 'Reel URL is required'],
      trim: true
    },
    platform: {
      type: String,
      enum: ['instagram', 'youtube', 'tiktok', 'facebook', 'twitter', 'other'],
      default: 'other',
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please assign a category to this reel'],
      index: true
    },
    title: {
      type: String,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      trim: true,
      default: ''
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
      trim: true,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    },
    thumbnail: {
      type: String,
      trim: true,
      default: null
    },
    isFavorite: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent saving the exact same URL twice for the same user
reelSchema.index({ user: 1, url: 1 }, { unique: true });

// Optimize category filtering for user
reelSchema.index({ user: 1, category: 1 });

// Full-text search index for keyword searches
reelSchema.index({
  title: 'text',
  note: 'text',
  tags: 'text'
});

export const Reel = mongoose.model('Reel', reelSchema);
