import express from 'express';
import type { Request, Response } from 'express';
import db from '../db';

const router = express.Router();

// Define types for database results
interface FriendRequest {
  id: number;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface Friend {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

interface ReceivedRequest {
  id: number;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender_username: string;
  sender_first_name: string;
  sender_last_name: string;
  sender_avatar_url: string;
}

interface SentRequest {
  id: number;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  receiver_username: string;
  receiver_first_name: string;
  receiver_last_name: string;
  receiver_avatar_url: string;
}

// Ensure friend-related tables exist
function ensureFriendTablesExist() {
  // Create friend_requests table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      UNIQUE(senderId, receiverId)
    )
  `).run();

  // Create friendships table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, friendId),
      FOREIGN KEY (userId) REFERENCES users (id),
      FOREIGN KEY (friendId) REFERENCES users (id)
    );
  `).run();
}

// Get all friends for a user
router.get('/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    ensureFriendTablesExist();
    
    // Get all friends
    const friends = db.prepare(`
      SELECT u.id, u.username, u.first_name, u.last_name, u.avatar_url
      FROM friendships f
      JOIN users u ON f.friendId = u.id
      WHERE f.userId = ?
      AND f.status = 'accepted'
    `).all(userId) as Friend[];
    
    res.json(friends);
  } catch (error) {
    console.error('Error getting friends:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Get all friend requests for a user (both sent and received)
router.get('/:userId/requests', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    ensureFriendTablesExist();
    
    // Get received requests
    const receivedRequests = db.prepare(`
      SELECT 
        fr.id, 
        fr.senderId, 
        fr.receiverId, 
        fr.status, 
        fr.created_at,
        u.username as sender_username,
        u.first_name as sender_first_name,
        u.last_name as sender_last_name,
        u.avatar_url as sender_avatar_url
      FROM friend_requests fr
      JOIN users u ON fr.senderId = u.id
      WHERE fr.receiverId = ? AND fr.status = 'pending'
    `).all(userId) as ReceivedRequest[];
    
    // Get sent requests
    const sentRequests = db.prepare(`
      SELECT 
        fr.id, 
        fr.senderId, 
        fr.receiverId, 
        fr.status, 
        fr.created_at,
        u.username as receiver_username,
        u.first_name as receiver_first_name,
        u.last_name as receiver_last_name,
        u.avatar_url as receiver_avatar_url
      FROM friend_requests fr
      JOIN users u ON fr.receiverId = u.id
      WHERE fr.senderId = ? AND fr.status = 'pending'
    `).all(userId) as SentRequest[];
    
    res.json({
      received: receivedRequests,
      sent: sentRequests
    });
  } catch (error) {
    console.error('Error getting friend requests:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Send a friend request
router.post('/request', (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.body;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Sender ID and receiver ID are required' });
    }
    
    if (senderId === receiverId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }
    
    ensureFriendTablesExist();
    
    // Check if users exist
    const senderExists = db.prepare('SELECT id FROM users WHERE id = ?').get(senderId);
    const receiverExists = db.prepare('SELECT id FROM users WHERE id = ?').get(receiverId);
    
    if (!senderExists) {
      return res.status(404).json({ error: 'Sender not found' });
    }
    
    if (!receiverExists) {
      return res.status(404).json({ error: 'Receiver not found' });
    }
    
    // Check if they are already friends
    const alreadyFriends = db.prepare(`
      SELECT * FROM friendships WHERE 
      (userId = ? AND friendId = ?) OR
      (userId = ? AND friendId = ?)
    `).get(senderId, receiverId, receiverId, senderId);
    
    if (alreadyFriends) {
      return res.status(400).json({ error: 'Already friends' });
    }
    
    // Check if a request already exists
    const existingRequest = db.prepare(`
      SELECT * FROM friend_requests WHERE 
      (senderId = ? AND receiverId = ?) OR
      (senderId = ? AND receiverId = ?)
    `).get(senderId, receiverId, receiverId, senderId) as FriendRequest | undefined;
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already exists' });
      } else if (existingRequest.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
    }
    
    // Create friend request
    db.prepare(`
      INSERT INTO friend_requests (senderId, receiverId, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run(senderId, receiverId);
    
    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Respond to a friend request (accept or reject)
router.put('/request/:requestId', (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, userId } = req.body;
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (accepted or rejected) is required' });
    }
    
    ensureFriendTablesExist();
    
    // Get the request
    const request = db.prepare('SELECT * FROM friend_requests WHERE id = ?')
      .get(requestId) as FriendRequest | undefined;
    
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }
    
    // Verify the user is the receiver of the request
    if (request.receiverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to respond to this request' });
    }
    
    // Update request status
    db.prepare('UPDATE friend_requests SET status = ? WHERE id = ?').run(status, requestId);
    
    // If accepted, add to friends list (both ways)
    if (status === 'accepted') {
      db.transaction(() => {
        // Add friend relationship in both directions
        db.prepare(`
          INSERT INTO friendships (userId, friendId, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(request.senderId, request.receiverId);
        
        db.prepare(`
          INSERT INTO friendships (userId, friendId, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(request.receiverId, request.senderId);
      })();
    }
    
    res.json({ message: `Friend request ${status}` });
  } catch (error) {
    console.error('Error responding to friend request:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

// Remove a friend
router.delete('/:userId/friend/:friendId', (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.params;
    
    ensureFriendTablesExist();
    
    // Remove friend relationship in both directions
    db.transaction(() => {
      db.prepare('DELETE FROM friendships WHERE userId = ? AND friendId = ?').run(userId, friendId);
      db.prepare('DELETE FROM friendships WHERE userId = ? AND friendId = ?').run(friendId, userId);
    })();
    
    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
