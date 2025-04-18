import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import type { Topic } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Posts } from './ui/Posts';
import axios from 'axios';
import { Heart, HeartOff } from 'lucide-react';

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

  const handleCreatePost = async (content: string) => {
    if (!user || !topic) return;

    try {
      setLoading(true);
      const response = await axios.post(`/api/topics/${topicId}/posts`, {
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
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!topic) {
    return <div className="container mx-auto p-4">Topic not found</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button 
        variant="destructive" 
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{topic.title}</CardTitle>
          </div>
          {user && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={`ml-2 ${followLoading ? 'opacity-70' : ''}`}
              onClick={handleFollowToggle}
              disabled={followLoading}
            >
              {isFollowing ? (
                <>
                  <HeartOff className="h-4 w-4 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{topic.description}</p>
          <div className="flex items-center text-sm text-gray-500">
            <Avatar className="h-6 w-6 mr-2">
              {topic.creatorAvatarUrl && (
                <AvatarImage src={topic.creatorAvatarUrl} alt={topic.creatorUsername || ''} />
              )}
              <AvatarFallback>{topic.creatorUsername?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>Created by {topic.creatorUsername}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Posts</h2>
        <Posts 
          posts={topic.posts || []}
          onEdit={handleEditPost}
          onUploadImage={handleUploadImage}
          onCreatePost={handleCreatePost}
          allowNewPosts={true}
        />
      </div>
    </div>
  );
}
