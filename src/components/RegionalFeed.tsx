import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { MapPin, Plus, MessageSquare, Settings, Globe, ShieldAlert, Zap } from 'lucide-react';
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
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4 bg-orange-50/50">
        <div className="w-16 h-16 border-8 border-black border-t-blue-500 animate-spin shadow-neo" />
        <p className="font-black uppercase tracking-widest text-xl italic">Scanning Frequencies...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-10 w-10 text-blue-600 stroke-[3]" />
            <h1 className="text-5xl font-black uppercase tracking-tighter italic">Regional Feed</h1>
          </div>
          {region ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-xs font-black uppercase tracking-widest">
              <Globe className="h-3 w-3" />
              Sector: {region}
            </div>
          ) : (
            <p className="font-bold text-gray-600 uppercase tracking-widest text-xs">Accessing localized intelligence streams</p>
          )}
        </div>
        <div className="flex gap-4 relative z-10">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setShowRegionSetting(!showRegionSetting)}
            className="border-2 border-black font-black uppercase tracking-widest shadow-neo-sm hover:bg-yellow-400 transition-all"
          >
            <Settings className="h-4 w-4 mr-2 stroke-[3]" />
            Relocate
          </Button>
          {region && (
            <Button 
              onClick={() => setShowNewTopic(!showNewTopic)}
              size="lg"
              className="bg-green-500 hover:bg-green-400 text-black border-2 border-black shadow-neo font-black uppercase tracking-widest"
            >
              <Plus className="h-4 w-4 mr-2 stroke-[3]" />
              New Intel
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="neo-brutal-card bg-red-100 p-4 border-red-600 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <span className="font-black uppercase text-xs text-red-600">BREACH: {error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-black text-red-600 hover:scale-125 transition-transform">×</button>
        </div>
      )}

      {/* Region Setting */}
      {showRegionSetting && (
        <div className="neo-brutal-card bg-white overflow-hidden">
          <div className="bg-yellow-400 p-4 border-b-2 border-black">
            <h2 className="text-xl font-black uppercase tracking-tight italic">Set Operational Sector</h2>
          </div>
          <div className="p-8">
            <p className="font-bold text-gray-600 mb-6 uppercase text-xs tracking-widest">
              IDENTIFY YOUR GRID COORDINATES (COUNTRY CODE, CITY, OR HUB NAME)
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
                placeholder="E.G. US, NYC, LONDON_UNDERGROUND"
                className="flex-1 font-black uppercase tracking-widest"
              />
              <Button onClick={handleSetRegion} disabled={!newRegion.trim()} className="bg-black text-white font-black uppercase px-8">
                Lock Coordinates
              </Button>
              {region && (
                <Button variant="ghost" onClick={() => setShowRegionSetting(false)} className="font-black uppercase text-xs">
                  Abort
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Topic Form */}
      {showNewTopic && region && (
        <div className="neo-brutal-card bg-white overflow-hidden animate-in slide-in-from-top duration-300">
          <div className="bg-green-400 p-4 border-b-2 border-black">
            <h2 className="text-xl font-black uppercase tracking-tight italic">Broadcast New Regional Intel: {region}</h2>
          </div>
          <div className="p-8">
            <form onSubmit={handleCreateTopic} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-black uppercase tracking-widest text-[10px]">Intel Subject</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="WHAT'S THE SITUATION?"
                  required
                  className="text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="font-black uppercase tracking-widest text-[10px]">Operational Briefing</Label>
                <Textarea
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="PROVIDE ALL NECESSARY DETAILS..."
                  rows={4}
                  required
                  className="font-bold p-4"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <Button type="submit" disabled={creating} className="bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-neo font-black uppercase px-10">
                  {creating ? 'TRANSMITTING...' : 'POST INTEL'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowNewTopic(false)} className="font-black uppercase">
                  CANCEL_OP
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topics List */}
      {!region ? (
        <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-20 text-center space-y-6">
          <MapPin className="h-20 w-20 mx-auto text-black/10 stroke-[1]" />
          <div>
            <p className="text-2xl font-black uppercase text-gray-400 italic">Sector Unidentified</p>
            <p className="font-bold text-gray-400 mt-2">Initialize your coordinates to access the local frequency.</p>
          </div>
          <Button onClick={() => setShowRegionSetting(true)} className="bg-black text-white font-black uppercase tracking-widest px-8">
            Identify Sector
          </Button>
        </div>
      ) : topics.length === 0 ? (
        <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-20 text-center space-y-6">
          <MessageSquare className="h-20 w-20 mx-auto text-black/10 stroke-[1]" />
          <div>
            <p className="text-2xl font-black uppercase text-gray-400 italic">Static Airwaves</p>
            <p className="font-bold text-gray-400 mt-2">No regional intel detected for {region}.</p>
          </div>
          <Button onClick={() => setShowNewTopic(true)} className="bg-green-500 text-black border-2 border-black shadow-neo font-black uppercase tracking-widest px-8">
            Broadcast First Signal
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic whitespace-nowrap">Latest Intel</h2>
            <div className="h-1 flex-1 bg-black" />
          </div>
          {topics.map((topic) => (
            <div key={topic.id} className="neo-brutal-card bg-white group hover:-translate-y-1 transition-all overflow-hidden">
              <Link to={`/topics/${topic.id}`} className="block">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 bg-blue-400 border-b-2 md:border-b-0 md:border-r-2 border-black p-6 flex flex-col items-center justify-center gap-4">
                    <div className="border-2 border-black shadow-neo-sm bg-white p-1 transition-transform group-hover:rotate-3">
                      <Avatar className="h-20 w-20 rounded-none">
                        <AvatarImage src={topic.creatorAvatarUrl || undefined} className="rounded-none" />
                        <AvatarFallback className="rounded-none bg-orange-400 font-black text-xl">
                          {topic.creatorUsername?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 truncate w-full text-center">
                      @{topic.creatorUsername}
                    </span>
                  </div>
                  
                  <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 border-2 border-black bg-yellow-400 text-[10px] font-black uppercase shadow-neo-sm">REGIONAL_INTEL</div>
                        {topic.lastPostAt && (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            SIGNAL_DETECTED: {new Date(topic.lastPostAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl font-black uppercase tracking-tight group-hover:underline decoration-4">
                        {topic.title}
                      </h3>
                      <p className="text-lg font-bold text-gray-600 line-clamp-2 italic">
                        "{topic.description}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 border-t-2 border-black/5 pt-6">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 stroke-[2.5]" />
                        <span className="text-sm font-black">{topic.postCount || 0} LOGS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 stroke-[2.5] text-blue-600" />
                        <span className="text-sm font-black uppercase tracking-widest">{topic.region}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-2 text-xs font-black uppercase group-hover:gap-4 transition-all">
                        Access Feed <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RegionalFeed;
