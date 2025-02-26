import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db';
import { User } from '../types/auth';

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
    get(email, username);
    if (existingUser) {
      console.log('User already exists:', { email, username });
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, first_name, last_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(username, email, passwordHash, firstName, lastName);

    console.log('User registered successfully:', { userId: result.lastInsertRowid });
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({
      message: 'User registered successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      console.log('Missing required fields:', { username: !!username, password: !!password });
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      console.log('User not found:', { username });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.log('Password mismatch for user:', { username });
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return user data (excluding password)
    console.log('User logged in successfully:', { userId: user.id });
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

router.post('/logout', (req, res) => {
  // In a real app with sessions or JWT, you would invalidate the token/session here
  console.log('User logged out');
  res.status(200).json({ message: 'Logout successful' });
});

export default router;
