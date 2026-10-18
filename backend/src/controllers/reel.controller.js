import { Reel } from '../models/Reel.js';
import { Category } from '../models/Category.js';
import { detectPlatform, normalizeUrl } from '../utils/detectPlatform.js';
import { fetchMetadata } from '../utils/fetchMetadata.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc    Save a new reel
 * @route   POST /api/reels
 * @access  Protected
 */
export const createReel = asyncHandler(async (req, res) => {
  const { url, categoryId, title, note, tags, thumbnail, isFavorite } = req.body;

  // Normalize URL
  let normalizedUrl;
  try {
    normalizedUrl = normalizeUrl(url);
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid URL provided',
      data: null
    });
  }

  // Check if category belongs to user
  const category = await Category.findOne({ _id: categoryId, user: req.user._id });
  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category selected',
      data: null
    });
  }

  // Check if user has already saved this reel
  const existingReel = await Reel.findOne({ user: req.user._id, url: normalizedUrl });
  if (existingReel) {
    return res.status(409).json({
      success: false,
      message: 'You already saved this reel',
      data: null
    });
  }

  // Detect platform automatically
  const platform = detectPlatform(normalizedUrl);

  // Attempt to fetch metadata (title, thumbnail) if not provided by user
  let metaTitle = null;
  let metaThumbnail = null;

  if (!title || !thumbnail) {
    const fetched = await fetchMetadata(normalizedUrl, platform);
    metaTitle = fetched.title;
    metaThumbnail = fetched.thumbnail;
  }

  // Sanitize tags
  let parsedTags = [];
  if (Array.isArray(tags)) {
    parsedTags = tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof tags === 'string') {
    parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const reel = await Reel.create({
    user: req.user._id,
    url: normalizedUrl,
    platform,
    category: category._id,
    title: (title && title.trim()) || metaTitle || '',
    note: (note && note.trim()) || '',
    tags: parsedTags,
    thumbnail: thumbnail || metaThumbnail || null,
    isFavorite: Boolean(isFavorite)
  });

  const populated = await Reel.findById(reel._id).populate('category', 'name color icon');

  res.status(201).json({
    success: true,
    message: 'Reel saved successfully!',
    data: populated
  });
});

/**
 * @desc    Get saved reels with search, filters, pagination, and sorting
 * @route   GET /api/reels
 * @access  Protected
 */
export const getReels = asyncHandler(async (req, res) => {
  const { category, platform, search, favorite, page = 1, limit = 12, sort = 'newest' } = req.query;

  const filter = { user: req.user._id };

  // Category filter
  if (category && category !== 'all') {
    filter.category = category;
  }

  // Platform filter
  if (platform && platform !== 'all') {
    filter.platform = platform.toLowerCase();
  }

  // Favorite filter
  if (favorite === 'true') {
    filter.isFavorite = true;
  }

  // Search keyword across title, note, and tags
  if (search && search.trim()) {
    const queryTerm = search.trim();
    filter.$or = [
      { title: { $regex: queryTerm, $options: 'i' } },
      { note: { $regex: queryTerm, $options: 'i' } },
      { tags: { $regex: queryTerm, $options: 'i' } }
    ];
  }

  // Pagination parameters
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  const [total, reels] = await Promise.all([
    Reel.countDocuments(filter),
    Reel.find(filter)
      .sort(sortOrder)
      .skip(skip)
      .limit(limitNum)
      .populate('category', 'name color icon')
      .lean()
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  res.status(200).json({
    success: true,
    message: 'Reels fetched successfully',
    data: {
      reels,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore: pageNum < totalPages
      }
    }
  });
});

/**
 * @desc    Get single reel by ID
 * @route   GET /api/reels/:id
 * @access  Protected
 */
export const getReelById = asyncHandler(async (req, res) => {
  const reel = await Reel.findOne({
    _id: req.params.id,
    user: req.user._id
  }).populate('category', 'name color icon');

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
      data: null
    });
  }

  res.status(200).json({
    success: true,
    message: 'Reel retrieved successfully',
    data: reel
  });
});

/**
 * @desc    Update a saved reel
 * @route   PUT /api/reels/:id
 * @access  Protected
 */
export const updateReel = asyncHandler(async (req, res) => {
  const { categoryId, title, note, tags, thumbnail, isFavorite } = req.body;

  const reel = await Reel.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
      data: null
    });
  }

  if (categoryId) {
    const category = await Category.findOne({ _id: categoryId, user: req.user._id });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected',
        data: null
      });
    }
    reel.category = category._id;
  }

  if (title !== undefined) reel.title = title ? title.trim() : '';
  if (note !== undefined) reel.note = note ? note.trim() : '';
  if (thumbnail !== undefined) reel.thumbnail = thumbnail;
  if (isFavorite !== undefined) reel.isFavorite = Boolean(isFavorite);

  if (tags !== undefined) {
    if (Array.isArray(tags)) {
      reel.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      reel.tags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }
  }

  await reel.save();

  const updatedReel = await Reel.findById(reel._id).populate('category', 'name color icon');

  res.status(200).json({
    success: true,
    message: 'Reel updated successfully',
    data: updatedReel
  });
});

/**
 * @desc    Delete a saved reel
 * @route   DELETE /api/reels/:id
 * @access  Protected
 */
export const deleteReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
      data: null
    });
  }

  res.status(200).json({
    success: true,
    message: 'Reel deleted successfully',
    data: {
      deletedId: req.params.id
    }
  });
});

/**
 * @desc    Toggle favorite status of a reel
 * @route   PATCH /api/reels/:id/favorite
 * @access  Protected
 */
export const toggleFavorite = asyncHandler(async (req, res) => {
  const reel = await Reel.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!reel) {
    return res.status(404).json({
      success: false,
      message: 'Reel not found',
      data: null
    });
  }

  reel.isFavorite = !reel.isFavorite;
  await reel.save();

  res.status(200).json({
    success: true,
    message: reel.isFavorite ? 'Added to favorites' : 'Removed from favorites',
    data: {
      id: reel._id,
      isFavorite: reel.isFavorite
    }
  });
});
