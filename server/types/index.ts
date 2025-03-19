/* eslint-disable no-unused-vars */
/**
 * Consolidated server-side type definitions
 * All types are defined here to avoid duplication and ensure consistency
 */

// ==================== USER & AUTH TYPES ====================

// Basic user type
export interface User {
  id: number;
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
  userId: number;
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
  id: number;
  sender_id: number;
  receiver_id: number;
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
}

// Basic profile for display in lists
export interface BasicProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

// Member profile with additional information
export interface MemberProfile {
  user: User;
  profile: Profile;
  isFriend?: boolean;
  friendRequestStatus?: FriendRequestStatus;
  following?: Topic[];
  friends?: BasicProfile[];
  friendRequests?: FriendRequest[];
  followingMembers?: any[];
  unreadAlerts?: number;
  galleryImages?: string[];
}

// ==================== CONTENT TYPES ====================

// Gallery Image type
export interface GalleryImage {
  id: number;
  userId: number;
  image_url: string;
  created_at: string;     
}

// Basic topic definition
export interface Topic {
  id: number;
  title: string;
  description: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Post definition
export interface Post {
  id: number;
  topic_id: number;
  content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// Comment definition
export interface Comment {
  id: number;
  post_id: number;
  content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
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
  userId: number;
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

// Database helper types
export interface DbHelpers {
  users: {
    getById: (userId: string) => User;
    create: (user: {
      username: string;
      email: string;
      password_hash: string;
      first_name: string;
      last_name: string;
    }) => DbOperationResult;
    update: (userId: string, data: {
      first_name?: string;
      last_name?: string;
      bio?: string;
      avatar_url?: string | null;
    }) => DbOperationResult;
    updateProfilePicture: (userId: string, filePath: string) => DbOperationResult;
  };
  
  profiles: {
    getByUserId: (userId: string) => Profile | undefined;
    exists: (userId: string) => boolean;
    update: (userId: string, data: {
      location?: string;
      social_links?: string;
      relationship_status?: string;
      age?: number | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => DbOperationResult;
    create: (userId: string, data: {
      location?: string;
      social_links?: string;
      relationship_status?: string;
      age?: number | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => DbOperationResult;
  };
  
  galleryImages: {
    getByUserId: (userId: string) => GalleryImage[];
    deleteAllForUser: (userId: string) => DbOperationResult;
    create: (userId: string, imageUrl: string) => DbOperationResult;
  };
  
  userFiles: {
    getByUserId: (userId: string) => UserFile[];
    getFileCount: (userId: string) => { count: number };
    create: (file: {
      userId: string;
      filename: string;
      original_name: string;
      file_path: string;
      size: number;
      mimetype: string;
    }) => DbOperationResult;
    getById: (fileId: string) => UserFile;
    deleteById: (fileId: string) => DbOperationResult;
  };
  
  transaction: {
    begin: () => void;
    commit: () => void;
    rollback: () => void;
  };
}