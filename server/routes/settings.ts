import { Router, Request, Response } from 'express';
import db from '../db.js';
import { LoginHistory } from '../types/types.js';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

const router = Router();

// Helper: Get client IP from request
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
}

// Get login history for current user
router.get('/login-history', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const history = db.prepare(`
      SELECT id, userId, ipAddress, userAgent, createdAt
      FROM loginHistory
      WHERE userId = ?
      ORDER BY createdAt DESC
      LIMIT 20
    `).all(userId) as LoginHistory[];

    res.json({ history });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

// Get current IP restriction settings
router.get('/ip-restriction', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = db.prepare(`
      SELECT ipRestricted, allowedIp FROM users WHERE userId = ?
    `).get(userId) as { ipRestricted: number; allowedIp: string | null } | undefined;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentIp = getClientIp(req);

    res.json({
      ipRestricted: !!user.ipRestricted,
      allowedIp: user.allowedIp,
      currentIp
    });
  } catch (error) {
    console.error('Error fetching IP restriction settings:', error);
    res.status(500).json({ error: 'Failed to fetch IP restriction settings' });
  }
});

// Enable IP restriction (locks to current IP)
router.post('/ip-restriction/enable', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const currentIp = getClientIp(req);

    db.prepare(`
      UPDATE users SET ipRestricted = 1, allowedIp = ? WHERE userId = ?
    `).run(currentIp, userId);

    res.json({
      message: 'IP restriction enabled',
      ipRestricted: true,
      allowedIp: currentIp
    });
  } catch (error) {
    console.error('Error enabling IP restriction:', error);
    res.status(500).json({ error: 'Failed to enable IP restriction' });
  }
});

// Disable IP restriction
router.post('/ip-restriction/disable', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    db.prepare(`
      UPDATE users SET ipRestricted = 0, allowedIp = NULL WHERE userId = ?
    `).run(userId);

    res.json({
      message: 'IP restriction disabled',
      ipRestricted: false,
      allowedIp: null
    });
  } catch (error) {
    console.error('Error disabling IP restriction:', error);
    res.status(500).json({ error: 'Failed to disable IP restriction' });
  }
});

export default router;
