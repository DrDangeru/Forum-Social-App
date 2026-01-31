import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DbHelpers, User, GalleryImage, Profile, UserFile } from './types/types';
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
      region TEXT,
      ipRestricted INTEGER DEFAULT 0,
      allowedIp TEXT,
      isAdmin INTEGER DEFAULT 0,
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

    CREATE TABLE IF NOT EXISTS loginHistory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      ipAddress TEXT NOT NULL,
      userAgent TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_loginHistory_userId ON loginHistory(userId);

    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      linkUrl TEXT NOT NULL,
      placement TEXT NOT NULL DEFAULT 'banner',
      isActive INTEGER DEFAULT 1,
      clicks INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      createdBy TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users (userId)
    );
    CREATE INDEX IF NOT EXISTS idx_ads_placement ON ads(placement);
    CREATE INDEX IF NOT EXISTS idx_ads_isActive ON ads(isActive);
  `);
}

// Function to run database migrations
// function runMigrations() {
//   console.log('Running database migrations...');

//   // Recreate follows/any table with new schema
//   try {
//     // Backup existing follows data (change to new column)
//     const follows = db.prepare('SELECT * FROM follows').all();
//     console.log('Backing up follows data:', follows);

    // Drop and recreate follows table
//     db.exec(`
//       DROP TABLE IF EXISTS follows;
      
//       CREATE TABLE follows (
//         followerId TEXT NOT NULL,
//         followingId TEXT,  -- Made nullable to support topic follows
//         topicId INTEGER,  -- Made nullable to support user follows
//         createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         PRIMARY KEY (followerId, COALESCE(followingId, ''), COALESCE(topicId, 0)),
//         FOREIGN KEY (followerId) REFERENCES users (userId),
//         FOREIGN KEY (followingId) REFERENCES users (userId),
//         FOREIGN KEY (topicId) REFERENCES topics (id)
//       );
      
//       CREATE INDEX IF NOT EXISTS idx_follows_followerId ON follows(followerId);
//       CREATE INDEX IF NOT EXISTS idx_follows_topicId ON follows(topicId);
//     `);

//     // Restore user follows (where topicId is NULL)
//     const insertUserFollow = db.prepare(
//       'INSERT INTO follows (followerId, followingId, createdAt) VALUES (?, ?, ?)'
//     );

//     // Restore topic follows (where followingId is NULL)
//     const insertTopicFollow = db.prepare(
//       'INSERT INTO follows (followerId, topicId, createdAt) VALUES (?, ?, ?)'
//     );

//     // Restore the data
//     follows.forEach((follow: any) => {
//       if (follow.topicId) {
//         // This is a topic follow
//         insertTopicFollow.run(follow.followerId, follow.topicId, follow.createdAt);
//       } else {
//         // This is a user follow
//         insertUserFollow.run(follow.followerId, follow.followingId, follow.createdAt);
//       }
//     });

