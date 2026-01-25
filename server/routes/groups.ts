import express from 'express';
import type { Request, Response } from 'express';
import db from '../db.js';
import { handleServerError } from '../utils.js';
import type { Group, GroupMember, GroupInvitation } from '../types/types.js';

const router = express.Router();

// Get all open groups (for discovery)
router.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    
    const groups = db.prepare(`
      SELECT g.*, u.username as creatorUsername, u.avatarUrl as creatorAvatarUrl,
             (SELECT COUNT(*) FROM groupMembers WHERE groupId = g.id) as memberCount
      FROM groups AS g
      JOIN users AS u ON g.createdBy = u.userId
      WHERE g.accessType = 'open'
      ORDER BY g.createdAt DESC
    `).all() as (Group & { memberCount: number })[];

    // If userId provided, add membership info
    if (userId) {
      const userMemberships = db.prepare(`
        SELECT groupId, role FROM groupMembers WHERE userId = ?
      `).all(userId) as { groupId: number; role: string }[];
      
      const membershipMap = new Map(userMemberships.map(m => [m.groupId, m.role]));
      
      const groupsWithMembership = groups.map(group => ({
        ...group,
        isMember: membershipMap.has(group.id),
        userRole: membershipMap.get(group.id)
      }));
      
      return res.json(groupsWithMembership);
    }

    res.json(groups);
  } catch (error) {
    handleServerError(res, error, 'Failed to get groups');
  }
});

// Get groups user is a member of
router.get('/my/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const groups = db.prepare(`
      SELECT g.*, u.username as creatorUsername, u.avatarUrl as creatorAvatarUrl,
             gm.role as userRole,
             (SELECT COUNT(*) FROM groupMembers WHERE groupId = g.id) as memberCount
      FROM groups g
      JOIN users u ON g.createdBy = u.userId
      JOIN groupMembers gm ON g.id = gm.groupId AND gm.userId = ?
      ORDER BY g.createdAt DESC
    `).all(userId) as (Group & { memberCount: number; userRole: string })[];

    const groupsWithMembership = groups.map(group => ({
      ...group,
      isMember: true
    }));

    res.json(groupsWithMembership);
  } catch (error) {
    handleServerError(res, error, 'Failed to get user groups');
  }
});

// Get a specific group by ID
router.get('/:groupId', (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.query.userId as string;
    
    const group = db.prepare(`
      SELECT g.*, u.username as creatorUsername, u.avatarUrl as creatorAvatarUrl,
             (SELECT COUNT(*) FROM groupMembers WHERE groupId = g.id) as memberCount
      FROM groups g
      JOIN users u ON g.createdBy = u.userId
      WHERE g.id = ?
    `).get(groupId) as (Group & { memberCount: number }) | null;

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Check membership if userId provided
    if (userId) {
      const membership = db.prepare(`
        SELECT role FROM groupMembers WHERE groupId = ? AND userId = ?
      `).get(groupId, userId) as { role: string } | null;
      
      return res.json({
        ...group,
        isMember: !!membership,
        userRole: membership?.role
      });
    }

    res.json(group);
  } catch (error) {
    handleServerError(res, error, 'Failed to get group');
  }
});

// Get group members
router.get('/:groupId/members', (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    
    const members = db.prepare(`
      SELECT gm.*, u.username, u.firstName, u.lastName, u.avatarUrl
      FROM groupMembers gm
      JOIN users u ON gm.userId = u.userId
      WHERE gm.groupId = ?
      ORDER BY gm.role = 'owner' DESC, gm.role = 'admin' DESC, gm.joinedAt ASC
    `).all(groupId) as GroupMember[];

    res.json(members);
  } catch (error) {
    handleServerError(res, error, 'Failed to get group members');
  }
});

// Create a new group
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, accessType, createdBy } = req.body;
    
    if (!name?.trim() || !description?.trim() || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (accessType && !['open', 'invitation'].includes(accessType)) {
      return res.status(400).json({ error: 'Invalid access type' });
    }

    db.prepare('BEGIN').run();

    try {
      // Create the group
      const result = db.prepare(`
        INSERT INTO groups (name, description, accessType, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(name, description, accessType || 'open', createdBy);

      const groupId = Number(result.lastInsertRowid);

      // Add creator as owner
      db.prepare(`
        INSERT INTO groupMembers (groupId, userId, role, joinedAt)
        VALUES (?, ?, 'owner', CURRENT_TIMESTAMP)
      `).run(groupId, createdBy);

      db.prepare('COMMIT').run();

      // Get creator info
      const user = db.prepare(`
        SELECT username, avatarUrl FROM users WHERE userId = ?
      `).get(createdBy) as { username: string; avatarUrl: string | null };

      const newGroup: Group = {
        id: groupId,
        name,
        description,
        accessType: accessType || 'open',
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        memberCount: 1,
        creatorUsername: user?.username,
        creatorAvatarUrl: user?.avatarUrl
      };

      res.status(201).json(newGroup);
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    handleServerError(res, error, 'Failed to create group');
  }
});

