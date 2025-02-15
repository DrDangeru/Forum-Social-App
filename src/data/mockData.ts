import { User, Post, Topic } from '../types';
import GuyProfilePic from '../Pics/Guy-20s.webp';
import WomanProfilePic from '../Pics/Woman_3-4s.webp';

// Create users first without friends array
const createUser = (id: number, username: string, email: string, profilePic: string): User => ({
  id,
  username,
  email,
  profilePic,
  created_at: new Date().toISOString(),
  friends: [], // Will be populated later
});

// Create initial users
const john = createUser(1, 'JohnDoe', 'john@example.com', GuyProfilePic);
const jane = createUser(2, 'JaneSmith', 'jane@example.com', WomanProfilePic);

// Set up friendship
john.friends = [jane];
jane.friends = [john];

export const mockUsers: User[] = [john, jane];

export const mockTopics: Topic[] = [
  {
    id: 1,
    name: 'Technology Trends',
    description: 'Discuss the latest in tech and innovation',
    created_at: new Date().toISOString(),
    followers: mockUsers,
    posts: [],
  },
  {
    id: 2,
    name: 'Travel Adventures',
    description: 'Share your travel experiences and tips',
    created_at: new Date().toISOString(),
    followers: mockUsers,
    posts: [],
  },
];

export const mockPosts: Post[] = [
  {
    id: 1,
    user_id: john.id,
    username: john.username,
    userProfilePic: john.profilePic,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    topic: 'Technology Trends',
    created_at: new Date().toISOString(),
    likes: 5,
    comments: 2,
  },
  {
    id: 2,
    user_id: jane.id,
    username: jane.username,
    userProfilePic: jane.profilePic,
    content: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    topic: 'Technology Trends',
    created_at: new Date().toISOString(),
    likes: 3,
    comments: 1,
  },
  {
    id: 3,
    user_id: john.id,
    username: john.username,
    userProfilePic: john.profilePic,
    content: 'Nulla facilisi. Mauris sollicitudin fermentum libero. Sed cursus turpis vitae tortor. Donec posuere vulputate arcu. Sed in libero ut nibh placerat accumsan.',
    topic: 'Travel Adventures',
    created_at: new Date().toISOString(),
    likes: 7,
    comments: 4,
  },
  {
    id: 4,
    user_id: jane.id,
    username: jane.username,
    userProfilePic: jane.profilePic,
    content: 'Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Fusce id purus. Ut varius tincidunt libero. Phasellus dolor. Maecenas vestibulum mollis diam.',
    topic: 'Travel Adventures',
    created_at: new Date().toISOString(),
    likes: 6,
    comments: 3,
  },
];

// Add posts to topics
mockTopics[0].posts = mockPosts.filter(post => post.topic === 'Technology Trends');
mockTopics[1].posts = mockPosts.filter(post => post.topic === 'Travel Adventures');
