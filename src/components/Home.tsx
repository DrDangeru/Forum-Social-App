import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useTopics } from '../hooks/useTopics';
import WelcomeModal from './WelcomeModal';
import LocalFeed from './LocalFeed';
import { FileText, Layout, Users, User, MapPin, Star, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import './Home.css';
import type { RegionalTopicItem, RegionalTopicsSseData } from '../types/clientTypes';

const Home: React.FC = () => {
  const { user } = useAuth();
  const { profile, setCurrentProfile } = useProfile();
  const { userTopics, userTopicsLoading } = useTopics();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  const [regionalTopics, setRegionalTopics] = useState<RegionalTopicItem[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [regionalMessage, setRegionalMessage] = useState<string | null>(null);
  const regionalEventSource = useRef<EventSource | null>(null);
  
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

  useEffect(() => {
    if (!user?.userId) return;

    regionalEventSource.current = new EventSource('/api/sse/regional-topics', {
      withCredentials: true
    });

    regionalEventSource.current.addEventListener('regional-topics', (event) => {
      const data: RegionalTopicsSseData = JSON.parse((event as MessageEvent).data);
      setRegionalTopics(data.topics || []);
      setRegion(data.region || null);
      setRegionalMessage(data.message || null);
    });

    regionalEventSource.current.onerror = () => {
      console.error('Regional SSE connection error');
    };

    return () => {
      regionalEventSource.current?.close();
    };
  }, [user?.userId]);
  
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
        
        {/* Main Content - Followed Topics & Regional News */}
        <div className="main-feed space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Your Feed</h2>
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              <Link to="/topics">Start a Topic</Link>
            </Button>
          </div>
          
          {/* Followed Topics Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Topics You Follow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Stay updated with the latest posts from topics you're following.
              </p>
              <div className="space-y-3">
                {userTopicsLoading ? (
                  <p className="text-gray-500">Loading followed topics...</p>
                ) : userTopics.length > 0 ? (
                  userTopics.slice(0, 5).map((topic) => (
                    <Link 
                      key={topic.id} 
                      to={`/topics/${topic.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{topic.title}</h3>
                          <p className="text-sm text-gray-500 truncate">{topic.description}</p>
                        </div>
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <Star className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No followed topics yet.</p>
                    <Link to="/topics" className="text-blue-600 hover:underline text-sm">
                      Browse topics to follow
                    </Link>
                  </div>
                )}
              </div>
              {userTopics.length > 5 && (
                <Link to="/topics" className="text-blue-600 hover:underline text-sm mt-3 block">
                  View all followed topics →
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Regional News Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Regional News
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Top stories and discussions from your region.
              </p>

              {regionalMessage ? (
                <p className="text-sm text-gray-500 py-2">{regionalMessage}</p>
              ) : regionalTopics.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">No regional topics yet</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Top Stories in {region || 'Your Region'}
                  </p>
                  {regionalTopics.map((topic) => (
                    <Link
                      key={topic.id}
                      to={`/topics/${topic.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{topic.title}</h3>
                          <p className="text-sm text-gray-500 truncate">{topic.description}</p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {topic.postCount}
                            </span>
                            {topic.creatorUsername && <span>by {topic.creatorUsername}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <Link to="/regional" className="text-blue-600 hover:underline text-sm mt-3 block">
                View all regional topics →
              </Link>
            </CardContent>
          </Card>
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
