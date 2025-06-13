import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter for general API requests
const generalRateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware_general',
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Rate limiter for authentication endpoints
const authRateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware_auth',
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds
});

// Rate limiter for file upload
const uploadRateLimiter = new RateLimiterMemory({
  keyPrefix: 'middleware_upload',
  points: 10, // Number of uploads
  duration: 300, // Per 5 minutes
});

export const rateLimiter = async (req, res, next) => {
  try {
    const key = req.ip;
    
    // Choose appropriate rate limiter based on route
    let limiter = generalRateLimiter;
    
    if (req.path.includes('/auth/')) {
      limiter = authRateLimiter;
    } else if (req.path.includes('/files/upload')) {
      limiter = uploadRateLimiter;
    }
    
    await limiter.consume(key);
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
      retryAfter: secs
    });
  }
};

export { authRateLimiter, uploadRateLimiter };