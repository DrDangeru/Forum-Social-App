import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Group, GroupMember } from '../types/clientTypes';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import axios from 'axios';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Users, Lock, Globe, ArrowLeft, UserPlus, Crown, Shield, Zap, Terminal, Search, ShieldAlert } from 'lucide-react';

export default function GroupView() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchGroup = useCallback(async () => {
    if (!groupId || !user) return;
    
    try {
      setLoading(true);
      const [groupRes, membersRes] = await Promise.all([
        axios.get(`/api/groups/${groupId}?userId=${user.userId}`),
        axios.get(`/api/groups/${groupId}/members`)
      ]);
      
      setGroup(groupRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Failed to fetch group:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleJoinGroup = async () => {
    try {
      if (!user || !groupId) return;
      
      await axios.post(`/api/groups/${groupId}/join`, {
        userId: user.userId
      });
      
      fetchGroup();
    } catch (error: any) {
      console.error('Failed to join group:', error);
      alert(error.response?.data?.error || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      if (!user || !groupId) return;
      
      await axios.delete(`/api/groups/${groupId}/leave`, {
        data: { userId: user.userId }
      });
      
      navigate('/groups');
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      alert(error.response?.data?.error || 'Failed to leave group');
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await axios.get(`/api/users/search?q=${query}`);
      // Filter out existing members
      const memberIds = members.map(m => m.userId);
      setSearchResults(response.data.filter((u: any) => !memberIds.includes(u.userId)));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleInviteUser = async (inviteeId: string) => {
    try {
      if (!user || !groupId) return;
      
      await axios.post(`/api/groups/${groupId}/invite`, {
        inviterId: user.userId,
        inviteeId
      });
      
      alert('Invitation sent successfully');
      setInviteUsername('');
      setSearchResults([]);
      setShowInviteForm(false);
    } catch (error: any) {
      console.error('Failed to invite user:', error);
      alert(error.response?.data?.error || 'Failed to send invitation');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const canInvite = group?.isMember && 
    (group?.userRole === 'owner' || group?.userRole === 'admin');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-orange-50/50">
        <div className="w-16 h-16 border-8 border-black border-t-purple-500 animate-spin shadow-neo" />
        <p className="font-black uppercase tracking-widest text-xl italic">Decrypting Coalition Data...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-orange-50/50">
        <div className="neo-brutal-card bg-red-100 p-12 text-center border-red-600 max-w-lg">
          <ShieldAlert className="h-16 w-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-3xl font-black uppercase text-red-600 mb-4 tracking-tighter italic">Coalition Not Found</h2>
          <p className="font-bold text-red-800 mb-8">The requested sector is either non-existent or heavily encrypted.</p>
          <Button onClick={() => navigate('/groups')} className="bg-black text-white font-black uppercase tracking-widest px-8 border-2 border-black shadow-neo">
            Back to Command
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-10 pb-24">
      <Button 
        variant="outline" 
        onClick={() => navigate('/groups')}
        className="border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-yellow-400 gap-2 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      >
        <ArrowLeft className="h-4 w-4 stroke-[3]" />
        Sector Overview
      </Button>

      <div className="neo-brutal-card bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-400 border-b-4 border-l-4 border-black -mr-24 -mt-24 rotate-45" />
        
        <div className="p-8 relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 border-2 border-black bg-yellow-400 text-[10px] font-black uppercase shadow-neo-sm tracking-widest">
                  Coalition ID: {group.id}
                </div>
                <div className="flex items-center gap-2 px-2 py-1 border-2 border-black bg-black text-white text-[8px] font-black uppercase tracking-widest">
                  {group.accessType === 'invitation' ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  {group.accessType === 'invitation' ? 'Secure Line' : 'Open Frequency'}
                </div>
              </div>
              
              <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
                {group.name}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {group.isMember ? (
                <>
                  <div className="px-4 py-2 border-2 border-black bg-blue-100 font-black uppercase tracking-widest text-xs shadow-neo-sm">
                    Active Operative: {group.userRole?.toUpperCase()}
                  </div>
                  {group.userRole !== 'owner' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleLeaveGroup}
                      className="border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-red-500 hover:text-white transition-all"
                    >
                      Withdraw
                    </Button>
                  )}
                </>
              ) : (
                group.accessType === 'open' && (
                  <Button 
                    className="bg-green-500 hover:bg-green-400 text-black border-2 border-black shadow-neo font-black uppercase tracking-widest px-8"
                    onClick={handleJoinGroup}
                  >
                    Initialize Join Protocol
                  </Button>
                )
              )}
            </div>
          </div>

          <div className="bg-orange-50 border-4 border-black p-6 shadow-neo-sm relative">
            <div className="absolute -top-3 -left-3 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase italic">Mission Directive</div>
            <p className="text-xl font-bold leading-tight text-gray-800">{group.description}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-8 text-sm text-gray-500 pt-4 border-t-4 border-black/5">
            <div className="flex items-center gap-3">
              <div className="border-2 border-black shadow-neo-sm bg-white p-1">
                <Avatar className="h-10 w-10 rounded-none">
                  <AvatarImage src={group.creatorAvatarUrl || undefined} className="rounded-none" />
                  <AvatarFallback className="rounded-none bg-orange-400 font-black">
                    {group.creatorUsername?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 block">Founder</span>
                <Link to={`/profile/${group.createdBy}`} className="font-black uppercase tracking-tight text-black hover:underline decoration-2">
                  @{group.creatorUsername}
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-black stroke-[3]" />
              <span className="font-black uppercase tracking-tight text-black">{group.memberCount || members.length} Units Recruited</span>
            </div>

            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-black stroke-[3]" />
              <span className="font-black uppercase tracking-tight text-black italic">Est. {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-baseline gap-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
              <Users className="h-8 w-8 stroke-[3]" />
              Operatives
            </h2>
            <div className="h-1 flex-1 bg-black" />
            <div className="px-3 py-1 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-neo-sm">
              {members.length} LOGGED
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {members.map((member) => (
              <div 
                key={member.id}
                className="neo-brutal-card bg-white p-4 group hover:bg-yellow-50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="border-2 border-black shadow-neo-sm bg-white overflow-hidden transition-transform group-hover:-rotate-3">
                    <Avatar className="h-12 w-12 rounded-none">
                      <AvatarImage src={member.avatarUrl || undefined} className="rounded-none" />
                      <AvatarFallback className="rounded-none bg-orange-400 font-black">
                        {member.username?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${member.userId}`} className="font-black uppercase tracking-tight text-sm hover:underline decoration-2">
                        {member.username}
                      </Link>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase italic truncate">
                      {member.firstName} {member.lastName}
                    </p>
                  </div>
                </div>
                <div className="text-[8px] font-black uppercase text-gray-400 text-right">
                  Joined<br/>{new Date(member.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="flex items-baseline gap-4">
            <h2 className="text-xl font-black uppercase tracking-tighter italic whitespace-nowrap">Resources</h2>
            <div className="h-1 flex-1 bg-black" />
          </div>

          <div className="space-y-6">
            {canInvite && (
              <div className="neo-brutal-card bg-white overflow-hidden">
                <div className="bg-yellow-400 p-3 border-b-2 border-black flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest">Recruitment Protocol</h3>
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="p-4 space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={inviteUsername}
                      onChange={(e) => {
                        setInviteUsername(e.target.value);
                        searchUsers(e.target.value);
                      }}
                      placeholder="SCAN_BY_CALLSIGN..."
                      className="pl-10 font-black uppercase text-xs border-2 border-black shadow-none focus:shadow-neo-sm"
                    />
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="border-2 border-black bg-gray-50 divide-y-2 divide-black/5 max-h-60 overflow-y-auto shadow-neo-sm">
                      {searchResults.map((searchUser) => (
                        <div 
                          key={searchUser.userId}
                          className="flex items-center justify-between p-3 hover:bg-white transition-colors cursor-pointer group"
                          onClick={() => handleInviteUser(searchUser.userId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="border border-black overflow-hidden h-8 w-8">
                              <Avatar className="rounded-none h-full w-full">
                                <AvatarImage src={searchUser.avatarUrl || undefined} />
                                <AvatarFallback className="rounded-none bg-orange-400 text-[10px] font-black">
                                  {searchUser.username?.[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <span className="text-xs font-black uppercase group-hover:underline">@{searchUser.username}</span>
                          </div>
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[8px] border-black font-black uppercase shadow-none group-hover:shadow-neo-sm">
                            Invite
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="neo-glass-card p-6 space-y-4">
              <h3 className="font-black uppercase italic tracking-tighter text-lg border-b-2 border-black/10 pb-2">Coalition Intelligence</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Active Threads</span>
                  <span className="font-black">14</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Total Intelligence</span>
                  <span className="font-black">156 Logs</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Zap className="h-3 w-3 fill-green-600" /> Activity Level
                  </span>
                  <span className="font-black uppercase text-[10px]">Optimal</span>
                </div>
              </div>
              <div className="w-full h-4 border-2 border-black bg-white overflow-hidden mt-4">
                <div className="h-full bg-green-500 w-[92%] border-r-2 border-black" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
