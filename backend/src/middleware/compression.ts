/**
 * Response Compression Middleware
 * Compress responses to reduce bandwidth and improve performance
 */
import compression from 'compression';
import { Request, Response } from 'express';

/**
 * Compression middleware with smart filtering
 */
export const compressionMiddleware = compression({
  // Only compress responses larger than 1KB
  threshold: 1024,

  // Compression level (0-9, higher = better compression but slower)
  level: 6,

  // Filter function to determine what to compress
  filter: (req: Request, res: Response) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Don't compress streaming responses
    if (res.getHeader('Content-Type')?.toString().includes('stream')) {
      return false;
    }

    // Don't compress already compressed formats
    const contentType = res.getHeader('Content-Type')?.toString() || '';
    const compressedFormats = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/',
      'audio/',
      'application/zip',
      'application/gzip',
      'application/x-rar',
    ];

    if (compressedFormats.some(format => contentType.includes(format))) {
      return false;
    }

    // Use default compression filter for everything else
    return compression.filter(req, res);
  },
});

/**
 * Cache control middleware
 */
export function cacheControl(maxAge: number = 3600) {
  return (req: Request, res: Response, next: Function) => {
    // Only cache GET requests
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }
    next();
  };
}

/**
 * ETag middleware for conditional requests
 */
export function etag() {
  return (req: Request, res: Response, next: Function) => {
    const originalSend = res.send;

    res.send = function (data: any) {
      // Generate simple ETag from content
      if (data && typeof data === 'string') {
        const hash = Buffer.from(data).toString('base64').substring(0, 27);
        res.setHeader('ETag', `"${hash}"`);

        // Check if client has cached version
        const clientETag = req.headers['if-none-match'];
        if (clientETag === `"${hash}"`) {
          res.status(304);
          return originalSend.call(res, '');
        }
      }

      return originalSend.call(res, data);
    };

    next();
  };
}
