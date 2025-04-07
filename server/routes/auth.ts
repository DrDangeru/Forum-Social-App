import { Router, Request } from 'express';
import bcrypt from 'bcrypt';
import db from '../db';
import crypto from 'node:crypto';
import { generateToken } from '../middleware/auth';
import dotenv from 'dotenv';
import { User } from '../types';
import cookieParser from 'cookie-parser';

dotenv.config();

/* global process */

interface LoginCredentials {
  username: string;
  password: string;
}

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

const router = Router();
router.use(cookieParser());

// Cookie configuration
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
};

router.post('/register', async (req: AuthRequest, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { email, password, firstName, lastName, username } = req.body;

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
        INSERT INTO users (userId, username, email, passwordHash, firstName, lastName)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = insertStmt.run(userId, username, email, passwordHash, firstName, lastName);
      
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
          lastName: newUser.lastName
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

    // Generate JWT token and set as cookie
    const token = generateToken({ userId: user.userId, username: user.username });
    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
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
        'SELECT userId, username, email, firstName, lastName FROM users WHERE userId = ?'
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
