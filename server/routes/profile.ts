import express from 'express';
import type { Request, Response } from 'express';
import db, { dbHelpers } from '../db.js';
import type { User, Profile, GalleryImage } from '../types/types.js';

const router = express.Router();

// Get user profile information
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = dbHelpers.users.getById(userId) as User;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get extended profile data from profiles table
    const profileData = dbHelpers.profiles.getByUserId(userId) as Profile;
    
    // Get follower count
    const followerCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE followingId = ?
    `).get(userId) as { count: number };
    
    // Get following count
    const followingCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE followerId = ?
    `).get(userId) as { count: number };
    
    // Get gallery images
    const galleryImagesResult = dbHelpers.galleryImages.getByUserId(userId);
    const galleryImages = galleryImagesResult.map((item: GalleryImage) => item.imageUrl);
    
    // Format response using the consolidated Profile type
    const response = {
      userId: userId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      bio: user.bio || '',
      location: profileData?.location || '',
      createdAt: user.createdAt,
      updatedAt: profileData?.updatedAt || user.createdAt,
      socialLinks: profileData?.socialLinks || null,
      relationshipStatus: profileData?.relationshipStatus || null,
      age: profileData?.age === null || profileData?.age === undefined ? 
        'Not specified' : profileData.age,
      interests: profileData?.interests ? 
        JSON.parse(profileData.interests) : [],
      occupation: profileData?.occupation || '',
      company: profileData?.company || '',
      hobbies: profileData?.hobbies ? 
        JSON.parse(profileData.hobbies) : [],
      pets: profileData?.pets ? 
        JSON.parse(profileData.pets) : [],
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
    
    console.log('Profile update request received for user:', userId);
    console.log('Profile data:', JSON.stringify(profileData, null, 2));
    
    // Begin transaction
    dbHelpers.transaction.begin();
    
    try {
      // Update basic user information
      dbHelpers.users.update(userId, {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        bio: profileData.bio,
        avatarUrl: profileData.avatarUrl
      });
      
      // Check if profile exists
      const profileExists = dbHelpers.profiles.exists(userId);
      
      // Prepare profile data for database (convert arrays to JSON strings)
      const dbProfileData = {
        location: profileData.location || '',
        socialLinks: typeof profileData.socialLinks === 'string' ? 
          profileData.socialLinks : 
          JSON.stringify(profileData.socialLinks || {}),
        relationshipStatus: profileData.relationshipStatus || '',
        age: profileData.age !== undefined && profileData.age !== null && profileData.age !== '' ? 
          Number(profileData.age) : null,
        interests: Array.isArray(profileData.interests) ? 
          JSON.stringify(profileData.interests) : 
          (profileData.interests || '[]'),
        occupation: profileData.occupation || '',
        company: profileData.company || '',
        hobbies: Array.isArray(profileData.hobbies) ? 
          JSON.stringify(profileData.hobbies) : 
          (profileData.hobbies || '[]'),
        pets: Array.isArray(profileData.pets) ? 
          JSON.stringify(profileData.pets) : 
          (profileData.pets || '[]')
      };
      
      if (profileExists) {
        // Update existing profile
        console.log('Updating existing profile with data:', dbProfileData);
        dbHelpers.profiles.update(userId, dbProfileData);
      } else {
        // Create new profile
        console.log('Creating new profile with data:', dbProfileData);
        dbHelpers.profiles.create(userId, dbProfileData);
      }
      
      // Handle gallery images
      if (profileData.galleryImages && Array.isArray(profileData.galleryImages)) {
        // Get current gallery images
        const currentImages = dbHelpers.galleryImages.getByUserId(userId);
        const currentUrls = currentImages.map((img: GalleryImage) => img.imageUrl);
        
        // Only update if the gallery has changed
        if (JSON.stringify(currentUrls) !== JSON.stringify(profileData.galleryImages)) {
          console.log('Gallery images have changed, updating...');
          
          // Clear existing gallery images
          console.log('Clearing existing gallery images for user:', userId);
          dbHelpers.galleryImages.deleteAllForUser(userId);
          
          // Insert new gallery images
          console.log('Adding gallery images:', profileData.galleryImages);
          profileData.galleryImages
            .filter((imageUrl: string) => imageUrl && !imageUrl.includes('undefined'))
            .forEach((imageUrl: string) => {
              dbHelpers.galleryImages.create(userId, imageUrl);
            });
        }
      }
      
      // Commit transaction
      dbHelpers.transaction.commit();
      console.log('Transaction committed successfully');
      
      // Return updated profile
      res.json({
        ...profileData,
        userId: userId
      });
    } catch (dbError) {
      // Rollback transaction on error
      console.error('Database error, rolling back transaction:', dbError);
      dbHelpers.transaction.rollback();
      throw dbError;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
