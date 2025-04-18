import express from 'express';
import type { Request, Response } from 'express';
import db from '../db';
import { handleServerError } from '../utils.ts';
import { Post } from '../types/types.ts';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    // Get userId from query parameters
    const userId = req.query.userId as string;
    if (!userId) {
      cb(new Error('User ID is required'), '');
      return;
    }
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create user-specific directory
    const uploadPath = path.join(uploadsDir, userId);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

const router = express.Router();

// Helper function to get posts for a topic
const getPostsForTopic = (topicId: number): Post[] => {
  let posts: Post[] = [];
  try {
    const rawPosts = db.prepare(`
      SELECT p.id, p.topicId, p.content, p.createdBy, p.createdAt, p.updatedAt,
             u.username as authorUsername, u.avatarUrl as authorAvatarUrl, p.imageUrl
      FROM posts p
      JOIN users u ON p.createdBy = u.userId
      WHERE p.topicId = ?
      ORDER BY p.createdAt ASC
    `).all(topicId) as 
    { id: number; topicId: number; content: string; createdBy: string; createdAt: string; 
      updatedAt: string; authorUsername: string; authorAvatarUrl: string | null;
      imageUrl: string | null }[];

    posts = rawPosts.map((post) => ({
      postId: post.id,
      topicId: post.topicId,
      posterId: post.createdBy,
      content: post.content,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorUsername: post.authorUsername,
      authorAvatarUrl: post.authorAvatarUrl,
      imageUrl: post.imageUrl || null
    }));
  } catch (err) {
    console.log('Posts table may not exist yet:', err);
  }
  return posts;
};

// Get all topics
router.get('/', (_req: Request, res: Response) => {
  try {
    const topics = db.prepare(`
      SELECT DISTINCT t.id, t.title, t.description, t.createdAt, 
             u.username as creatorUsername, ut.userId as createdBy,
             t.isPublic, t.updatedAt
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      WHERE t.isPublic = 1
      ORDER BY t.createdAt DESC
    `).all() as { id: number; title: string; createdAt: string; 
      creatorUsername: string; createdBy: string; description: string | null; 
      isPublic: number | null; updatedAt: string | null }[];

    // Get posts for each topic
    const topicsWithPosts = topics.map((topic) => {
      const posts = getPostsForTopic(topic.id);
      return {
        ...topic,
        description: topic.description ?? topic.title,
        isPublic: topic.isPublic === 1,
        updatedAt: topic.updatedAt ?? topic.createdAt,
        posts: posts
      };
    });

    res.json(topicsWithPosts);
  } catch (error) {
    handleServerError(res, error, 'Failed to get topics');
  }
});

// Get topics followed by a user
router.get('/followed/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Get topics followed by the user
    const topics = db.prepare(`
      SELECT DISTINCT t.id, t.title, t.description, t.createdAt,
             u.username as creatorUsername, ut.userId as createdBy,
             t.isPublic, t.updatedAt, u.avatarUrl as creatorAvatarUrl
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      LEFT JOIN follows f ON t.id = f.topicId AND f.followerId = ?
      WHERE f.topicId IS NOT NULL
      ORDER BY t.createdAt DESC
    `).all(userId) as { id: number; title: string; createdAt: string; 
      creatorUsername: string; createdBy: string; description: string | null; 
      isPublic: number | null; updatedAt: string | null; creatorAvatarUrl: string | null }[];

    // Get posts for each topic
    const topicsWithPosts = topics.map((topic) => {
      const posts = getPostsForTopic(topic.id);
      return {
        ...topic,
        description: topic.description ?? topic.title,
        isPublic: topic.isPublic === 1,
        updatedAt: topic.updatedAt ?? topic.createdAt,
        posts: posts
      };
    });

    res.json(topicsWithPosts);
  } catch (error) {
    handleServerError(res, error, 'Failed to get followed topics');
  }
});

