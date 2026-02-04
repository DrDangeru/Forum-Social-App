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
  region: string | null;
  isAdmin?: boolean;
  createdAt: string;
}

// Ad placement types
export type AdPlacement = 'banner' | 'sidebar' | 'feed';

// Ad interface
export interface Ad {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: AdPlacement;
  isActive: boolean;
  clicks: number;
  impressions: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication credentials
export interface AuthCredentials {
  username: string;
  password: string;
  userId?: string;
  // email: string; // Email is not required for login
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
  region?: string | null;
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
  message?: string; // Optional message with friend request
  
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
  region?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Client-specific additions
  topicOwnerOrMod?: string;
  followers?: User[];
  posts?: Post[];
  public?: boolean;
  
  // New fields for enhanced functionality
  isPublic?: boolean;
  creatorUsername?: string;
  creatorAvatarUrl?: string | null;
  firstPost?: Post & {
    authorUsername?: string;
    authorAvatarUrl?: string | null;
  };
}

// Post definition
export interface Post {
  postId: number;
  topicId: number;
  posterId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  authorUsername?: string;
  authorAvatarUrl?: string | null;
}

// Follow relationship
export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

// ==================== GROUP TYPES ====================

// Group access type
export type GroupAccessType = 'open' | 'invitation';

// Group member role
export type GroupMemberRole = 'owner' | 'admin' | 'member';

// Group interface
export interface Group {
  id: number;
  name: string;
  description: string;
  accessType: GroupAccessType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  creatorUsername?: string;
  creatorAvatarUrl?: string | null;
  isMember?: boolean;
  userRole?: GroupMemberRole;
}

// Group member interface
export interface GroupMember {
  id: number;
  groupId: number;
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

// Group invitation interface
export interface GroupInvitation {
  id: number;
  groupId: number;
  inviterId: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  groupName?: string;
  inviterUsername?: string;
  inviterAvatarUrl?: string | null;
}

// ==================== REGIONAL/ACTIVITY TYPES ====================

// Regional post with author info
export interface RegionalPost extends Post {
  topicTitle: string;
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

// Friend activity summary
export interface FriendActivity {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  region: string | null;
  recentPosts: number;
}

// Followed topic summary
export interface FollowedTopic {
  topicId: number;
  topicTitle: string;
  topicDescription: string;
  recentPosts: number;
  createdBy: string;
}

// ==================== ALERT TYPES ====================

// Alert type
export type AlertType = 'friend_request' | 'group_invitation' | 'topic_update';

// Alert item interface
export interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  fromUserId?: string;
  fromUsername?: string;
  fromAvatarUrl?: string | null;
  relatedId?: number | string;
  createdAt: string;
  read: boolean;
}

// Alerts response from API
export interface AlertsResponse {
  alerts: AlertItem[];
  counts: AlertCounts;
}

// Alert counts for navbar
export interface AlertCounts {
  friendRequests: number;
  groupInvitations: number;
  topicUpdates?: number;
  total: number;
}

// Preview topic for login page
export interface PreviewTopic {
  id: number;
  title: string;
  description?: string;
  postCount?: number;
}

// ==================== SETTINGS TYPES ====================

// Login history entry
export interface LoginHistory {
  id: number;
  userId: string;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
}

// IP restriction settings
export interface IpRestrictionSettings {
  ipRestricted: boolean;
  allowedIp: string | null;
  currentIp: string;
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