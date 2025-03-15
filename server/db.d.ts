// Define database entity interfaces
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

export interface GalleryImage {
  id: number;
  user_id: number;
  image_url: string;
  created_at: string;
}

// Define the structure of dbHelpers
export interface DbHelpers {
  users: {
    getById: (userId: string) => User;
    create: (user: {
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
      socialLinks?: object;
      relationshipStatus?: string;
      age?: number | null;
      interests?: string[];
      occupation?: string;
      company?: string;
      hobbies?: string[];
      pets?: any[];
    }) => any;
    create: (userId: string, data: {
      location?: string;
      socialLinks?: object;
      relationshipStatus?: string;
      age?: number | null;
      interests?: string[];
      occupation?: string;
      company?: string;
      hobbies?: string[];
      pets?: any[];
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
      user_id: string;
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

export type { User, Profile, GalleryImage, DbHelpers };
