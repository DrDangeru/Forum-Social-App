export interface User {
    id: string;
    email: string;
    username: string;  // Used for login, can be different from display name
}

export interface AuthCredentials {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

// Registration data extends auth credentials with profile information
export interface RegistrationData extends AuthCredentials {
    email: string;
    profile: {
        firstName: string;
        lastName: string;
        userNickname: string;
    };
}
