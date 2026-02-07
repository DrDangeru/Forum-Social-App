import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import type { Topic } from '../types/clientTypes';
import { useAuth } from '../hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Posts } from './ui/Posts';
import axios from 'axios';
import { Heart, HeartOff, ArrowLeft, Calendar, Terminal, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

export default function TopicView() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/topics/${topicId}`);
        setTopic(response.data);
      } catch (error) {
        console.error('Failed to fetch topic:', error);
        navigate('/topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId, navigate]);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !topicId) return;
      
      try {
        setFollowLoading(true);
        const response = await axios.get(`/api/topics/follows/${user.userId}`);
        const follows = response.data;
        const isFollowingTopic = follows.some((follow: any) => follow.topicId === Number(topicId));
        setIsFollowing(isFollowingTopic);
      } catch (error) {
        console.error('Failed to check follow status:', error);
      } finally {
        setFollowLoading(false);
      }
    };

    if (user) {
      checkFollowStatus();
    }
  }, [user, topicId]);

  const handleFollowToggle = async () => {
    if (!user || !topicId) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        await axios.delete(`/api/topics/follows`, { 
          data: { 
            userId: user.userId,
            topicId: Number(topicId)
          } 
        });
        setIsFollowing(false);
      } else {
        await axios.post(`/api/topics/follows`, { 
          userId: user.userId,
          topicId: Number(topicId)
        });
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Failed to toggle follow status:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCreatePost = async (content: string, image?: File | null) => {
    if (!user || !topic) return;

    try {
      setLoading(true);

      const response = image
        ? await axios.post(
          `/api/topics/${topicId}/posts`,
          (() => {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('createdBy', user.userId);
            formData.append('image', image);
            return formData;
          })()
        )
        : await axios.post(`/api/topics/${topicId}/posts`, {
          content,
          createdBy: user.userId
        });

      setTopic(prev => {
        if (!prev) return null;
        return {
          ...prev,
          posts: [...(prev.posts || []), response.data]
        };
      });
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPost = async (postId: number, content: string) => {
    if (!user || !topic) return;

    try {
      setLoading(true);
      const response = await axios.put(`/api/posts/${postId}`, {
        content,
        updatedBy: user.userId
      });

      setTopic(prev => {
        if (!prev) return null;
        return {
          ...prev,
          posts: prev.posts?.map(post => 
            post.postId === postId ? { ...post, ...response.data } : post
          ) || []
        };
      });
    } catch (error) {
      console.error('Failed to edit post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (postId: number, file: File) => {
    if (!user || !topic) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', file);

      // Add a timeout to the axios request
      const response = await axios.post(
        `/api/topics/posts/${postId}/image?userId=${user.userId}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 seconds timeout
        }
      );

      // Update the post in the topic state
      setTopic(prev => {
        if (!prev) return null;
        const updatedPosts = prev.posts?.map(post => 
          post.postId === postId ? { ...post, imageUrl: response.data.imageUrl } : post
        ) || [];
        return {
          ...prev,
          posts: updatedPosts
        };
      });
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      let errorMessage = 'Failed to upload image';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'No response from server. Please check your network connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-orange-50/50">
        <div className="w-16 h-16 border-8 border-black border-t-yellow-400 animate-spin shadow-neo" />
        <p className="font-black uppercase tracking-widest text-xl italic">Establishing Uplink...</p>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-orange-50/50">
        <div className="neo-brutal-card bg-red-100 p-12 text-center border-red-600 max-w-lg">
          <Terminal className="h-16 w-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-3xl font-black uppercase text-red-600 mb-4 tracking-tighter italic">Topic Lost</h2>
          <p className="font-bold text-red-800 mb-8">The requested transmission frequency is non-responsive.</p>
          <Button onClick={() => navigate('/topics')} className="bg-black text-white font-black uppercase tracking-widest px-8">
            Back to Topics
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-10">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-yellow-400 gap-2"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3]" />
          Return
        </Button>
      </div>

      <div className="neo-brutal-card bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-400 border-b-4 border-l-4 border-black -mr-24 -mt-24 rotate-45" />
        
        <div className="p-8 relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 border-2 border-black bg-yellow-400 text-xs font-black uppercase shadow-neo-sm tracking-widest">
                Protocol #{topic.id}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <Calendar className="h-3 w-3" />
                Logged: {new Date(topic.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none border-l-8 border-black pl-6">
              {topic.title}
            </h1>
          </div>

          <div className="bg-orange-50 border-4 border-black p-6 shadow-neo-sm relative">
            <div className="absolute -top-3 -left-3 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">Briefing</div>
            <p className="text-xl font-bold leading-tight text-gray-800">{topic.description}</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t-4 border-black/5">
            <div className="flex items-center gap-4">
              <div className="border-2 border-black shadow-neo-sm bg-white p-1">
                <Avatar className="h-12 w-12 rounded-none">
                  <AvatarImage src={topic.creatorAvatarUrl || undefined} className="rounded-none" />
                  <AvatarFallback className="rounded-none bg-orange-400 font-black text-lg">
                    {topic.creatorUsername?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block">Chief Operative</span>
                <Link to={`/profile/${topic.createdBy}`} className="font-black uppercase tracking-tight hover:underline decoration-2 text-lg">
                  @{topic.creatorUsername}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="lg"
                  className={cn(
                    "font-black uppercase tracking-widest border-2 border-black shadow-neo px-8 gap-2 transition-all",
                    isFollowing ? "hover:bg-red-100" : "bg-green-500 hover:bg-green-400 text-black",
                    followLoading && "opacity-70"
                  )}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {isFollowing ? (
                    <>
                      <HeartOff className="h-5 w-5 stroke-[3]" />
                      Intercept Off
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5 stroke-[3] fill-black" />
                      Join Intercept
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 pb-20">
        <div className="flex items-baseline gap-4">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic flex items-center gap-3">
            <MessageSquare className="h-10 w-10 stroke-[3]" />
            Intel Log
          </h2>
          <div className="h-1 flex-1 bg-black" />
          <div className="px-4 py-1 border-2 border-black bg-black text-white text-xs font-black uppercase tracking-widest shadow-neo-sm">
            {topic.posts?.length || 0} Entries Recorded
          </div>
        </div>

        <div className="neo-glass-card p-1">
          <div className="bg-white/50 p-8 border-2 border-black/10">
            <Posts 
              posts={topic.posts || []}
              onEdit={handleEditPost}
              onUploadImage={handleUploadImage}
              onCreatePost={handleCreatePost}
              allowNewPosts={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
