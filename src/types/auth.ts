import { User } from './index';

export interface AuthCredentials {
    username: string;
    password: string;  // Will be hashed using bcrypt
    firstName: string;
    lastName: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

export { User };

