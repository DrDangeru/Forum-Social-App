import type { AuthState, AuthCredentials, User } from '../types';
import { createContext } from 'react';

// Define the context type
export interface AuthContextType extends AuthState {
    // eslint-disable-next-line no-unused-vars
    login: (arg: AuthCredentials) => Promise<User>; 
    logout: () => void;
    // eslint-disable-next-line no-unused-vars
    register: (arg: Omit<AuthCredentials, 'userId'> & { 
        firstName: string; 
        lastName: string;
        email: string;
    }) => Promise<User>;
}

// Create the context with a default value
export const AuthContext = createContext<AuthContextType | null>(null);
