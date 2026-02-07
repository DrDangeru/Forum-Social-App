import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea.tsx';
import { useAuth } from '../hooks/useAuth';
import type { GroupAccessType } from '../types/clientTypes';
import { Globe, Lock, ArrowLeft, Shield, Zap, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NewGroup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState<GroupAccessType>('open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !!user && groupName.trim().length > 0 && description.trim().length > 0;
  }, [description, groupName, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be logged in to create a group.');
      return;
    }

    if (! groupName.trim() || !description.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await axios.post('/api/groups', {
        name: groupName.trim(),
        description: description.trim(),
        accessType,
        createdBy: user.userId
      });

      const createdGroupId = response.data?.id;
      if (createdGroupId) {
        navigate(`/groups/${createdGroupId}`);
        return;
      }

      navigate('/groups');
    } catch (error: any) {
      console.error('Failed to create group:', error);
      setErrorMessage(error?.response?.data?.error || 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8 pb-24">
      <Button 
        variant="outline" 
        onClick={() => navigate('/groups')}
        className="border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-yellow-400 gap-2 transition-all"
      >
        <ArrowLeft className="h-4 w-4 stroke-[3]" />
        Abort Protocol
      </Button>

      <div className="neo-brutal-card bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        
        <div className="bg-yellow-400 p-6 border-b-4 border-black flex items-center justify-between relative z-10 text-black">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Establish_Unit</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Coalition Formation Protocol</p>
          </div>
          <Shield className="h-10 w-10 stroke-[2.5]" />
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="groupName" className="font-black uppercase tracking-widest text-xs">Coalition Designation *</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="UNIT_SIGMA_NINER"
                required
                className="text-lg font-bold h-14"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupDescription" className="font-black uppercase tracking-widest text-xs">Mission Directive *</Label>
              <Textarea
                id="groupDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="OUTLINE TACTICAL OBJECTIVES AND SECTOR GOALS..."
                className="min-h-[120px] font-bold p-4"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={cn(
                "flex items-center gap-4 p-4 border-2 border-black cursor-pointer transition-all shadow-neo-sm",
                accessType === 'open' ? "bg-green-100 translate-x-[2px] translate-y-[2px] shadow-none" : "bg-white"
              )}>
                <input
                  type="radio"
                  name="accessType"
                  checked={accessType === 'open'}
                  onChange={() => setAccessType('open')}
                  className="hidden"
                />
                <div className={cn(
                  "w-6 h-6 border-2 border-black flex items-center justify-center shrink-0",
                  accessType === 'open' ? "bg-black" : "bg-white"
                )}>
                  {accessType === 'open' && <div className="w-2 h-2 bg-white rotate-45" />}
                </div>
                <div>
                  <div className="font-black uppercase text-xs flex items-center gap-2">
                    <Globe className="h-3 w-3" /> Open Frequency
                  </div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase italic">Public recruitment enabled</p>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-4 p-4 border-2 border-black cursor-pointer transition-all shadow-neo-sm",
                accessType === 'invitation' ? "bg-purple-100 translate-x-[2px] translate-y-[2px] shadow-none" : "bg-white"
              )}>
                <input
                  type="radio"
                  name="accessType"
                  checked={accessType === 'invitation'}
                  onChange={() => setAccessType('invitation')}
                  className="hidden"
                />
                <div className={cn(
                  "w-6 h-6 border-2 border-black flex items-center justify-center shrink-0",
                  accessType === 'invitation' ? "bg-black" : "bg-white"
                )}>
                  {accessType === 'invitation' && <div className="w-2 h-2 bg-white rotate-45" />}
                </div>
                <div>
                  <div className="font-black uppercase text-xs flex items-center gap-2">
                    <Lock className="h-3 w-3" /> Secure Line
                  </div>
                  <p className="text-[8px] font-bold text-gray-500 uppercase italic">Vetted personnel only</p>
                </div>
              </label>
            </div>

            {errorMessage && (
              <div className="p-4 border-2 border-black bg-red-100 text-red-600 font-black uppercase text-xs shadow-neo-sm flex items-center gap-3">
                <Zap className="h-4 w-4 fill-red-600" />
                DEPLOYMENT_FAILED: {errorMessage}
              </div>
            )}

            <div className="pt-4 border-t-4 border-black/5 flex justify-end">
              <Button 
                type="submit" 
                disabled={!canSubmit || isSubmitting}
                size="lg"
                className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo font-black uppercase tracking-widest px-12 py-8 text-xl"
              >
                {isSubmitting ? 'Establishing...' : 'Deploy Unit →'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
