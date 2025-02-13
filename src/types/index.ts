export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Post {
  id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export interface Topic {
  id: number;
  name: string;
  created_at: string;
}
