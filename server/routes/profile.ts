import express from 'express';
import type { Request, Response } from 'express';
import db from '../db';

const router = express.Router();

// Get user profile information
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = db.prepare(`
      SELECT id, username, email, avatar_url, first_name, last_name, created_at, bio
      FROM users WHERE id = ?
    `).get(userId) as {
      id: string;
      username: string;
      email: string;
      avatar_url?: string;
      first_name: string;
      last_name: string;
      created_at: string;
      bio?: string;
    } | undefined;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get extended profile data from profiles table
    const profileData = db.prepare(`
      SELECT * FROM profiles WHERE user_id = ?
    `).get(userId) as {
      user_id: string;
      location?: string;
      social_links?: string;
      relationship_status?: string;
      age?: number;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    } | undefined;
    
    // Get follower count
    const followerCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE following_id = ?
    `).get(userId) as { count: number };
    
    // Get following count
    const followingCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE follower_id = ?
    `).get(userId) as { count: number };
    
    // Get gallery images
    const galleryImagesResult = db.prepare(`
      SELECT image_url FROM gallery_images WHERE user_id = ? ORDER BY created_at DESC
    `).all(userId) as { image_url: string }[];
    
    const galleryImages = galleryImagesResult.map(item => item.image_url);
    
    // Format response
    const response = {
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      userNickname: user.username,
      avatarUrl: user.avatar_url,
      bio: user.bio || '',
      location: profileData?.location || '',
      joinedDate: user.created_at,
      socialLinks: profileData?.social_links ? JSON.parse(profileData.social_links) : {},
      relationshipStatus: profileData?.relationship_status || '',
      age: profileData?.age || null,
      interests: profileData?.interests ? JSON.parse(profileData.interests) : [],
      occupation: profileData?.occupation || '',
      company: profileData?.company || '',
      hobbies: profileData?.hobbies ? JSON.parse(profileData.hobbies) : [],
      pets: profileData?.pets ? JSON.parse(profileData.pets) : [],
      galleryImages,
      followerCount: followerCountResult.count,
      followingCount: followingCountResult.count
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching profile:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Update profile details
router.put('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;
    
    // Ensure the profile exists in the database
    ensureProfileTablesExist();
    
    // Begin transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
      // Update basic user information
      db.prepare(`
        UPDATE users 
        SET first_name = ?, last_name = ?, bio = ?, avatar_url = ?
        WHERE id = ?
      `).run(
        profileData.firstName || '', 
        profileData.lastName || '', 
        profileData.bio || '',
        profileData.avatarUrl || null,
        userId
      );
      
      // Check if profile exists
      const existingProfile = db.prepare('SELECT 1 FROM profiles WHERE user_id = ?').get(userId);
      
      if (existingProfile) {
        // Update existing profile
        db.prepare(`
          UPDATE profiles 
          SET location = ?, 
              social_links = ?, 
              relationship_status = ?,
              age = ?,
              interests = ?,
              occupation = ?,
              company = ?,
              hobbies = ?,
              pets = ?
          WHERE user_id = ?
        `).run(
          profileData.location || '',
          JSON.stringify(profileData.socialLinks || {}),
          profileData.relationshipStatus || '',
          profileData.age || null,
          JSON.stringify(profileData.interests || []),
          profileData.occupation || '',
          profileData.company || '',
          JSON.stringify(profileData.hobbies || []),
          JSON.stringify(profileData.pets || []),
          userId
        );
      } else {
        // Insert new profile
        db.prepare(`
          INSERT INTO profiles (
            user_id, location, social_links, relationship_status, 
            age, interests, occupation, company, hobbies, pets
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          userId,
          profileData.location || '',
          JSON.stringify(profileData.socialLinks || {}),
          profileData.relationshipStatus || '',
          profileData.age || null,
          JSON.stringify(profileData.interests || []),
          profileData.occupation || '',
          profileData.company || '',
          JSON.stringify(profileData.hobbies || []),
          JSON.stringify(profileData.pets || [])
        );
      }
      
      // Handle gallery images
      if (profileData.galleryImages && Array.isArray(profileData.galleryImages)) {
        // Clear existing gallery images
        db.prepare('DELETE FROM gallery_images WHERE user_id = ?').run(userId);
        
        // Insert new gallery images
        const insertGalleryImage = db.prepare(
          'INSERT INTO gallery_images (user_id, image_url) VALUES (?, ?)'
        );
        
        profileData.galleryImages.forEach((imageUrl: string) => {
          insertGalleryImage.run(userId, imageUrl);
        });
      }
      
      // Commit transaction
      db.prepare('COMMIT').run();
      
      // Return updated profile
      res.json(profileData);
    } catch (dbError) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Ensure required tables exist
function ensureProfileTablesExist() {
  // Create profiles table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      location TEXT,
      social_links TEXT,
      relationship_status TEXT,
      age INTEGER,
      interests TEXT,
      occupation TEXT,
      company TEXT,
      hobbies TEXT,
      pets TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();
  
  // Create gallery_images table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `).run();
}

export default router;
