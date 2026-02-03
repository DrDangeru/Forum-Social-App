import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { MapPin, Star, MessageSquare, TrendingUp } from 'lucide-react';

interface TopicItem {
  id: number;
  title: string;
  description: string;
  region?: string | null;
  creatorUsername: string;
  creatorAvatarUrl?: string | null;
  postCount: number;
  lastActivity?: string | null;
  newPosts?: number;
}

interface RegionalData {
  topics: TopicItem[];
  region: string | null;
  message?: string;
  timestamp?: string;
}

interface FollowedData {
  topics: TopicItem[];
  timestamp?: string;
}

const LocalFeed: React.FC = () => {
  const [regionalTopics, setRegionalTopics] = useState<TopicItem[]>([]);
  const [followedTopics, setFollowedTopics] = useState<TopicItem[]>([]);
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
      const data: RegionalData = JSON.parse(event.data);
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
      const data: FollowedData = JSON.parse(event.data);
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
    <div className="space-y-4">
      {/* Regional Top Topics - Frosted Glass */}
      <Card className="backdrop-blur-md bg-white/70 border border-white/20 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            Top Stories in {region || 'Your Region'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {regionalMessage ? (
            <p className="text-xs text-gray-500 py-2">{regionalMessage}</p>
          ) : regionalTopics.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">No regional topics yet</p>
          ) : (
            <ul className="space-y-2">
              {regionalTopics.map((topic, index) => (
                <li key={topic.id} className="border-b last:border-0 pb-2 last:pb-0">
                  <Link 
                    to={`/topics/${topic.id}`}
                    className="block hover:bg-gray-50 rounded p-1 -m-1"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-blue-600 mt-0.5">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {topic.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {topic.postCount}
                          </span>
                          <span>by {topic.creatorUsername}</span>
                        </div>
                      </div>
                      {topic.postCount > 5 && (
                        <TrendingUp className="h-3 w-3 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {region && (
            <Link 
              to="/regional" 
              className="text-xs text-blue-600 hover:underline mt-2 block"
            >
              View all regional topics →
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="border-t border-gray-300 my-2" />

      {/* Followed Topics - Frosted Glass */}
      <Card className="backdrop-blur-md bg-white/70 border border-white/20 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Your Followed Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {followedTopics.length === 0 ? (
            <p className="text-xs text-gray-500 py-2">
              No followed topics yet. Follow topics to see updates here.
            </p>
          ) : (
            <ul className="space-y-2">
              {followedTopics.map((topic, index) => (
                <li key={topic.id} className="border-b last:border-0 pb-2 last:pb-0">
                  <Link 
                    to={`/topics/${topic.id}`}
                    className="block hover:bg-gray-50 rounded p-1 -m-1"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-yellow-600 mt-0.5">
                        {index + 1}.
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {topic.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {topic.postCount}
                          </span>
                          {topic.newPosts && topic.newPosts > 0 && (
                            <span className="text-green-600 font-medium">
                              +{topic.newPosts} new
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link 
            to="/topics" 
            className="text-xs text-blue-600 hover:underline mt-2 block"
          >
            Browse all topics →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default LocalFeed;
