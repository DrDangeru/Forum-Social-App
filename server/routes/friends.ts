import express from 'express';
import type { Request, Response } from 'express';
import db from '../db';
import { 
  FriendRequest, 
  BasicProfile as Friend 
} from '../types';

const router = express.Router();

// Define types for database results that extend the base types
interface ReceivedRequest extends FriendRequest {
  senderUsername: string;
  senderFirstName: string;
  senderLastName: string;
  senderAvatarUrl: string;
}
// Could be added in types.ts, but used just here...
interface SentRequest extends FriendRequest {
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
      status TEXT DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, friendId),
      FOREIGN KEY (userId) REFERENCES users (userId),
      FOREIGN KEY (friendId) REFERENCES users (userId)
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
      SELECT u.userId, u.username, u.firstName, u.lastName, u.avatarUrl
      FROM friendships f
      JOIN users u ON f.friendId = u.userId
      WHERE f.userId = ?
      AND f.status = 'accepted'
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
      JOIN users u ON fr.senderId = u.userId
      WHERE fr.receiverId = ? AND fr.status = 'pending'
    `).all(userId) as ReceivedRequest[];
    
    // Get sent friend requests
    const sentRequests = db.prepare(`
      SELECT fr.*, u.username as receiverUsername, u.firstName as receiverFirstName, 
      u.lastName as receiverLastName, u.avatarUrl as receiverAvatarUrl
      FROM friendRequests fr
      JOIN users u ON fr.receiverId = u.userId
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
    console.log('[Friend Request] Attempting to send request:', { senderId, receiverId });
    
    if (!senderId || !receiverId) {
      console.log('[Friend Request] Error: Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Ensure IDs are strings
    const senderIdStr = String(senderId);
    const receiverIdStr = String(receiverId);
    
    ensureFriendTablesExist();
    
    // Debug: Check if receiver exists. Receiver would be selected already.. no need for
    // rechecking every time / step (Lookup from the users table prior to this)
    // const receiver = db.prepare('SELECT * FROM users WHERE userId = ?').get(receiverIdStr);
    // console.log('[Friend Request] Receiver check:', { receiverIdStr, receiver });
    
    // if (!receiver) {
    //   console.log('[Friend Request] Error: Receiver not found');
    //   return res.status(404).json({ error: 'Receiver not found' });
    // }
    
    // Check if request already exists (confirm if needed)
    const existingRequest = db.prepare(`
      SELECT * FROM friendRequests 
      WHERE (senderId = ? AND receiverId = ?) 
      OR (senderId = ? AND receiverId = ?)
    `).get(senderIdStr, receiverIdStr, receiverIdStr, senderIdStr) as FriendRequest | undefined;
    
    if (existingRequest) {
      console.log('[Friend Request] Error: Request already exists:', existingRequest);
      return res.status(400).json({ error: 'Friend request already exists' });
    }
    
    // Check if they are already friends .. confirm this for delete. Existing 
    // friends should not show for requests anyway...
    const existingFriendship = db.prepare(`
      SELECT * FROM friendships 
      WHERE (userId = ? AND friendId = ?) 
      OR (userId = ? AND friendId = ?)
    `).get(senderIdStr, receiverIdStr, receiverIdStr, senderIdStr);
    
    if (existingFriendship) {
      console.log('[Friend Request] Error: Users are already friends');
      return res.status(400).json({ error: 'Already friends' });
    }
    
    // Create friend request
    const result = db.prepare(`
      INSERT INTO friendRequests (senderId, receiverId, status, createdAt)
      VALUES (?, ?, 'pending', datetime('now'))
    `).run(senderIdStr, receiverIdStr);

    console.log('[Friend Request] Successfully created request:',
       { requestId: result.lastInsertRowid });

    // Get the created request with user details
    const request = db.prepare(`
      SELECT fr.*, 
      u.username as receiverUsername, 
      u.firstName as receiverFirstName, 
      u.lastName as receiverLastName, 
      u.avatarUrl as receiverAvatarUrl
      FROM friendRequests fr
      JOIN users u ON fr.receiverId = u.userId
      WHERE fr.id = ?
    `).get(result.lastInsertRowid) as SentRequest;
    
    console.log('[Friend Request] Returning created request with user details:', request);
    res.status(201).json(request);
  } catch (error) {
    console.error('[Friend Request] Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept or reject a friend request
router.put('/request/:requestId', (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, userId } = req.body;
    console.log('[Friend Request Update] Processing request:', { requestId, status, userId });
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      console.log('[Friend Request Update] Error: Invalid status:', status);
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    ensureFriendTablesExist();
    
    // Get the request
    const request = db.prepare(`
      SELECT * FROM friendRequests WHERE id = ? AND status = 'pending'
    `).get(requestId) as FriendRequest | undefined;
    
    if (!request) {
      console.log(`[Friend Request Update] Error: Request not found or
         already processed:`, { requestId });
      return res.status(404).json({ error: 'Friend request not found or already processed' });
    }
    
    // Verify the user is the receiver of the request
    if (request.receiverId !== userId) {
      console.log(`[Friend Request Update] Error: Unauthorized update attempt:`,
         { requestId, userId, receiverId: request.receiverId });
      return res.status(403).json({ error: 'Not authorized to update this request' });
    }
    
    // Begin transaction
    db.prepare('BEGIN').run();
    console.log('[Friend Request Update] Starting transaction for request:', { requestId, status });
    
    try {
      // Update the request status
      db.prepare(`
        UPDATE friendRequests SET status = ? WHERE id = ?
      `).run(status, requestId);
      console.log('[Friend Request Update] Updated request status:', { requestId, status });
      
      // If accepted, create friendship entries
      if (status === 'accepted') {
        // Create friendship entries for both users
        const createFriendship = db.prepare(`
          INSERT INTO friendships (userId, friendId, status, createdAt)
          VALUES (?, ?, 'accepted', datetime('now'))
        `);

        // Create entries for both users
        createFriendship.run(request.senderId, request.receiverId);
        createFriendship.run(request.receiverId, request.senderId);
        
        console.log('[Friend Request Update] Created friendship entries for users:', {
          user1: request.senderId,
          user2: request.receiverId
        });
      }
      
      // Commit transaction
      db.prepare('COMMIT').run();
      console.log('[Friend Request Update] Successfully committed transaction');
      res.json({ message: `Friend request ${status}` });
    } catch (error) {
      // Rollback transaction on error
      db.prepare('ROLLBACK').run();
      console.error('[Friend Request Update] Transaction failed, rolling back:', error);
      throw error;
    }
  } catch (error) {
    console.error(`[Friend Request Update] Error ${req.body.status} friend request:`, error);
    res.status(500).json({ error: `Failed to ${req.body.status} friend request` });
  }
});

// Remove a friend
router.delete('/:userId/friend/:friendId', (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.params;
    console.log('[Friend Remove] Attempting to remove friendship:', { userId, friendId });
    
    ensureFriendTablesExist();
    
    // Delete friendship entries
    const result = db.prepare(`
      DELETE FROM friendships 
      WHERE (userId = ? AND friendId = ?) 
      OR (userId = ? AND friendId = ?)
    `).run(userId, friendId, friendId, userId);
    
    console.log('[Friend Remove] Friendship removal result:', { 
      userId, 
      friendId, 
      rowsAffected: result.changes 
    });
    
    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('[Friend Remove] Error removing friend:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

export default router;
