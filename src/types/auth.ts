import { User } from './index';

export interface AuthCredentials {
    username: string;
    email: string;
    password: string;  // Will be hashed using bcrypt
    firstName?: string; // These are just for reg
    lastName?: string; // These are just for reg
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}
