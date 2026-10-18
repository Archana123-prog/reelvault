export const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Handle PostgreSQL & MongoDB duplicate key error (code '23505' or 11000)
  if (err.code === '23505' || err.code === 11000) {
    statusCode = 409;
    const detail = (err.detail || err.message || '').toLowerCase();
    if (detail.includes('url')) {
      message = 'You already saved this reel';
    } else if (detail.includes('email')) {
      message = 'An account with this email address already exists';
    } else if (detail.includes('name') || detail.includes('category')) {
      message = 'A category with this name already exists';
    } else {
      message = 'A record with this information already exists';
    }
  }

  // Handle PostgreSQL foreign key violation (code '23503')
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference: The associated category or user was not found';
  }

  // Handle PostgreSQL invalid UUID / ID format (code '22P02')
  if (err.code === '22P02' || err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID format';
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = err.errors?.[0]?.message || 'Validation error';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Log in non-production
  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('[Error Details]:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
