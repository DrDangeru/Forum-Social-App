import React, { createContext, useContext, useState, useCallback } from 'react';
import { MemberProfile } from '../types/profile';

interface ProfileContextType {
    profile: MemberProfile | null;
    updateProfile: (profile: Partial<MemberProfile>) => Promise<void>;
    fetchProfile: (userId: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<MemberProfile | null>(null);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            // Here you would typically make an API call to your backend
            // For now, we'll simulate fetching a profile
            const fetchedProfile: MemberProfile = {
                userId,
                joinedDate: new Date().toISOString(),
                // Other fields would be populated from the API
            };
            
            setProfile(fetchedProfile);
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            throw error;
        }
    }, []);

    const updateProfile = useCallback(async (updates: Partial<MemberProfile>) => {
        try {
            // Here you would typically make an API call to your backend
            // For now, we'll just update the local state
            setProfile(prev => prev ? { ...prev, ...updates } : null);
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, updateProfile, fetchProfile }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfile must be used within a ProfileProvider');
    }
    return context;
}
