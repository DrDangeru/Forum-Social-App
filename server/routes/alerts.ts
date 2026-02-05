import { Router, Response } from 'express';
import db from '../db.js';
import type { AuthRequest, AlertItem } from '../types/types.js';
import type { Request } from 'express';

const router = Router();

// Get alert counts only (lightweight endpoint for navbar)
router.get('/counts', (req: Request, res: Response): any => {
  const authReq = req as unknown as AuthRequest;
  try {
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Count pending friend requests
    const friendRequestCount = db.prepare(`
      SELECT COUNT(*) as count FROM friendRequests 
      WHERE receiverId = ? AND status = 'pending'
    `).get(userId) as { count: number };

    // Count pending group invitations
    const groupInvitationCount = db.prepare(`
      SELECT COUNT(*) as count FROM groupInvitations 
      WHERE inviteeId = ? AND status = 'pending'
    `).get(userId) as { count: number };

    res.json({
      friendRequests: friendRequestCount.count,
      groupInvitations: groupInvitationCount.count,
      total: friendRequestCount.count + groupInvitationCount.count
    });
  } catch (error) {
    console.error('Failed to get alert counts:', error);
    res.status(500).json({ error: 'Failed to get alert counts' });
  }
});

// Get all alerts for a user
router.get('/', (req: Request, res: Response): any => {
  const authReq = req as unknown as AuthRequest;
  try {
    const userId = authReq.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const alerts: AlertItem[] = [];

    // 1. Get pending friend requests
    const friendRequests = db.prepare(`
      SELECT fr.id, fr.senderId, fr.createdAt,
        u.username as senderUsername, u.avatarUrl as senderAvatarUrl,
        u.firstName as senderFirstName, u.lastName as senderLastName
      FROM friendRequests fr
      JOIN users u ON fr.senderId = u.userId
      WHERE fr.receiverId = ? AND fr.status = 'pending'
      ORDER BY fr.createdAt DESC
    `).all(userId) as any[];

    friendRequests.forEach((req: any) => {
      alerts.push({
        id: `fr_${req.id}`,
        type: 'friend_request',
        title: 'Friend Request',
        message: `${req.senderUsername} wants to be your friend`,
        fromUserId: req.senderId,
        fromUsername: req.senderUsername,
        fromAvatarUrl: req.senderAvatarUrl,
        relatedId: req.id,
        createdAt: req.createdAt,
        read: false
      });
    });

    // 2. Get pending group invitations
    const groupInvitations = db.prepare(`
      SELECT gi.id, gi.groupId, gi.inviterId, gi.createdAt,
        g.name as groupName,
        u.username as inviterUsername, u.avatarUrl as inviterAvatarUrl
      FROM groupInvitations gi
      JOIN groups g ON gi.groupId = g.id
      JOIN users u ON gi.inviterId = u.userId
      WHERE gi.inviteeId = ? AND gi.status = 'pending'
      ORDER BY gi.createdAt DESC
    `).all(userId) as any[];

    groupInvitations.forEach((inv: any) => {
      alerts.push({
        id: `gi_${inv.id}`,
        type: 'group_invitation',
        title: 'Group Invitation',
        message: `${inv.inviterUsername} invited you to join "${inv.groupName}"`,
        fromUserId: inv.inviterId,
        fromUsername: inv.inviterUsername,
        fromAvatarUrl: inv.inviterAvatarUrl,
        relatedId: inv.id,
        createdAt: inv.createdAt,
        read: false
      });
    });

    // 3. Get recent activity on followed topics (posts in last 24 hours)
    const topicUpdates = db.prepare(`
      SELECT t.id as topicId, t.title as topicTitle,
        COUNT(p.id) as newPostCount,
        MAX(p.createdAt) as lastPostAt
      FROM follows f
      JOIN topics t ON f.topicId = t.id
      JOIN posts p ON p.topicId = t.id
      WHERE f.followerId = ?
        AND p.createdAt > datetime('now', '-1 day')
        AND p.createdBy != ?
      GROUP BY t.id
      HAVING newPostCount > 0
      ORDER BY lastPostAt DESC
      LIMIT 10
    `).all(userId, userId) as any[];

    topicUpdates.forEach((update: any) => {
      alerts.push({
        id: `tu_${update.topicId}`,
        type: 'topic_update',
        title: 'Topic Update',
        message: `${update.newPostCount} new post${update.newPostCount > 1 ? 's' : ''} in "${update.topicTitle}"`,
        relatedId: update.topicId,
        createdAt: update.lastPostAt,
        read: false
      });
    });

    // Sort all alerts by date
    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      alerts,
      counts: {
        friendRequests: friendRequests.length,
        groupInvitations: groupInvitations.length,
        topicUpdates: topicUpdates.length,
        total: alerts.length
      }
    });
  } catch (error) {
    console.error('Failed to get alerts:', error);
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Accept friend request
router.post('/friend-request/:requestId/accept', (req: Request, res: Response): any => {
  const authReq = req as unknown as AuthRequest;
  try {
    const userId = authReq.user?.userId;
    const { requestId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the request
    const request = db.prepare(`
      SELECT * FROM friendRequests WHERE id = ? AND receiverId = ? AND status = 'pending'
    `).get(requestId, userId) as any;

    if (!request) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Update request status
    db.prepare(`UPDATE friendRequests SET status = 'accepted' WHERE id = ?`).run(requestId);

    // Create friendship entries (both directions)
    db.prepare(`
      INSERT OR IGNORE INTO friendships (userId, friendId, status, createdAt)
      VALUES (?, ?, 'accepted', CURRENT_TIMESTAMP)
    `).run(request.senderId, userId);

    db.prepare(`
      INSERT OR IGNORE INTO friendships (userId, friendId, status, createdAt)
      VALUES (?, ?, 'accepted', CURRENT_TIMESTAMP)
    `).run(userId, request.senderId);

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Failed to accept friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Decline friend request
router.post('/friend-request/:requestId/decline', (req: Request, res: Response): any => {
  const authReq = req as unknown as AuthRequest;
  try {
    const userId = authReq.user?.userId;
    const { requestId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    db.prepare(`
      UPDATE friendRequests SET status = 'declined' 
      WHERE id = ? AND receiverId = ? AND status = 'pending'
    `).run(requestId, userId);

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Failed to decline friend request:', error);
    res.status(500).json({ error: 'Failed to decline friend request' });
  }
});

// Accept group invitation
router.post('/group-invitation/:invitationId/accept', (req: Request, res: Response): any => {
  const authReq = req as unknown as AuthRequest;
  try {
    const userId = authReq.user?.userId;
    const { invitationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invitation = db.prepare(`
      SELECT * FROM groupInvitations WHERE id = ? AND inviteeId = ? AND status = 'pending'
    `).get(invitationId, userId) as any;

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Update invitation status
    db.prepare(`
      UPDATE groupInvitations SET status = 'accepted', updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(invitationId);

    // Add user to group
    db.prepare(`
      INSERT INTO groupMembers (groupId, userId, role, joinedAt)
      VALUES (?, ?, 'member', CURRENT_TIMESTAMP)
    `).run(invitation.groupId, userId);

    res.json({ message: 'Group invitation accepted', groupId: invitation.groupId });
  } catch (error) {
    console.error('Failed to accept group invitation:', error);
    res.status(500).json({ error: 'Failed to accept group invitation' });
  }
});

// Decline group invitation
router.post('/group-invitation/:invitationId/decline', (req: Request, res: Response): any => {
  const authReq = req as unknown as AuthRequest;
  try {
    const userId = authReq.user?.userId;
    const { invitationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    db.prepare(`
      UPDATE groupInvitations SET status = 'rejected', updatedAt = CURRENT_TIMESTAMP
      WHERE id = ? AND inviteeId = ? AND status = 'pending'
    `).run(invitationId, userId);

    res.json({ message: 'Group invitation declined' });
  } catch (error) {
    console.error('Failed to decline group invitation:', error);
    res.status(500).json({ error: 'Failed to decline group invitation' });
  }
});

export default router;
