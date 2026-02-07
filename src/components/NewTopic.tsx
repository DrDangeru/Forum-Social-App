import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Terminal, Zap, Globe, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NewTopic() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [topicTitle , setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !!user &&  topicTitle.trim().length > 0;
  }, [topicTitle, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be logged in to create a topic.');
      return;
    }

    const trimmedTitle = topicTitle.trim();
    if (!trimmedTitle) {
      setErrorMessage('Topic name is required.');
      return;
    }

    const trimmedDescription = description.trim() || trimmedTitle;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await axios.post('/api/topics', {
        title: trimmedTitle,
        description: trimmedDescription,
        createdBy: user.userId,
        isPublic
      });

      const createdTopicId = response.data?.id;
      if (createdTopicId) {
        navigate(`/topics/${createdTopicId}`);
        return;
      }

      navigate('/topics');
    } catch (error: any) {
      console.error('Failed to create topic:', error);
      setErrorMessage(error?.response?.data?.error || 'Failed to create topic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8 pb-24">
      <Button 
        variant="outline" 
        onClick={() => navigate('/topics')}
        className="border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-yellow-400 gap-2 transition-all"
      >
        <ArrowLeft className="h-4 w-4 stroke-[3]" />
        Abort Protocol
      </Button>

      <div className="neo-brutal-card bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        
        <div className="bg-yellow-400 p-6 border-b-4 border-black flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Initiate_Topic</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Operational Transmission System</p>
          </div>
          <Terminal className="h-10 w-10 stroke-[2.5]" />
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="topicTitle" className="font-black uppercase tracking-widest text-xs">Topic Designation *</Label>
              <Input
                id="topicTitle"
                value={topicTitle}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="SECTOR_ALPHA_REPORT"
                required
                className="text-lg font-bold h-14"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topicDescription" className="font-black uppercase tracking-widest text-xs">Mission Parameters</Label>
              <Input
                id="topicDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="BRIEF DESCRIPTION OF INTEL..."
                className="h-14 font-bold"
              />
            </div>

            <div className="neo-glass-card p-6 flex items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {isPublic ? <Globe className="h-4 w-4 text-green-600" /> : <Lock className="h-4 w-4 text-red-600" />}
                  <span className="font-black uppercase text-sm tracking-tight">{isPublic ? 'Unencrypted Stream' : 'Secure Channel'}</span>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase italic">
                  {isPublic ? 'Visible to all operatives in the grid.' : 'Access restricted to authorized personnel only.'}
                </p>
              </div>
              <Switch 
                id="topicIsPublic" 
                checked={isPublic} 
                onCheckedChange={setIsPublic} 
                className="scale-150 data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 border-2 border-black shadow-neo-sm"
              />
            </div>

            {errorMessage && (
              <div className="p-4 border-2 border-black bg-red-100 text-red-600 font-black uppercase text-xs shadow-neo-sm flex items-center gap-3">
                <Zap className="h-4 w-4 fill-red-600" />
                PROTOCOL_ERROR: {errorMessage}
              </div>
            )}

            <div className="pt-4 border-t-4 border-black/5 flex justify-end">
              <Button 
                type="submit" 
                disabled={!canSubmit || isSubmitting}
                size="lg"
                className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo font-black uppercase tracking-widest px-12 py-8 text-xl"
              >
                {isSubmitting ? 'Transmitting...' : 'Broadcast Intel →'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
