import { Router, Request } from 'express';
import bcrypt from 'bcrypt';
import db from '../db.js';
import crypto from 'node:crypto';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import dotenv from 'dotenv';
import { User, LoginCredentials } from '../types/types.js';
import cookieParser from 'cookie-parser';

const MAX_LOGIN_HISTORY = 20;

dotenv.config();

/* global process */

const router = Router();
router.use(cookieParser());

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

// Helper: Get client IP from request
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
}

// Helper: Log login attempt and maintain max history
function logLoginAttempt(userId: string, ipAddress: string, userAgent: string | null) {
  // Insert new login record
  db.prepare(`
    INSERT INTO loginHistory (userId, ipAddress, userAgent)
    VALUES (?, ?, ?)
  `).run(userId, ipAddress, userAgent);

  // Keep only the last MAX_LOGIN_HISTORY entries
  db.prepare(`
    DELETE FROM loginHistory 
    WHERE userId = ? AND id NOT IN (
      SELECT id FROM loginHistory 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT ?
    )
  `).run(userId, userId, MAX_LOGIN_HISTORY);
}

// Helper: Check if IP is allowed for user
function isIpAllowed(user: User, clientIp: string): boolean {
  if (!user.ipRestricted) return true;
  return user.allowedIp === clientIp;
}

router.post('/register', async (req: AuthRequest, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { email, password, firstName, lastName, username, isAdmin } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !username) {
      console.log('Missing required fields:', { email: !!email, 
        password: !!password, firstName: !!firstName, lastName: !!lastName, 
        username: !!username });
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').
    get(email, username) as User | undefined;
    if (existingUser) {
      console.log('User already exists:', { email, username });
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate a unique userId
    const userId = crypto.randomUUID();

    // Insert new user
    try {
      const insertStmt = db.prepare(`
        INSERT INTO users (userId, username, email, passwordHash, firstName, lastName , isAdmin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const result = insertStmt.run(userId, username, email, passwordHash, firstName, lastName, isAdmin);
      
      console.log('Insert result:', result);
      
      // Get the newly created user
      const newUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User;
      
      // Generate JWT token and set as cookie
      const token = generateToken({ userId: newUser.userId, username: newUser.username });
      res.cookie('token', token, COOKIE_OPTIONS);

      console.log('User registered successfully:', { userId: newUser.userId });
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json({
        message: 'User registered successfully',
        user: {
          userId: newUser.userId,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          isAdmin: !!newUser.isAdmin
        }
      });
    } catch (dbError) {
      console.error('Database error during registration:', dbError);
      return res.status(500).json({ error: 'Database error during registration', 
        details: dbError });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

router.post('/login', async (req: AuthRequest, res) => {
  try {
    const { username, password } = req.body as LoginCredentials;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').
    get(username) as User | undefined;
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check IP restriction
    const clientIp = getClientIp(req);
    if (!isIpAllowed(user, clientIp)) {
      return res.status(403).json({ 
        error: 'Login from this IP address is not allowed. IP restriction is enabled on this account.' 
      });
    }

    // Log successful login
    const userAgent = req.headers['user-agent'] || null;
    logLoginAttempt(user.userId, clientIp, userAgent);

    // Generate JWT token and set as cookie
    const token = generateToken({ userId: user.userId, username: user.username });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: !!user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

router.get('/me', async (req: AuthRequest, res) => {
  try {
    // Token verification will be handled by auth middleware
    const user = db
      .prepare(
        'SELECT userId, username, email, firstName, lastName, isAdmin FROM users WHERE userId = ?'
      )
      .get(req.user?.userId) as Omit<User, 'passwordHash'> | undefined;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (_req: AuthRequest, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out successfully' });
});

export default router;
