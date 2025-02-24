import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { MemberProfile, BasicProfile } from '../types/profile';

interface ProfileContextType {
    profile: MemberProfile | null;
    basicProfile: BasicProfile | null;
    updateProfile: (profile: Partial<MemberProfile>) => Promise<void>;
    fetchProfile: (userId: string) => Promise<void>;
    setBasicProfile: (profile: BasicProfile) => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [basicProfile, setBasicProfile] = useState<BasicProfile | null>(null);

    // Effect to sync member profile with basic profile when logging in
    useEffect(() => {
        if (basicProfile && !profile && basicProfile.userId) {
            fetchProfile(basicProfile.userId).catch(console.error);
        }
    }, [basicProfile]);

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            // Here you would typically make an API call to your backend
            // For now, we'll create a member profile based on basic profile
            if (basicProfile && basicProfile.userId === userId) {
                const fetchedProfile: MemberProfile = {
                    ...basicProfile,
                    userId,
                    joinedDate: new Date().toISOString(),
                    socialLinks: {},
                    interests: [],
                    following: [],
                    // followers: [], probably not needed
                    //followingTopics: [], probably not needed
                    unreadAlerts: 0
                };
                
                setProfile(fetchedProfile);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            throw error;
        }
    }, [basicProfile]);

    const updateProfile = useCallback(async (updates: Partial<MemberProfile>) => {
        try {
            // Here you would typically make an API call to your backend
            setProfile(prev => prev ? { ...prev, ...updates } : null);
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    }, []);

    return (
        <ProfileContext.Provider 
            value={{ 
                profile, 
                basicProfile,
                updateProfile, 
                fetchProfile,
                setBasicProfile 
            }}
        >
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