// Join an open group
router.post('/:groupId/join', (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if group exists and is open
    const group = db.prepare(`
      SELECT * FROM groups WHERE id = ?
    `).get(groupId) as Group | null;

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.accessType !== 'open') {
      return res.status(403).json({ error: 'This group requires an invitation to join' });
    }

    // Check if already a member
    const existingMember = db.prepare(`
      SELECT * FROM groupMembers WHERE groupId = ? AND userId = ?
    `).get(groupId, userId);

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this group' });
    }

    // Add as member
    db.prepare(`
      INSERT INTO groupMembers (groupId, userId, role, joinedAt)
      VALUES (?, ?, 'member', CURRENT_TIMESTAMP)
    `).run(groupId, userId);

    res.status(201).json({ message: 'Successfully joined group' });
  } catch (error) {
    handleServerError(res, error, 'Failed to join group');
  }
});

// Leave a group
router.delete('/:groupId/leave', (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if user is the owner
    const membership = db.prepare(`
      SELECT role FROM groupMembers WHERE groupId = ? AND userId = ?
    `).get(groupId, userId) as { role: string } | null;

    if (!membership) {
      return res.status(404).json({ error: 'Not a member of this group' });
    }

    if (membership.role === 'owner') {
      return res.status(400).json({ error: 'Owner cannot leave the group. Transfer ownership first.' });
    }

    db.prepare(`
      DELETE FROM groupMembers WHERE groupId = ? AND userId = ?
    `).run(groupId, userId);

    res.json({ message: 'Successfully left group' });
  } catch (error) {
    handleServerError(res, error, 'Failed to leave group');
  }
});

// Invite a user to a group (for invitation-only groups)
router.post('/:groupId/invite', (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { inviterId, inviteeId } = req.body;

    if (!inviterId || !inviteeId) {
      return res.status(400).json({ error: 'Inviter and invitee IDs are required' });
    }

    // Check if inviter is admin/owner
    const inviterMembership = db.prepare(`
      SELECT role FROM groupMembers WHERE groupId = ? AND userId = ?
    `).get(groupId, inviterId) as { role: string } | null;

    if (!inviterMembership || !['owner', 'admin'].includes(inviterMembership.role)) {
      return res.status(403).json({ error: 'Only admins and owners can invite members' });
    }

    // Check if invitee is already a member
    const existingMember = db.prepare(`
      SELECT * FROM groupMembers WHERE groupId = ? AND userId = ?
    `).get(groupId, inviteeId);

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Check for existing pending invitation
    const existingInvite = db.prepare(`
      SELECT * FROM groupInvitations WHERE groupId = ? AND inviteeId = ? AND status = 'pending'
    `).get(groupId, inviteeId);

    if (existingInvite) {
      return res.status(400).json({ error: 'Invitation already sent' });
    }

    // Create invitation
    db.prepare(`
      INSERT INTO groupInvitations (groupId, inviterId, inviteeId, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(groupId, inviterId, inviteeId);

    res.status(201).json({ message: 'Invitation sent successfully' });
  } catch (error) {
    handleServerError(res, error, 'Failed to send invitation');
  }
});

// Get pending invitations for a user
router.get('/invitations/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const invitations = db.prepare(`
      SELECT gi.*, g.name as groupName, u.username as inviterUsername, u.avatarUrl as inviterAvatarUrl
      FROM groupInvitations gi
      JOIN groups g ON gi.groupId = g.id
      JOIN users u ON gi.inviterId = u.userId
      WHERE gi.inviteeId = ? AND gi.status = 'pending'
      ORDER BY gi.createdAt DESC
    `).all(userId) as GroupInvitation[];

    res.json(invitations);
  } catch (error) {
    handleServerError(res, error, 'Failed to get invitations');
  }
});

// Respond to an invitation
router.put('/invitations/:invitationId', (req: Request, res: Response) => {
  try {
    const { invitationId } = req.params;
    const { userId, accept } = req.body;

    if (!userId || accept === undefined) {
      return res.status(400).json({ error: 'User ID and accept status are required' });
    }

    // Get the invitation
    const invitation = db.prepare(`
      SELECT * FROM groupInvitations WHERE id = ? AND inviteeId = ? AND status = 'pending'
    `).get(invitationId, userId) as GroupInvitation | null;

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or already processed' });
    }

    db.prepare('BEGIN').run();

    try {
      // Update invitation status
      db.prepare(`
        UPDATE groupInvitations SET status = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(accept ? 'accepted' : 'rejected', invitationId);

      // If accepted, add user to group
      if (accept) {
        db.prepare(`
          INSERT INTO groupMembers (groupId, userId, role, joinedAt)
          VALUES (?, ?, 'member', CURRENT_TIMESTAMP)
        `).run(invitation.groupId, userId);
      }

      db.prepare('COMMIT').run();

      res.json({ message: accept ? 'Invitation accepted' : 'Invitation rejected' });
    } catch (error) {
      db.prepare('ROLLBACK').run();
      throw error;
    }
  } catch (error) {
    handleServerError(res, error, 'Failed to respond to invitation');
  }
});

export default router;
