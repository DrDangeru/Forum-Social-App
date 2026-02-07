import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import type { Topic } from '../types/clientTypes';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea.tsx';
import axios from 'axios';
import { 
  Plus, 
  MessageSquare, 
  ChevronRight, 
  Search, 
  Filter,
  Terminal,
  Calendar,
  Zap,
  X,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Topics() {
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [firstPostContent, setFirstPostContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchTopics = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/topics/user/${user.userId}`);
      const processedTopics = response.data.map((topic: any) => ({
        ...topic,
        posts: topic.posts || []
      }));
      setUserTopics(processedTopics);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleCreateTopic = async () => {
    try {
      if (!user) {
        alert('You must be logged in to create a topic');
        return;
      }
      
      if (!title.trim() || !description.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      setLoading(true);
      
      const response = await axios.post('/api/topics', {
        title,
        description,
        createdBy: user.userId,
        isPublic,
        firstPostContent: firstPostContent.trim() || null
      });
      
      const newTopic = {
        ...response.data,
        posts: response.data.posts || []
      };
      
      setUserTopics(prev => [newTopic, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create topic:', error);
      alert('Failed to create topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFirstPostContent('');
    setIsPublic(true);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2">Topic Hub</h1>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-xs italic">Operational Transmissions & Archive Management</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          size="lg"
          className={cn(
            "relative z-10 font-black uppercase tracking-widest border-2 border-black shadow-neo px-8",
            showForm ? "bg-red-500 hover:bg-red-400 text-white" : "bg-yellow-400 hover:bg-yellow-300 text-black"
          )}
        >
          {showForm ? <X className="h-5 w-5 mr-2 stroke-[3]" /> : <Plus className="h-5 w-5 mr-2 stroke-[3]" />}
          {showForm ? 'Abort Mission' : 'Initiate Topic'}
        </Button>
      </div>

      {showForm && (
        <div className="neo-brutal-card bg-white overflow-hidden animate-in slide-in-from-top duration-300">
          <div className="bg-yellow-400 p-4 border-b-2 border-black flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tight italic">New Transmission Protocol</h2>
            <Terminal className="h-5 w-5" />
          </div>
          <div className="p-8">
            <div className="grid gap-8">
              <div className="grid gap-2">
                <Label htmlFor="title" className="font-black uppercase tracking-widest text-xs">Subject Header *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="CLASSIFIED_TITLE"
                  className="text-lg font-bold"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description" className="font-black uppercase tracking-widest text-xs">Mission Briefing *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="PROVIDE DETAILED INTEL..."
                  className="min-h-[120px] font-bold p-4"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="firstPost" className="font-black uppercase tracking-widest text-xs">Initial Intel Drop</Label>
                <Textarea
                  id="firstPost"
                  value={firstPostContent}
                  onChange={(e) => setFirstPostContent(e.target.value)}
                  placeholder="WRITE YOUR FIRST LOG ENTRY (OPTIONAL)"
                  className="min-h-[120px] font-bold p-4 bg-gray-50"
                />
              </div>
              
              <div className="flex items-center gap-4 p-4 border-2 border-black bg-orange-50/50 shadow-neo-sm w-fit">
                <input
                  type="checkbox"
                  id="public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-6 w-6 border-2 border-black rounded-none appearance-none checked:bg-black transition-colors cursor-pointer relative after:content-['✓'] after:absolute after:hidden checked:after:block after:text-white after:text-sm after:left-1 after:top-0"
                />
                <Label htmlFor="public" className="font-black uppercase tracking-widest text-sm cursor-pointer select-none">
                  {isPublic ? 'Public Frequency' : 'Secure Line (Invitation Only)'}
                </Label>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 border-t-2 border-black/5">
                <Button variant="ghost" onClick={() => {
                  resetForm();
                  setShowForm(false);
                }} className="font-black uppercase">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateTopic}
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo font-black uppercase px-10 tracking-widest"
                  disabled={loading}
                >
                  {loading ? 'Transmitting...' : 'Broadcast Protocol →'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic whitespace-nowrap">Your Archive</h2>
          <div className="h-1 flex-1 bg-black" />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-2 border-black font-black uppercase text-[10px] shadow-neo-sm p-2">
              <Search className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" className="border-2 border-black font-black uppercase text-[10px] shadow-neo-sm p-2">
              <Filter className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {loading && userTopics.length === 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 neo-brutal-card animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {userTopics.map((topic) => (
              <div 
                key={topic.id} 
                className="neo-brutal-card bg-white group hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
                onClick={() => navigate(`/topics/${topic.id}`)}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-64 bg-black border-b-2 md:border-b-0 md:border-r-2 border-black p-8 flex flex-col items-center justify-center gap-4 text-white">
                    <div className="border-4 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] bg-black p-4 rotate-3 transition-transform group-hover:rotate-0">
                      <Terminal className="h-12 w-12 stroke-[2]" />
                    </div>
                    <div className="space-y-1 text-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Entry ID</span>
                      <p className="font-mono text-xl font-bold tracking-tighter">#{topic.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-8 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "px-2 py-0.5 border-2 border-black text-[8px] font-black uppercase shadow-neo-sm",
                            topic.isPublic ? "bg-green-400" : "bg-red-500 text-white"
                          )}>
                            {topic.isPublic ? "Open Frequency" : "Secure Line"}
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(topic.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-400 border-2 border-black px-2 py-0.5 shadow-neo-sm text-[8px] font-black uppercase">
                          <Zap className="h-3 w-3 fill-black" />
                          Priority
                        </div>
                      </div>
                      
                      <h3 className="text-3xl font-black uppercase tracking-tight group-hover:underline decoration-4 underline-offset-4">
                        {topic.title}
                      </h3>
                      <p className="text-lg font-bold text-gray-600 line-clamp-2 italic leading-tight">
                        "{topic.description}"
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 border-t-2 border-black/5 pt-6">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 stroke-[2.5]" />
                        <span className="text-sm font-black">{topic.posts?.length || 0} INTEL_LOGS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 stroke-[2.5]" />
                        <span className="text-sm font-black uppercase tracking-widest">{topic.followers?.length || 0} LISTENERS</span>
                      </div>
                      <div className="ml-auto flex items-center gap-2 text-xs font-black uppercase bg-black text-white px-4 py-2 border-2 border-black shadow-neo-sm group-hover:bg-white group-hover:text-black transition-all">
                        Access Intel <ChevronRight className="h-4 w-4 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {userTopics.length === 0 && (
              <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-32 text-center space-y-6">
                <div className="w-24 h-24 mx-auto border-4 border-dashed border-black/10 flex items-center justify-center -rotate-12">
                  <Terminal className="h-12 w-12 text-black/10" />
                </div>
                <div>
                  <p className="text-3xl font-black uppercase text-gray-400 italic">Radio Silence</p>
                  <p className="font-bold text-gray-400 mt-2">Your operational log is currently empty.</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-black text-white font-black uppercase tracking-widest px-12 py-6 text-lg border-2 border-black shadow-neo">
                  Start Transmission
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
