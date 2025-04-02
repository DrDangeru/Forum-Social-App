import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import type { Topic } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import axios from 'axios';

export default function TopicView() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleCreatePost = async () => {
    if (!user || !topic) return;

    try {
      setLoading(true);
      const response = await axios.post(`/api/topics/${topicId}/posts`, {
        content: newPostContent,
        createdBy: user.userId
      });

      setTopic(prev => {
        if (!prev) return null;
        return {
          ...prev,
          posts: [...(prev.posts || []), response.data]
        };
      });
      setNewPostContent('');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (!topic) {
    return <div className="container mx-auto p-4">Topic not found</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Button 
        variant="outline" 
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{topic.title}</CardTitle>
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
        {(topic.posts || []).map((post) => (
          <Card key={post.id} className="bg-white">
            <CardContent className="pt-4">
              <div className="flex items-center mb-2">
                <Avatar className="h-6 w-6 mr-2">
                  {post.authorAvatarUrl && (
                    <AvatarImage src={post.authorAvatarUrl} alt={post.authorUsername || ''} />
                  )}
                  <AvatarFallback>
                    {post.authorUsername?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-600">
                  {post.authorUsername}
                </span>
              </div>
              <p className="text-gray-800">{post.content}</p>
            </CardContent>
          </Card>
        ))}

        {user && (
          <div className="mt-6">
            <Textarea
              placeholder="Write a new post..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              className="mb-2"
            />
            <Button 
              onClick={handleCreatePost}
              disabled={!newPostContent.trim() || loading}
              className="bg-blue-400 hover:bg-blue-500 text-white"
            >
              Post Reply
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
