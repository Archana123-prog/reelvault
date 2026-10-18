import mongoose from 'mongoose';

export const DEFAULT_CATEGORIES = [
  { name: 'Educational', icon: '📚', color: '#3B82F6', isDefault: true },
  { name: 'Romantic', icon: '❤️', color: '#EC4899', isDefault: true },
  { name: 'Funny', icon: '😂', color: '#F59E0B', isDefault: true },
  { name: 'Motivational', icon: '🔥', color: '#EF4444', isDefault: true },
  { name: 'Inspirational', icon: '✨', color: '#8B5CF6', isDefault: true },
  { name: 'Music', icon: '🎵', color: '#10B981', isDefault: true },
  { name: 'Food', icon: '🍔', color: '#F97316', isDefault: true },
  { name: 'Travel', icon: '✈️', color: '#06B6D4', isDefault: true },
  { name: 'Fitness', icon: '💪', color: '#14B8A6', isDefault: true },
  { name: 'Other', icon: '📌', color: '#64748B', isDefault: true }
];

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [40, 'Category name cannot exceed 40 characters']
    },
    color: {
      type: String,
      default: '#6366F1',
      trim: true,
      match: [/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Please provide a valid hex color']
    },
    icon: {
      type: String,
      default: '📌',
      trim: true,
      maxlength: 10
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index on user + name to prevent duplicate categories per user
categorySchema.index({ user: 1, name: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
