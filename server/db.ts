import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DbHelpers, User, GalleryImage, Profile } from './types';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database tables
const db = new Database(path.join(__dirname, 'forum.db')) as Database.Database;

// Initialize database schema
// Initializes tables for read/write use in the application
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      avatarUrl TEXT,
      bio TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      userId TEXT PRIMARY KEY,
      location TEXT,
      socialLinks TEXT,
      relationshipStatus TEXT,
      age INTEGER,
      interests TEXT,
      occupation TEXT,
      company TEXT,
      hobbies TEXT,
      pets TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS galleryImages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS userFiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      filename TEXT NOT NULL,
      originalName TEXT NOT NULL,
      filePath TEXT NOT NULL,
      size INTEGER NOT NULL,
      mimetype TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, friendId),
      FOREIGN KEY (userId) REFERENCES users (userId),
      FOREIGN KEY (friendId) REFERENCES users (userId)
    );

    CREATE TABLE IF NOT EXISTS follows (
      followerId TEXT NOT NULL,
      followingId TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (followerId, followingId),
      FOREIGN KEY (followerId) REFERENCES users (userId),
      FOREIGN KEY (followingId) REFERENCES users (userId)
    );
  `);
}

// Function to initialize topics-related tables
// should create only if not exists and ready topic table contents
// with added indexes for better performance 
function initTopicsTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      isPublic INTEGER DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users (userId)
    );

    CREATE TABLE IF NOT EXISTS userTopics (
      userId TEXT NOT NULL,
      topicId INTEGER NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, topicId),
      FOREIGN KEY (userId) REFERENCES users (userId),
      FOREIGN KEY (topicId) REFERENCES topics (id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topicId INTEGER NOT NULL,
      content TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      imageUrl TEXT,
      FOREIGN KEY (topicId) REFERENCES topics (id),
      FOREIGN KEY (createdBy) REFERENCES users (userId)
    );
    
    CREATE INDEX IF NOT EXISTS idx_userTopics_userId ON userTopics(userId);
    CREATE INDEX IF NOT EXISTS idx_userTopics_topicId ON userTopics(topicId);
    CREATE INDEX IF NOT EXISTS idx_posts_topicId ON posts(topicId);
    CREATE INDEX IF NOT EXISTS idx_posts_createdBy ON posts(createdBy);
  `);
}

// Initialize the database
initializeDatabase();

// Initialize topics tables on startup
initTopicsTables(); 

