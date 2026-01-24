import { Router, Response } from 'express';
import db from '../db.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/feed
 * Returns a personalized feed for the authenticated user.
 * 
 * Logic:
 * 1. Posts from friends (highest priority)
 * 2. Posts from topics the user follows
 * 3. Discovery: Posts matching user's interests (from their profile)
 * 4. Recent public posts (fallback)
 */
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Get user's interests from profile
    const profile = db.prepare('SELECT interests FROM profiles WHERE userId = ?').get(userId) as { interests: string } | undefined;
    const interests = profile?.interests ? JSON.parse(profile.interests) : [];

    // 2. Complex query to fetch feed items
    // We'll use a UNION or multiple joins to gather relevant posts
    // For simplicity and better control, we'll fetch them in steps or 
    // one large query with weights
    
    const feedQuery = `
      WITH UserContext AS (
        SELECT ? as currentUserId
      ),
      Friends AS (
        SELECT friendId FROM friendships WHERE userId = 
        (SELECT currentUserId FROM UserContext) AND status = 'accepted'
        UNION
        SELECT userId FROM friendships WHERE friendId = 
        (SELECT currentUserId FROM UserContext) AND status = 'accepted'
      ),
      FollowedTopics AS (
        SELECT topicId FROM follows WHERE followerId = (SELECT currentUserId FROM UserContext) AND topicId IS NOT NULL
      )
      SELECT DISTINCT 
        p.id as postId,
        p.topicId,
        p.content,
        p.createdBy as posterId,
        p.createdAt,
        p.updatedAt,
        p.imageUrl,
        u.username as authorUsername,
        u.avatarUrl as authorAvatarUrl,
        t.title as topicTitle,
        -- Scoring for "Custom Feeds"
        CASE 
          WHEN p.createdBy IN Friends THEN 100 -- Friend posts
          WHEN p.topicId IN FollowedTopics THEN 80 -- Followed topics
          ELSE 0 
        END as relevanceScore
      FROM posts p
      JOIN users u ON p.createdBy = u.userId
      JOIN topics t ON p.topicId = t.id
      WHERE 
        p.createdBy IN Friends -- From friends
        OR p.topicId IN FollowedTopics -- From followed topics
        OR (t.isPublic = 1 AND p.createdBy = (SELECT currentUserId FROM UserContext)) -- My own public posts
      ORDER BY relevanceScore DESC, p.createdAt DESC
      LIMIT 50
    `;

    const rawPosts = db.prepare(feedQuery).all(userId) as any[];

    // 3. Post-process to include interest matching if we have interests
    let filteredPosts = rawPosts;
    if (interests.length > 0) {
      filteredPosts = rawPosts.map(post => {
        let interestScore = 0;
        interests.forEach((interest: string) => {
          if (post.content.toLowerCase().includes(interest.toLowerCase()) || 
              post.topicTitle.toLowerCase().includes(interest.toLowerCase())) {
            interestScore += 20;
          }
        });
        return { ...post, relevanceScore: post.relevanceScore + interestScore };
      }).sort((a, b) => b.relevanceScore - a.relevanceScore || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json(filteredPosts);
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

export default router;
