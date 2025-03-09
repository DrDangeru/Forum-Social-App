import { createContext } from 'react';
import type { MemberProfile } from '../types/profile';

// Define the context type
export interface ProfileContextType {
   profile: MemberProfile | null;
  // eslint-disable-next-line no-unused-vars
  updateProfile: (profile: Partial<MemberProfile>) => Promise<MemberProfile>;
}

// Create the context with a default value
export const ProfileContext = createContext<ProfileContextType | null>(null);
