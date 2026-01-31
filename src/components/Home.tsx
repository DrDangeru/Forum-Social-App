import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useTopics } from '../hooks/useTopics';
import Feed from './Feed';
import WelcomeModal from './WelcomeModal';
import { FileText, Image, Layout, Users } from 'lucide-react';
import { Button } from './ui/button';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { profile, setCurrentProfile } = useProfile();
  const { userTopics, userTopicsLoading } = useTopics();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
  useEffect(() => {
    if (!profile?.galleryImages?.length) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prevIndex => 
        (prevIndex + 1) % profile.galleryImages!.length
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [profile?.galleryImages]);
  
  // Get current gallery image or placeholder
  const currentImage = profile?.galleryImages?.length 
    ? profile.galleryImages[currentImageIndex] 
    : null;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)}
        userName={user?.firstName || user?.username || ''}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Profile and Quick Links */}
        <div className="md:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Your Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    {currentImage ? (
                      <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4">
                        <img 
                          src={currentImage} 
                          alt="Gallery" 
                          className="w-full h-full object-cover"
                        />
                        {profile.galleryImages && profile.galleryImages.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50
                           text-white px-2 py-1 rounded text-xs">
                            {currentImageIndex + 1}/{profile.galleryImages.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center
                       justify-center mb-4">
                        <Image className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Username:</div>
                      <div>{profile.username}</div>
                    </div>
                    
                    <div className="mt-4">
                      <Link to={`/profile/${profile.userId}`}>
                        <Button variant="outline" className="w-full">
                          View Full Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  Loading profile...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Layout className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/topics" className="block w-full">
                <Button variant="default" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Browse Topics
                </Button>
              </Link>
              <Link to="/friends" className="block w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Find Friends
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        
        {/* Personalized Feed */}
        <div className="md:col-span-2">
          <Feed />
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
