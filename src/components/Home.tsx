import React, { useEffect, useRef, useState } from 'react';
import { Link } from "react-router-dom";
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={() => setShowWelcomeModal(false)}
        userName={user?.firstName || user?.username || ''}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Local Feed */}
        <div className="lg:col-span-3 space-y-6">
          <div className="neo-brutal-card p-1 bg-yellow-400">
            <div className="bg-white p-4 border-2 border-black">
              <h3 className="font-black uppercase tracking-tight flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5" />
                Local Pulse
              </h3>
              <LocalFeed />
            </div>
          </div>
        </div>
        
        {/* Main Content - Followed Topics & Regional News */}
        <div className="lg:col-span-6 space-y-8">
          <div className="flex items-center justify-between bg-white border-4 border-black p-6 shadow-neo">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Your Feed</h2>
              <p className="text-sm font-bold text-gray-600">Fresh updates from your network</p>
            </div>
            <Button size="lg" className="bg-green-500 hover:bg-green-400 text-black border-2 border-black shadow-neo-sm font-black uppercase tracking-widest px-6">
              <Link to="/topics">Start Topic</Link>
            </Button>
          </div>
          
          {/* Followed Topics Section */}
          <div className="neo-brutal-card overflow-hidden">
            <div className="bg-purple-400 p-4 border-b-2 border-black flex items-center gap-2">
              <Star className="h-6 w-6 text-black fill-yellow-400" />
              <h2 className="text-xl font-black uppercase tracking-tight">Followed Topics</h2>
            </div>
            <div className="p-6 space-y-4">
              {userTopicsLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-12 bg-gray-200 border-2 border-black" />
                  <div className="h-12 bg-gray-200 border-2 border-black" />
                </div>
              ) : userTopics.length > 0 ? (
                <div className="grid gap-4">
                  {userTopics.slice(0, 5).map((topic) => (
                    <Link 
                      key={topic.id} 
                      to={`/topics/${topic.id}`}
                      className="group block p-4 border-2 border-black hover:bg-yellow-50 transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-neo-sm bg-white"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 border-2 border-black bg-orange-100 group-hover:bg-orange-200 transition-colors">
                          <FileText className="h-5 w-5 text-black" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-lg uppercase tracking-tight truncate group-hover:underline decoration-2">{topic.title}</h3>
                          <p className="text-sm font-bold text-gray-600 line-clamp-1">{topic.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="p-1 border border-black bg-white flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span className="text-[10px] font-black">12</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-black bg-gray-50">
                  <Star className="h-16 w-16 mx-auto text-gray-300 mb-4 stroke-[1.5]" />
                  <p className="font-black uppercase tracking-tight text-gray-500 mb-4">Silence is golden, but following is better.</p>
                  <Button variant="outline" className="font-black">
                    <Link to="/topics">Find Something to Follow</Link>
                  </Button>
                </div>
              )}
              
              {userTopics.length > 5 && (
                <Link to="/topics" className="inline-block font-black uppercase text-xs hover:underline underline-offset-4 mt-2">
                  View all followed topics →
                </Link>
              )}
            </div>
          </div>

          {/* Regional News Section */}
          <div className="neo-brutal-card overflow-hidden">
            <div className="bg-blue-400 p-4 border-b-2 border-black flex items-center gap-2">
              <MapPin className="h-6 w-6 text-black fill-white" />
              <h2 className="text-xl font-black uppercase tracking-tight">Regional Pulse: {region || 'Global'}</h2>
            </div>
            <div className="p-6">
              {regionalMessage ? (
                <div className="p-4 bg-orange-100 border-2 border-black font-bold text-sm">
                  {regionalMessage}
                </div>
              ) : regionalTopics.length === 0 ? (
                <div className="text-center py-8">
                  <p className="font-bold text-gray-500">Scanning the airwaves...</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {regionalTopics.map((topic) => (
                    <Link
                      key={topic.id}
                      to={`/topics/${topic.id}`}
                      className="group block p-4 border-2 border-black bg-white hover:bg-blue-50 transition-all hover:translate-x-[2px] hover:translate-y-[2px] shadow-neo-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase px-1 border border-black bg-yellow-400">Trending</span>
                            {topic.creatorUsername && (
                              <span className="text-[10px] font-bold text-gray-500 italic">by @{topic.creatorUsername}</span>
                            )}
                          </div>
                          <h3 className="font-black text-lg uppercase tracking-tight truncate group-hover:underline decoration-2">{topic.title}</h3>
                          <p className="text-sm font-medium text-gray-600 line-clamp-2">{topic.description}</p>
                        </div>
                        <div className="p-2 border-2 border-black bg-blue-100 group-hover:bg-blue-200 transition-colors">
                          <MessageSquare className="h-5 w-5 text-black" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <Link to="/regional" className="inline-block font-black uppercase text-xs hover:underline underline-offset-4 mt-6">
                Go beyond your region →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Quick Actions */}
        <div className="lg:col-span-3 space-y-6">
          <div className="neo-brutal-card">
            <div className="bg-black text-white p-4 flex items-center gap-2">
              <Layout className="h-5 w-5" />
              <h2 className="font-black uppercase tracking-widest text-sm">Quick Access</h2>
            </div>
            <div className="p-4 space-y-3 bg-white">
              <Link to={`/profile/${profile?.userId}`} className="block">
                <Button variant="outline" className="w-full justify-start font-black uppercase text-xs border-2 border-black shadow-none hover:bg-yellow-400 hover:shadow-neo-sm transition-all">
                  <User className="h-4 w-4 mr-3 stroke-[3]" />
                  My Command Center
                </Button>
              </Link>
              <Link to="/topics" className="block">
                <Button variant="outline" className="w-full justify-start font-black uppercase text-xs border-2 border-black shadow-none hover:bg-purple-400 hover:shadow-neo-sm transition-all">
                  <FileText className="h-4 w-4 mr-3 stroke-[3]" />
                  Deep Dives
                </Button>
              </Link>
              <Link to="/friends" className="block">
                <Button variant="outline" className="w-full justify-start font-black uppercase text-xs border-2 border-black shadow-none hover:bg-green-400 hover:shadow-neo-sm transition-all">
                  <Users className="h-4 w-4 mr-3 stroke-[3]" />
                  The Squad
                </Button>
              </Link>
            </div>
          </div>

          <div className="neo-glass-card p-6">
            <h3 className="font-black uppercase italic tracking-tighter text-lg mb-2">Member Since</h3>
            <p className="text-3xl font-black">2026</p>
            <div className="mt-4 pt-4 border-t-2 border-black/10">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500">
                <span>Reputation</span>
                <span className="text-black">High</span>
              </div>
              <div className="w-full h-4 border-2 border-black mt-1 bg-white overflow-hidden">
                <div className="h-full bg-green-500 w-[85%] border-r-2 border-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Your Topics Section (kept for managing owned content) */}
      <div className="mt-16">
        <div className="flex items-baseline gap-4 mb-8">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic">Your Archives</h2>
          <div className="h-1 flex-1 bg-black" />
          <Button variant="default" className="rounded-none font-black uppercase tracking-widest border-2 border-black shadow-neo">
            <Link to="/topics">Archive Topic</Link> 
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userTopicsLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 neo-brutal-card animate-pulse bg-gray-100" />
            ))
          ) : userTopics.length > 0 ? (
            userTopics.map(topic => (
              <div key={topic.id} className="neo-brutal-card group bg-white hover:-translate-rotate-1 transition-all">
                <div className="p-6">
                  <Link to={`/topics/${topic.id}`} className="block space-y-3">
                    <div className="flex justify-between items-start">
                      <FileText className="h-8 w-8 text-black stroke-[2.5]" />
                      <span className="text-[10px] font-black uppercase px-2 py-1 bg-black text-white">Topic ID: {topic.id}</span>
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight group-hover:underline decoration-4">
                      {topic.title}
                    </h3>
                    <p className="text-sm font-bold text-gray-600 line-clamp-2 italic">
                      "{topic.description}"
                    </p>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 neo-brutal-card bg-gray-50 flex flex-col items-center justify-center border-dashed border-4 border-black/20">
              <p className="text-2xl font-black uppercase text-gray-400">Empty Archives</p>
              <p className="font-bold text-gray-500 mt-2">Start a legacy today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
