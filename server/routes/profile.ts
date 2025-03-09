import express from 'express';
import type { Request, Response } from 'express';
import db from '../db';

const router = express.Router();

// Get user profile information
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = db.prepare(`
      SELECT id, username, email, avatar_url, first_name, last_name, created_at
      FROM users WHERE id = ?
    `).get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get follower count
    const followerCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE following_id = ?
    `).get(userId) as { count: number };
    
    // Get following count
    const followingCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE follower_id = ?
    `).get(userId) as { count: number };
    
    res.json({
      ...user,
      followerCount: followerCountResult.count,
      followingCount: followingCountResult.count
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Update profile details
router.put('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, bio } = req.body;
    
    // Update user profile
    db.prepare(`
      UPDATE users 
      SET first_name = ?, last_name = ?, bio = ?
      WHERE id = ?
    `).run(firstName, lastName, bio, userId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
