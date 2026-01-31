import { Router, Response } from 'express';
import db from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get regional activity - posts from users in the same region
router.get('/activity', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's region
    const userRegion = db.prepare('SELECT region FROM users WHERE userId = ?')
    .get(userId) as { region: string | null } | undefined;
    
    if (!userRegion || !userRegion.region) {
      return res.json({ 
        posts: [], 
        region: null,
        message: 'No region set for user'
      });
    }

    // Get recent posts from users in the same region
    const posts = db.prepare(`
      SELECT 
        p.id,
        p.content,
        p.imageUrl,
        p.createdAt,
        t.id as topicId,
        t.title as topicTitle,
        u.userId,
        u.username,
        u.firstName,
        u.lastName,
        u.avatarUrl
      FROM posts p
      JOIN users u ON p.createdBy = u.userId
      JOIN topics t ON p.topicId = t.id
      WHERE u.region = ? 
        AND u.userId != ?
        AND p.createdAt > datetime('now', '-7 days')
      ORDER BY p.createdAt DESC
      LIMIT 10
    `).all(userRegion.region, userId);

    res.json({ 
      posts,
      region: userRegion.region
    });
  } catch (error) {
    console.error('Error fetching regional activity:', error);
    res.status(500).json({ error: 'Failed to fetch regional activity' });
  }
});

// Get friends with recent activity
router.get('/friends-activity', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get accepted friends (friendships are bidirectional, so only check one direction)
    const friends = db.prepare(`
      SELECT 
        u.userId,
        u.username,
        u.firstName,
        u.lastName,
        u.avatarUrl,
        u.region,
        COUNT(p.id) as recentPosts
      FROM users u
      JOIN friendships f ON f.friendId = u.userId
      LEFT JOIN posts p ON p.createdBy = u.userId 
        AND p.createdAt > datetime('now', '-7 days')
      WHERE f.userId = ?
        AND f.status = 'accepted'
      GROUP BY u.userId
      ORDER BY recentPosts DESC, u.username
      LIMIT 10
    `).all(userId);

    res.json({ friends });
  } catch (error) {
    console.error('Error fetching friends activity:', error);
    res.status(500).json({ error: 'Failed to fetch friends activity' });
  }
});

// Get followed topics with recent activity
router.get('/followed-topics', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const topics = db.prepare(`
      SELECT 
        t.id as topicId,
        t.title as topicTitle,
        t.description as topicDescription,
        t.createdBy,
        COUNT(p.id) as recentPosts
      FROM topics t
      JOIN follows f ON f.topicId = t.id
      LEFT JOIN posts p ON p.topicId = t.id 
        AND p.createdAt > datetime('now', '-7 days')
      WHERE f.followerId = ?
      GROUP BY t.id
      ORDER BY recentPosts DESC, t.title
      LIMIT 10
    `).all(userId);

    res.json({ topics });
  } catch (error) {
    console.error('Error fetching followed topics:', error);
    res.status(500).json({ error: 'Failed to fetch followed topics' });
  }
});

// Update user region
router.put('/set-region', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { region } = req.body;
    
    if (!region || typeof region !== 'string') {
      return res.status(400).json({ error: 'Region is required' });
    }

    db.prepare('UPDATE users SET region = ? WHERE userId = ?').run(region.trim().toUpperCase(), userId);

    res.json({ message: 'Region updated', region: region.trim().toUpperCase() });
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({ error: 'Failed to update region' });
  }
});

export default router;
