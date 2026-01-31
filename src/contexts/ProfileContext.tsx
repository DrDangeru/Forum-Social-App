import { createContext } from 'react';
import type { Profile } from '../types/clientTypes';

// Define the context type
export interface ProfileContextType {
  profile: Profile | null;
  profiles: Record<string, Profile>;
  // eslint-disable-next-line no-unused-vars
  getProfile: (userId: string) => Promise<Profile>;
  // eslint-disable-next-line no-unused-vars
  updateProfile: (profile: Partial<Profile>, userId?: string) => Promise<Profile>;
  // eslint-disable-next-line no-unused-vars
  setCurrentProfile: (userId: string) => void;
}

// Create the context with a default value
export const ProfileContext = createContext<ProfileContextType | null>(null);
