import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Category, DEFAULT_CATEGORIES } from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_jwt_key_reelvault_development_2026_secure',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

/**
 * @desc    Register a new user, auto-seed default categories, and return JWT
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email address already exists',
      data: null
    });
  }

  const user = await User.create({
    name,
    email,
    password
  });

  // Auto-seed default categories for the new user
  try {
    const categoryDocs = DEFAULT_CATEGORIES.map((cat) => ({
      user: user._id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      isDefault: true
    }));
    await Category.insertMany(categoryDocs);
  } catch (seedErr) {
    console.error('[Category Seed Error]:', seedErr.message);
  }

  const token = signToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful! Welcome to ReelVault.',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    }
  });
});

/**
 * @desc    Authenticate user & return JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      data: null
    });
  }

  const token = signToken(user._id);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    }
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Protected
 */
export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        createdAt: req.user.createdAt
      }
    }
  });
});
