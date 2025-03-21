import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db';
import crypto from 'crypto';
// think its an error to use the whole user obj here. only need the data / id
// and use adapter pattern to then instantiate the full user obj.

// Define the database user type
interface DbUser {
  id: number;
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt?: string;
}

const router = Router();

router.post('/register', async (req, res) => {
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
    get(email, username) as DbUser | undefined;
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
      const newUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as DbUser;
      
      console.log('User registered successfully:', { 
        userId: newUser.userId 
      });
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json({
        message: 'User registered successfully',
        userId: newUser.userId
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

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').
    get(username) as DbUser | undefined;
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return user data (excluding password)
    console.log('User logged in successfully:', { userId: user.userId });
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      message: 'Login successful',
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

router.post('/logout', (_req, res) => {
  // In a real app with sessions or JWT, you would invalidate the token/session here
  console.log('User logged out');
  res.status(200).json({ message: 'Logout successful' });
});

export default router;