// Database helper functions
const dbHelpers: DbHelpers = {
  // User related functions
  users: {
    getById: (userId: string) => {
      const result = db.prepare(`
        SELECT * FROM users WHERE userId = ?
      `).get(userId);
      
      return result as User;
    },
    
    create: (user) => {
      // Generate a unique string userId if not provided
      const userId = user.userId || crypto.randomUUID();
      
      return db.prepare(`
        INSERT INTO users (userId, username, email, passwordHash, firstName, lastName)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        user.username,
        user.email,
        user.passwordHash,
        user.firstName,
        user.lastName
      );
    },
    
    update: (userId: string, data) => {
      const { firstName, lastName, bio, avatarUrl } = data;
      return db.prepare(`
        UPDATE users 
        SET 
          firstName = COALESCE(?, firstName),
          lastName = COALESCE(?, lastName),
          bio = COALESCE(?, bio),
          avatarUrl = COALESCE(?, avatarUrl)
        WHERE userId = ?
      `).run(firstName, lastName, bio, avatarUrl, userId);
    },
    
    updateProfilePicture: (userId: string, filePath) => {
      return db.prepare(`
        UPDATE users SET avatarUrl = ? WHERE userId = ?
      `).run(filePath, userId);
    }
  },
  
  // Profile related functions
  profiles: {
    getByUserId: (userId: string) => {
      const result = db.prepare(`
        SELECT * FROM profiles WHERE userId = ?
      `).get(userId);
      
      return result as Profile | undefined;
    },
    
    exists: (userId: string) => {
      return !!db.prepare(`
        SELECT 1 FROM profiles WHERE userId = ?
      `).get(userId);
    },
    
    update: (userId: string, data: {
      location?: string;
      socialLinks?: string;
      relationshipStatus?: string;
      age: number | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => {
      return db.prepare(`
        UPDATE profiles 
        SET 
          location = COALESCE(?, location),
          socialLinks = COALESCE(?, socialLinks),
          relationshipStatus = COALESCE(?, relationshipStatus),
          age = COALESCE(?, age),
          interests = COALESCE(?, interests),
          occupation = COALESCE(?, occupation),
          company = COALESCE(?, company),
          hobbies = COALESCE(?, hobbies),
          pets = COALESCE(?, pets),
          updatedAt = CURRENT_TIMESTAMP
        WHERE userId = ?
      `).run(
        data.location,
        data.socialLinks,
        data.relationshipStatus,
        data.age,
        data.interests,
        data.occupation,
        data.company,
        data.hobbies,
        data.pets,
        userId
      );
    },
    
    create: (userId: string, data: {
      location?: string;
      socialLinks?: string;
      relationshipStatus?: string;
      age?: number | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => {
      return db.prepare(`
        INSERT INTO profiles (
          userId, 
          location, 
          socialLinks, 
          relationshipStatus,
          age,
          interests,
          occupation,
          company,
          hobbies,
          pets
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        data.location || null,
        data.socialLinks || null,
        data.relationshipStatus || null,
        data.age,
        data.interests || null,
        data.occupation || null,
        data.company || null,
        data.hobbies || null,
        data.pets || null
      );
    }
  },
  
  // Gallery images related functions
  galleryImages: {
    getByUserId: (userId: string) => {
      const results = db.prepare(`
        SELECT * FROM galleryImages WHERE userId = ? ORDER BY createdAt DESC
      `).all(userId);
      
      return results as GalleryImage[];
    },
    
    deleteAllForUser: (userId: string) => {
      return db.prepare(`
        DELETE FROM galleryImages WHERE userId = ?
      `).run(userId);
    },
    
    create: (userId: string, imageUrl: string) => {
      return db.prepare(`
        INSERT INTO galleryImages (userId, imageUrl)
        VALUES (?, ?)
      `).run(userId, imageUrl);
    }
  },
  
  // User files related functions
  userFiles: {
    getByUserId: (userId: string) => {
      return db.prepare(`
        SELECT * FROM userFiles WHERE userId = ? ORDER BY createdAt DESC
      `).all(userId);
    },
    
    getFileCount: (userId: string) => {
      return db.prepare(`
        SELECT COUNT(*) as count FROM userFiles WHERE userId = ?
      `).get(userId) as { count: number };
    },
    
    create: (file: {
      userId: string;
      filename: string;
      originalName: string;
      filePath: string;
      size: number;
      mimetype: string;
    }) => {
      return db.prepare(`
        INSERT INTO userFiles (userId, filename, originalName, filePath, size, mimetype)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        file.userId,
        file.filename,
        file.originalName,
        file.filePath,
        file.size,
        file.mimetype
      );
    },
    
    getById: (fileId: string) => {
      return db.prepare(`
        SELECT * FROM userFiles WHERE id = ?
      `).get(fileId);
    },
    
    deleteById: (fileId: string) => {
      const file = dbHelpers.userFiles.getById(fileId);
      
      if (file && file.filePath) {
        try {
          fs.unlinkSync(file.filePath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      
      return db.prepare(`
        DELETE FROM userFiles WHERE id = ?
      `).run(fileId);
    }
  },
  
  // Transaction helpers
  transaction: {
    begin: () => db.prepare('BEGIN TRANSACTION').run(),
    commit: () => db.prepare('COMMIT').run(),
    rollback: () => db.prepare('ROLLBACK').run()
  }
};

// Set journal mode for better performance
db.pragma('journal_mode = WAL');
// Enable foreign key constraints for referential integrity
// (so that they work properly)
db.pragma('foreign_keys = ON');

// Export both the database instance and helpers
export { db as default, dbHelpers };
