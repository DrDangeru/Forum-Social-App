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
    getById: (userId: number) => User;
    create: (user: {
      username: string;
      email: string;
      password_hash: string;
      first_name: string;
      last_name: string;
    }) => any;
    update: (userId: number, data: {
      first_name?: string;
      last_name?: string;
      bio?: string;
      avatar_url?: string | null;
    }) => any;
    updateProfilePicture: (userId: number, filePath: string) => any;
  };
  
  profiles: {
    getByUserId: (userId: number) => Profile | undefined;
    exists: (userId: number) => any;
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
    }) => any;
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
    }) => any;
  };
  
  galleryImages: {
    getByUserId: (userId: number) => GalleryImage[];
    deleteAllForUser: (userId: number) => any;
    create: (userId: number, imageUrl: string) => any;
  };
  
  userFiles: {
    getByUserId: (userId: number) => any[];
    getFileCount: (userId: number) => { count: number };
    create: (file: {
      user_id: number;
      filename: string;
      original_name: string;
      file_path: string;
      size: number;
      mimetype: string;
    }) => any;
    getById: (fileId: number) => any;
    deleteById: (fileId: number) => any;
  };
  
  transaction: {
    begin: () => void;
    commit: () => void;
    rollback: () => void;
  };
}
