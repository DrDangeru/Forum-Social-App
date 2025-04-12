import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useTopics } from '../hooks/useTopics';
import { FileText, Image } from 'lucide-react';
import { Button } from './ui/button';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { profile, setCurrentProfile } = useProfile();
  const { userTopics, userTopicsLoading, userTopicsError } = useTopics();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Profile Card */}
        <Card className="md:col-span-1">
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
                    
                    {profile.age !== null && profile.age !== undefined && (
                      <>
                        <div className="text-gray-500">Age:</div>
                        <div>{profile.age}</div>
                      </>
                    )}
                    
                    {profile.relationshipStatus && (
                      <>
                        <div className="text-gray-500">Relationship:</div>
                        <div>{profile.relationshipStatus}</div>
                      </>
                    )}
                    
                    {profile.location && (
                      <>
                        <div className="text-gray-500">Location:</div>
                        <div>{profile.location}</div>
                      </>
                    )}
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
        
        {/* Welcome Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">
              Welcome, {user?.username}!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              We're glad to see you on Forum Social App. 
              Start exploring topics or connect with friends!
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <Link to="/topics">
                <Button variant="default" className="w-full">
                  Browse Topics
                </Button>
              </Link>
              <Link to="/friends">
                <Button variant="outline" className="w-full">
                  Connect with Friends
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Topics</h2>
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
