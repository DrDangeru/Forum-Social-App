//import bcrypt from 'bcrypt'; Unused 

export interface User {
    id: string;
    email: string;
    username: string;  // Used for login, can be different from display name
}

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

// // Registration data extends auth credentials with profile information
//  *** DONT think these are needed or useful  ***
// export interface RegistrationData extends AuthCredentials {
//     email: string;
//     profile: {
//         firstName: string;
//         lastName: string;
//         userNickname: string;
//     };
// }
