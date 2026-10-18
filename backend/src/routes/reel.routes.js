import express from 'express';
import {
  createReel,
  getReels,
  getReelById,
  updateReel,
  deleteReel,
  toggleFavorite
} from '../controllers/reel.controller.js';
import { protect } from '../middleware/auth.js';
import { validate, createReelSchema, updateReelSchema } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .post(validate(createReelSchema), createReel)
  .get(getReels);

router.route('/:id')
  .get(getReelById)
  .put(validate(updateReelSchema), updateReel)
  .delete(deleteReel);

router.patch('/:id/favorite', toggleFavorite);

export default router;
