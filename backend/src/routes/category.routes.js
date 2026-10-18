import express from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/category.controller.js';
import { protect } from '../middleware/auth.js';
import { validate, categorySchema } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCategories)
  .post(validate(categorySchema), createCategory);

router.route('/:id')
  .put(validate(categorySchema), updateCategory)
  .delete(deleteCategory);

export default router;
