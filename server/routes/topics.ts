import express from 'express';
import type { Request, Response } from 'express';
import db from '../db';
import { handleServerError } from '../utils.ts';
import { Post } from '../types/index';

const router = express.Router();

// Helper function to get posts for a topic
const getPostsForTopic = (topicId: number): Post[] => {
  let posts: Post[] = [];
  try {
    const rawPosts = db.prepare(`
      SELECT p.id, p.topicId, p.content, p.createdBy, p.createdAt, p.updatedAt,
             u.username as authorUsername, u.avatarUrl as authorAvatarUrl
      FROM posts p
      JOIN users u ON p.createdBy = u.userId
      WHERE p.topicId = ?
      ORDER BY p.createdAt ASC
    `).all(topicId) as 
    { id: number; topicId: number; content: string; createdBy: string; createdAt: string; 
      updatedAt: string; authorUsername: string; authorAvatarUrl: string | null }[];

    posts = rawPosts.map((post) => ({
      id: post.id,
      topicId: post.topicId,
      content: post.content,
      createdBy: post.createdBy,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      authorUsername: post.authorUsername,
      authorAvatarUrl: post.authorAvatarUrl,
    }));
  } catch (err) {
    // If posts table doesn't exist, use an empty array
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
    
    const topics = db.prepare(`
      SELECT DISTINCT t.id, t.title, t.description, t.createdAt,
             u.username as creatorUsername, ut.userId as createdBy,
             t.isPublic, t.updatedAt
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      JOIN friendships f ON (
        (f.userId = ? AND f.friendId = ut.userId) OR
        (f.friendId = ? AND f.userId = ut.userId)
      )
      WHERE f.status = 'accepted'
        AND (t.isPublic = 1 OR ut.userId IN (
          SELECT f2.friendId
          FROM friendships f2
          WHERE f2.userId = ? AND f2.status = 'accepted'
          UNION
          SELECT f3.userId
          FROM friendships f3
          WHERE f3.friendId = ? AND f3.status = 'accepted'
        ))
      ORDER BY t.createdAt DESC
    `).all(userId, userId, userId, userId) as { id: number; title: string; createdAt: string; 
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
          id: postId,
          topicId,
          content: firstPostContent,
          createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          authorUsername: user.username,
          authorAvatarUrl: user.avatarUrl
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
router.post('/:topicId/posts', (req: Request, res: Response) => {
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
    
    // Create a formatted response
    const newPost: Post = {
      id: postId,
      topicId: Number(topicId),
      content: content,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorUsername: user?.username ?? '',
      authorAvatarUrl: user?.avatarUrl ?? ''
    };
    
    res.status(201).json(newPost);
  } catch (error) {
    handleServerError(res, error, 'Failed to create post');
  }
});

export default router;
