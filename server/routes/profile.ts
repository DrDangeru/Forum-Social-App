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
      SELECT COUNT(*) as count FROM follows WHERE following_id = ?
    `).get(Number(userId)) as { count: number };
    
    // Get following count
    const followingCountResult = db.prepare(`
      SELECT COUNT(*) as count FROM follows WHERE follower_id = ?
    `).get(Number(userId)) as { count: number };
    
    // Get gallery images
    const galleryImagesResult = // implicit type GalleryImage[] auto assigned
       dbHelpers.galleryImages.getByUserId(Number(userId));
    
    
    const galleryImages = galleryImagesResult.map((item: GalleryImage) => item.image_url);
    
    // Format response
    const response = {
      userId: user.userId,
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
    
    console.log('Profile update request received for user:', userId);
    console.log('Profile data:', JSON.stringify(profileData, null, 2));
    
    // Begin transaction
    dbHelpers.transaction.begin();
    
    try {
      // Update basic user information
      dbHelpers.users.update(Number(userId), {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        bio: profileData.bio,
        avatar_url: profileData.avatarUrl
      });
      
      // Check if profile exists
      const profileExists = dbHelpers.profiles.exists(Number(userId));
      
      if (profileExists) {
        // Update existing profile
        dbHelpers.profiles.update(Number(userId), {
          location: profileData.location,
          social_links: JSON.stringify(profileData.socialLinks),
          relationship_status: profileData.relationshipStatus,
          age: profileData.age,
          interests: JSON.stringify(profileData.interests),
          occupation: profileData.occupation,
          company: profileData.company,
          hobbies: JSON.stringify(profileData.hobbies),
          pets: JSON.stringify(profileData.pets)
        });
      } else {
        // Insert new profile
        dbHelpers.profiles.create(Number(userId), {
          location: profileData.location,
          social_links: JSON.stringify(profileData.socialLinks),
          relationship_status: profileData.relationshipStatus,
          age: profileData.age,
          interests: JSON.stringify(profileData.interests),
          occupation: profileData.occupation,
          company: profileData.company,
          hobbies: JSON.stringify(profileData.hobbies),
          pets: JSON.stringify(profileData.pets)
        });
      }
      
      // Handle gallery images
      if (profileData.galleryImages && Array.isArray(profileData.galleryImages)) {
        // Clear existing gallery images
        dbHelpers.galleryImages.deleteAllForUser(Number(userId));
        
        // Insert new gallery images
        profileData.galleryImages.forEach((imageUrl: string) => {
          dbHelpers.galleryImages.create(Number(userId), imageUrl);
        });
      }
      
      // Commit transaction
      dbHelpers.transaction.commit();
      
      // Return updated profile
      res.json(profileData);
    } catch (dbError) {
      // Rollback transaction on error
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
