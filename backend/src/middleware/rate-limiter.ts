/**
 * Rate Limiting Middleware
 * Protect API from abuse and ensure fair usage
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(req: Request): string {
    // Use IP address as key (could also use user ID if authenticated)
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();

      // Initialize or reset if window expired
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 0,
          resetTime: now + this.config.windowMs,
        };
      }

      // Increment request count
      this.store[key].count++;

      // Set rate limit headers
      const remaining = Math.max(0, this.config.maxRequests - this.store[key].count);
      const resetTime = Math.ceil(this.store[key].resetTime / 1000);

      res.setHeader('X-RateLimit-Limit', this.config.maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      // Check if limit exceeded
      if (this.store[key].count > this.config.maxRequests) {
        logger.warn(
          { ip: key, path: req.path, count: this.store[key].count },
          'Rate limit exceeded'
        );

        res.setHeader('Retry-After', Math.ceil((this.store[key].resetTime - now) / 1000));

        return res.status(429).json({
          error: 'Too Many Requests',
          message: this.config.message,
          retryAfter: Math.ceil((this.store[key].resetTime - now) / 1000),
        });
      }

      // Handle response to potentially skip counting
      const originalSend = res.send;
      res.send = function (data: any) {
        const statusCode = res.statusCode;

        // Skip counting based on config
        if (
          (this.config.skipSuccessfulRequests && statusCode < 400) ||
          (this.config.skipFailedRequests && statusCode >= 400)
        ) {
          this.store[key].count--;
        }

        return originalSend.call(res, data);
      }.bind(this);

      next();
    };
  }
}

// Export rate limiters for different endpoints
export const generalLimiter = new RateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute (reduced for development)
  maxRequests: 1000, // Increased for development
  message: 'Too many requests from this IP, please try again later.',
});

export const authLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

export const uploadLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  message: 'Too many file uploads, please try again later.',
});

export const qubicRpcLimiter = new RateLimiter({
  windowMs: 1000, // 1 second
  maxRequests: 10,
  message: 'Too many blockchain requests, please slow down.',
});

export const createRateLimiter = (config: RateLimitConfig) => {
  return new RateLimiter(config);
};
