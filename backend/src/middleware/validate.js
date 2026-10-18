import { z } from 'zod';

export const validate = (schema) => async (req, res, next) => {
  try {
    const parsed = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Assign validated and sanitized values back to req
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      const message = firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation error';
      return res.status(400).json({
        success: false,
        message,
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        })),
        data: null
      });
    }
    next(error);
  }
};

// Common validation schemas
export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must not exceed 50 characters').trim(),
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters long')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required')
  })
});

export const createReelSchema = z.object({
  body: z.object({
    url: z.string().url('Please enter a valid HTTP/HTTPS URL').trim(),
    categoryId: z.string().min(1, 'Please select a category'),
    title: z.string().max(150, 'Title cannot exceed 150 characters').optional().nullable(),
    note: z.string().max(500, 'Note cannot exceed 500 characters').optional().nullable(),
    tags: z.array(z.string()).optional().default([]),
    thumbnail: z.string().url('Thumbnail must be a valid URL').optional().nullable(),
    isFavorite: z.boolean().optional().default(false)
  })
});

export const updateReelSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Reel ID is required')
  }),
  body: z.object({
    categoryId: z.string().optional(),
    title: z.string().max(150, 'Title cannot exceed 150 characters').optional().nullable(),
    note: z.string().max(500, 'Note cannot exceed 500 characters').optional().nullable(),
    tags: z.array(z.string()).optional(),
    thumbnail: z.string().url('Thumbnail must be a valid URL').optional().nullable(),
    isFavorite: z.boolean().optional()
  })
});

export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Category name is required').max(40, 'Category name cannot exceed 40 characters').trim(),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Please provide a valid hex color code').optional(),
    icon: z.string().max(10, 'Icon emoji should be concise').optional()
  })
});
