import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ProfileContext, ProfileContextType } from '../contexts/ProfileContext';
import type { Profile } from '../types';
import { useAuth } from '../hooks/useAuth';

// Default profile for new users, empty 
const defaultProfile: Profile = {
  userId: '',
  username: '',
  firstName: '',
  lastName: '',
  bio: '',
  location: '',
  interests: [],
  following: [],
  followingMembers: [],
  unreadAlerts: 0,
  socialLinks: null,
  relationshipStatus: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  avatarUrl: null,
  galleryImages: []
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // Store profiles in a map, keyed by userId
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  // Fetch a profile by userId
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const response = await axios.get(`/api/profile/${userId}`);
      const profile = response.data;
      
      setProfiles(prevProfiles => ({
        ...prevProfiles,
        [userId]: profile
      }));
      return profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }, []); // should be triggered by a request and not   
  // some sort of a auto refresh / trigger 
  // Empty dependency array would prevent re-renders if uncalled.
  
  // Set current profile to the logged-in user's profile and ensure it's loaded
  useEffect(() => {
    if (user?.userId && isAuthenticated) {
      setCurrentProfileId(user.userId);
      fetchProfile(user.userId).catch(console.error);
    }
  }, [user, isAuthenticated, fetchProfile]);
  
  // Get a profile by userId, fetching it if not already loaded
  const getProfile = useCallback(async (userId: string): Promise<Profile> => {
    if (profiles[userId]) {
      return profiles[userId];
    }
  
      return await fetchProfile(userId);
  }, [profiles, fetchProfile]);
  
  // Update profile information
  const updateProfile = useCallback(async (
    updatedProfile: Partial<Profile>,
    userId?: string
  ): Promise<Profile> => {
    // Use provided userId or current profile id
    const targetUserId = userId || currentProfileId;
    
    if (!targetUserId) {
      throw new Error('No user ID provided and no current profile set');
    }
    
    try {
      // Get the existing profile or use default
      const existingProfile = profiles[targetUserId] || { ...defaultProfile, userId: targetUserId };
      
      // Merge updates with existing profile
      const newProfile = { ...existingProfile, ...updatedProfile };
      
      // Send update to server
      await axios.put(`/api/profile/${targetUserId}`, newProfile);
      
      // Re-fetch the profile to ensure we have the latest data
      return await fetchProfile(targetUserId);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [profiles, currentProfileId, fetchProfile]);

  // Set which profile is currently being viewed
  const setCurrentProfile = useCallback((userId: string) => {
    setCurrentProfileId(userId);
    
    // Load the profile if not already loaded
    if (!profiles[userId]) {
      fetchProfile(userId).catch(console.error);
    }
  }, [profiles, fetchProfile]);

  // Create the context value object
  const contextValue: ProfileContextType = {
    profile: currentProfileId ? profiles[currentProfileId] || null : null,
    profiles,
    getProfile,
    updateProfile,
    setCurrentProfile
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}
