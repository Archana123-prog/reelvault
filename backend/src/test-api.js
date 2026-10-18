import dotenv from 'dotenv';
dotenv.config();
process.env.MONGODB_URI = 'memory';

import assert from 'node:assert/strict';
import axios from 'axios';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const TEST_PORT = 5099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

const runTests = async () => {
  console.log('\n==========================================');
  console.log('🧪 Starting ReelVault Backend API Test Suite');
  console.log('==========================================\n');

  let server;
  try {
    await connectDB();
    server = app.listen(TEST_PORT);
    console.log(`[Test Server] Listening on ${BASE_URL}`);

    // 1. Health check
    console.log('\n1. Testing GET /health');
    const healthRes = await axios.get(`${BASE_URL}/health`);
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.data.status, 'ok');
    console.log('✅ Health check passed:', healthRes.data);

    // 2. Register User 1
    const uniqueEmail = `testuser_${Date.now()}@reelvault.app`;
    console.log(`\n2. Testing POST /auth/register with ${uniqueEmail}`);
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Explorer',
      email: uniqueEmail,
      password: 'SecurePassword123!'
    });
    assert.equal(regRes.status, 201);
    assert.ok(regRes.data.data.token, 'Token should be returned');
    assert.equal(regRes.data.data.user.email, uniqueEmail);
    const token1 = regRes.data.data.token;
    console.log('✅ Registration successful. Token received.');

    // 3. Login
    console.log('\n3. Testing POST /auth/login');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: uniqueEmail,
      password: 'SecurePassword123!'
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.data.data.token);
    console.log('✅ Login successful.');

    // 4. Get Current User profile (/auth/me)
    console.log('\n4. Testing GET /auth/me');
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.data.data.user.name, 'Test Explorer');
    console.log('✅ Profile verification successful.');

    // 5. Check auto-seeded categories
    console.log('\n5. Testing GET /categories (auto-seeded categories)');
    const catRes = await axios.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(catRes.status, 200);
    const categories = catRes.data.data;
    assert.ok(categories.length >= 10, 'Expected at least 10 auto-seeded categories');
    console.log(`✅ Default categories confirmed (${categories.length} categories found).`);

    const educationalCat = categories.find((c) => c.name.toLowerCase() === 'educational');
    assert.ok(educationalCat, 'Educational category should exist');

    // 6. Create custom category
    console.log('\n6. Testing POST /categories (create custom category)');
    const newCatRes = await axios.post(
      `${BASE_URL}/categories`,
      { name: 'Podcasts', icon: '🎙️', color: '#8B5CF6' },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    assert.equal(newCatRes.status, 201);
    const podcastCatId = newCatRes.data.data._id;
    console.log('✅ Custom category "Podcasts" created:', podcastCatId);

    // 7. Save a reel (Instagram reel with tracking query params)
    console.log('\n7. Testing POST /reels (with tracking parameters to test normalization)');
    const rawUrl = 'https://www.instagram.com/reel/C123456789/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==/';
    const reelRes = await axios.post(
      `${BASE_URL}/reels`,
      {
        url: rawUrl,
        categoryId: podcastCatId,
        title: 'Microphone Setup for Crisp Audio',
        note: 'Remember to set gain at 50%',
        tags: ['podcast', 'audio', 'gear']
      },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    assert.equal(reelRes.status, 201);
    const savedReel = reelRes.data.data;
    assert.equal(savedReel.platform, 'instagram', 'Platform should be auto-detected as instagram');
    assert.equal(
      savedReel.url,
      'https://www.instagram.com/reel/C123456789',
      'URL should be normalized with query params stripped'
    );
    console.log('✅ Reel created with platform auto-detection & URL normalization.');

    // 8. Prevent duplicate reel saving
    console.log('\n8. Testing duplicate reel rejection');
    try {
      await axios.post(
        `${BASE_URL}/reels`,
        {
          url: 'https://www.instagram.com/reel/C123456789?another_param=123',
          categoryId: educationalCat._id
        },
        { headers: { Authorization: `Bearer ${token1}` } }
      );
      assert.fail('Duplicate reel should have been rejected');
    } catch (dupErr) {
      assert.equal(dupErr.response.status, 409);
      assert.equal(dupErr.response.data.message, 'You already saved this reel');
      console.log('✅ Duplicate correctly rejected with 409: "You already saved this reel".');
    }

    // 9. Query reels with filters and search
    console.log('\n9. Testing GET /reels with filtering and search');
    const listRes = await axios.get(`${BASE_URL}/reels?search=Microphone&platform=instagram`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(listRes.status, 200);
    assert.equal(listRes.data.data.reels.length, 1);
    assert.equal(listRes.data.data.reels[0]._id, savedReel._id);
    console.log('✅ Reels query, search, and platform filter working properly.');

    // 10. Toggle favorite
    console.log('\n10. Testing PATCH /reels/:id/favorite');
    const favRes = await axios.patch(
      `${BASE_URL}/reels/${savedReel._id}/favorite`,
      {},
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    assert.equal(favRes.status, 200);
    assert.equal(favRes.data.data.isFavorite, true);
    console.log('✅ Favorite toggled to true.');

    // 11. Update reel
    console.log('\n11. Testing PUT /reels/:id');
    const updateRes = await axios.put(
      `${BASE_URL}/reels/${savedReel._id}`,
      { note: 'Updated note: Gain adjusted to 45%' },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.data.data.note, 'Updated note: Gain adjusted to 45%');
    console.log('✅ Reel update successful.');

    // 12. Safe Category Deletion: Reassign reels to "Other"
    console.log('\n12. Testing DELETE /categories/:id (Safe reassignment to Other)');
    const delCatRes = await axios.delete(`${BASE_URL}/categories/${podcastCatId}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(delCatRes.status, 200);
    console.log(`✅ Category deleted safely: ${delCatRes.data.message}`);

    const verifyReelCat = await axios.get(`${BASE_URL}/reels/${savedReel._id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(
      verifyReelCat.data.data.category.name.toLowerCase(),
      'other',
      'Reel should have been reassigned to Other category'
    );
    console.log('✅ Verified reel reassigned to "Other" category.');

    // 13. Test Data Isolation between users
    console.log('\n13. Testing User Data Isolation');
    const user2Res = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Second User',
      email: `user2_${Date.now()}@reelvault.app`,
      password: 'SecurePassword123!'
    });
    const token2 = user2Res.data.data.token;

    // User 2 fetches reels
    const user2Reels = await axios.get(`${BASE_URL}/reels`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    assert.equal(user2Reels.data.data.reels.length, 0, 'User 2 should not see User 1 reels');

    // User 2 cannot access or delete User 1 reel
    try {
      await axios.delete(`${BASE_URL}/reels/${savedReel._id}`, {
        headers: { Authorization: `Bearer ${token2}` }
      });
      assert.fail('User 2 should not be able to delete User 1 reel');
    } catch (unauthErr) {
      assert.equal(unauthErr.response.status, 404);
      console.log('✅ Data isolation confirmed: User 2 cannot see or delete User 1 data.');
    }

    // 14. Delete reel
    console.log('\n14. Testing DELETE /reels/:id by owner');
    const delReelRes = await axios.delete(`${BASE_URL}/reels/${savedReel._id}`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    assert.equal(delReelRes.status, 200);
    console.log('✅ Reel deleted successfully.');

    console.log('\n==========================================');
    console.log('🎉 ALL BACKEND API TESTS PASSED SUCCESSFULLY!');
    console.log('==========================================\n');
  } catch (err) {
    console.error('\n❌ Test failed:', err.response ? err.response.data : err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
};

runTests();
