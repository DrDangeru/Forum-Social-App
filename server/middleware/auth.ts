/// <reference types="node" />
import { Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import process from 'process';
import type { AuthRequest, JwtUserPayload } from '../types/types.js';

// Load environment variables early
dotenv.config();

// --- Configuration Loading (Ideally in a separate config file/module) ---

// Validate essential environment variables on startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is not set.");
  process.exit(1); // Exit if critical secret is missing
}

// Use fallback for less critical env var or validate as needed
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// --- End Configuration Loading ---


export const verifyToken = (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Response | void => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;

    if (typeof decoded !== 'object' || !decoded.userId || !decoded.username) {
      throw new Error('Invalid token payload structure');
    }

    req.user = {
      userId: decoded.userId,
      username: decoded.username
    };
    next();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Token verification failed:', errorMsg);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Admin verification middleware - must be used after verifyToken
export const verifyAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  // Import db here to avoid circular dependency
  const db = require('../db.js').default;
  
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Access denied. Not authenticated.' });
  }

  try {
    const user = db.prepare('SELECT isAdmin FROM users WHERE userId = ?').get(req.user.userId) as { isAdmin: number } | undefined;
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    console.error('Admin verification failed:', error);
    return res.status(500).json({ error: 'Failed to verify admin status.' });
  }
};

export const generateToken = (payload: JwtUserPayload): string => {
  // Ensure JWT_EXPIRES_IN is handled correctly (number string vs time string)
  const expiresIn = /^\d+$/.test(JWT_EXPIRES_IN)
    ? parseInt(JWT_EXPIRES_IN, 10) // Specify radix 10
    : JWT_EXPIRES_IN;

  const options: SignOptions = { expiresIn: expiresIn as number };

  return jwt.sign(payload, JWT_SECRET, options);
};