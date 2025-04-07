/// <reference types="node" />
import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import process from 'process';

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


// --- Auth Module (e.g., auth.ts) ---

export interface AuthRequest extends Request {
  user?: { // more specific type(s) could be implemented
    userId: string;
    username: string;
    // Add other relevant, non-sensitive user fields if needed (e.g., roles)
  };
}

// Define the expected shape of the JWT payload
interface JwtPayload {
  userId: string;
  username: string;
  // iat?: number; // Issued at (added automatically by jwt)
  // exp?: number; // Expiration time (added automatically by jwt)
}

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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

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

export const generateToken = (payload: { userId: string; username: string }): string => {
  // Ensure JWT_EXPIRES_IN is handled correctly (number string vs time string)
  const expiresIn = /^\d+$/.test(JWT_EXPIRES_IN)
    ? parseInt(JWT_EXPIRES_IN, 10) // Specify radix 10
    : JWT_EXPIRES_IN;

  const options: SignOptions = { expiresIn: expiresIn as number };

  return jwt.sign(payload, JWT_SECRET, options);
};