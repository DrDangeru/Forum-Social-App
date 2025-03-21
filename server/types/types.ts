/* eslint-disable no-unused-vars */
/**
 * Consolidated server-side type definitions
 * These types match the client-side definitions 100%
 */

// ==================== USER & AUTH TYPES ====================

// Basic user type
export interface User {
  userId: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
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
  location: string | null;
  socialLinks: string | null;
  relationshipStatus: string | null;
  age: number | null;
  interests: string | null;
  occupation: string | null;
  company: string | null;
  hobbies: string | null;
  pets: string | null;
  createdAt: string;
  updatedAt: string;
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
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
}

// Basic profile for display in lists
export interface BasicProfile {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

// ==================== CONTENT TYPES ====================

// Topic interface
export interface Topic {
  id: number;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  headline?: string;
  topicOwnerOrMod?: string;
  followers?: User[];
  posts?: Post[];
  public?: boolean;
}

// Post interface
export interface Post {
  id: number;
  userId: string;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  author?: User | BasicProfile;
  topic?: Topic | string;
  comments?: Comment[];
}

// Comment definition
export interface Comment {
  id: number;
  postId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  author?: User | BasicProfile;
}

// Follow relationship
export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

// ==================== UTILITY TYPES ====================

// File related types
export interface UserFile {
  id: number;
  userId: string;
  filename: string;
  originalName: string;
  filePath: string;
  size: number;
  mimetype: string;
  createdAt: string;
}

// Gallery Image type
export interface GalleryImage {
  id: number;
  userId: string;
  imageUrl: string;
  createdAt: string;
  fileName?: string;
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
      userId?: string;
      username: string;
      email: string;
      passwordHash: string;
      firstName: string;
      lastName: string;
    }) => DbOperationResult;
    update: (userId: string, data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      avatarUrl?: string | null;
    }) => DbOperationResult;
    updateProfilePicture: (userId: string, filePath: string) => DbOperationResult;
  };
  
  profiles: {
    getByUserId: (userId: string) => Profile | undefined;
    exists: (userId: string) => boolean;
    update: (userId: string, data: {
      location?: string;
      socialLinks?: string;
      relationshipStatus?: string;
      interests?: string;
      hobbies?: string;
      pets?: string;
    }) => DbOperationResult;
    create: (userId: string, data: {
      location?: string;
      socialLinks?: string;
      relationshipStatus?: string;
      interests?: string;
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
      originalName: string;
      filePath: string;
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
