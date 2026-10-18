import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/db.js';
import { User } from './models/User.js';
import { Category, DEFAULT_CATEGORIES } from './models/Category.js';
import { Reel } from './models/Reel.js';

const sampleReelsData = [
  {
    url: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    platform: 'youtube',
    categoryName: 'Music',
    title: 'Never Gonna Give You Up - Short Edition',
    note: 'The classic classic hit that never gets old!',
    tags: ['classic', 'rickroll', 'music'],
    isFavorite: true
  },
  {
    url: 'https://www.instagram.com/reel/C8xyz123abc',
    platform: 'instagram',
    categoryName: 'Educational',
    title: '10 JavaScript Tips Every Senior Developer Knows',
    note: 'Great refresher on event loops and microtask queue priorities.',
    tags: ['javascript', 'webdev', 'coding'],
    isFavorite: true
  },
  {
    url: 'https://www.tiktok.com/@chefjack/video/7192837461928374',
    platform: 'tiktok',
    categoryName: 'Food',
    title: 'Crispy Garlic Butter Potatoes in 15 Minutes',
    note: 'Super quick recipe to make for evening snacks.',
    tags: ['cooking', 'potatoes', 'recipe'],
    isFavorite: false
  },
  {
    url: 'https://www.youtube.com/shorts/k9Z87abc123',
    platform: 'youtube',
    categoryName: 'Motivational',
    title: 'Daily Discipline Over Motivation',
    note: 'Focus on showing up every single day even when you do not feel like it.',
    tags: ['mindset', 'habits', 'focus'],
    isFavorite: true
  },
  {
    url: 'https://x.com/techinsider/status/17892348712398',
    platform: 'twitter',
    categoryName: 'Inspirational',
    title: 'AI robotics breakthrough demo showcase',
    note: 'Mind blowing robotic agility demonstration.',
    tags: ['ai', 'future', 'robotics'],
    isFavorite: false
  },
  {
    url: 'https://www.facebook.com/reel/987123456789',
    platform: 'facebook',
    categoryName: 'Funny',
    title: 'When your cat thinks it is a dog',
    note: 'Hilarious video of a cat fetching tennis balls.',
    tags: ['pets', 'funny', 'cats'],
    isFavorite: false
  }
];

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Setting up demo user...');
    const demoEmail = 'demo@reelvault.app';
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        name: 'Alex Mercer',
        email: demoEmail,
        password: 'Password123'
      });
      console.log(`[Seed] Created demo user: ${demoEmail} (Password: Password123)`);
    } else {
      console.log(`[Seed] Found existing demo user: ${demoEmail}`);
    }

    // Ensure default categories exist for demo user
    let userCategories = await Category.find({ user: user._id });
    if (userCategories.length === 0) {
      const categoryDocs = DEFAULT_CATEGORIES.map((c) => ({
        user: user._id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        isDefault: true
      }));
      userCategories = await Category.insertMany(categoryDocs);
      console.log(`[Seed] Seeded ${userCategories.length} default categories`);
    }

    const categoryMap = {};
    userCategories.forEach((cat) => {
      categoryMap[cat.name.toLowerCase()] = cat._id;
    });

    // Seed sample reels if none exist for user
    const reelCount = await Reel.countDocuments({ user: user._id });
    if (reelCount === 0) {
      const reelDocs = sampleReelsData.map((r) => ({
        user: user._id,
        url: r.url,
        platform: r.platform,
        category: categoryMap[r.categoryName.toLowerCase()] || userCategories[0]._id,
        title: r.title,
        note: r.note,
        tags: r.tags,
        isFavorite: r.isFavorite
      }));

      await Reel.insertMany(reelDocs);
      console.log(`[Seed] Inserted ${reelDocs.length} sample reels!`);
    } else {
      console.log(`[Seed] User already has ${reelCount} reels. Skipping reel insert.`);
    }

    console.log('[Seed] Seeding completed successfully! 🚀');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    await disconnectDB();
    process.exit(1);
  }
};

seedData();
