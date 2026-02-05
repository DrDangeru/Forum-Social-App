import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { MapPin, Plus, MessageSquare, Settings } from 'lucide-react';
import type { RegionalTopic } from '../types/clientTypes';

const RegionalFeed: React.FC = () => {
  const [topics, setTopics] = useState<RegionalTopic[]>([]);
  const [region, setRegion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New topic form
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Region setting
  const [showRegionSetting, setShowRegionSetting] = useState(false);
  const [newRegion, setNewRegion] = useState('');

  useEffect(() => {
    fetchRegionalTopics();
  }, []);

  const fetchRegionalTopics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/regional/topics', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
        setRegion(data.region);
        if (!data.region) {
          setShowRegionSetting(true);
        }
      } else {
        setError('Failed to fetch regional topics');
      }
    } catch (err) {
      console.error('Error fetching regional topics:', err);
      setError('Failed to fetch regional topics');
    } finally {
      setLoading(false);
    }
  };

  const handleSetRegion = async () => {
    if (!newRegion.trim()) return;
    
    try {
      const response = await fetch('/api/regional/set-region', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ region: newRegion.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setRegion(data.region);
        setShowRegionSetting(false);
        setNewRegion('');
        fetchRegionalTopics();
      } else {
        setError('Failed to set region');
      }
    } catch (err) {
      setError('Failed to set region');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/regional/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTopics(prev => [data.topic, ...prev]);
        setNewTitle('');
        setNewDescription('');
        setShowNewTopic(false);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create topic');
      }
    } catch (err) {
      setError('Failed to create topic');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading regional feed...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Regional Feed</h1>
          {region && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {region}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRegionSetting(!showRegionSetting)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Change Region
          </Button>
          {region && (
            <Button onClick={() => setShowNewTopic(!showNewTopic)}>
              <Plus className="h-4 w-4 mr-1" />
              New Regional Topic
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Region Setting */}
      {showRegionSetting && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Set Your Region</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Enter your region to see and create regional topics. Use a country code (US, UK, EU) or city name.
            </p>
            <div className="flex gap-2">
              <Input
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="Enter region (e.g., US, NYC, London)"
                className="flex-1"
              />
              <Button onClick={handleSetRegion} disabled={!newRegion.trim()}>
                Set Region
              </Button>
              {region && (
                <Button variant="outline" onClick={() => setShowRegionSetting(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Topic Form */}
      {showNewTopic && region && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Create Regional Topic for {region}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTopic} className="space-y-4">
              <div>
                <Label htmlFor="title">Topic Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What's happening in your region?"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe your topic..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Topic'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewTopic(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Topics List */}
      {!region ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Set your region above to see regional topics and discussions.</p>
          </CardContent>
        </Card>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No regional topics yet for {region}.</p>
            <p className="mt-2">Be the first to start a discussion!</p>
            <Button className="mt-4" onClick={() => setShowNewTopic(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Create First Topic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <Link to={`/topics/${topic.id}`} className="block">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={topic.creatorAvatarUrl || undefined} />
                      <AvatarFallback>
                        {topic.creatorUsername?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                        {topic.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {topic.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>by {topic.creatorUsername}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {topic.postCount || 0} posts
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {topic.region}
                        </span>
                        {topic.lastPostAt && (
                          <span>
                            Last activity: {new Date(topic.lastPostAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegionalFeed;
