export interface User {
  id: number;
  username: string;
  email: string;
  profilePic: string;
  created_at: string;
  friends: User[];
}

export interface Post {
  id: number;
  user_id: number;
  username: string;
  userProfilePic: string;
  content: string;
  topic: string;
  created_at: string;
  likes: number;
  comments: number;
}

export interface Topic {
  id: number;
  name: string;
  description: string;
  created_at: string;
  followers: User[];
  posts: Post[];
}
