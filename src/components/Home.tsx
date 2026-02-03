import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useTopics } from '../hooks/useTopics';
import Feed from './Feed';
import WelcomeModal from './WelcomeModal';
import LocalFeed from './LocalFeed';
import { FileText, Layout, Users, User } from 'lucide-react';
import { Button } from './ui/button';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { profile, setCurrentProfile } = useProfile();
  const { userTopics, userTopicsLoading } = useTopics();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  // Check if we should show welcome modal (on login)
  useEffect(() => {
    const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcome');
    if (user && !hasSeenWelcome) {
      setShowWelcomeModal(true);
      sessionStorage.setItem('hasSeenWelcome', 'true');
    }
  }, [user]);
  
  // Set current profile to the logged-in user's profile
  useEffect(() => {
    if (user?.userId) {
      setCurrentProfile(user.userId);
    }
  }, [user, setCurrentProfile]);
  
  // Rotate through gallery images every 5 seconds
  // Removed - maybe in a display or slideshow mode... maybe
  // when in gallery mode... but not here.
  // Get current gallery image or placeholder
  // const currentImage = profile?.galleryImages?.length 
  //   ? profile.galleryImages[currentImageIndex] 
  //   : null;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)}
        userName={user?.firstName || user?.username || ''}
      />
      <div className="home-layout">
        {/* Left Sidebar - Local Feed */}
        <div className="local-feed-sidebar">
          <LocalFeed />
        </div>
        
        {/* Main Feed - Center */}
        <div className="main-feed">
          <Feed />
        </div>

        {/* Right Sidebar - Quick Actions */}
        <div className="quick-actions-sidebar">
          <Card className="frosted-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Layout className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to={`/profile/${profile?.userId}`} className="block w-full">
                <Button variant="ghost" className="action-btn">
                  <User className="h-4 w-4 mr-2" />
                  My Profile
                </Button>
              </Link>
              <div className="thin-divider" />
              <Link to="/topics" className="block w-full">
                <Button variant="ghost" className="action-btn">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Topics
                </Button>
              </Link>
              <div className="thin-divider" />
              <Link to="/friends" className="block w-full">
                <Button variant="ghost" className="action-btn">
                  <Users className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Your Topics Section (kept for managing owned content) */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Topics</h2>
          <Button variant="default">
            <Link to="/topics">Create Topic</Link> 
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {userTopicsLoading ? (
            <Card className="col-span-full">
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  <p>Loading topics...</p>
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
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full bg-gray-50 border-dashed border-2">
              <CardContent className="py-8 text-center text-gray-500">
                <p>No topics created yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
