import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DbHelpers, User, GalleryImage, Profile } from './types';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database tables
const db = new Database(path.join(__dirname, 'forum.db')) as Database.Database;

// Initialize database schema
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      avatar_url TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      userId INTEGER PRIMARY KEY,
      location TEXT,
      social_links TEXT,
      relationship_status TEXT,
      age INTEGER,
      interests TEXT,
      occupation TEXT,
      company TEXT,
      hobbies TEXT,
      pets TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      size INTEGER NOT NULL,
      mimetype TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      friendId INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, friendId),
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (friendId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS follows (
      followerId INTEGER NOT NULL,
      followingId INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (followerId, followingId),
      FOREIGN KEY (followerId) REFERENCES users (id),
      FOREIGN KEY (followingId) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_topics (
      userId INTEGER NOT NULL,
      topicId INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (userId, topicId),
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (topicId) REFERENCES topics (id)
    );
  `);
}

// Database helper functions
const dbHelpers: DbHelpers = {
  // User related functions
  users: {
    getById: (userId: number) => {
      const result = db.prepare(`
        SELECT * FROM users WHERE id = ?
      `).get(userId);
      
      return result as User;
    },
    
    create: (user) => {
      return db.prepare(`
        INSERT INTO users (username, email, password_hash, first_name, last_name)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        user.username,
        user.email,
        user.password_hash,
        user.first_name,
        user.last_name
      );
    },
    
    update: (userId: number, data) => {
      return db.prepare(`
        UPDATE users 
        SET first_name = ?, 
            last_name = ?, 
            bio = ?,
            avatar_url = ?
        WHERE id = ?
      `).run(
        data.first_name,
        data.last_name,
        data.bio || null,
        data.avatar_url || null,
        userId
      );
    },
    
    updateProfilePicture: (userId: number, filePath) => {
      return db.prepare(`
        UPDATE users 
        SET avatar_url = ?
        WHERE id = ?
      `).run(filePath, userId);
    }
  },
  
  // Profile related functions
  profiles: {
    getByUserId: (userId: number) => {
      const result = db.prepare(`
        SELECT * FROM profiles WHERE userId = ?
      `).get(userId);
      
      return result as Profile | undefined;
    },
    
    exists: (userId: number) => {
      return db.prepare('SELECT 1 FROM profiles WHERE userId = ?').get(userId);
    },
    
    update: (userId: number, data: {
      location?: string;
      social_links?: string;
      relationship_status?: string;
      age?: number | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => {
      return db.prepare(`
        UPDATE profiles 
        SET location = ?, 
            social_links = ?, 
            relationship_status = ?,
            age = ?,
            interests = ?,
            occupation = ?,
            company = ?,
            hobbies = ?,
            pets = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE userId = ?
      `).run(
        data.location || '',
        data.social_links || '{}',
        data.relationship_status || '',
        data.age || null,
        data.interests || '[]',
        data.occupation || '',
        data.company || '',
        data.hobbies || '[]',
        data.pets || '[]',
        userId
      );
    },
    
    create: (userId: number, data: {
      location?: string;
      social_links?: string;
      relationship_status?: string;
      age?: number | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => {
      return db.prepare(`
        INSERT INTO profiles (
          userId, location, social_links, relationship_status, 
          age, interests, occupation, company, hobbies, pets
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        data.location || '',
        data.social_links || '{}',
        data.relationship_status || '',
        data.age || null,
        data.interests || '[]',
        data.occupation || '',
        data.company || '',
        data.hobbies || '[]',
        data.pets || '[]'
      );
    }
  },
  
  // Gallery images related functions
  galleryImages: {
    getByUserId: (userId: number) => {
      const results = db.prepare(`
        SELECT * FROM gallery_images WHERE userId = ? ORDER BY created_at DESC
      `).all(userId);
      
      return results as GalleryImage[];
    },
    
    deleteAllForUser: (userId: number) => {
      return db.prepare(`
        DELETE FROM gallery_images WHERE userId = ?
      `).run(userId);
    },
    
    create: (userId: number, imageUrl: string) => {
      return db.prepare(`
        INSERT INTO gallery_images (userId, image_url)
        VALUES (?, ?)
      `).run(userId, imageUrl);
    }
  },
  
  // User files related functions
  userFiles: {
    getByUserId: (userId: number) => {
      return db.prepare(`
        SELECT * FROM user_files WHERE userId = ? ORDER BY created_at DESC
      `).all(userId);
    },
    
    getFileCount: (userId: number) => {
      return db.prepare(`
        SELECT COUNT(*) as count FROM user_files WHERE userId = ?
      `).get(userId) as { count: number };
    },
    
    create: (file: {
      userId: number;
      filename: string;
      original_name: string;
      file_path: string;
      size: number;
      mimetype: string;
    }) => {
      return db.prepare(`
        INSERT INTO user_files (userId, filename, original_name, file_path, size, mimetype)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        file.userId,
        file.filename,
        file.original_name,
        file.file_path,
        file.size,
        file.mimetype
      );
    },
    
    getById: (fileId: number) => {
      return db.prepare(`
        SELECT * FROM user_files WHERE id = ?
      `).get(fileId);
    },
    
    deleteById: (fileId: number) => {
      const file = dbHelpers.userFiles.getById(fileId);
      
      if (file && file.file_path) {
        try {
          fs.unlinkSync(file.file_path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
      
      return db.prepare(`
        DELETE FROM user_files WHERE id = ?
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

// Initialize the database
initializeDatabase();

// Set journal mode for better performance
db.pragma('journal_mode = WAL');

// Export both the database instance and helpers
export { db as default, dbHelpers };
