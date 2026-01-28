import express from 'express';
import type { Express, Request, Response } from 'express';
import cors from 'cors';
import db, { dbHelpers } from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import friendsRoutes from './routes/friends.js';
import usersRoutes from './routes/users.js';
import topicsRoutes from './routes/topics.js';
import feedRoutes from './routes/feed.js';
import groupsRoutes from './routes/groups.js';
import settingsRoutes from './routes/settings.js';
import { verifyToken, AuthRequest } from './middleware/auth.js';
import process from 'node:process';
import cookieParser from 'cookie-parser'; // Import express cookie-parser

// Load environment variables
dotenv.config();

// Configure ES modules path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app: Express = express();
const port = process.env.PORT || 3001;

// Add request logging middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const userId = _req.params.userId;
    const uploadPath = path.join(__dirname, 'uploads', userId);
    
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

// File upload configuration
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB
    files: 22
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Core middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Allow Vite dev server (5173) and potentially old CRA (3000)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser()); // Add cookie-parser middleware before routes
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

// Serve static files from server/uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/profile', verifyToken, profileRoutes);
app.use('/api/friends', verifyToken, friendsRoutes);
app.use('/api/users', verifyToken, usersRoutes);
app.use('/api/topics', verifyToken, topicsRoutes);
app.use('/api/feed', verifyToken, feedRoutes);
app.use('/api/groups', verifyToken, groupsRoutes);
app.use('/api/settings', verifyToken, settingsRoutes);

// Social Features 
// Think for now feed would be friends topics/posts
app.get('/api/feed-legacy', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const posts = db.prepare(`
      SELECT p.*, u.username 
      FROM posts p
      JOIN users u ON p.userId = u.id
      WHERE p.userId IN (
        SELECT followingId 
        FROM follows 
        WHERE followerId = ?
      )
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all(userId);
    
    res.json(posts);
  } catch (error) {
    handleServerError(res, error, 'Failed to get feed');
  }
});

app.post('/api/posts', (req: Request, res: Response) => {
  try {
    const { userId, content } = req.body;
    const result = db.prepare(
      'INSERT INTO posts (userId, content) VALUES (?, ?)'
    ).run(userId, content);
    
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    handleServerError(res, error, 'Failed to create post');
  }
});

// Follow System, just a shell for now
app.post('/api/follow', (req: Request, res: Response) => {
  try {
    const { followerId, followingId } = req.body;
    db.prepare(`
      INSERT INTO follows (followerId, followingId)
      VALUES (?, ?)
    `).run(followerId, followingId);
    
    res.json({ success: true });
  } catch (error) {
    handleServerError(res, error, 'Failed to follow user');
  }
});

// Remove follow
app.delete('/api/follow', (req: Request, res: Response) => {
  try {
    const { followerId, followingId } = req.body;
    db.prepare(`
      DELETE FROM follows
      WHERE followerId = ? AND followingId = ?
    `).run(followerId, followingId);
    
    res.json({ success: true });
  } catch (error) {
    handleServerError(res, error, 'Failed to unfollow user');
  }
});

// User who follow current user
app.get('/api/followers/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followers = db.prepare(`
      SELECT u.userId, u.username, u.avatarUrl, u.createdAt
      FROM follows f
      JOIN users u ON f.followerId = u.userId 
      WHERE f.followingId = ?
    `).all(userId);
    
    res.json(followers);
  } catch (error) {
    handleServerError(res, error, 'Failed to get followers');
  }
});

// Who(users) current user follows
app.get('/api/following/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const following = db.prepare(`
      SELECT u.userId, u.username, u.avatarUrl, u.createdAt
      FROM follows f
      JOIN users u ON f.followingId = u.userId 
      WHERE f.followerId = ?
    `).all(userId);
    
    res.json(following);
  } catch (error) {
    handleServerError(res, error, 'Failed to get following users');
  }
});

app.get('/api/friends/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const friends = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at, u.avatar_url
      FROM users u
      WHERE u.id IN (
        SELECT f1.followingId
        FROM follows f1
        JOIN follows f2 ON f1.followingId = f2.followerId
        WHERE f1.followerId = ?
        AND f2.followingId = ?
      )
    `).all(userId, userId);
    
    res.json(friends);
  } catch (error) {
    handleServerError(res, error, 'Failed to get friends');
  }
});

