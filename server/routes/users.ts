import express from 'express';
import type { Request, Response } from 'express';
import db from '../db';
import type { BasicProfile } from '../types';

const router = express.Router();

// Search for users by name, email, or username
router.get('/search', (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchTerm = `%${q}%`;
    
    const users = db.prepare(`
      SELECT 
        id as userId, 
        username, 
        firstName, 
        lastName, 
        avatarUrl
      FROM users
      WHERE 
        username LIKE ? OR
        firstName LIKE ? OR
        lastName LIKE ? OR
        email LIKE ?
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm, searchTerm) as BasicProfile[];
    
    res.json(users);
  } catch (error) {
    console.error('Error searching for users:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Get user by ID
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = db.prepare(`
      SELECT 
        id as userId, 
        username as userNickname, 
        firstName, 
        lastName, 
        avatarUrl
      FROM users
      WHERE id = ?
    `).get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
