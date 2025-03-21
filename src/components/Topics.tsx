import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Topic } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Topics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const { user } = useAuth();

  const fetchTopics = useCallback(async () => {
    try {
      // This would be replaced with an actual API call
      // Real topic/s will be fetched from the database
      // and api/topics would be put into the below as real Topics
      // should work seamlessly.
      // Default page for user would be his created Topics/ 1st Topic
      // And from there he would have a feed / friends / topics to click
      const mockTopics: Topic[] = [
        {
          id: 1,
          title: "Welcome to the Forum",
          headline: "Welcome to the Forum",
          topicOwnerOrMod: user?.userId || '',
          description: "Introduction and guidelines",
          createdBy: user?.userId || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          followers: [],
          posts: [],
          public: true
        }
      ];
      setTopics(mockTopics);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleCreateTopic = async () => {
    try {
      const newTopic: Topic = {
        id: topics.length + 1,
        title: "New Topic",
        headline: "New Topic",
        topicOwnerOrMod: user?.userId || '',
        description: "New topic description",
        createdBy: user?.userId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        followers: [],
        posts: [],
        public: true
      };
      
      setTopics(prev => [...prev, newTopic]);
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Topics</h1>
        <Button onClick={handleCreateTopic}>Create Topic</Button>
      </div>
      
      {topics.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <p className="text-center text-gray-500">No topics found. Create one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(topic => (
            <Card key={topic.id} className="h-full">
              <CardHeader>
                <CardTitle>{topic.title || topic.headline}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
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
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm">
                    View Posts ({topic.posts?.length || 0})
                  </Button>
                  <Button variant="outline" size="sm">
                    Follow ({topic.followers?.length || 0})
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
