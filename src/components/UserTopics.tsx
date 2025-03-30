import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Topic, Post } from '../types';
import { Textarea } from './ui/textarea.tsx';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface UserTopicsProps {
  userId: string;
  showCreateButton?: boolean;
  onCreateTopic?: () => void;
}

export default function UserTopics({
  userId,
  showCreateButton = false,
  onCreateTopic,
}: UserTopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [postContents, setPostContents] = useState<Record<number, string>>({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchTopics = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await axios.get(`/api/topics/user/${userId}`);

        // Ensure each topic has a posts array
        const processedTopics = response.data.map((topic: any) => ({
          ...topic,
          posts: topic.posts || [],
        }));

        setTopics(processedTopics);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [userId]);

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
        createdBy: user.userId,
      });

      // Update the topics state with the new post
      setTopics((prev) =>
        prev.map((topic) => {
          if (topic.id === topicId) {
            return {
              ...topic,
              posts: [...(topic.posts || []), response.data],
            };
          }
          return topic;
        })
      );

      // Clear the post input for this topic
      setPostContents((prev) => ({ ...prev, [topicId]: '' }));
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && topics.length === 0) {
    return (
      <div className="my-6">
        <Card className="border border-dashed border-gray-300 bg-gray-50">
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Loading topics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="my-6">
        <Card className="border border-dashed border-gray-300 bg-gray-50">
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">No topics found.</p>
            {showCreateButton && onCreateTopic && (
              <Button
                onClick={onCreateTopic}
                className="bg-green-500 hover:bg-green-600"
              >
                Start Your First Topic
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Topics</h2>
        {showCreateButton && onCreateTopic && (
          <Button
            onClick={onCreateTopic}
            className="bg-green-500 hover:bg-green-600 text-white"
            size="sm"
          >
            Start a New Topic
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {topics.map((topic) => (
          <Card key={topic.id} className="w-full">
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
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">
                      No posts yet. Be the first to post!
                    </p>
                  )}

                  {/* New post input */}
                  {user && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={postContents[topic.id] || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setPostContents((prev) => ({ ...prev, [topic.id]: e.target.value }))
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
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
