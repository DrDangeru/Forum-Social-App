import { Topic } from "./Topic";

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

// Personal details information
export interface PersonalDetails {
    age?: number;
    relationshipStatus?: 'Single' | 'In a relationship' | 'Married' | 'Prefer not to say';
    hobbies?: string[];
    occupation?: string;
    company?: string;
    pets?: {
        type: string;
        name: string;
    }[];
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
    occupation?: string;    // Added for occupation info
    company?: string;      // Added for company info
    hobbies?: string[];    // Added for hobbies
    pets?: Array<{ type: string; name: string; }>; // Added for pets info
    galleryImages?: string[]; // Added for photo gallery
}
