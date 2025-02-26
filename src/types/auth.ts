export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar_url?: string;
    created_at?: string;
}

export interface AuthCredentials {
    username: string;
    email?: string;
    password: string;  // Will be hashed using bcrypt
    firstName?: string; // These are just for reg
    lastName?: string; // These are just for reg
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}
