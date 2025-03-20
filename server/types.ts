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
  password_hash: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Profile {
  userId: string;
  location: string | null;
  social_links: string | null;
  relationship_status: string | null;
  age: string | null;
  interests: string | null;
  occupation: string | null;
  company: string | null;
  hobbies: string | null;
  pets: string | null;
  created_at: string;
  updated_at: string;
}

export interface GalleryImage {
  id: number;
  userId: string;
  image_url: string;
  created_at: string;
}

// Friend request status
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

// Friend request interface
export interface FriendRequest {
  id: number;
  receiverId: string; // userId of requested user
  sender_userId: string; // userId of requestor
  status: FriendRequestStatus;
  created_at: string;
  updated_at: string;
}

// Friend request with user details
export interface FriendRequestWithDetails extends FriendRequest {
  // Sender information
  sender_first_name: string;
  sender_last_name: string;
  sender_username: string;
  sender_avatar_url: string | null;
  
  // Receiver information
  receiver_first_name: string;
  receiver_last_name: string;
  receiver_username: string;
  receiver_avatar_url: string | null;
}

// Basic profile for display in lists
export interface BasicProfile {
  userId: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

// Topic interface
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
      password_hash: string;
      first_name: string;
      last_name: string;
    }) => any;
    update: (userId: string, data: {
      first_name?: string;
      last_name?: string;
      bio?: string;
      avatar_url?: string | null;
    }) => any;
    updateProfilePicture: (userId: string, filePath: string) => any;
  };
  
  profiles: {
    getByUserId: (userId: string) => Profile | undefined;
    exists: (userId: string) => any;
    update: (userId: string, data: {
      location?: string;
      social_links?: string;
      relationship_status?: string;
      age?: string | null;
      interests?: string;
      occupation?: string;
      company?: string;
      hobbies?: string;
      pets?: string;
    }) => any;
    create: (userId: string, data: {
      location?: string;
      social_links?: string;
      relationship_status?: string;
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
      original_name: string;
      file_path: string;
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
