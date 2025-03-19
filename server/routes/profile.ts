import express from 'express';
import type { Request, Response } from 'express';
import db, { dbHelpers } from '../db';
import type { User, Profile, GalleryImage } from '../types';

const router = express.Router();

// Get user profile information
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = dbHelpers.users.getById(Number(userId)) as User;
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get extended profile data from profiles table
    const profileData = dbHelpers.profiles.getByUserId(Number(userId)) as Profile;
    
    // Get follower count
    const followerCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE followingId = ?
    `).get(Number(userId)) as { count: number };
    
    // Get following count
    const followingCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE followerId = ?
    `).get(Number(userId)) as { count: number };
    
    // Get gallery images
    const galleryImagesResult = dbHelpers.galleryImages.getByUserId(Number(userId));
    const galleryImages = galleryImagesResult.map((item: GalleryImage) => item.image_url);
    
    // Format response using the consolidated Profile type
    const response = {
      userId: userId.toString(),
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      bio: user.bio || '',
      location: profileData?.location || '',
      created_at: user.created_at,
      updated_at: profileData?.updated_at || user.created_at,
      social_links: profileData?.social_links || null,
      relationship_status: profileData?.relationship_status || null,
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
    
    console.log('Profile update request received for user:', userId);
    console.log('Profile data:', JSON.stringify(profileData, null, 2));
    
    // Begin transaction
    dbHelpers.transaction.begin();
    
    try {
      // Update basic user information
      dbHelpers.users.update(Number(userId), {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url
      });
      
      // Check if profile exists
      const profileExists = dbHelpers.profiles.exists(Number(userId));
      
      // Prepare profile data for database (convert arrays to JSON strings)
      const dbProfileData = {
        location: profileData.location || '',
        social_links: typeof profileData.social_links === 'string' ? 
          profileData.social_links : 
          JSON.stringify(profileData.social_links || {}),
        relationship_status: profileData.relationship_status || '',
        age: profileData.age || null,
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
        dbHelpers.profiles.update(Number(userId), dbProfileData);
      } else {
        // Insert new profile
        console.log('Creating new profile with data:', dbProfileData);
        dbHelpers.profiles.create(Number(userId), dbProfileData);
      }
      
      // Handle gallery images
      if (profileData.galleryImages && Array.isArray(profileData.galleryImages)) {
        // Clear existing gallery images
        console.log('Clearing existing gallery images for user:', userId);
        dbHelpers.galleryImages.deleteAllForUser(Number(userId));
        
        // Insert new gallery images
        console.log('Adding gallery images:', profileData.galleryImages);
        profileData.galleryImages.forEach((imageUrl: string) => {
          dbHelpers.galleryImages.create(Number(userId), imageUrl);
        });
      }
      
      // Commit transaction
      dbHelpers.transaction.commit();
      console.log('Transaction committed successfully');
      
      // Return updated profile
      res.json({
        ...profileData,
        userId: userId.toString()
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
