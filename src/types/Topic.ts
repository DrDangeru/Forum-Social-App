// Basic Topics / posts definitions
import { User } from './index';

export interface Topic {
    id: number;
    headline: string;
    topicOwnerOrMod: User['id'];
    description: string;
    created_at: string;
    followers: User[];
    posts: Post[];
    public: boolean;
}

export interface Post {
    id: number;
    content: string;
    author: User;
    created_at: string;
    topic: string;
    likes: number;
    comments: Comment[];
}

export interface Comment {
    id: number;
    content: string;
    author: User;
    created_at: string;
    likes: number;
}