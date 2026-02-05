import { createContext } from 'react';
import type { ProfileContextType } from '../types/clientTypes';

// Create the context with a default value
export const ProfileContext = createContext<ProfileContextType | null>(null);
