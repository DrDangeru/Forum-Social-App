import express from 'express';
import type { Request, Response } from 'express';
import db from '../db';
import { handleServerError } from '../utils.ts';
import { Post } from '../types/index';

const router = express.Router();

// Get all topics
router.get('/', (_req: Request, res: Response) => {
  try {
    const topics = db.prepare(`
      SELECT t.id, t.name as title, t.created_at as createdAt, 
             u.username as creatorUsername
      FROM topics t
      JOIN users u ON t.id IN (
        SELECT topicId FROM userTopics WHERE userId = u.userId
      )
      ORDER BY t.created_at DESC
    `).all() as { id: number; title: string; createdAt: string; creatorUsername: string }[];

    // Get posts for each topic
    const topicsWithPosts = topics.map((topic) => {
      // Try to get posts from the posts table if it exists
      let posts: Post[] = [];
      try {
        const rawPosts = db.prepare(`
          SELECT p.id, p.topicId, p.content, p.createdBy, p.createdAt, p.updatedAt,
                 u.username as authorUsername
          FROM posts p
          JOIN users u ON p.createdBy = u.userId
          WHERE p.topicId = ?
          ORDER BY p.createdAt ASC
        `).all(topic.id) as 
        { id: number; topicId: number; content: string; createdBy: string; createdAt: string; 
          updatedAt: string; authorUsername: string }[];

        posts = rawPosts.map((post) => ({
          id: post.id,
          topicId: post.topicId,
          content: post.content,
          createdBy: post.createdBy,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorUsername: post.authorUsername,
        }));
      } catch (err) {
        // If posts table doesn't exist, use an empty array
        console.log('Posts table may not exist yet:', err);
      }

      return {
        ...topic,
        description: topic.title, // Use title as description for now
        createdBy: '',
        isPublic: true,
        updatedAt: topic.createdAt,
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
      SELECT t.id, t.name as title, t.created_at as createdAt,
             u.username as creatorUsername
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      WHERE ut.userId = ?
      ORDER BY t.created_at DESC
    `).all(userId) as { id: number; title: string; createdAt: string; creatorUsername: string }[];

    // Get posts for each topic
    const topicsWithPosts = topics.map((topic) => {
      // Try to get posts from the posts table if it exists
      let posts: Post[] = [];
      try {
        const rawPosts = db.prepare(`
          SELECT p.id, p.topicId, p.content, p.createdBy, p.createdAt, p.updatedAt,
                 u.username as authorUsername
          FROM posts p
          JOIN users u ON p.createdBy = u.userId
          WHERE p.topicId = ?
          ORDER BY p.createdAt ASC
        `).all(topic.id) as 
        { id: number; topicId: number; content: string; createdBy: string; createdAt: string; 
          updatedAt: string; authorUsername: string }[];

        posts = rawPosts.map((post) => ({
          id: post.id,
          topicId: post.topicId,
          content: post.content,
          createdBy: post.createdBy,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorUsername: post.authorUsername,
        }));
      } catch (err) {
        // If posts table doesn't exist, use an empty array
        console.log('Posts table may not exist yet:', err);
      }

      return {
        ...topic,
        description: topic.title, // Use title as description for now
        createdBy: userId,
        isPublic: true,
        updatedAt: topic.createdAt,
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
      SELECT t.id, t.name as title, t.created_at as createdAt,
             u.username as creatorUsername
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      WHERE ut.userId IN (
        SELECT f1.friendId
        FROM friendships f1
        WHERE f1.userId = ? AND f1.status = 'accepted'
        UNION
        SELECT f2.userId
        FROM friendships f2
        WHERE f2.friendId = ? AND f2.status = 'accepted'
      )
      ORDER BY t.created_at DESC
    `).all(userId, userId) as { id: number; title: string; 
      createdAt: string; creatorUsername: string }[];

    // Get posts for each topic
    const topicsWithPosts = topics.map((topic) => {
      // Try to get posts from the posts table if it exists
      let posts: Post[] = [];
      try {
        const rawPosts = db.prepare(`
          SELECT p.id, p.topicId, p.content, p.createdBy, p.createdAt, p.updatedAt,
                 u.username as authorUsername
          FROM posts p
          JOIN users u ON p.createdBy = u.userId
          WHERE p.topicId = ?
          ORDER BY p.createdAt ASC
        `).all(topic.id) as 
        { id: number; topicId: number; content: string; createdBy: string; createdAt: string; 
          updatedAt: string; authorUsername: string }[];

        posts = rawPosts.map((post) => ({
          id: post.id,
          topicId: post.topicId,
          content: post.content,
          createdBy: post.createdBy,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          authorUsername: post.authorUsername,
        }));
      } catch (err) {
        // If posts table doesn't exist, use an empty array
        console.log('Posts table may not exist yet:', err);
      }

      return {
        ...topic,
        description: topic.title, // Use title as description for now
        createdBy: '',
        isPublic: true,
        updatedAt: topic.createdAt,
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
      SELECT t.id, t.name as title, t.created_at as createdAt,
             u.username as creatorUsername
      FROM topics t
      JOIN userTopics ut ON t.id = ut.topicId
      JOIN users u ON ut.userId = u.userId
      WHERE t.id = ?
      LIMIT 1
    `).get(topicId) as { id: number; title: string; createdAt: 
      string; creatorUsername: string } | null;
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Get posts for this topic
    let posts: Post[] = [];
    try {
      const rawPosts = db.prepare(`
        SELECT p.id, p.topicId, p.content, p.createdBy, p.createdAt, p.updatedAt,
               u.username as authorUsername
        FROM posts p
        JOIN users u ON p.createdBy = u.userId
        WHERE p.topicId = ?
        ORDER BY p.createdAt ASC
      `).all(topicId) as 
      { id: number; topicId: number; content: string; createdBy: string;
        createdAt: string; updatedAt: string; authorUsername: string }[];

      posts = rawPosts.map((post) => ({
        id: post.id,
        topicId: Number(topicId),
        content: post.content,
        createdBy: post.createdBy,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        authorUsername: post.authorUsername,
      }));
    } catch (err) {
      console.log('Posts table may not exist yet:', err);
    }

    // Format the topic to match our new schema
    const formattedTopic = {
      ...topic,
      description: topic.title, // Use title as description for now
      createdBy: '',
      isPublic: true,
      updatedAt: topic.createdAt,
      posts: posts
    };

    res.json(formattedTopic);
  } catch (error) {
    handleServerError(res, error, 'Failed to get topic');
  }
});

// Create a new topic with first post
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description, createdBy, isPublic, firstPostContent } = req.body;
    
    // Start transaction
    db.prepare('BEGIN').run();
    
    try {
      // Insert the topic
      const topicResult = db.prepare(`
        INSERT INTO topics (name, created_at)
        VALUES (?, CURRENT_TIMESTAMP)
      `).run(title);
      
      const topicId = Number(topicResult.lastInsertRowid);
      
      // Associate the topic with the user
      db.prepare(`
        INSERT INTO userTopics (userId, topicId, created_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `).run(createdBy, topicId);
      
      // Create posts table if it doesn't exist
      try {
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
      
      // Insert the first post if provided
      let posts: Post[] = [];
      if (firstPostContent) {
        try {
          const postResult = db.prepare(`
            INSERT INTO posts (topicId, content, createdBy, createdAt, updatedAt)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `).run(topicId, firstPostContent, createdBy);
          
          const postId = Number(postResult.lastInsertRowid);
          
          // Get user info
          const user = db.prepare(`
            SELECT username FROM users WHERE userId = ?
          `).get(createdBy) as { username: string } | null;
          
          // Add the post to the posts array
          const newPost: Post = {
            id: postId,
            topicId: topicId,
            content: firstPostContent,
            createdBy: createdBy,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            authorUsername: user ? user.username : ''
          };
          
          posts.push(newPost);
        } catch (err) {
          console.log('Error inserting first post:', err);
        }
      }
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      // Get user info
      const user = db.prepare(`
        SELECT username FROM users WHERE userId = ?
      `).get(createdBy) as { username: string } | null;
      
      // Create a formatted response
      const newTopic = {
        id: topicId,
        title: title,
        description: description,
        createdBy: createdBy,
        isPublic: isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatorUsername: user ? user.username : '',
        posts: posts
      };
      
      res.status(201).json(newTopic);
    } catch (error) {
      // Rollback on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    handleServerError(res, error, 'Failed to create topic');
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
    
    // Create posts table if it doesn't exist
    try {
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
      SELECT username FROM users WHERE userId = ?
    `).get(createdBy) as { username: string } | null;
    
    // Create a formatted response
    const newPost: Post = {
      id: postId,
      topicId: Number(topicId),
      content: content,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorUsername: user ? user.username : ''
    };
    
    res.status(201).json(newPost);
  } catch (error) {
    handleServerError(res, error, 'Failed to create post');
  }
});

export default router;
