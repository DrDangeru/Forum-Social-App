import db from './db';

// Clear existing data
db.exec(`
  DELETE FROM user_topics;
  DELETE FROM follows;
  DELETE FROM posts;
  DELETE FROM users;
  DELETE FROM topics;
`);

// Insert test users
const users = [
  { 
    username: 'john_doe', 
    email: 'john@example.com', 
    password_hash: 'hash1',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john_doe'
  },
  { 
    username: 'jane_smith', 
    email: 'jane@example.com', 
    password_hash: 'hash2',
    avatar_url: null
  },
  { 
    username: 'bob_wilson', 
    email: 'bob@example.com', 
    password_hash: 'hash3',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob_wilson'
  },
  { 
    username: 'alice_brown', 
    email: 'alice@example.com', 
    password_hash: 'hash4',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice_brown&hair=long'
  },
];

users.forEach(user => {
  db.prepare(`
    INSERT INTO users (username, email, password_hash, avatar_url)
    VALUES (?, ?, ?, ?)
  `).run(user.username, user.email, user.password_hash, user.avatar_url);
});

// Create some follows (including mutual follows for testing friends)
const follows = [
  { follower: 1, following: 2 }, // John follows Jane
  { follower: 2, following: 1 }, // Jane follows John (mutual)
  { follower: 1, following: 3 }, // John follows Bob
  { follower: 3, following: 1 }, // Bob follows John (mutual)
  { follower: 2, following: 3 }, // Jane follows Bob
  { follower: 4, following: 1 }, // Alice follows John
];

follows.forEach(follow => {
  db.prepare(`
    INSERT INTO follows (follower_id, following_id)
    VALUES (?, ?)
  `).run(follow.follower, follow.following);
});

// Insert some posts
const posts = [
  { user_id: 1, content: "Hello from John!" },
  { user_id: 2, content: "Jane's first post" },
  { user_id: 3, content: "Bob checking in" },
  { user_id: 1, content: "Another post from John" },
];

posts.forEach(post => {
  db.prepare(`
    INSERT INTO posts (user_id, content)
    VALUES (?, ?)
  `).run(post.user_id, post.content);
});

console.log('Database seeded successfully!');
