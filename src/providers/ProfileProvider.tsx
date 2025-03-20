import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ProfileContext, ProfileContextType } from '../contexts/ProfileContext';
import type { Profile } from '../types';
import { useAuth } from '../hooks/useAuth';

// Default profile for new users
const defaultProfile: Profile = {
  userId: '',
  username: '',
  first_name: '',
  last_name: '',
  bio: '',
  location: '',
  interests: [],
  following: [],
  followingMembers: [],
  unreadAlerts: 0,
  social_links: null,
  relationship_status: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  avatar_url: null,
  galleryImages: []
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // Store profiles in a map, keyed by userId
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Set current profile to the logged-in user's profile
  useEffect(() => {
    if (user?.userId) {
      setCurrentProfileId(user.userId);
      // Load the user's profile if not already loaded
      // if (!profiles[user.userId]) {
      //   fetchProfile(user.userId);
      // }  Think this wont work... and not registered users will not
      // have a profile, thus probably best to leave this out
    }
  }, [user]);
  
  // Fetch a profile by userId
  const fetchProfile = async (userId: string) => {
    try {
      const response = await axios.get(`/api/profiles/${userId}`);
      setProfiles(prevProfiles => ({
        ...prevProfiles,
        [userId]: response.data
      }));
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      const newProfile = { ...defaultProfile, userId };
      setProfiles(prevProfiles => ({
        ...prevProfiles,
        [userId]: newProfile
      }));
      return newProfile;
    }
  };
  
  // Get a profile by userId, fetching it if not already loaded
  const getProfile = useCallback(async (userId: string): Promise<Profile> => {
    if (profiles[userId]) {
      return profiles[userId];
    }
    
    return await fetchProfile(userId);
  }, [profiles]);
  
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
      
      console.log('Sending profile update to server:', newProfile);
      
      // Send update to server
      const response = await axios.put(`/api/profiles/${targetUserId}`, newProfile);
      const updatedData = response.data;
      
      console.log('Received updated profile from server:', updatedData);
      
      // Update profiles map with the server response data
      setProfiles(prevProfiles => ({
        ...prevProfiles,
        [targetUserId]: updatedData
      }));
      
      return updatedData;
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Don't update local state if server update failed - this ensures we don't get out of sync
      throw error;
    }
  }, [profiles, currentProfileId]);

  // Set which profile is currently being viewed
  const setCurrentProfile = useCallback((userId: string) => {
    setCurrentProfileId(userId);
    
    // Load the profile if not already loaded
    if (!profiles[userId]) {
      fetchProfile(userId);
    }
  }, [profiles]);

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
