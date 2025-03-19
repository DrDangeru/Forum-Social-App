/* eslint-disable no-unused-vars */
/**
 * Consolidated server-side type definitions
 * These types match the client-side definitions 100%
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
  isFriend?: boolean;
  friendRequestStatus?: FriendRequestStatus;
  following?: Topic[];
  friends?: BasicProfile[];
  friendRequests?: FriendRequest[];
  followingMembers?: any[];
  unreadAlerts?: number;
  galleryImages?: string[];
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

// Friend request status
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// Friend request interface
export interface FriendRequest {
  id: number;
  senderId: number;
  receiverId: number;
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

// ==================== CONTENT TYPES ====================

// Topic interface
export interface Topic {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

// Post interface
export interface Post {
  id: number;
  userId: number;
  content: string;
  createdBy: number;
  created_at: string;
  updated_at: string;
}

// Comment definition
export interface Comment {
  id: number;
  postId: number;
  content: string;
  createdBy: number;
  created_at: string;
  updated_at: string;
}

// Follow relationship
export interface Follow {
  followerId: number;
  followingId: number;
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

// Gallery Image type
export interface GalleryImage {
  id: number;
  userId: number;
  imageUrl: string;
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
    getById: (userId: number) => User;
    create: (user: {
      username: string;
      email: string;
      password_hash: string;
      first_name: string;
      last_name: string;
    }) => DbOperationResult;
    update: (userId: number, data: {
      first_name?: string;
      last_name?: string;
      bio?: string;
      avatar_url?: string | null;
    }) => DbOperationResult;
    updateProfilePicture: (userId: number, filePath: string) => DbOperationResult;
  };
  
  profiles: {
    getByUserId: (userId: number) => Profile | undefined;
    exists: (userId: number) => boolean;
    update: (userId: number, data: {
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
    create: (userId: number, data: {
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
    getByUserId: (userId: number) => GalleryImage[];
    deleteAllForUser: (userId: number) => DbOperationResult;
    create: (userId: number, imageUrl: string) => DbOperationResult;
  };
  
  userFiles: {
    getByUserId: (userId: number) => UserFile[];
    getFileCount: (userId: number) => { count: number };
    create: (file: {
      userId: number;
      filename: string;
      original_name: string;
      file_path: string;
      size: number;
      mimetype: string;
    }) => DbOperationResult;
    getById: (fileId: number) => UserFile;
    deleteById: (fileId: number) => DbOperationResult;
  };
  
  transaction: {
    begin: () => void;
    commit: () => void;
    rollback: () => void;
  };
}
