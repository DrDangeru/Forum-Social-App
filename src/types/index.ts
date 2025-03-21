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
  userId?: string;
  email: string;
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
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  socialLinks: string | null;
  relationshipStatus: string | null;
  createdAt: string;
  updatedAt: string;
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
  receiverId: User["userId"]; // userId of requested user
  senderId: User["userId"]; // userId of requestor for fr
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  
  // Sender information
  senderFirstName?: string;
  senderLastName?: string;
  senderUsername?: string;
  senderAvatarUrl?: string | null;
  
  // Receiver information
  receiverFirstName?: string;
  receiverLastName?: string;
  receiverUsername?: string;
  receiverAvatarUrl?: string | null;
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

// Gallery Image type
export interface GalleryImage {
  id: number;
  userId: string;
  imageUrl: string;
  createdAt: string;
  fileName?: string;
}

// Basic topic definition
export interface Topic {
  id: number;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
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
  topicId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Client-specific additions
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
  
  // Client-specific additions
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

// Database operation result type
export interface DbOperationResult {
  changes?: number;
  lastInsertRowid?: number | bigint;
}