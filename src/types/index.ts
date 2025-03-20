/**
 * Consolidated type definitions for the entire application
 * All types are defined here to avoid duplication and ensure consistency
 */

// ==================== USER & AUTH TYPES ====================

// Basic user type
export interface User {
  userId: string;
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
  userId: string;
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
  userId: string; 
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  social_links: string | null;
  relationship_status: string | null;
  created_at: string;
  updated_at: string;
  isFriend?: boolean;
  friendRequestStatus?: FriendRequestStatus;
  following?: Topic[];
  friends?: BasicProfile[];
  friendRequests?: FriendRequest[];
  followingMembers?: any[];
  unreadAlerts?: number;
  age?: number | null;
  galleryImages?: string[];
  bio?: string;
  location?: string;
  interests?: string[];
  occupation?: string;
  company?: string;
  hobbies?: string[];
  pets?: any[];
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

// Personal details structure Duplicate of MemberProfile .. delete
// export interface PersonalDetails {
//   location?: string;
//   socialLinks?: SocialLinks;
//   relationshipStatus?: string;
//   age?: number | null;
//   interests?: string[];
//   occupation?: string;
//   company?: string;
//   hobbies?: string[];
//   pets?: any[];
// }

// Friend request status
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// Friend request interface
export interface FriendRequest {
  id?: number;
  receiver_id: User["userId"]; // userId of requested user
  sender_userId: User["userId"]; // userId of requestor for fr
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
  
  // Sender information
  sender_first_name?: string;
  sender_last_name?: string;
  sender_username?: string;
  sender_avatar_url?: string | null;
  
  // Receiver information
  receiver_first_name?: string;
  receiver_last_name?: string;
  receiver_username?: string;
  receiver_avatar_url?: string | null;
}

// Basic profile for display in lists
export interface BasicProfile {
  userId: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

// ==================== CONTENT TYPES ====================

// Gallery Image type
export interface GalleryImage {
  id: number;
  userId: string;
  image_url: string;
  created_at: string;
  file_name?: string;
}

// Basic topic definition
export interface Topic {
  id: number;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Client-specific additions
  headline?: string;
  topicOwnerOrMod?: string;
  followers?: User[];
  posts?: Post[];
  public?: boolean;
}

// Post definition
export interface Post {
  id: number;
  topic_id: number;
  content: string;
  created_by: string;
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
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Client-specific additions
  author?: User | BasicProfile;
}

// Follow relationship
export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

// ==================== UTILITY TYPES ====================

// File related types
export interface UserFile {
  id: number;
  userId: string;
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