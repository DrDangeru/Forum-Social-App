import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Topic } from '../types';
import { useAuth } from '../lib/useAuth';

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
          headline: "Welcome to the Forum",
          topicOwnerOrMod: user?.id || '',
          description: "Introduction and guidelines",
          created_at: new Date().toISOString(),
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
        headline: "New Topic",
        topicOwnerOrMod: user?.id || '',
        description: "New topic description",
        created_at: new Date().toISOString(),
        followers: [],
        posts: [],
        public: true
      };
      setTopics([...topics, newTopic]);
    } catch (error) {
      console.error('Failed to create topic:', error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Topics</CardTitle>
            <Button onClick={handleCreateTopic}>Create Topic</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topics.map(topic => (
              <Card key={topic.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{topic.headline}</h3>
                      <p className="text-gray-600">{topic.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-sm text-gray-500">
                          Created: {new Date(topic.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-500">
                          • {topic.public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View Posts ({topic.posts.length})
                      </Button>
                      <Button variant="outline" size="sm">
                        Follow ({topic.followers.length})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
