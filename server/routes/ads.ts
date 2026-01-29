import { Router, Response } from 'express';
import db from '../db.js';
import { AuthRequest } from '../middleware/auth.js';
import { Ad } from '../types/types.ts'; // was types.js??

const router = Router();

// Helper: Check if user is admin
function checkAdmin(req: AuthRequest, res: Response): boolean {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  const user = db.prepare('SELECT isAdmin FROM users WHERE userId = ?').get(userId) as { isAdmin: number } | undefined;
  if (!user || user.isAdmin !== 1) {
    res.status(403).json({ error: 'Forbidden' });
    return false;
  }
  return true;
}

// Get all ads (admin only)
router.get('/all', async (req: AuthRequest, res: Response) => {
  if (!checkAdmin(req, res)) return;
  
  try {
    const ads = db.prepare(`
      SELECT * FROM ads ORDER BY createdAt DESC
    `).all() as Ad[];

    res.json({ ads });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

// Get active ads by placement (public - for displaying ads)
router.get('/placement/:placement', async (req: AuthRequest, res: Response) => {
  try {
    const { placement } = req.params;
    
    const ads = db.prepare(`
      SELECT id, title, imageUrl, linkUrl, placement 
      FROM ads 
      WHERE placement = ? AND isActive = 1
      ORDER BY RANDOM()
      LIMIT 1
    `).get(placement) as Ad | undefined;

    if (ads) {
      // Increment impressions
      db.prepare('UPDATE ads SET impressions = impressions + 1 WHERE id = ?').run(ads.id);
    }

    res.json({ ad: ads || null });
  } catch (error) {
    console.error('Error fetching ad by placement:', error);
    res.status(500).json({ error: 'Failed to fetch ad' });
  }
});

// Track ad click
router.post('/click/:adId', async (req: AuthRequest, res: Response) => {
  try {
    const { adId } = req.params;
    
    const ad = db.prepare('SELECT linkUrl FROM ads WHERE id = ?').get(adId) as { linkUrl: string } | undefined;
    
    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    db.prepare('UPDATE ads SET clicks = clicks + 1 WHERE id = ?').run(adId);

    res.json({ linkUrl: ad.linkUrl });
  } catch (error) {
    console.error('Error tracking ad click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// Create new ad (admin only)
router.post('/', async (req: AuthRequest, res: Response) => {
  if (!checkAdmin(req, res)) return;
  
  try {
    const userId = req.user?.userId;
    const { title, imageUrl, linkUrl, placement, isActive } = req.body;

    if (!title || !imageUrl || !linkUrl) {
      return res.status(400).json({ error: 'Title, image URL, and link URL are required' });
    }

    const validPlacements = ['banner', 'sidebar', 'feed'];
    const adPlacement = validPlacements.includes(placement) ? placement : 'banner';

    const result = db.prepare(`
      INSERT INTO ads (title, imageUrl, linkUrl, placement, isActive, createdBy)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(title, imageUrl, linkUrl, adPlacement, isActive ? 1 : 0, userId);

    res.status(201).json({
      message: 'Ad created successfully',
      adId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating ad:', error);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

// Update ad (admin only)
router.put('/:adId', async (req: AuthRequest, res: Response) => {
  if (!checkAdmin(req, res)) return;
  
  try {
    const { adId } = req.params;
    const { title, imageUrl, linkUrl, placement, isActive } = req.body;

    const existingAd = db.prepare('SELECT * FROM ads WHERE id = ?').get(adId);
    if (!existingAd) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    db.prepare(`
      UPDATE ads 
      SET title = COALESCE(?, title),
          imageUrl = COALESCE(?, imageUrl),
          linkUrl = COALESCE(?, linkUrl),
          placement = COALESCE(?, placement),
          isActive = COALESCE(?, isActive),
          updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, imageUrl, linkUrl, placement, isActive !== undefined ? (isActive ? 1 : 0) : null, adId);

    res.json({ message: 'Ad updated successfully' });
  } catch (error) {
    console.error('Error updating ad:', error);
    res.status(500).json({ error: 'Failed to update ad' });
  }
});

// Delete ad (admin only)
router.delete('/:adId', async (req: AuthRequest, res: Response) => {
  if (!checkAdmin(req, res)) return;
  
  try {
    const { adId } = req.params;

    const existingAd = db.prepare('SELECT * FROM ads WHERE id = ?').get(adId);
    if (!existingAd) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    db.prepare('DELETE FROM ads WHERE id = ?').run(adId);

    res.json({ message: 'Ad deleted successfully' });
  } catch (error) {
    console.error('Error deleting ad:', error);
    res.status(500).json({ error: 'Failed to delete ad' });
  }
});

// Get ad stats (admin only)
router.get('/stats', async (req: AuthRequest, res: Response) => {
  if (!checkAdmin(req, res)) return;
  
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalAds,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as activeAds,
        SUM(clicks) as totalClicks,
        SUM(impressions) as totalImpressions
      FROM ads
    `).get() as { totalAds: number; activeAds: number; totalClicks: number; totalImpressions: number };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching ad stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
