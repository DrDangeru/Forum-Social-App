import { Router, Response } from 'express';
import db from '../db.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Store active SSE connections
const clients = new Map<string, Response[]>();

// Helper to send SSE message
const sendSSE = (res: Response, event: string, data: any) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// SSE endpoint for regional top topics
router.get('/regional-topics', (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Get user's region
  const user = db.prepare('SELECT region FROM users WHERE userId = ?')
    .get(userId) as { region: string | null } | undefined;
  const region = user?.region;

  // Fetch seeded mock topics from database (IDs 901-905)
  const mockRegionalTopics = db.prepare(`
    SELECT 
      t.id,
      t.title,
      t.description,
      t.region,
      u.username as creatorUsername,
      u.avatarUrl as creatorAvatarUrl,
      COUNT(p.id) as postCount
    FROM topics t
    JOIN users u ON t.createdBy = u.userId
    LEFT JOIN posts p ON p.topicId = t.id
    WHERE t.id BETWEEN 901 AND 905
    GROUP BY t.id
    ORDER BY t.id
  `).all() as any[];

  // Function to fetch and send regional topics
  const sendRegionalTopics = () => {
    if (!region) {
      // Still show mock topics even without region set
      sendSSE(res, 'regional-topics', {
        topics: mockRegionalTopics,
        region: 'Global',
        message: 'Set your region for local news'
      });
      return;
    }

    // Get top 5 topics for the region with activity
    const dbTopics = db.prepare(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.region,
        t.createdBy,
        t.createdAt,
        u.username as creatorUsername,
        u.avatarUrl as creatorAvatarUrl,
        COUNT(p.id) as postCount,
        MAX(p.createdAt) as lastActivity
      FROM topics t
      JOIN users u ON t.createdBy = u.userId
      LEFT JOIN posts p ON p.topicId = t.id
      WHERE t.region = ?
      GROUP BY t.id
      ORDER BY lastActivity DESC, postCount DESC, t.createdAt DESC
      LIMIT 5
    `).all(region) as any[];

    // Combine real topics with mock topics (mock first, then real)
    const combinedTopics = [...mockRegionalTopics, ...dbTopics].slice(0, 5);

    sendSSE(res, 'regional-topics', {
      topics: combinedTopics,
      region,
      timestamp: new Date().toISOString()
    });
  };

  // Send initial data
  sendRegionalTopics();

  // Send updates every 30 seconds
  const intervalId = setInterval(sendRegionalTopics, 30000);

  // Store connection
  if (!clients.has(`regional-${userId}`)) {
    clients.set(`regional-${userId}`, []);
  }
  clients.get(`regional-${userId}`)?.push(res);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(intervalId);
    const userClients = clients.get(`regional-${userId}`);
    if (userClients) {
      const index = userClients.indexOf(res);
      if (index > -1) userClients.splice(index, 1);
      if (userClients.length === 0) clients.delete(`regional-${userId}`);
    }
  });
});

// SSE endpoint for followed topics updates
router.get('/followed-topics', (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Function to fetch and send followed topics
  const sendFollowedTopics = () => {
    const topics = db.prepare(`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.region,
        t.createdBy,
        t.createdAt,
        u.username as creatorUsername,
        u.avatarUrl as creatorAvatarUrl,
        COUNT(p.id) as postCount,
        MAX(p.createdAt) as lastActivity,
        (SELECT COUNT(*) FROM posts WHERE topicId = t.id AND createdAt > datetime('now', '-1 day')) as newPosts
      FROM topics t
      JOIN users u ON t.createdBy = u.userId
      JOIN follows f ON f.topicId = t.id AND f.followerId = ?
      LEFT JOIN posts p ON p.topicId = t.id
      GROUP BY t.id
      ORDER BY newPosts DESC, lastActivity DESC
      LIMIT 5
    `).all(userId);

    sendSSE(res, 'followed-topics', {
      topics,
      timestamp: new Date().toISOString()
    });
  };

  // Send initial data
  sendFollowedTopics();

  // Send updates every 30 seconds
  const intervalId = setInterval(sendFollowedTopics, 30000);

  // Store connection
  if (!clients.has(`followed-${userId}`)) {
    clients.set(`followed-${userId}`, []);
  }
  clients.get(`followed-${userId}`)?.push(res);

  // Cleanup on close
  req.on('close', () => {
    clearInterval(intervalId);
    const userClients = clients.get(`followed-${userId}`);
    if (userClients) {
      const index = userClients.indexOf(res);
      if (index > -1) userClients.splice(index, 1);
      if (userClients.length === 0) clients.delete(`followed-${userId}`);
    }
  });
});

export default router;