// User search (Get user by ID) who follows current user/
// (threads maybe added later with just thread id)
app.get('/api/users/:userId', (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const friendsCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows 
      WHERE followerId = ? AND followingId IN (
        SELECT followerId FROM follows WHERE followingId = ?
      )
    `).get(userId, userId) as { count: number };
    
    res.json({ ...user, friendsCount: friendsCountResult.count });
  } catch (error) {
    handleServerError(res, error, 'Failed to get user');
  }
});

// Protected file upload routes
app.post('/api/upload/:userId', verifyToken, async (req: AuthRequest, res: Response) => {
  const userId = req.params.userId;
  
  // Verify user is uploading their own files
  if (req.user?.userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized to upload for this user' });
  }

  try {
    // Validate user exists
    const user = dbHelpers.users.getById((userId));
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check file count limit
    const fileCountResult = dbHelpers.userFiles.getFileCount((userId));

    if (fileCountResult.count >= 15) {
      return res.status(400).json({ error: 'Maximum 15 photos allowed' });
    }

    // Ensure user upload directory exists
    const userUploadDir = path.join(__dirname, 'uploads', userId);
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }

    console.log(`Processing file upload for user ${userId}`);
    console.log('Request Content-Type:', req.get('Content-Type'));
    
    // Debug log entire request
    console.log('Request headers:', req.headers);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);

    // Handle file upload
    upload.array('files', 3)(req, res, async (err) => {
      try {
        if (err) {
          console.error('File upload error:', err);
          return res.status(400).json({ error: err.message });
        }

        console.log('Request body:', req.body);
        console.log('Request files:', req.files);
        
        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
          console.error('No files received in the request');
          return res.status(400).json({ error: 'No files uploaded' });
        }
        
        console.log(`Received ${files.length} files for user ${userId}`);
        console.log('Files:', files.map(f => ({ name: f.filename, path: f.path })));

        // Begin transaction
        dbHelpers.transaction.begin();

        try {
          const savedFiles = files.map(file => {
            // Ensure the file path is relative for database storage
            const relativePath = `/uploads/${userId}/${file.filename}`;
            console.log(`Saving file ${file.filename} with path ${relativePath}`);
            
            // Create database record
            const result = dbHelpers.userFiles.create({
              userId: userId,
              filename: file.filename,
              originalName: file.originalname,
              filePath: relativePath,
              size: file.size,
              mimetype: file.mimetype
            });
            
            return {
              id: result.lastInsertRowid,
              path: relativePath,
              filename: file.filename,
              originalName: file.originalname
            };
          });
          
          // Commit transaction
          dbHelpers.transaction.commit();
          console.log('File upload transaction committed successfully');
          
          res.json({
            message: `${files.length} files uploaded successfully`,
            files: savedFiles
          });
        } catch (dbError) {
          // Rollback transaction on error
          console.error('Database error during file upload:', dbError);
          dbHelpers.transaction.rollback();
          throw dbError;
        }
      } catch (error) {
        console.error('File upload failed:', error);
        handleServerError(res, error, 'File upload failed');
      }
    });
  } catch (error) {
    console.error('Upload validation failed:', error);
    handleServerError(res, error, 'Upload validation failed');
  }
});

app.get('/api/files/:userId', (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const files = dbHelpers.userFiles.getByUserId((userId));
    
    res.json(files);
  } catch (error) {
    handleServerError(res, error, 'Failed to fetch files');
  }
});

app.delete('/api/files/:fileId', (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    // Get the file info to delete the physical file later
    const fileInfo = dbHelpers.userFiles.getById(fileId) as {
      id: string;
      userId: string;
      filename: string;
      originalName: string;
      filePath: string;
      size: number;
      mimetype: string;
    } | undefined;
    
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete from database
    dbHelpers.userFiles.deleteById(fileId);
    
    // Delete the physical file
    const filePath = path.join(__dirname, '..', fileInfo.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.log('File deleted successfully');
    res.json({ success: true, message: 'File deleted successfully' });
    
  } catch (error) {
    handleServerError(res, error, 'Failed to delete file');
  }
});

app.patch('/api/users/:userId/profile-pic', verifyToken, (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Verify user is updating their own profile picture
    if (req.user?.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this user\'s profile picture' });
    }

    const { filePath } = req.body;
    dbHelpers.users.updateProfilePicture((userId), filePath);
    
    res.json({ message: 'Profile picture updated' });
  } catch (error) {
    handleServerError(res, error, 'Error updating profile picture');
  }
});

// Central error handler
const handleServerError = (
  res: Response, 
  error: unknown,
  context: string
) => {
  console.error(`${context}:`, error);
  const message = error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json({ error: message });
};

// Server initialization
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
});
// move file uploading to separate file