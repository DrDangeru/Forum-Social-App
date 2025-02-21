// Basic profile information
export interface BasicProfile {
    firstName: string;
    lastName: string;
    userNickname: string;  // Display name
    avatarUrl?: string;
}

// Social connections only use/d if need 
export interface SocialLinks {
    twitter?: string;
    github?: string;
    linkedin?: string;
}

// Member profile extends basic profile with additional information
//  only use/d if need 
export interface MemberProfile extends BasicProfile {
    userId: string;  // References User.id
    bio?: string;
    location?: string;
    joinedDate: string;
    socialLinks?: SocialLinks;
    interests?: string[];
    following?: BasicProfile[];  // Only basic info needed for following/followers
    followers?: BasicProfile[];
    followingTopics? : Topic[];  // References Topic.id
}

// For future use
export interface Topic {
    id: string;
    name: string;
    description?: string;
}

// Separate interface for profile state management 
// Dont see the need for this
export interface ProfileState {
    profile: MemberProfile | null;
    loading: boolean;
    error?: string;
}
