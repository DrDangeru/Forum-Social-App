import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { MapPin, Users, X } from 'lucide-react';
import type { RegionalPost, FriendActivity, FollowedTopic } from '../types/clientTypes';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, userName }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'welcome' | 'options' | 'region'>('welcome');
  const [region, setRegion] = useState('');
  const [regionalPosts, setRegionalPosts] = useState<RegionalPost[]>([]);
  const [friendsActivity, setFriendsActivity] = useState<FriendActivity[]>([]);
  const [followedTopics, setFollowedTopics] = useState<FollowedTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && step === 'options') {
      fetchActivity();
    }
  }, [isOpen, step]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const [regionalRes, friendsRes, followedTopicsRes] = await Promise.all([
        fetch('/api/regional/activity', { credentials: 'include' }),
        fetch('/api/regional/friends-activity', { credentials: 'include' }),
        fetch('/api/regional/followed-topics', { credentials: 'include' })
      ]);

      if (regionalRes.ok) {
        const regionalData = await regionalRes.json();
        setRegionalPosts(regionalData.posts || []);
      }

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriendsActivity(friendsData.friends || []);
      }
      
      if (followedTopicsRes.ok) {
        const followedTopicsData = await followedTopicsRes.json();
        setFollowedTopics(followedTopicsData.topics || []);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetRegion = async () => {
    if (!region.trim()) return;
    
    try {
      const response = await fetch('/api/regional/set-region', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ region: region.trim() })
      });

      if (response.ok) {
        setStep('options');
        fetchActivity();
      } else {
        setError('Failed to set region');
      }
    } catch (err) {
      setError('Failed to set region');
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleFollowedTopics = async () => {
    try{
      const response = await fetch('/api/regional/followed-topics',
        { credentials: 'include' });
        console.log(response);
      if (response.ok) {
        const data = await response.json();
        setFollowedTopics(data.topics || []);
      }
    } catch (err) {
      console.error('Error fetching followed topics:', err);
    }
    onClose();
    navigate('/topics'); // Or create a specific followed topics route
  };

  const goToRegionalFeed = () => {
    onClose();
    navigate('/regional');
  };

  const goToFriends = () => {
    onClose();
    navigate('/friends');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {step === 'welcome' && `Welcome back, ${userName}!`}
            {step === 'region' && 'Set Your Region'}
            {step === 'options' && 'What would you like to do?'}
          </h2>
          <button onClick={handleSkip} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'welcome' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Great to see you again! Let's get you connected with your community.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setStep('region')} className="flex-1">
                Continue
              </Button>
              <Button onClick={handleSkip} variant="outline">
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {step === 'region' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Set your region to see what's happening in your area. 
              Use a country code (e.g., US, EU, UK) or city name.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Enter your region (e.g., US, EU, NYC)"
                className="flex-1 border rounded px-3 py-2"
              />
              <Button onClick={handleSetRegion} disabled={!region.trim()}>
                Set Region
              </Button>
            </div>
            <Button onClick={() => setStep('options')} variant="ghost" className="w-full">
              Skip this step
            </Button>
          </div>
        )}

        {step === 'options' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={goToRegionalFeed}
                    className="p-4 border rounded-lg hover:bg-blue-50 text-left transition-colors"
                  >
                    <MapPin className="h-6 w-6 text-blue-500 mb-2" />
                    <h3 className="font-semibold">Regional Activity</h3>
                    <p className="text-sm text-gray-500">
                      {regionalPosts.length > 0 
                        ? `${regionalPosts.length} recent posts from your region`
                        : 'See what people in your area are posting'}
                    </p>
                  </button>

                  <button
                    onClick={goToFriends}
                    className="p-4 border rounded-lg hover:bg-green-50 text-left transition-colors"
                  >
                    <Users className="h-6 w-6 text-green-500 mb-2" />
                    <h3 className="font-semibold">Connect with Friends</h3>
                    <p className="text-sm text-gray-500">
                      {friendsActivity.length > 0
                        ? `${friendsActivity.filter(f => f.recentPosts > 0).length} friends active recently`
                        : 'See what your friends are up to'}
                    </p>
                  </button>
                </div>

                {regionalPosts.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Recent in your region
                    </h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {regionalPosts.slice(0, 3).map((post) => (
                        <div key={post.postId} className="text-sm border-b pb-2 last:border-0">
                          <span className="font-medium">{post.username}</span> posted in{' '}
                          <span className="text-blue-600">{post.topicTitle}</span>
                          <p className="text-gray-500 truncate">{post.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {friendsActivity.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Friends activity
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {friendsActivity.filter(f => f.recentPosts > 0).slice(0, 5).map((friend) => (
                        <div 
                          key={friend.userId}
                          className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm"
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                            {friend.firstName[0]}{friend.lastName[0]}
                          </div>
                          <span>{friend.firstName}</span>
                          <span className="text-green-600 text-xs">({friend.recentPosts} posts)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {followedTopics.length > 0 && (
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">Your followed topics</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {followedTopics.slice(0, 3).map((topic) => (
                        <div key={topic.topicId} className="text-sm border-b pb-2 last:border-0">
                          <span className="font-medium">{topic.topicTitle}</span>
                          {topic.recentPosts > 0 && (
                            <span className="text-green-600 ml-2">({topic.recentPosts} new posts)</span>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleFollowedTopics} variant="link" className="p-0 mt-2">
                      View all topics →
                    </Button>
                  </div>
                )}

                <Button onClick={handleSkip} variant="outline" className="w-full">
                  Go to home feed
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeModal;
