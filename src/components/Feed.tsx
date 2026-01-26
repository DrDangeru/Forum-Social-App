import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Loader2, MessageSquare, TrendingUp, Upload, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useAuth } from '../hooks/useAuth';

interface FeedItem {
  postId: number;
  topicId: number;
  content: string;
  posterId: string;
  createdAt: string;
  updatedAt: string;
  imageUrl: string | null;
  authorUsername: string;
  authorAvatarUrl: string | null;
  topicTitle: string;
  relevanceScore: number;
}

const Feed: React.FC = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingToPostId, setReplyingToPostId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [isReplySubmitting, setIsReplySubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/feed');
      setItems(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load your feed. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleStartTopic = () => {
    navigate('/topics');
  };

  const handleStartReply = (postId: number) => {
    setReplyingToPostId(postId);
    setReplyContent('');
    setReplyImage(null);
  };

  const handleSubmitReply = async (topicId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!replyContent.trim()) return;

    try {
      setIsReplySubmitting(true);

      if (replyImage) {
        const formData = new FormData();
        formData.append('content', replyContent.trim());
        formData.append('createdBy', user.userId);
        formData.append('image', replyImage);

        await axios.post(`/api/topics/${topicId}/posts`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post(`/api/topics/${topicId}/posts`, {
          content: replyContent.trim(),
          createdBy: user.userId
        });
      }

      setReplyingToPostId(null);
      setReplyContent('');
      setReplyImage(null);
      fetchFeed();
    } catch (err) {
      console.error('Failed to post reply:', err);
      setError('Failed to post reply. Please try again.');
    } finally {
      setIsReplySubmitting(false);
    }
  };

  const getRelevanceLabel = (score: number) => {
    if (score >= 100) return { label: 'Friend', icon: <Users className="h-3 w-3 mr-1" />, color: 'bg-blue-100 text-blue-800' };
    if (score >= 80) return { label: 'Following', icon: <TrendingUp className="h-3 w-3 mr-1" />, color: 'bg-green-100 text-green-800' };
    if (score > 0) return { label: 'Match', icon: <TrendingUp className="h-3 w-3 mr-1" />, color: 'bg-purple-100 text-purple-800' };
    return { label: 'Discovery', icon: <MessageSquare className="h-3 w-3 mr-1" />, color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Tailoring your feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto space-y-6 px-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Feed</h2>
        <Button 
          onClick={handleStartTopic}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Start a Topic
        </Button>
      </div>
      
      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Your feed is quiet</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Follow some topics or add friends to see what's happening in your community.
              </p>
            </div>
            <Link to="/topics" className="inline-block text-primary hover:underline">
              Explore Topics
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {items.map((item) => {
            const relevance = getRelevanceLabel(item.relevanceScore);
            return (
              <Card key={item.postId} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start space-y-0 gap-4 pb-3">
                  <Link to={`/profile/${item.posterId}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={item.authorAvatarUrl || undefined} />
                      <AvatarFallback>{item.authorUsername[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${item.posterId}`} className="font-semibold hover:underline">
                          {item.authorUsername}
                        </Link>
                        <span className="text-muted-foreground text-sm">•</span>
                        <span className="text-muted-foreground text-sm">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <Badge variant="secondary" className={`${relevance.color} border-none font-medium flex items-center px-2 py-0.5`}>
                        {relevance.icon}
                        {relevance.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <span>posted in</span>
                      <Link to={`/topics/${item.topicId}`} className="text-primary hover:underline font-medium">
                        {item.topicTitle}
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                  {item.imageUrl && (
                    <div className="rounded-lg overflow-hidden border">
                      <img 
                        src={item.imageUrl} 
                        alt="Post content" 
                        className="w-full h-auto max-h-[400px] object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartReply(item.postId)}
                    >
                      Reply
                    </Button>
                    <Link to={`/topics/${item.topicId}`} className="text-sm text-primary hover:underline">
                      View topic
                    </Link>
                  </div>

                  {replyingToPostId === item.postId && (
                    <div className="space-y-2 pt-2">
                      <Textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${item.authorUsername}...`}
                        className="min-h-[90px]"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setReplyImage(file);
                            }}
                          />
                          <span className="inline-flex items-center">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload image
                          </span>
                        </label>
                        {replyImage && (
                          <span className="text-xs text-muted-foreground truncate max-w-[55%]">
                            {replyImage.name}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyingToPostId(null);
                            setReplyContent('');
                            setReplyImage(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSubmitReply(item.topicId)}
                          disabled={isReplySubmitting || !replyContent.trim()}
                        >
                          {isReplySubmitting ? 'Posting...' : 'Post Reply'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Feed;
