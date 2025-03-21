/* eslint-disable no-unused-vars */
// Define database entity interfaces
// This is in your DbHelpers interface, which is defining the shape 
// of your database helper functions. Since this is just an
//  interface definition (not an implementation),
//  the linter is incorrectly flagging the parameter as unused.
// Takes over from db.d.ts... probably if it works...
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

export interface Profile {
  userId: string;
  location: string | null;
  socialLinks: string | null;
  relationshipStatus: string | null;
  age: string | null;
  interests: string | null;
  occupation: string | null;
  company: string | null;
  hobbies: string | null;
  pets: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  id: number;
  userId: string;
  imageUrl: string;
  createdAt: string;
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
  updatedAt?: string;
}

// Friend request with user details
export interface FriendRequestWithDetails extends FriendRequest {
  senderFirstName: string;
  senderLastName: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  receiverFirstName: string;
  receiverLastName: string;
  receiverUsername: string;
  receiverAvatarUrl: string | null;
}

// Basic profile for display in lists
export interface BasicProfile {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

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
}

// Member profile with additional information
export interface MemberProfile {
  userId: string;
  profile: Profile;
  isFriend?: boolean;
  friendRequestStatus?: FriendRequestStatus;
  following?: Topic[];
  friends?: BasicProfile[];
  friendRequests?: FriendRequest[];
  followingMembers?: any[];
  unreadAlerts?: number;
  age?: string | null;
  galleryImages?: string[];
  bio?: string;
  location?: string | null;
  interests?: string[];
  occupation?: string;
  company?: string;
  hobbies?: string[];
  pets?: any[];
  joinedDate?: string;
}

// Define the structure of dbHelpers
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
    }) => any;
    update: (userId: string, data: {
      firstName?: string;
      lastName?: string;
      bio?: string;
      avatarUrl?: string | null;
    }) => any;
    updateProfilePicture: (userId: string, filePath: string) => any;
  };
  profiles: {
    getByUserId: (userId: string) => Profile | undefined;
    exists: (userId: string) => any;
    update: (userId: string, data: {
      location?: string;
      socialLinks?: string;
      relationshipStatus?: string;
      age?: string | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => any;
    create: (userId: string, data: {
      location?: string;
      socialLinks?: string;
      relationshipStatus?: string;
      age?: string | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => any;
  };
  galleryImages: {
    getByUserId: (userId: string) => GalleryImage[];
    deleteAllForUser: (userId: string) => any;
    create: (userId: string, imageUrl: string) => any;
  };
  userFiles: {
    getByUserId: (userId: string) => any[];
    getFileCount: (userId: string) => { count: number };
    create: (file: {
      userId: string;
      filename: string;
      originalName: string;
      filePath: string;
      size: number;
      mimetype: string;
    }) => any;
    getById: (fileId: string) => any;
    deleteById: (fileId: string) => any;
  };
  transaction: {
    begin: () => void;
    commit: () => void;
    rollback: () => void;
  };
}
