import express from 'express';
import cors from 'cors';
import db from './db';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Get feed (posts from followed users and interested topics)
app.get('/api/feed', (req, res) => {
  const userId = req.query.userId as string;
  const posts = db.prepare(`
    SELECT p.*, u.username 
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.user_id IN (
      SELECT following_id 
      FROM follows 
      WHERE follower_id = ?
    )
    ORDER BY p.created_at DESC
    LIMIT 20
  `).all(userId);
  res.json(posts);
});

// Create a new post
app.post('/api/posts', (req, res) => {
  const { userId, content } = req.body;
  const result = db.prepare(
    'INSERT INTO posts (user_id, content) VALUES (?, ?)'
  ).run(userId, content);
  res.json({ id: result.lastInsertRowid });
});

// Follow a user
app.post('/api/follow', (req, res) => {
  const { followerId, followingId } = req.body;
  
  try {
    db.prepare(`
      INSERT INTO follows (follower_id, following_id)
      VALUES (?, ?)
    `).run(followerId, followingId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
app.delete('/api/follow', (req, res) => {
  const { followerId, followingId } = req.body;
  
  try {
    db.prepare(`
      DELETE FROM follows
      WHERE follower_id = ? AND following_id = ?
    `).run(followerId, followingId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Failed to unfollow user' });
  }
});

// Get user's followers
app.get('/api/followers/:userId', (req, res) => {
  const { userId } = req.params;
  
  try {
    const followers = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
    `).all(userId);
    
    res.json(followers);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get followers' });
  }
});

// Get users followed by user
app.get('/api/following/:userId', (req, res) => {
  const { userId } = req.params;
  
  try {
    const following = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
    `).all(userId);
    
    res.json(following);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get following users' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