// Get topics by user ID
router.get('/user/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const topics = db.prepare(`
      SELECT DISTINCT t.id, t.title, t.description, t.createdAt,
             u.username as creatorUsername, ut.userId as createdBy,
             t.isPublic, t.updatedAt
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      WHERE ut.userId = ?
      ORDER BY t.createdAt DESC
    `).all(userId) as { id: number; title: string; createdAt: string; 
      creatorUsername: string; createdBy: string; description: string | null; 
      isPublic: number | null; updatedAt: string | null }[];

    // Get posts for each topic
    const topicsWithPosts = topics.map((topic) => {
      const posts = getPostsForTopic(topic.id);
      return {
        ...topic,
        description: topic.description ?? topic.title,
        isPublic: topic.isPublic === 1,
        updatedAt: topic.updatedAt ?? topic.createdAt,
        posts: posts
      };
    });

    res.json(topicsWithPosts);
  } catch (error) {
    handleServerError(res, error, 'Failed to get user topics');
  }
});

// Get topics from friends
router.get('/friends/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Debug: Check friendships
    const friendships = db.prepare(`
      SELECT f.*, 
             u1.username as userUsername,
             u2.username as friendUsername
      FROM friendships f
      JOIN users u1 ON f.userId = u1.userId
      JOIN users u2 ON f.friendId = u2.userId
      WHERE (f.userId = ? OR f.friendId = ?)
        AND f.status = 'accepted'
    `).all(userId, userId);
    
    console.log('Debug - Friendships for user:', friendships);
    
    const topics = db.prepare(`
      SELECT DISTINCT t.id, t.title, t.description, t.createdAt,
             u.username as creatorUsername, ut.userId as createdBy,
             t.isPublic, t.updatedAt, u.avatarUrl as creatorAvatarUrl
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      JOIN friendships f ON (
        (f.userId = ? AND f.friendId = ut.userId AND f.status = 'accepted') OR
        (f.friendId = ? AND f.userId = ut.userId AND f.status = 'accepted')
      )
      WHERE t.isPublic = 1 OR ut.userId IN (
        SELECT f2.friendId
        FROM friendships f2
        WHERE f2.userId = ? AND f2.status = 'accepted'
        UNION
        SELECT f3.userId
        FROM friendships f3
        WHERE f3.friendId = ? AND f3.status = 'accepted'
      )
      ORDER BY t.createdAt DESC
    `).all(userId, userId, userId, userId) as { id: number; title: string; createdAt: string; 
      creatorUsername: string; createdBy: string; description: string | null; 
      isPublic: number | null; updatedAt: string | null; creatorAvatarUrl: string | null }[];

    // Get posts for each topic
    const topicsWithPosts = topics.map((topic) => {
      const posts = getPostsForTopic(topic.id);
      return {
        ...topic,
        description: topic.description ?? topic.title,
        isPublic: topic.isPublic === 1,
        updatedAt: topic.updatedAt ?? topic.createdAt,
        posts: posts
      };
    });

    res.json(topicsWithPosts);
  } catch (error) {
    handleServerError(res, error, 'Failed to get friend topics');
  }
});

// Get a specific topic by ID
router.get('/:topicId', (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    
    const topic = db.prepare(`
      SELECT t.id, t.title, t.description, t.createdAt,
             u.username as creatorUsername, ut.userId as createdBy,
             t.isPublic, t.updatedAt
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      WHERE t.id = ?
      LIMIT 1
    `).get(topicId) as { id: number; title: string; createdAt: string;
      creatorUsername: string; createdBy: string; description: string | null;
      isPublic: number | null; updatedAt: string | null } | null;
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const posts = getPostsForTopic(topic.id);

    const topicWithPosts = {
      ...topic,
      description: topic.description ?? topic.title,
      isPublic: topic.isPublic === 1,
      updatedAt: topic.updatedAt ?? topic.createdAt,
      posts: posts
    };

    res.json(topicWithPosts);
  } catch (error) {
    handleServerError(res, error, 'Failed to get topic');
  }
});

// Create a new topic with first post
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, createdBy, isPublic, firstPostContent } = req.body;
    
    if (!title?.trim() || !description?.trim() || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Start transaction
    db.prepare('BEGIN').run();

    try {
      // Insert the topic
      const topicResult = db.prepare(`
        INSERT INTO topics (title, description, createdBy, isPublic, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(title, description, createdBy, isPublic ? 1 : 0);

      const topicId = Number(topicResult.lastInsertRowid);

      // Associate the topic with the user
      db.prepare(`
        INSERT INTO userTopics (userId, topicId, createdAt)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(createdBy, topicId);

      // Get user info
      const user = db.prepare(`
        SELECT username, avatarUrl FROM users WHERE userId = ?
      `).get(createdBy) as { username: string; avatarUrl: string | null } | undefined;

      if (!user) {
        throw new Error('User not found');
      }

      // Insert the first post if provided
      let posts: Post[] = [];
      if (firstPostContent?.trim()) {
        const postResult = db.prepare(`
          INSERT INTO posts (topicId, content, createdBy, createdAt, updatedAt)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(topicId, firstPostContent, createdBy);

        const postId = Number(postResult.lastInsertRowid);
        
        posts.push({
          postId,
          topicId,
          posterId: createdBy,
          content: firstPostContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorUsername: user.username,
          authorAvatarUrl: user.avatarUrl,
          imageUrl: null
        });
      }

      // Commit transaction
      db.prepare('COMMIT').run();

      // Create a formatted response
      const newTopic = {
        id: topicId,
        title,
        description,
        createdBy,
        isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatorUsername: user.username,
        posts
      };

      res.status(201).json(newTopic);
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      handleServerError(res, error, 'Failed to create topic');
    }
  } catch (error) {
    handleServerError(res, error, 'Failed to process request');
  }
});

