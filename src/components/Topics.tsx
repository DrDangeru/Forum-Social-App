import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Topic, Post } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [postContents, setPostContents] = useState<Record<number, string>>({});

  // const fetchTopics = useCallback(async () => {
    // try {
      // This would be replaced with an actual API call
      // Real topic/s will be fetched from the database
      // and api/topics would be put into the below as real Topics
      // should work seamlessly.
      // Default page for user would be his created Topics/ 1st Topic
      // And from there he would have a feed / friends / topics to click
  //     const mockTopics: Topic[] = [
  //       {
  //         id: 1,
  //         title: "Welcome to the Forum",
  //         headline: "Welcome to the Forum",
  //         topicOwnerOrMod: user?.userId || '',
  //         description: "Introduction and guidelines",
  //         createdBy: user?.userId || '',
  //         createdAt: new Date().toISOString(),
  //         updatedAt: new Date().toISOString(),
  //         followers: [],
  //         posts: [],
  //         public: true
  //       }
  //     ];
  //     setTopics(mockTopics);
  //    } catch (error) {
  //     console.error('Failed to fetch topics:', error);
  //   }
  //   }, [user]);

  // useEffect(() => {
  //   fetchTopics();
  // }, [fetchTopics]);

  const handleCreateTopic = async () => {
    try {
      if (!title.trim() || !headline.trim() || !description.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      const newTopic: Topic = {
        id: topics.length + 1,
        title: title,
        headline: headline,
        topicOwnerOrMod: user?.userId || '',
        description: description,
        createdBy: user?.userId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followers: [],
        posts: [],
        public: isPublic
      };
      
      setTopics(prev => [...prev, newTopic]);
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  const handleCreatePost = (topicId: number) => {
    const content = postContents[topicId];
    if (!content || !content.trim()) {
      alert('Post content cannot be empty');
      return;
    }

    const newPost: Post = {
      id: Math.floor(Math.random() * 10000), // Temporary ID generation
      topicId: topicId,
      content: content,
      createdBy: user?.userId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: user ? {
        userId: user.userId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl
      } : undefined
    };

    setTopics(prev => 
      prev.map(topic => {
        if (topic.id === topicId) {
          return {
            ...topic,
            posts: [...(topic.posts || []), newPost]
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
  };

  const resetForm = () => {
    setTitle('');
    setHeadline('');
    setDescription('');
    setIsPublic(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Topics</h1>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2"
          size="lg"
        >
          Start a New Topic
        </Button>
      </div>
      
      {showForm && (
        <Card className="mb-6 border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-green-50">
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
                <Label htmlFor="headline">Headline *</Label>
                <Input
                  id="headline"
                  value={headline}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setHeadline(e.target.value)
                  }
                  placeholder="Enter topic headline"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setDescription(e.target.value)
                  }
                  placeholder="Enter topic description"
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
                >
                  Create Topic
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {!showForm && topics.length === 0 ? (
        <Card className="border border-dashed border-gray-300 bg-gray-50">
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">No topics found. Create one to get started!</p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              Start Your First Topic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {topics.map(topic => (
            <Card key={topic.id} className="w-full">
              <CardHeader>
                <CardTitle>{topic.title || topic.headline}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{topic.headline}</h3>
                    <p className="text-gray-600">{topic.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-gray-500">
                        Created: {new Date(topic.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        • {topic.public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Posts section */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium mb-3">Posts ({topic.posts?.length || 0})</h4>
                    
                    {/* Existing posts */}
                    {topic.posts && topic.posts.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {topic.posts.map(post => (
                          <div key={post.id} className="bg-gray-50 p-3 rounded-md">
                            <p className="text-gray-800">{post.content}</p>
                            <div className="flex justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                By: {post.author?.firstName} {post.author?.lastName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(post.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">
                        No posts yet. Be the first to post!</p>
                    )}
                    
                    {/* New post input */}
                    <div className="mt-3 space-y-2">
                      <Input
                        value={postContents[topic.id] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
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
        </div>
      )}
    </div>
  );
}
