import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { ProfileContext, ProfileContextType } from '../contexts/ProfileContext';
import type { MemberProfile } from '../types/Profile';
import { useAuth } from '../hooks/useAuth';

// Default profile for new users
const defaultProfile: MemberProfile = {
  userId: '',
  firstName: '',
  lastName: '',
  userNickname: '',
  joinedDate: new Date().toISOString(),
  bio: '',
  location: '',
  interests: [],
  following: [],
  followingMembers: [],
  unreadAlerts: 0
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // Store profiles in a map, keyed by userId
  const [profiles, setProfiles] = useState<Record<string, MemberProfile>>({});
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Set current profile to the logged-in user's profile
  useEffect(() => {
    if (user?.id) {
      setCurrentProfileId(user.id);
      // Load the user's profile if not already loaded
      if (!profiles[user.id]) {
        fetchProfile(user.id);
      }
    }
  }, [user, profiles]);
  
  // Fetch a profile by userId
  const fetchProfile = async (userId: string) => {
    try {
      const response = await axios.get(`/api/profiles/${userId}`);
      const profileData = response.data;
      
      setProfiles(prevProfiles => ({
        ...prevProfiles,
        [userId]: profileData
      }));
      
      return profileData;
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      // Create a default profile for this user if not found
      const newProfile = { ...defaultProfile, userId };
      setProfiles(prevProfiles => ({
        ...prevProfiles,
        [userId]: newProfile
      }));
      return newProfile;
    }
  };
  
  // Get a profile by userId, fetching it if not already loaded
  const getProfile = useCallback(async (userId: string): Promise<MemberProfile> => {
    if (profiles[userId]) {
      return profiles[userId];
    }
    
    return await fetchProfile(userId);
  }, [profiles]);
  
  // Update profile information
  const updateProfile = useCallback(async (
    updatedProfile: Partial<MemberProfile>,
    userId?: string
  ): Promise<MemberProfile> => {
    // Use provided userId or current profile id
    const targetUserId = userId || currentProfileId;
    
    if (!targetUserId) {
      throw new Error('No user ID provided for profile update');
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
      
      // Update profiles map
      setProfiles(prevProfiles => ({
        ...prevProfiles,
        [targetUserId]: updatedData
      }));
      
      return updatedData;
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Update local state even if server update failed
      const existingProfile = profiles[targetUserId] || { ...defaultProfile, userId: targetUserId };
      const fallbackProfile = { ...existingProfile, ...updatedProfile };
      
      setProfiles(prevProfiles => ({
        ...prevProfiles,
        [targetUserId]: fallbackProfile
      }));
      
      return fallbackProfile; // Return the fallback profile when there's an error
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
