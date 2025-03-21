import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { profile, setCurrentProfile } = useProfile();
  
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
            Welcome, {profile?.firstName || user?.firstName || 'User'}!
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
        <h2 className="text-xl font-semibold mb-4">Topics Feed</h2>
        <div className="space-y-4">
          <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                <p className="mb-2">No topics yet</p>
                <p className="text-sm">
                  Topics you follow will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Home;
