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
  createdAt: string;
}

interface Friend {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
}

interface ReceivedRequest {
  id: number;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  senderUsername: string;
  senderFirstName: string;
  senderLastName: string;
  senderAvatarUrl: string;
}

interface SentRequest {
  id: number;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  receiverUsername: string;
  receiverFirstName: string;
  receiverLastName: string;
  receiverAvatarUrl: string;
}

// Ensure friend-related tables exist
function ensureFriendTablesExist() {
  // Create friendRequests table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS friendRequests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      UNIQUE(senderId, receiverId, status)
    )
  `).run();

  // Create friendships table if it doesn't exist
  db.prepare(`
    CREATE TABLE IF NOT EXISTS friendships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      friendId TEXT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
      SELECT u.id, u.username, u.firstName, u.lastName, u.avatarUrl
      FROM friendships f
      JOIN users u ON f.friendId = u.id
      WHERE f.userId = ?
      AND f.createdAt IS NOT NULL
    `).all(userId) as Friend[];
    
    res.json(friends);
  } catch (error) {
    console.error('Error getting friends:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get all friend requests for a user
router.get('/:userId/requests', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    ensureFriendTablesExist();
    
    // Get received friend requests
    const receivedRequests = db.prepare(`
      SELECT fr.*, u.username as senderUsername, u.firstName as senderFirstName, 
      u.lastName as senderLastName, u.avatarUrl as senderAvatarUrl
      FROM friendRequests fr
      JOIN users u ON fr.senderId = u.id
      WHERE fr.receiverId = ? AND fr.status = 'pending'
    `).all(userId) as ReceivedRequest[];
    
    // Get sent friend requests
    const sentRequests = db.prepare(`
      SELECT fr.*, u.username as receiverUsername, u.firstName as receiverFirstName, 
      u.lastName as receiverLastName, u.avatarUrl as receiverAvatarUrl
      FROM friendRequests fr
      JOIN users u ON fr.receiverId = u.id
      WHERE fr.senderId = ? AND fr.status = 'pending'
    `).all(userId) as SentRequest[];
    
    res.json({
      received: receivedRequests,
      sent: sentRequests
    });
  } catch (error) {
    console.error('Error getting friend requests:', error);
    res.status(500).json({ error: 'Failed to get friend requests' });
  }
});

// Send a friend request
router.post('/request', (req: Request, res: Response) => {
  try {
    const { senderId, receiverId } = req.body;
    
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    ensureFriendTablesExist();
    
    // Check if request already exists
    const existingRequest = db.prepare(`
      SELECT * FROM friendRequests 
      WHERE (senderId = ? AND receiverId = ?) 
      OR (senderId = ? AND receiverId = ?)
    `).get(senderId, receiverId, receiverId, senderId) as FriendRequest | undefined;
    
    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already exists' });
    }
    
    // Check if they are already friends
    const existingFriendship = db.prepare(`
      SELECT * FROM friendships 
      WHERE (userId = ? AND friendId = ?) 
      OR (userId = ? AND friendId = ?)
    `).get(senderId, receiverId, receiverId, senderId);
    
    if (existingFriendship) {
      return res.status(400).json({ error: 'Already friends' });
    }
    
    // Create friend request
    const result = db.prepare(`
      INSERT INTO friendRequests (senderId, receiverId, status, createdAt)
      VALUES (?, ?, 'pending', datetime('now'))
    `).run(senderId, receiverId);

    // Get the created request with user details
    const request = db.prepare(`
      SELECT fr.*, u.username as receiverUsername, u.firstName as receiverFirstName, 
      u.lastName as receiverLastName, u.avatarUrl as receiverAvatarUrl
      FROM friendRequests fr
      JOIN users u ON fr.receiverId = u.id
      WHERE fr.id = ?
    `).get(result.lastInsertRowid) as SentRequest;
    
    res.status(201).json(request);
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept or reject a friend request
router.put('/request/:requestId', (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, userId } = req.body;
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    ensureFriendTablesExist();
    
    // Get the request
    const request = db.prepare(`
      SELECT * FROM friendRequests WHERE id = ? AND status = 'pending'
    `).get(requestId) as FriendRequest | undefined;
    
    if (!request) {
      return res.status(404).json({ error: 'Friend request not found or already processed' });
    }
    
    // Verify the user is the receiver of the request
    if (request.receiverId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }
    
    // Begin transaction
    db.prepare('BEGIN').run();
    
    try {
      // Update the request status
      db.prepare(`
        UPDATE friendRequests SET status = ? WHERE id = ?
      `).run(status, requestId);
      
      // If accepted, create friendship entries
      if (status === 'accepted') {
        // Dont see any need. Any cleanup will be handled when deleting friendships.
        // Delete any existing friendship entries first
        // db.prepare(` 
        //   DELETE FROM friendships 
        //   WHERE (userId = ? AND friendId = ?) 
        //   OR (userId = ? AND friendId = ?)
        // `).run(request.senderId, request.receiverId, request.receiverId, request.senderId);
        
        // Create friendship entry for the requester
        db.prepare(`
          INSERT INTO friendships (userId, friendId, createdAt)
          VALUES (?, ?, datetime('now'))
        `).run(request.senderId, request.receiverId);
        
        // Create friendship entry for the receiver
        db.prepare(`
          INSERT INTO friendships (userId, friendId, createdAt)
          VALUES (?, ?, datetime('now'))
        `).run(request.receiverId, request.senderId);
      }
      
      // Commit transaction
      db.prepare('COMMIT').run();
      res.json({ message: `Friend request ${status}` });
    } catch (error) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    console.error(`Error ${req.body.status} friend request:`, error);
    res.status(500).json({ error: `Failed to ${req.body.status} friend request` });
  }
});

// Remove a friend
router.delete('/:userId/friend/:friendId', (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.params;
    
    ensureFriendTablesExist();
    
    // Delete friendship entries
    db.prepare(`
      DELETE FROM friendships 
      WHERE (userId = ? AND friendId = ?) 
      OR (userId = ? AND friendId = ?)
    `).run(userId, friendId, friendId, userId);
    
    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

export default router;