// Add a post to a topic
router.post('/:topicId/posts', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const { topicId } = req.params;
    const { content, createdBy } = req.body;
    
    // Check if topic exists
    const topic = db.prepare('SELECT id FROM topics WHERE id = ?').
    get(topicId) as { id: number } | null;
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Check if the posts table exists and has the correct schema
    try {
      // First check if the posts table exists
      const tableExists = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='posts'
      `).get();
      
      if (tableExists) {
        // Check if the table has the topicId column
        const hasTopicId = db.prepare(`
          PRAGMA table_info(posts)
        `).all().some((col: any) => col.name === 'topicId');
        
        if (!hasTopicId) {
          // Drop the table if it doesn't have the topicId column
          db.prepare(`DROP TABLE IF EXISTS posts`).run();
        }
      }
      
      // Create the posts table with the correct schema
      db.prepare(`
        CREATE TABLE IF NOT EXISTS posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          topicId INTEGER NOT NULL,
          content TEXT NOT NULL,
          createdBy TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (topicId) REFERENCES topics(id) ON DELETE CASCADE,
          FOREIGN KEY (createdBy) REFERENCES users(userId) ON DELETE CASCADE
        )
      `).run();
    } catch (err) {
      console.log('Error creating posts table:', err);
    }
    
    // Insert the post
    let postId = 0;
    try {
      const result = db.prepare(`
        INSERT INTO posts (topicId, content, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(topicId, content, createdBy);
      
      postId = Number(result.lastInsertRowid);
    } catch (err) {
      console.log('Error inserting post:', err);
      throw err;
    }
    
    // Get user info
    const user = db.prepare(`
      SELECT username, avatarUrl FROM users WHERE userId = ?
    `).get(createdBy) as { username: string; avatarUrl: string | null } | undefined;
    
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.body.userId}/${req.file.filename}`;  
      // Update the post in the database with the imageUrl
      db.prepare('UPDATE posts SET imageUrl = ? WHERE id = last_insert_rowid()').run(imageUrl);
    }
    
    // Create a formatted response
    const newPost: Post = {
      postId,
      topicId: parseInt(topicId),
      posterId: createdBy,
      content: content || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorUsername: user?.username ?? '',
      authorAvatarUrl: user?.avatarUrl ?? '',
      imageUrl: req.file ? `/uploads/${req.body.userId}/${req.file.filename}` : null
    };
    
    res.status(201).json(newPost);
  } catch (error) {
    handleServerError(res, error, 'Failed to create post');
  }
});

// Upload image for a post
router.post('/posts/:postId/image', upload.single('image'), (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const file = req.file;
    const userId = req.query.userId as string;
    console.log('File:', file);
    console.log('User ID:', userId);

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!userId) {
      if (file && file.path) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Update post with image URL
    const imageUrl = `/api/topics/uploads/${userId}/${file.filename}`;
    
    // First check if post exists and user has permission
    const post = db.prepare(`
      SELECT * FROM posts WHERE id = ? AND createdBy = ?
    `).get(postId, userId);

    if (!post) {
      // If post not found, delete the uploaded file
      fs.unlinkSync(file.path);
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    // Update the post with image URL
    db.prepare(`
      UPDATE posts 
      SET imageUrl = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND createdBy = ?
    `).run(imageUrl, postId, userId);

    // Get the updated post with author info
    const updatedPost = db.prepare(`
      SELECT p.*, u.username as authorUsername, u.avatarUrl as authorAvatarUrl
      FROM posts p
      JOIN users u ON p.createdBy = u.userId
      WHERE p.id = ?
    `).get(postId);

    res.json(updatedPost);
  } catch (error) {
    console.error('Image upload error:', error);
    handleServerError(res, error, 'Failed to upload image');
  }
});

// Serve static files from the uploads directory
router.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Follow a topic
router.post('/follows', (req: Request, res: Response) => {
  try {
    const { topicId } = req.body;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if topic exists
    const topic = db.prepare('SELECT id FROM topics WHERE id = ?').get(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Check if already following
    const existingFollow = db.prepare(
      'SELECT * FROM follows WHERE followerId = ? AND topicId = ?'
    ).get(userId, topicId);

    if (existingFollow) {
      return res.status(200).json({ message: 'Already following this topic' });
    }

    // Add follow relationship - set followingId to NULL for topic follows
    db.prepare(
      `INSERT INTO follows (followerId, followingId, topicId, createdAt)
      VALUES (?, NULL, ?, CURRENT_TIMESTAMP)`
    ).run(userId, topicId);

    res.status(201).json({ message: 'Successfully followed topic' });
  } catch (error) {
    handleServerError(res, error, 'Failed to follow topic');
  }
});

// Unfollow a topic
router.delete('/follows', (req: Request, res: Response) => {
  try {
    const { topicId } = req.body;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if topic exists
    const topic = db.prepare('SELECT id FROM topics WHERE id = ?').get(topicId);
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Remove follow relationship
    const result = db.prepare(
      'DELETE FROM follows WHERE followerId = ? AND topicId = ?'
    ).run(userId, topicId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Not following this topic' });
    }

    res.status(200).json({ message: 'Successfully unfollowed topic' });
  } catch (error) {
    handleServerError(res, error, 'Failed to unfollow topic');
  }
});

// Check if user is following a topic
router.get('/follows/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Get all follows for this user
    const follows = db.prepare(
      'SELECT * FROM follows WHERE followerId = ?'
    ).all(userId);

    res.json(follows);
  } catch (error) {
    handleServerError(res, error, 'Failed to get user follows');
  }
});

export default router;
