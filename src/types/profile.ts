import { Topic } from ".";

// Basic profile information
export interface BasicProfile {
    firstName: string;
    lastName: string;
    userNickname: string;  // Display name
    avatarUrl?: string; // must make it local to avoid extra trafic
    userId: string; 
}

// Social connections only use/d if need 
export interface SocialLinks {
    twitter?: string;
    github?: string;
    linkedin?: string;
}

// Member profile extends basic profile with additional information
// for the extra info in use in app / shared here
export interface MemberProfile extends BasicProfile {
    userId: string;  // References User.id
    bio?: string;
    location?: string;
    joinedDate: string;
    socialLinks?: SocialLinks;
    relationshipStatus?: string;
    age?: number;
    interests?: string[];
    following?: Topic[];  // following topics
    // followers?: BasicProfile[]; unused for now
    followingMembers?: [];  // References Topic.id
    unreadAlerts?: number;  // Added for notification count. Unused for now
}

// // For future use  *** DONT think these are needed. Topics in sep file ***
// export interface Topic {
//     id: string;
//     name: string;
//     description?: string;
// }

// // Separate interface for profile state management 
// // Dont see the need for this
// export interface ProfileState {
//     profile: MemberProfile | null;
//     loading: boolean;
//     error?: string;
// }
