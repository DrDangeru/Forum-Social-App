import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Topic, Post } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea.tsx';
import axios from 'axios';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

export default function Topics() {
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [firstPostContent, setFirstPostContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [postContents, setPostContents] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchTopics = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      // Fetch user's topics
      const response = await axios.get(`/api/topics/user/${user.userId}`);
      
      // Process topics
      const processedTopics = response.data.map((topic: any) => ({
        ...topic,
        posts: topic.posts || []
      }));
      
      setUserTopics(processedTopics);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleCreateTopic = async () => {
    try {
      if (!user) {
        alert('You must be logged in to create a topic');
        return;
      }
      
      if (!title.trim() || !description.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      setLoading(true);
      
      const response = await axios.post('/api/topics', {
        title,
        description,
        createdBy: user.userId,
        isPublic,
        firstPostContent: firstPostContent.trim() || null
      });
      
      // Add the new topic to the state
      const newTopic = {
        ...response.data,
        posts: response.data.posts || []
      };
      
      setUserTopics(prev => [newTopic, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create topic:', error);
      alert('Failed to create topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (topicId: number) => {
    try {
      if (!user) {
        alert('You must be logged in to create a post');
        return;
      }
      
      const content = postContents[topicId];
      if (!content || !content.trim()) {
        alert('Post content cannot be empty');
        return;
      }

      setLoading(true);
      
      const response = await axios.post(`/api/topics/${topicId}/posts`, {
        content,
        createdBy: user.userId
      });
      
      // Update the topics state with the new post
      setUserTopics(prev => 
        prev.map(topic => {
          if (topic.id === topicId) {
            return {
              ...topic,
              posts: [...(topic.posts || []), response.data]
            };
          }
          return topic;
        })
      );

      // Clear the post input for this topic
      setPostContents(prev => ({
        ...prev,
        [topicId]: ''
      }));
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFirstPostContent('');
    setIsPublic(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create New Topic'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Create New Topic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setTitle(e.target.value)}
                  placeholder="Enter topic title"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setDescription(e.target.value)
                  }
                  placeholder="Enter topic description"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="firstPost">First Post</Label>
                <Textarea
                  id="firstPost"
                  value={firstPostContent}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setFirstPostContent(e.target.value)
                  }
                  placeholder="Write your first post in this topic (optional)"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={isPublic}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setIsPublic(e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="public">Public Topic</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTopic}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={loading}
                >
                  Create Topic
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div>Loading topics...</div>
      ) : (
        <div className="space-y-4">
          {userTopics.map((topic) => (
            <Card 
              key={topic.id} 
              className={
                "cursor-pointer hover:shadow-lg transition-shadow"
              } 
              onClick={() => navigate(`/topics/${topic.id}`)}
            >
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600">{topic.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-gray-500">
                        Created: {new Date(topic.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        • By: {topic.creatorUsername}
                      </span>
                      <span className="text-sm text-gray-500">
                        • {topic.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Posts section */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-3">
                      Posts ({topic.posts?.length || 0})
                    </h4>
                    
                    {/* Existing posts */}
                    {topic.posts && topic.posts.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {topic.posts
                          .sort((a, b) => 
                            new Date(a.createdAt).getTime() - 
                            new Date(b.createdAt).getTime()
                          )
                          .map((post: Post) => (
                            <div key={post.id} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <Avatar className="h-24 w-24">
                                    <AvatarImage 
                                      src={post.authorAvatarUrl || undefined} 
                                      alt={post.authorUsername} 
                                    />
                                    <AvatarFallback className="text-lg">
                                      {post.authorUsername?.[0]?.toUpperCase() || '?'}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-800">{post.content}</p>
                                  <div className="flex justify-between mt-2">
                                    <span className="text-xs text-gray-500">
                                      By: {post.authorUsername}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(post.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">
                        No posts yet. Be the first to post!
                      </p>
                    )}
                    
                    {/* New post input */}
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={postContents[topic.id] || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                          setPostContents(prev => ({
                            ...prev,
                            [topic.id]: e.target.value
                          }))
                        }
                        placeholder="Write a post..."
                        className="w-full"
                      />
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleCreatePost(topic.id)}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600"
                          disabled={loading}
                        >
                          Post
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      Follow ({topic.followers?.length || 0})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {userTopics.length === 0 && (
            <div className="text-center text-gray-500">
              No topics yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
