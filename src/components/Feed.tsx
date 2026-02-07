import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Loader2, MessageSquare, TrendingUp, Upload, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { useAuth } from '../hooks/useAuth';
import type { FeedItem } from '../types/clientTypes';
import { cn } from '../lib/utils';

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
    <div className="max-w-[800px] mx-auto space-y-8 px-4">
      <div className="flex items-center justify-between bg-white border-4 border-black p-6 shadow-neo">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">Main Feed</h2>
          <p className="text-sm font-bold text-gray-600">The pulse of the entire forum</p>
        </div>
        <Button 
          onClick={handleStartTopic}
          className="bg-green-500 hover:bg-green-400 text-black border-2 border-black shadow-neo-sm font-black uppercase"
        >
          Start Topic
        </Button>
      </div>
      
      {items.length === 0 ? (
        <div className="neo-brutal-card p-12 text-center space-y-6 bg-white">
          <MessageSquare className="h-20 w-16 mx-auto text-black opacity-20 stroke-[1]" />
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase italic tracking-tight">Feed is Empty</h3>
            <p className="font-bold text-gray-500 max-w-xs mx-auto">
              Be the spark! Start a conversation or follow some topics.
            </p>
          </div>
          <Button variant="outline" className="font-black border-2 border-black shadow-neo-sm">
            <Link to="/topics">Explore Topics</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8">
          {items.map((item) => {
            const relevance = getRelevanceLabel(item.relevanceScore);
            return (
              <div key={item.postId} className="neo-brutal-card bg-white overflow-hidden group">
                <div className="flex flex-row items-start gap-4 p-6 border-b-2 border-black bg-yellow-400/5">
                  <Link to={`/profile/${item.posterId}`}>
                    <div className="border-2 border-black shadow-neo-sm bg-white overflow-hidden transition-transform group-hover:-rotate-2">
                      <Avatar className="h-12 w-12 rounded-none">
                        <AvatarImage src={item.authorAvatarUrl || undefined} className="rounded-none" />
                        <AvatarFallback className="rounded-none bg-orange-400 font-black">{item.authorUsername[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${item.posterId}`} className="font-black uppercase tracking-tight hover:underline decoration-2">
                          {item.authorUsername}
                        </Link>
                        <span className="text-black font-black opacity-20">•</span>
                        <span className="text-xs font-bold text-gray-500">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className={cn("px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase shadow-neo-sm", relevance.color)}>
                        {relevance.label}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-500 italic">
                      <span>In topic:</span>
                      <Link to={`/topics/${item.topicId}`} className="text-black hover:underline decoration-1 underline-offset-2">
                        {item.topicTitle}
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <p className="text-lg font-bold leading-tight whitespace-pre-wrap">
                    {item.content}
                  </p>
                  {item.imageUrl && (
                    <div className="border-4 border-black shadow-neo-sm overflow-hidden bg-black transition-transform hover:rotate-1">
                      <img 
                        src={item.imageUrl} 
                        alt="Post content" 
                        className="w-full h-auto max-h-[500px] object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t-2 border-black/5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartReply(item.postId)}
                      className="border-2 border-black shadow-neo-sm font-black uppercase text-xs hover:bg-yellow-400"
                    >
                      Reply
                    </Button>
                    <Link to={`/topics/${item.topicId}`} className="text-xs font-black uppercase underline decoration-2 underline-offset-4 hover:bg-black hover:text-white px-2 py-1 transition-colors">
                      Enter Topic →
                    </Link>
                  </div>

                  {replyingToPostId === item.postId && (
                    <div className="space-y-4 pt-6 mt-6 border-t-2 border-black">
                      <div className="relative">
                        <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black text-[10px] font-black uppercase tracking-widest">Your Response</div>
                        <Textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Shout at ${item.authorUsername}...`}
                          className="min-h-[120px] rounded-none border-2 border-black shadow-neo-sm focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all font-bold p-4"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <label className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-orange-50 cursor-pointer shadow-neo-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all group">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setReplyImage(file);
                            }}
                          />
                          <Upload className="h-4 w-4 stroke-[3] group-hover:rotate-12 transition-transform" />
                          <span className="text-xs font-black uppercase">Attach Intel</span>
                        </label>
                        {replyImage && (
                          <div className="px-2 py-1 bg-black text-white text-[10px] font-black uppercase max-w-[200px] truncate italic">
                            [{replyImage.name}]
                          </div>
                        )}
                        <div className="flex items-center gap-3 ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReplyingToPostId(null);
                              setReplyContent('');
                              setReplyImage(null);
                            }}
                            className="font-black uppercase text-xs"
                          >
                            Abort
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(item.topicId)}
                            disabled={isReplySubmitting || !replyContent.trim()}
                            className="bg-yellow-400 border-2 border-black shadow-neo-sm font-black uppercase text-xs hover:bg-yellow-300"
                          >
                            {isReplySubmitting ? 'Transmitting...' : 'Post Intel'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Feed;