//     console.log('Successfully migrated follows table');
//   } catch (error) {
//     console.error('Error during migration:', error);
//   }
// }
// Function to initialize topics-related tables
// should create only if not exists and ready topic table contents
// with added indexes for better performance 
function initTopicsTables() {
  // Create tables and their indexes in a single transaction
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      isPublic INTEGER DEFAULT 1,
      region TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users (userId)
    );
    CREATE INDEX IF NOT EXISTS idx_topics_region ON topics(region);

    CREATE TABLE IF NOT EXISTS userTopics (
      userId TEXT NOT NULL,
      topicId INTEGER NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, topicId),
      FOREIGN KEY (userId) REFERENCES users (userId),
      FOREIGN KEY (topicId) REFERENCES topics (id)
    );
    -- Index for userTopics
    CREATE INDEX IF NOT EXISTS idx_userTopics_userId ON userTopics(userId);
    CREATE INDEX IF NOT EXISTS idx_userTopics_topicId ON userTopics(topicId);


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
    -- Index for posts
    CREATE INDEX IF NOT EXISTS idx_posts_topicId ON posts(topicId);
    CREATE INDEX IF NOT EXISTS idx_posts_createdBy ON posts(createdBy);


    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      followerId TEXT NOT NULL,
      followingId TEXT,  
      topicId INTEGER,  
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (followerId, followingId, topicId),
      FOREIGN KEY (followerId) REFERENCES users (userId),
      FOREIGN KEY (followingId) REFERENCES users (userId),
      FOREIGN KEY (topicId) REFERENCES topics (id)
    );
    -- Index for follows - this should now succeed after migration
    CREATE INDEX IF NOT EXISTS idx_follows_followerId ON follows(followerId);
    CREATE INDEX IF NOT EXISTS idx_follows_topicId ON follows(topicId); 
  `);

  try {
    const hasImageUrl = db.prepare('PRAGMA table_info(posts)').all().some((col: any) => col.name === 'imageUrl');
    if (!hasImageUrl) {
      db.prepare('ALTER TABLE posts ADD COLUMN imageUrl TEXT').run();
    }
  } catch {
    // intentionally ignored
  }
}

// Initialize the database
initializeDatabase();

// Migration: Add IP restriction columns to users table if they don't exist
try {
  const hasIpRestricted = db.prepare('PRAGMA table_info(users)').all().some((col: any) => col.name === 'ipRestricted');
  if (!hasIpRestricted) {
    db.prepare('ALTER TABLE users ADD COLUMN ipRestricted INTEGER DEFAULT 0').run();
    db.prepare('ALTER TABLE users ADD COLUMN allowedIp TEXT').run();
  }
} catch {
  // intentionally ignored - columns may already exist
}

// Migration: Add isAdmin column to users table if it doesn't exist
try {
  const hasIsAdmin = db.prepare('PRAGMA table_info(users)').all().some((col: any) => col.name === 'isAdmin');
  if (!hasIsAdmin) {
    db.prepare('ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0').run();
  }
} catch {
  // intentionally ignored - column may already exist
}

// Migration: Add region column to users table if it doesn't exist
try {
  const hasRegion = db.prepare('PRAGMA table_info(users)').all().some((col: any) => col.name === 'region');
  if (!hasRegion) {
    db.prepare('ALTER TABLE users ADD COLUMN region TEXT').run();
  }
} catch {
  // intentionally ignored - column may already exist
}

// Migration: Add region column to topics table if it doesn't exist
try {
  const hasTopicRegion = db.prepare('PRAGMA table_info(topics)').all()
  .some((col: any) => col.name === 'region');
  if (!hasTopicRegion) {
    db.prepare('ALTER TABLE topics ADD COLUMN region TEXT').run();
  }
} catch {
  // intentionally ignored - column may already exist
}

// Run migrations to update schema if/when necessary
// runMigrations(); 

// Initialize topics tables (will create if not exist, indexes should work now)
initTopicsTables();

// Function to initialize groups-related tables
function initGroupsTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      accessType TEXT NOT NULL DEFAULT 'open',
      createdBy TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (createdBy) REFERENCES users (userId)
    );

    CREATE TABLE IF NOT EXISTS groupMembers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groupId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (groupId, userId),
      FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users (userId) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_groupMembers_groupId ON groupMembers(groupId);
    CREATE INDEX IF NOT EXISTS idx_groupMembers_userId ON groupMembers(userId);

    CREATE TABLE IF NOT EXISTS groupInvitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      groupId INTEGER NOT NULL,
      inviterId TEXT NOT NULL,
      inviteeId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (groupId, inviteeId),
      FOREIGN KEY (groupId) REFERENCES groups (id) ON DELETE CASCADE,
      FOREIGN KEY (inviterId) REFERENCES users (userId),
      FOREIGN KEY (inviteeId) REFERENCES users (userId)
    );
    CREATE INDEX IF NOT EXISTS idx_groupInvitations_inviteeId ON groupInvitations(inviteeId);
  `);
}

// Initialize groups tables
initGroupsTables(); 

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
      // Generate a unique string userId using random UUID
      const userId = crypto.randomUUID();
      
      return db.prepare(`
        INSERT INTO users (userId, username, email, passwordHash,
         firstName, lastName)
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
      `).get(fileId) as UserFile | undefined;
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
