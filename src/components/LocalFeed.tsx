import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, MessageSquare, TrendingUp } from 'lucide-react';
import type {
  RegionalTopicItem,
  FollowedTopicItem,
  RegionalTopicsSseData,
  FollowedTopicsSseData
} from '../types/clientTypes';

const LocalFeed: React.FC = () => {
  const [regionalTopics, setRegionalTopics] = useState<RegionalTopicItem[]>([]);
  const [followedTopics, setFollowedTopics] = useState<FollowedTopicItem[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [regionalMessage, setRegionalMessage] = useState<string | null>(null);
  
  const regionalEventSource = useRef<EventSource | null>(null);
  const followedEventSource = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to regional topics SSE
    regionalEventSource.current = new EventSource('/api/sse/regional-topics', {
      withCredentials: true
    });

    regionalEventSource.current.addEventListener('regional-topics', (event) => {
      const data: RegionalTopicsSseData = JSON.parse(event.data);
      setRegionalTopics(data.topics);
      setRegion(data.region);
      setRegionalMessage(data.message || null);
    });

    regionalEventSource.current.onerror = () => {
      console.error('Regional SSE connection error');
    };

    // Connect to followed topics SSE
    followedEventSource.current = new EventSource('/api/sse/followed-topics', {
      withCredentials: true
    });

    followedEventSource.current.addEventListener('followed-topics', (event) => {
      const data: FollowedTopicsSseData = JSON.parse(event.data);
      setFollowedTopics(data.topics);
    });

    followedEventSource.current.onerror = () => {
      console.error('Followed SSE connection error');
    };

    // Cleanup on unmount
    return () => {
      regionalEventSource.current?.close();
      followedEventSource.current?.close();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Regional Top Topics - Neo Glass */}
      <div className="neo-glass-card overflow-hidden">
        <div className="bg-blue-400 p-3 border-b-2 border-black flex items-center gap-2">
          <MapPin className="h-4 w-4 text-black fill-white" />
          <h2 className="text-xs font-black uppercase tracking-widest">Local Pulse: {region || 'Global'}</h2>
        </div>
        <div className="p-4">
          {regionalMessage ? (
            <p className="text-xs font-bold text-gray-600 bg-orange-100 p-2 border border-black mb-2">{regionalMessage}</p>
          ) : regionalTopics.length === 0 ? (
            <p className="text-xs font-bold text-gray-400 py-4 text-center">Scanning frequencies...</p>
          ) : (
            <ul className="space-y-3">
              {regionalTopics.map((topic, index) => (
                <li key={topic.id} className="group">
                  <Link 
                    to={`/topics/${topic.id}`}
                    className="flex items-start gap-3 p-2 border-2 border-transparent hover:border-black hover:bg-white transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <span className="text-sm font-black italic text-blue-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight truncate group-hover:underline">
                        {topic.title}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                          <MessageSquare className="h-3 w-3" />
                          {topic.postCount}
                        </div>
                        {topic.postCount > 5 && (
                          <div className="flex items-center gap-1 bg-green-400 border border-black px-1">
                            <TrendingUp className="h-2 w-2 text-black" />
                            <span className="text-[8px] font-black uppercase">Hot</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {region && (
            <Link 
              to="/regional" 
              className="text-[10px] font-black uppercase text-blue-600 hover:underline mt-4 block border-t-2 border-black/5 pt-2"
            >
              Expand Search Radius →
            </Link>
          )}
        </div>
      </div>

      {/* Followed Topics - Neo Glass */}
      <div className="neo-glass-card overflow-hidden">
        <div className="bg-yellow-400 p-3 border-b-2 border-black flex items-center gap-2">
          <Star className="h-4 w-4 text-black fill-black" />
          <h2 className="text-xs font-black uppercase tracking-widest">Watching</h2>
        </div>
        <div className="p-4">
          {followedTopics.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-black/10">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">No active surveillance.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {followedTopics.map((topic, index) => (
                <li key={topic.id} className="group">
                  <Link 
                    to={`/topics/${topic.id}`}
                    className="flex items-start gap-3 p-2 border-2 border-transparent hover:border-black hover:bg-white transition-all hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <span className="text-sm font-black italic text-yellow-600">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight truncate group-hover:underline">
                        {topic.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                          <MessageSquare className="h-3 w-3" />
                          {topic.postCount}
                        </div>
                        {topic.newPosts && topic.newPosts > 0 && (
                          <span className="bg-red-500 text-white text-[8px] font-black uppercase px-1 border border-black animate-pulse">
                            {topic.newPosts} NEW
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link 
            to="/topics" 
            className="text-[10px] font-black uppercase text-yellow-600 hover:underline mt-4 block border-t-2 border-black/5 pt-2"
          >
            Access All Topics →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LocalFeed;
