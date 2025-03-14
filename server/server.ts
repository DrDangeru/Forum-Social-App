import express from 'express';
import type { Express, Request, Response } from 'express';
import cors from 'cors';
import db, { dbHelpers } from './db';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import friendsRoutes from './routes/friends';
import usersRoutes from './routes/users';

// Configure ES modules path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express
const app: Express = express();
const port = 3001;

// Configure Multer storage
// as config, no  real file handling and req, so below is ok.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const userId = _req.params.userId;
    const uploadPath = path.join(__dirname, '../uploads', userId);
    
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
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/users', usersRoutes);

// Social Features
app.get('/api/feed', (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    handleServerError(res, error, 'Failed to get feed');
  }
});

app.post('/api/posts', (req: Request, res: Response) => {
  try {
    const { userId, content } = req.body;
    const result = db.prepare(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)'
    ).run(userId, content);
    
    res.json({ id: result.lastInsertRowid });
  } catch (error) {
    handleServerError(res, error, 'Failed to create post');
  }
});

// Follow System
app.post('/api/follow', (req: Request, res: Response) => {
  try {
    const { followerId, followingId } = req.body;
    db.prepare(`
      INSERT INTO follows (follower_id, following_id)
      VALUES (?, ?)
    `).run(followerId, followingId);
    
    res.json({ success: true });
  } catch (error) {
    handleServerError(res, error, 'Failed to follow user');
  }
});

app.delete('/api/follow', (req: Request, res: Response) => {
  try {
    const { followerId, followingId } = req.body;
    db.prepare(`
      DELETE FROM follows
      WHERE follower_id = ? AND following_id = ?
    `).run(followerId, followingId);
    
    res.json({ success: true });
  } catch (error) {
    handleServerError(res, error, 'Failed to unfollow user');
  }
});

// User Relationships
app.get('/api/followers/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const followers = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at, u.avatar_url
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
    `).all(userId);
    
    res.json(followers);
  } catch (error) {
    handleServerError(res, error, 'Failed to get followers');
  }
});

app.get('/api/following/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const following = db.prepare(`
      SELECT u.id, u.username, u.email, u.created_at, u.avatar_url
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
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
        SELECT f1.following_id
        FROM follows f1
        JOIN follows f2 ON f1.following_id = f2.follower_id
        WHERE f1.follower_id = ?
        AND f2.following_id = ?
      )
    `).all(userId, userId);
    
    res.json(friends);
  } catch (error) {
    handleServerError(res, error, 'Failed to get friends');
  }
});

// User Management
app.get('/api/users/:userId', (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const friendsCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows 
      WHERE follower_id = ? AND following_id IN (
        SELECT follower_id FROM follows WHERE following_id = ?
      )
    `).get(userId, userId) as { count: number };
    
    res.json({ ...user, friendsCount: friendsCountResult.count });
  } catch (error) {
    handleServerError(res, error, 'Failed to get user');
  }
});

// File Management
app.post('/api/upload/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  try {
    // Validate user exists
    const user = dbHelpers.users.getById(Number(userId));
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check file count limit
    const fileCountResult = dbHelpers.userFiles.getFileCount(Number(userId));

    if (fileCountResult.count >= 10) {
      return res.status(400).json({ error: 'Maximum 10 photos allowed' });
    }

    // Handle file upload
    upload.array('files', 3)(req, res, async (err) => {
      try {
        if (err) {
          console.error('File upload error:', err);
          return res.status(400).json({ error: err.message });
        }

        const files = req.files as Express.Multer.File[];
        
        if (!files || files.length === 0) {
          return res.status(400).json({ error: 'No files uploaded' });
        }
        
        console.log(`Received ${files.length} files for user ${userId}`);

        // Begin transaction
        dbHelpers.transaction.begin();

        try {
          files.forEach(file => {
            dbHelpers.userFiles.create({
              user_id: Number(userId),
              filename: file.filename,
              original_name: file.originalname,
              file_path: `/uploads/${userId}/${file.filename}`,
              size: file.size,
              mimetype: file.mimetype
            });
          });
          
          // Commit transaction
          dbHelpers.transaction.commit();
          
          res.json({
            message: `${files.length} files uploaded successfully`,
            files: files.map(file => ({
              path: `/uploads/${userId}/${file.filename}`,
              originalName: file.originalname
            }))
          });
        } catch (dbError) {
          // Rollback transaction on error
          dbHelpers.transaction.rollback();
          throw dbError;
        }
      } catch (error) {
        handleServerError(res, error, 'File upload failed');
      }
    });
  } catch (error) {
    handleServerError(res, error, 'Upload validation failed');
  }
});

app.get('/api/files/:userId', (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const files = dbHelpers.userFiles.getByUserId(Number(userId));
    
    res.json(files);
  } catch (error) {
    handleServerError(res, error, 'Failed to fetch files');
  }
});

app.delete('/api/files/:fileId', (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    
    // Get the file info to delete the physical file later
    const fileInfo = dbHelpers.userFiles.getById(Number(fileId)) as {
      id: number;
      user_id: number;
      filename: string;
      original_name: string;
      file_path: string;
      size: number;
      mimetype: string;
    } | undefined;
    
    if (!fileInfo) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete from database
    dbHelpers.userFiles.deleteById(Number(fileId));
    
    // Delete the physical file
    const filePath = path.join(__dirname, '..', fileInfo.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.log('File deleted successfully');
    res.json({ success: true, message: 'File deleted successfully' });
    
  } catch (error) {
    handleServerError(res, error, 'Failed to delete file');
  }
});

app.patch('/api/users/:userId/profile-pic', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { filePath } = req.body;

    dbHelpers.users.updateProfilePicture(Number(userId), filePath);
    
    res.json({ message: 'Profile picture updated' });
  } catch (error) {
    handleServerError(res, error, 'Profile picture update failed');
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
  fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
});