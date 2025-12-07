/**
 * Authentication Routes (Placeholder)
 * 
 * Note: The current Prisma schema uses Qubic wallet addresses for user identification.
 * This auth module provides placeholder endpoints for future email/password authentication.
 * 
 * Current authentication flow:
 * - Users connect via Qubic wallet address
 * - No password-based authentication in MVP
 */

import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import qubicWallet from '../services/qubic-wallet';
import { encryptSeed, decryptSeed } from '../utils/crypto';
import { authLimiter } from '../middleware/rate-limiter';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// ============================================
// POST /api/auth/register-email
// Register new user with email/password + auto wallet creation
// ============================================
router.post('/register-email', async (req: Request, res: Response) => {
  try {
    const { email, password, username, role } = req.body;

    // Validate email (RFC 5322 simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Valid email is required'
      });
    }

    // Validate password (8+ chars, uppercase, lowercase, number)
    if (!password || password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters'
      });
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.status(400).json({
        error: 'Password must contain uppercase, lowercase, and number'
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email already registered'
      });
    }

    // 1. Hash password with bcrypt cost 10
    const passwordHash = await bcrypt.hash(password, 10);

    // 2. Create Qubic wallet automatically
    console.log('🔑 Creating Qubic wallet for new user...');
    const wallet = await qubicWallet.createWallet();
    const qubicAddress = wallet.identity;
    
    // 3. Encrypt seed with user's password
    const encryptedSeed = encryptSeed(wallet.seed, password);

    // 4. Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        qubicAddress,
        qubicSeedEnc: encryptedSeed,
        username: username || null,
        role: role || 'CONSUMER'
      }
    });

    // 5. Generate JWT
    const token = jwt.sign(
      { userId: user.id, qubicAddress: user.qubicAddress },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User created and wallet generated successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        qubicAddress: user.qubicAddress,
        role: user.role
      },
      wallet: {
        identity: wallet.identity,
        seed: wallet.seed // Return seed ONCE for user to save
      },
      warning: '⚠️ IMPORTANT: Save your seed phrase! This is the only time it will be shown.'
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Failed to register user',
      details: error.message
    });
  }
});

// ============================================
// POST /api/auth/login-email
// Login with email/password (Rate limited: 5 attempts per 15 minutes)
// ============================================
router.post('/login-email', authLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password - user must have qubicSeedEnc which contains encrypted data
    if (!user.qubicSeedEnc) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }
    
    // Try to decrypt seed with provided password - if it fails, password is wrong
    try {
      decryptSeed(user.qubicSeedEnc, password);
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, qubicAddress: user.qubicAddress },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Get balance from Qubic (optional)
    let balance = user.balance;
    try {
      await qubicWallet.initializeClient();
      const balanceInfo = await qubicWallet.getBalance(user.qubicAddress);
      balance = balanceInfo.energyQubic;
      await qubicWallet.close();
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Continue with stored balance
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        qubicAddress: user.qubicAddress,
        role: user.role,
        balance
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to login',
      details: error.message
    });
  }
});

// ============================================
// POST /api/auth/register
// Register new user with Qubic wallet (LEGACY - keep for compatibility)
// ============================================
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { qubicAddress, username, role } = req.body;

    // Validate input
    if (!qubicAddress) {
      return res.status(400).json({
        error: 'Qubic address is required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { qubicAddress }
    });

    if (existingUser) {
      // Return existing user
      const token = jwt.sign(
        { userId: existingUser.id, qubicAddress: existingUser.qubicAddress },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return res.json({
        success: true,
        message: 'User already exists',
        token,
        user: existingUser
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        qubicAddress,
        username: username || null,
        role: role || 'CONSUMER'
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, qubicAddress: user.qubicAddress },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Failed to register user',
      details: error.message
    });
  }
});

// ============================================
// POST /api/auth/login
// Login user with Qubic wallet address
// ============================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { qubicAddress } = req.body;

    // Validate input
    if (!qubicAddress) {
      return res.status(400).json({
        error: 'Qubic address is required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { qubicAddress }
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found. Please register first.'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, qubicAddress: user.qubicAddress },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Get balance from Qubic (optional)
    let balance = user.balance;
    try {
      await qubicWallet.initializeClient();
      const balanceInfo = await qubicWallet.getBalance(qubicAddress);
      balance = balanceInfo.energyQubic;
      await qubicWallet.close();
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Continue with stored balance
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        ...user,
        balance
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to login',
      details: error.message
    });
  }
});

// ============================================
// GET /api/auth/me
// Get current user info
// ============================================
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        providers: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get balance
    let balance = user.balance;
    try {
      await qubicWallet.initializeClient();
      const balanceInfo = await qubicWallet.getBalance(user.qubicAddress);
      balance = balanceInfo.energyQubic;
      await qubicWallet.close();
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }

    res.json({
      success: true,
      user: {
        ...user,
        balance
      }
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user info',
      details: error.message
    });
  }
});

// ============================================
// POST /api/auth/create-wallet
// Create a new Qubic wallet
// ============================================
router.post('/create-wallet', async (req: Request, res: Response) => {
  try {
    console.log('🔑 Creating new Qubic wallet...');
    const wallet = await qubicWallet.createWallet();

    res.json({
      success: true,
      message: 'Wallet created successfully',
      wallet: {
        identity: wallet.identity,
        seed: wallet.seed
      },
      warning: '⚠️ IMPORTANT: Save your seed phrase in a secure location. We cannot recover it if lost!'
    });

  } catch (error: any) {
    console.error('Create wallet error:', error);
    res.status(500).json({
      error: 'Failed to create wallet',
      details: error.message
    });
  }
});

// ============================================
// POST /api/auth/import-wallet
// Import existing Qubic wallet
// ============================================
router.post('/import-wallet', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { seed } = req.body;

    if (!seed) {
      return res.status(400).json({
        error: 'Seed is required'
      });
    }

    // Import wallet
    const wallet = await qubicWallet.importWallet(seed);

    // Update user's qubic address
    await prisma.user.update({
      where: { id: userId },
      data: {
        qubicAddress: wallet.identity
      }
    });

    res.json({
      success: true,
      message: 'Wallet imported successfully',
      identity: wallet.identity
    });

  } catch (error: any) {
    console.error('Import wallet error:', error);
    res.status(500).json({
      error: 'Failed to import wallet',
      details: error.message
    });
  }
});

// ============================================
// Middleware: Authenticate JWT Token
// ============================================
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({
        error: 'Invalid or expired token'
      });
    }

    (req as any).user = user;
    next();
  });
}

// Export middleware for use in other routes
export { authenticateToken };
export default router;
