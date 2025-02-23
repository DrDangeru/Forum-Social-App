import { Router } from 'express';
import bcrypt from 'bcrypt';
import db from '../db';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ? OR username = ?').
    get(email, username);
    if (existingUser) {
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

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
