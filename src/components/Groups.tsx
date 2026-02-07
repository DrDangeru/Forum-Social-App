import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Group, GroupAccessType } from '../types/clientTypes';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea.tsx';
import axios from 'axios';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Users, Lock, Globe, Plus, Search, ChevronRight, Zap, Shield, X, Radio } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState<GroupAccessType>('open');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('my');
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [allGroupsRes, myGroupsRes] = await Promise.all([
        axios.get(`/api/groups?userId=${user.userId}`),
        axios.get(`/api/groups/my/${user.userId}`)
      ]);
      
      setGroups(allGroupsRes.data);
      setMyGroups(myGroupsRes.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async () => {
    try {
      if (!user) {
        alert('You must be logged in to create a group');
        return;
      }
      
      if (!name.trim() || !description.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      setLoading(true);
      
      const response = await axios.post('/api/groups', {
        name,
        description,
        accessType,
        createdBy: user.userId
      });
      
      setMyGroups(prev => [response.data, ...prev]);
      if (accessType === 'open') {
        setGroups(prev => [response.data, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      if (!user) return;
      
      await axios.post(`/api/groups/${groupId}/join`, {
        userId: user.userId
      });
      
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to join group:', error);
      alert(error.response?.data?.error || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      if (!user) return;
      
      await axios.delete(`/api/groups/${groupId}/leave`, {
        data: { userId: user.userId }
      });
      
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      alert(error.response?.data?.error || 'Failed to leave group');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAccessType('open');
  };

  const displayGroups = activeTab === 'my' ? myGroups : groups;

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2">Coalitions</h1>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-xs italic">Form Alliances & Secure Private Sectors</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <div className="flex bg-black border-2 border-black p-1 shadow-neo-sm">
            <button 
              onClick={() => setActiveTab('my')}
              className={cn(
                "px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'my' ? "bg-yellow-400 text-black" : "bg-black text-white hover:bg-gray-900"
              )}
            >
              My Units
            </button>
            <button 
              onClick={() => setActiveTab('discover')}
              className={cn(
                "px-4 py-2 text-xs font-black uppercase tracking-widest transition-all",
                activeTab === 'discover' ? "bg-yellow-400 text-black" : "bg-black text-white hover:bg-gray-900"
              )}
            >
              Recruit
            </button>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className={cn(
              "font-black uppercase tracking-widest border-2 border-black shadow-neo px-6",
              showForm ? "bg-red-500 hover:bg-red-400 text-white" : "bg-green-500 hover:bg-green-400 text-black"
            )}
          >
            {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="neo-brutal-card bg-white overflow-hidden animate-in slide-in-from-top duration-300">
          <div className="bg-yellow-400 p-4 border-b-2 border-black flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-tight italic text-black">Establish New Coalition</h2>
            <Shield className="h-5 w-5 text-black" />
          </div>
          <div className="p-8">
            <div className="grid gap-8">
              <div className="grid gap-2">
                <Label htmlFor="name" className="font-black uppercase tracking-widest text-xs">Coalition Designation *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="UNIT_NAME_ALPHA"
                  className="text-lg font-bold"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description" className="font-black uppercase tracking-widest text-xs">Mission Directive *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="OUTLINE THE OBJECTIVES..."
                  className="min-h-[120px] font-bold p-4"
                />
              </div>
              
              <div className="grid gap-2">
                <Label className="font-black uppercase tracking-widest text-xs">Encryption Protocol</Label>
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <label className={cn(
                    "flex-1 flex items-center gap-4 p-4 border-2 border-black cursor-pointer transition-all shadow-neo-sm",
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
                      "w-6 h-6 border-2 border-black flex items-center justify-center",
                      accessType === 'open' ? "bg-black" : "bg-white"
                    )}>
                      {accessType === 'open' && <div className="w-2 h-2 bg-white rotate-45" />}
                    </div>
                    <div>
                      <div className="font-black uppercase text-xs flex items-center gap-2">
                        <Globe className="h-3 w-3" /> Open Link
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase italic">Unrestricted access for all operatives</p>
                    </div>
                  </label>

                  <label className={cn(
                    "flex-1 flex items-center gap-4 p-4 border-2 border-black cursor-pointer transition-all shadow-neo-sm",
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
                      "w-6 h-6 border-2 border-black flex items-center justify-center",
                      accessType === 'invitation' ? "bg-black" : "bg-white"
                    )}>
                      {accessType === 'invitation' && <div className="w-2 h-2 bg-white rotate-45" />}
                    </div>
                    <div>
                      <div className="font-black uppercase text-xs flex items-center gap-2">
                        <Lock className="h-3 w-3" /> Secure Line
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase italic">Invitation protocols required</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 border-t-2 border-black/5">
                <Button variant="ghost" onClick={() => {
                  resetForm();
                  setShowForm(false);
                }} className="font-black uppercase text-xs">
                  Abort
                </Button>
                <Button 
                  onClick={handleCreateGroup}
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo font-black uppercase px-10 tracking-widest"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Deploy Coalition →'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && displayGroups.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 neo-brutal-card animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {displayGroups.map((group) => (
            <div 
              key={group.id} 
              className="neo-brutal-card bg-white group hover:-translate-y-1 transition-all overflow-hidden cursor-pointer flex flex-col"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <div className="bg-black text-white p-4 border-b-2 border-black flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {group.accessType === 'invitation' ? (
                    <Lock className="h-4 w-4 text-purple-400" />
                  ) : (
                    <Globe className="h-4 w-4 text-green-400" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {group.accessType === 'invitation' ? 'Encrypted' : 'Public Domain'}
                  </span>
                </div>
                {group.isMember && (
                  <div className="px-2 py-0.5 border border-white/20 bg-white/10 text-[8px] font-black uppercase tracking-[0.2em]">
                    Active Operative
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tight italic group-hover:underline decoration-4 decoration-yellow-400 underline-offset-4">
                    {group.name}
                  </h3>
                  <p className="text-sm font-bold text-gray-600 line-clamp-2 italic leading-tight">
                    "{group.description}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t-2 border-black/5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 stroke-[3]" />
                      <span className="text-[10px] font-black uppercase">{group.memberCount || 0} Units</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="border border-black overflow-hidden h-5 w-5">
                        <Avatar className="rounded-none h-full w-full">
                          <AvatarImage src={group.creatorAvatarUrl || undefined} />
                          <AvatarFallback className="rounded-none bg-orange-400 text-[8px] font-black">{group.creatorUsername?.[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">@{group.creatorUsername}</span>
                    </div>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    {group.isMember ? (
                      group.userRole !== 'owner' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleLeaveGroup(group.id)}
                          className="text-[10px] font-black uppercase hover:text-red-600 hover:bg-red-50"
                        >
                          Withdraw
                        </Button>
                      )
                    ) : (
                      group.accessType === 'open' && (
                        <Button 
                          size="sm"
                          onClick={() => handleJoinGroup(group.id)}
                          className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo-sm font-black uppercase text-[10px] px-4"
                        >
                          Join Op
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-2 bg-orange-50/50 border-t-2 border-black/5 flex items-center justify-between">
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Est. {new Date(group.createdAt).getFullYear()}</span>
                <div className="flex items-center gap-1 text-[8px] font-black uppercase group-hover:gap-2 transition-all">
                  Access Sector <ChevronRight className="h-3 w-3 stroke-[3]" />
                </div>
              </div>
            </div>
          ))}
          
          {displayGroups.length === 0 && (
            <div className="col-span-full py-24 neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 text-center space-y-6">
              <div className="w-20 h-20 mx-auto border-4 border-dashed border-black/10 flex items-center justify-center rotate-12">
                <Radio className="h-10 w-10 text-black/10" />
              </div>
              <div>
                <p className="text-2xl font-black uppercase text-gray-400 italic">No Active Coalitions</p>
                <p className="font-bold text-gray-400 mt-2">
                  {activeTab === 'my' 
                    ? "You haven't established or joined any tactical units." 
                    : "No public alliances found in this grid."}
                </p>
              </div>
              <Button onClick={() => setShowForm(true)} className="bg-black text-white font-black uppercase tracking-widest px-10 py-4 border-2 border-black shadow-neo">
                Establish Protocol
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
