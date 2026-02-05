import type { AuthContextType } from '../types/clientTypes';
import { createContext } from 'react';

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | null>(null);
