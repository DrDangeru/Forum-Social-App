import { createContext } from 'react';
import type { MemberProfile } from '../types/profile';

// Define the context type
export interface ProfileContextType {
  profile: MemberProfile | null;
  profiles: Record<string, MemberProfile>;
  // eslint-disable-next-line no-unused-vars
  getProfile: (userId: string) => Promise<MemberProfile>;
  // eslint-disable-next-line no-unused-vars
  updateProfile: (profile: Partial<MemberProfile>, userId?: string) => Promise<MemberProfile>;
  // eslint-disable-next-line no-unused-vars
  setCurrentProfile: (userId: string) => void;
}

// Create the context with a default value
export const ProfileContext = createContext<ProfileContextType | null>(null);
