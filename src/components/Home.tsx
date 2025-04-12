import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useTopics } from '../hooks/useTopics';
import { FileText } from 'lucide-react';
import { Button } from './ui/button';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentProfile } = useProfile();
  const { userTopics, userTopicsLoading, userTopicsError } = useTopics();
  
  // Set current profile to the logged-in user's profile
  useEffect(() => {
    if (user?.userId) {
      setCurrentProfile(user.userId);
    }
  }, [user, setCurrentProfile]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">
            Welcome, {user?.username}!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            We're glad to see you on Forum Social App. 
            Start exploring topics or connect with friends!
          </p>
        </CardContent>
      </Card>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Topics</h2>
          {/* <Link
            to="/topics"
            className={
              "inline-flex items-center px-3 py-2 text-sm font-medium " +
              "text-white bg-blue-600 rounded-md hover:bg-blue-700"
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Topic
          </Link> */}
          <Button variant="default" >
            <Link to="/topics" >
            Create Topic
            </Link> 
          </Button>
        </div>
        
        <div className="space-y-4">
          {userTopicsLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500 text-2xl">
                  <p>Loading topics...</p>
                </div>
              </CardContent>
            </Card>
          ) : userTopicsError ? (
            <Card className="bg-red-50">
              <CardContent className="py-8">
                <div className="text-center text-red-500 text-2xl">
                  <p>{userTopicsError}</p>
                </div>
              </CardContent>
            </Card>
          ) : userTopics.length > 0 ? (
            userTopics.map(topic => (
              <Card key={topic.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <Link to={`/topics/${topic.id}`} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {topic.title}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {topic.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(topic.createdAt).toLocaleDateString()}
                        {topic.posts && ` • ${topic.posts.length} posts`}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <p className="mb-2">No topics yet</p>
                  <p className="text-sm">
                    Create your first topic to get started
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
