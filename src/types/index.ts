export interface User {
  // Core user information
  id: number | string;  // Supporting both number and string IDs for flexibility
  username: string;     // Display name / nickname
  email: string;
  firstName: string;
  lastName: string;
  
  // Profile and social
  avatar_url?: string;  // Profile picture URL
  profilePic?: string;  // Alias for avatar_url for backward compatibility
  created_at: string;   // Account creation date
  friends?: User[];     // User's friends list
  
  // Extended profile information
  personalDetails?: PersonalDetails;
}

export interface Post {
  id: number;
  user_id: number;
  username: string;
  userProfilePic: string;
  content: string;
  topic: string;
  created_at: string;
  likes: number;
  comments: number;
}

export interface Topic {
  id: number;
  headline: string;
  topicOwnerOrMod: User['id'];
  description: string;
  created_at: string;
  followers: User[];
  posts: Post[];
  public: boolean;
}

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
