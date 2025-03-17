/**
 * Consolidated type definitions for the entire application
 * All types are defined here to avoid duplication and ensure consistency
 */

// ==================== USER & AUTH TYPES ====================

// Basic user type
export interface User {
  userId: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

// Authentication credentials
export interface AuthCredentials {
  username: string;
  password: string;
  userId: number;
}

// Authentication state
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

// ==================== PROFILE TYPES ====================

// Basic profile information
export interface Profile {
  user_id: number;
  location: string | null;
  social_links: string | null;
  relationship_status: string | null;
  age: number | null;
  interests: string | null;
  occupation: string | null;
  company: string | null;
  hobbies: string | null;
  pets: string | null;
  created_at: string;
  updated_at: string;
}

// Social links structure
export interface SocialLinks {
  twitter?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

// Personal details structure
export interface PersonalDetails {
  location?: string;
  socialLinks?: SocialLinks;
  relationshipStatus?: string;
  age?: number | null;
  interests?: string[];
  occupation?: string;
  company?: string;
  hobbies?: string[];
  pets?: any[];
}

// Friend request status
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// Friend request interface
export interface FriendRequest {
  receiver_id: User["userId"]; // userId of requested user
  sender_userId: User["userId"] ; // userId of requestor for fr
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
}

// Basic profile for display in lists
export interface BasicProfile {
  userId: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

// Member profile with additional information
export interface MemberProfile extends BasicProfile {
  userId: string; // Duplicate userId for type safety
  profile: Profile;
  isFriend?: boolean;
  friendRequestStatus?: FriendRequestStatus;
  following?: Topic[];
  friends?: BasicProfile[];
  friendRequests?: FriendRequest[];
  followingMembers?: any[];
  unreadAlerts?: number;
  galleryImages?: string[];
  bio?: string;
  location?: string;
  interests?: string[];
  occupation?: string;
  company?: string;
  hobbies?: string[];
  pets?: any[];
  joinedDate?: string;
}

// ==================== CONTENT TYPES ====================

// Gallery Image type
export interface GalleryImage {
  id: number;
  user_id: number;
  image_url: string;
  created_at: string;
  file_name?: string;
}

// Basic topic definition
export interface Topic {
  id: number;
  title: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  
  // Client-specific additions
  headline?: string;
  topicOwnerOrMod?: number;
  followers?: User[];
  posts?: Post[];
  public?: boolean;
}

// Post definition
export interface Post {
  id: number;
  topic_id: number;
  content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  
  // Client-specific additions
  author?: User | BasicProfile;
  topic?: Topic | string;
  comments?: Comment[];
}

// Comment definition
export interface Comment {
  id: number;
  post_id: number;
  content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  
  // Client-specific additions
  author?: User | BasicProfile;
}

// Follow relationship
export interface Follow {
  follower_id: number;
  following_id: number;
  created_at: string;
}

// ==================== UTILITY TYPES ====================

// File related types
export interface UserFile {
  id: number;
  user_id: number;
  filename: string;
  original_name: string;
  file_path: string;
  size: number;
  mimetype: string;
  created_at: string;
}

// Database operation result type
export interface DbOperationResult {
  changes?: number;
  lastInsertRowid?: number | bigint;
}