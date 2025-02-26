import express from 'express';
import type * as Express from 'express';
import cors from 'cors';
import db from './db';
import path from 'path';
import { fileURLToPath } from 'url';
import { upload } from './middleware/upload';
import multer from 'multer';
import authRoutes from './routes/auth';

// Get directory path using ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Register auth routes
app.use('/api/auth', authRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
    console.error(error);
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
    console.error(error);
  }
});

// Get user's followers
app.get('/api/followers/:userId', (req, res) => {
  const { userId } = req.params;
  
  try {
    const followers = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at, u.avatar_url
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
    `).all(userId);
    
    res.json(followers);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get followers' });
    console.error(error);
  }
});

// Get users followed by user
app.get('/api/following/:userId', (req, res) => {
  const { userId } = req.params;
  
  try {
    const following = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at, u.avatar_url
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
    `).all(userId);
    
    res.json(following);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get following users' });
    console.error(error);
  }
});

// Get user's friends (mutual follows)
app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  
  try {
    const friends = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at, u.avatar_url
      FROM users u
      WHERE u.id IN (
        SELECT f1.following_id
        FROM follows f1
        JOIN follows f2 ON f1.following_id = f2.follower_id
        WHERE f1.follower_id = ?
        AND f2.following_id = ?
      )
    `).all(userId, userId);
    
    res.json(friends);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get friends' });
    console.error(error);
  }
});

// Get user by ID
app.get('/api/users/:userId', (req, res) => {
  const userId = req.params.userId;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  // Get user's friends count NEEDS WORK - not working now...
  //const friendsCount = db.prepare('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?')
  //.get(userId);
  //user.friendsCount = friendsCount.count;
  //res.json(user);
});

// File upload endpoint
app.post('/api/upload/:userId', (req, res) => {
  // Check if user exists and has permission
  const userId = req.params.userId;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  upload.array('files', 10)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'File upload failed' });
    }

    const files = (req.files as any[]).map(file => ({ //Multer File does not work, try later.
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/${userId}/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    // Store file information in database
    const stmt = db.prepare(`
      INSERT INTO user_files (user_id, filename, original_name, file_path, size, mimetype)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertFiles = db.transaction((files) => {
      for (const file of files) {
        stmt.run(userId, file.filename, file.originalName, file.path, file.size, file.mimetype);
      }
    });

    try {
      insertFiles(files);
      res.json({ files });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save file information' });
      console.error(error);
    }
  });
});

// Get user's files
app.get('/api/files/:userId', (req, res) => {
  const userId = req.params.userId;
  
  try {
    const files = db.prepare(`
      SELECT * FROM user_files 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(userId);
    
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
    console.error(error);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
