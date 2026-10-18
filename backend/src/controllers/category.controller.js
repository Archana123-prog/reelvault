import { Category } from '../models/Category.js';
import { Reel } from '../models/Reel.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Get all categories for the logged-in user with reel counts
 * @route   GET /api/categories
 * @access  Protected
 */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ user: req.user._id }).sort({
    isDefault: -1,
    name: 1
  });

  // Calculate reel count for each category
  const categoryCounts = await Reel.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const countMap = {};
  categoryCounts.forEach((item) => {
    countMap[item._id.toString()] = item.count;
  });

  const categoriesWithCounts = categories.map((cat) => ({
    ...cat.toObject(),
    count: countMap[cat._id.toString()] || 0
  }));

  res.status(200).json({
    success: true,
    message: 'Categories fetched successfully',
    data: categoriesWithCounts
  });
});

/**
 * @desc    Create a custom category
 * @route   POST /api/categories
 * @access  Protected
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, color, icon } = req.body;

  const existing = await Category.findOne({
    user: req.user._id,
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message: `A category named "${name.trim()}" already exists.`,
      data: null
    });
  }

  const category = await Category.create({
    user: req.user._id,
    name: name.trim(),
    color: color || '#6366F1',
    icon: icon || '📌',
    isDefault: false
  });

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: {
      ...category.toObject(),
      count: 0
    }
  });
});

/**
 * @desc    Update a category (custom categories or customize defaults)
 * @route   PUT /api/categories/:id
 * @access  Protected
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, color, icon } = req.body;

  const category = await Category.findOne({ _id: id, user: req.user._id });
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found',
      data: null
    });
  }

  if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
    const duplicate = await Category.findOne({
      _id: { $ne: id },
      user: req.user._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: `Another category named "${name.trim()}" already exists.`,
        data: null
      });
    }
    category.name = name.trim();
  }

  if (color) category.color = color;
  if (icon) category.icon = icon;

  await category.save();

  const count = await Reel.countDocuments({ user: req.user._id, category: category._id });

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    data: {
      ...category.toObject(),
      count
    }
  });
});

/**
 * @desc    Delete a category and safely reassign its reels to 'Other'
 * @route   DELETE /api/categories/:id
 * @access  Protected
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findOne({ _id: id, user: req.user._id });
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found',
      data: null
    });
  }

  // Prevent deleting the default fallback "Other" category
  if (category.name.toLowerCase() === 'other') {
    return res.status(400).json({
      success: false,
      message: 'The default "Other" category cannot be deleted.',
      data: null
    });
  }

  // Find or create user's 'Other' category as fallback
  let otherCategory = await Category.findOne({
    user: req.user._id,
    name: { $regex: /^other$/i }
  });

  if (!otherCategory) {
    otherCategory = await Category.create({
      user: req.user._id,
      name: 'Other',
      icon: '📌',
      color: '#64748B',
      isDefault: true
    });
  }

  // Reassign all reels belonging to this category to "Other"
  const reelsMoved = await Reel.updateMany(
    { user: req.user._id, category: category._id },
    { $set: { category: otherCategory._id } }
  );

  await Category.deleteOne({ _id: category._id, user: req.user._id });

  const moveMessage =
    reelsMoved.modifiedCount > 0
      ? `Category "${category.name}" deleted. ${reelsMoved.modifiedCount} reel(s) were moved to "${otherCategory.name}".`
      : `Category "${category.name}" deleted successfully.`;

  res.status(200).json({
    success: true,
    message: moveMessage,
    data: {
      deletedId: id,
      reelsMovedCount: reelsMoved.modifiedCount,
      fallbackCategoryId: otherCategory._id
    }
  });
});
