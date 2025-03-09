import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { ProfileContext, ProfileContextType } from '../contexts/ProfileContext';
import type { MemberProfile } from '../types/profile';

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
  const [profile, setProfile] = useState<MemberProfile | null>(null);

  // Update profile information
  const updateProfile = useCallback(
    async (
      updatedProfile: Partial<MemberProfile>
    ): Promise<MemberProfile> => {
    try {
      // If we have a profile, merge the updates with the existing profile
      const newProfile = profile 
        ? { ...profile, ...updatedProfile } 
        : { ...defaultProfile, ...updatedProfile };
      
      // If we have a userId, send the update to the server
      if (newProfile.userId) {
        // Make API call to update profile on the server
        const response = await axios.put(`/api/profiles/${newProfile.userId}`, newProfile);
        const updatedData = response.data;
        setProfile(updatedData);
        return updatedData;
      } else {
        // Just update local state if no userId (e.g., during initial setup)
        setProfile(newProfile);
        return newProfile;
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // Return the local updated profile even if the server update failed
      const fallbackProfile = profile 
        ? { ...profile, ...updatedProfile } 
        : { ...defaultProfile, ...updatedProfile };
      setProfile(fallbackProfile);
      return fallbackProfile;
    }
  }, [profile]);

  // Create the context value object
  const contextValue: ProfileContextType = {
    profile,
    updateProfile
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}
