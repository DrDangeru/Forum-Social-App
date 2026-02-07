import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import { User, Topic } from '../types/clientTypes';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Zap, 
  Terminal,
  Calendar,
  ChevronRight,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

const Followed = () => {
  const { user } = useAuth();
  const currentUserId = user?.userId;
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [followedTopics, setFollowedTopics] = useState<Topic[]>([]);
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFollowData = async () => {
    if (!currentUserId) {
      return;
    }

    try {
      const [friendsRes, friendsTopicsRes, userTopicsRes] = await Promise.all([
        // Fetch friends
        fetch(`http://localhost:3001/api/friends/${currentUserId}`, {
          credentials: 'include',
        }),
        // Fetch friends' public topics
        fetch(`http://localhost:3001/api/topics/friends/${currentUserId}`, {
          credentials: 'include',
        }),
        // Fetch user's own topics
        fetch(`http://localhost:3001/api/topics/user/${currentUserId}`, {
          credentials: 'include',
        }),
      ]);

      if (!friendsRes.ok || !friendsTopicsRes.ok || !userTopicsRes.ok) {
        // Log specific errors
        if (!friendsRes.ok) console.error('Failed to fetch friends:', friendsRes.status,
           await friendsRes.text());
        if (!friendsTopicsRes.ok) console.error('Failed to fetch friends topics:',
           friendsTopicsRes.status, await friendsTopicsRes.text());
        if (!userTopicsRes.ok) console.error('Failed to fetch user topics:', 
          userTopicsRes.status, await userTopicsRes.text());
        throw new Error("Failed to fetch data");
      }

      const friendsData = await friendsRes.json();
      const friendsTopicsData = await friendsTopicsRes.json();
      const userTopicsData = await userTopicsRes.json();

      console.log("API Response - Friends:", friendsData); // Log friends
      console.log("API Response - Friends' Topics:", friendsTopicsData); // Log friends' topics
      console.log("API Response - User topics:", userTopicsData);

      setFollowedUsers(friendsData); // Update state with friends data
      setFollowedTopics(friendsTopicsData); // Update state with friends' topics data
      setUserTopics(userTopicsData);
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleUnfollow = async (targetUserId: number) => {
  //   try {
  //     await axios.delete('http://localhost:3001/api/follow', {
  //       data: {
  //         followerId: currentUserId,
  //         followingId: targetUserId
  //       }
  //     });
  //     fetchFollowData(); // Refresh the lists
  //   } catch (error) {
  //     console.error('Error unfollowing user:', error);
  //   }
  // };

  useEffect(() => {
    fetchFollowData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId ]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-orange-50/50">
        <div className="w-16 h-16 border-8 border-black border-t-purple-500 animate-spin shadow-neo" />
        <p className="font-black uppercase tracking-widest text-xl italic">Syncing Frequencies...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl space-y-12 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 flex items-center gap-3">
            <Zap className="h-10 w-10 stroke-[3] fill-yellow-400" />
            Signals
          </h1>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-xs italic">Subscribed intelligence and squad communications</p>
        </div>
        <div className="flex gap-4 relative z-10">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-yellow-400 gap-2 transition-all"
          >
            <ArrowLeft className="h-4 w-4 stroke-[3]" />
            Return HQ
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Feed Content */}
        <div className="lg:col-span-8 space-y-12">
          {/* Friends' Topics Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic whitespace-nowrap">Squad Intel</h2>
              <div className="h-1 flex-1 bg-black" />
              <div className="px-3 py-1 border-2 border-black bg-yellow-400 text-[10px] font-black uppercase shadow-neo-sm">
                {followedTopics.length} ACTIVE_CHANNELS
              </div>
            </div>

            {followedTopics.length === 0 ? (
              <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-20 text-center space-y-6">
                <div className="w-20 h-20 mx-auto border-4 border-dashed border-black/10 flex items-center justify-center rotate-12">
                  <MessageSquare className="h-10 w-10 text-black/10" />
                </div>
                <p className="font-black uppercase text-gray-400 italic">No incoming transmissions from your squad.</p>
                <Button onClick={() => navigate('/search')} className="bg-black text-white font-black uppercase tracking-widest px-8 border-2 border-black shadow-neo">
                  Recruit Operatives
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {followedTopics.map(topic => (
                  <div 
                    key={topic.id}
                    className="neo-brutal-card bg-white group hover:-translate-y-1 transition-all overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/topics/${topic.id}`)}
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-purple-400 border border-black shadow-neo-sm">SQUAD_INTEL</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(topic.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[8px] font-black text-gray-400">
                          ID_{topic.id.toString().padStart(4, '0')}
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-black uppercase tracking-tight italic group-hover:underline decoration-4 underline-offset-4">
                        {topic.title}
                      </h3>
                      <p className="font-bold text-gray-600 line-clamp-2 italic leading-tight">
                        "{topic.description || 'No briefing available.'}"
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t-2 border-black/5">
                        <div className="flex items-center gap-2">
                          <div className="border border-black overflow-hidden h-6 w-6">
                            <Avatar className="rounded-none h-full w-full">
                              <AvatarFallback className="rounded-none bg-orange-400 text-[8px] font-black">?</AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-[10px] font-black uppercase">OPERATIVE_COMMAND</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-black uppercase group-hover:gap-2 transition-all">
                          Access Intel <ChevronRight className="h-4 w-4 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User's Own Topics Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic whitespace-nowrap">Your Archives</h2>
              <div className="h-1 flex-1 bg-black" />
              <div className="px-3 py-1 border-2 border-black bg-green-400 text-[10px] font-black uppercase shadow-neo-sm">
                {userTopics.length} RECORDS
              </div>
            </div>

            {userTopics.length === 0 ? (
              <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-20 text-center space-y-6">
                <Terminal className="h-12 w-12 mx-auto text-black/10" />
                <p className="font-black uppercase text-gray-400 italic text-sm">You haven't initialized any protocols.</p>
                <Button onClick={() => navigate('/topics/new')} className="bg-black text-white font-black uppercase tracking-widest px-8 border-2 border-black shadow-neo">
                  New Protocol
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {userTopics.map(topic => (
                  <div
                    key={topic.id}
                    className="neo-brutal-card bg-white p-6 group hover:-rotate-1 transition-all cursor-pointer border-l-8 border-l-black"
                    onClick={() => navigate(`/topics/${topic.id}`)}
                  >
                    <div className="space-y-3">
                      <div className="text-[8px] font-black uppercase tracking-widest text-gray-400 italic">PERSONAL_ARCHIVE // {topic.id}</div>
                      <h3 className="text-xl font-black uppercase tracking-tight leading-none group-hover:underline decoration-2">{topic.title}</h3>
                      <p className="text-xs font-bold text-gray-500 line-clamp-2 leading-tight">
                        {topic.description || 'No data recorded.'}
                      </p>
                      <div className="pt-2 flex items-center justify-between text-[8px] font-black uppercase">
                        <span className="text-green-600">STABLE_SIGNAL</span>
                        <span className="text-gray-400">{new Date(topic.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Squad Contacts */}
        <div className="lg:col-span-4 space-y-8">
          <div className="sticky top-24 space-y-8">
            <div className="neo-brutal-card bg-white overflow-hidden flex flex-col">
              <div className="bg-black text-white p-4 border-b-4 border-black flex items-center justify-between">
                <h2 className="font-black uppercase italic tracking-widest text-sm border-b-2 border-black/10 pb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 stroke-[3]" />
                  Squad Grid
                </h2>
                <span className="text-[10px] font-black bg-white text-black px-2 py-0.5 uppercase">{followedUsers.length} UNITS</span>
              </div>
              
              <div className="p-4 space-y-3 bg-white max-h-[600px] overflow-y-auto custom-scrollbar">
                {followedUsers.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-black/5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">No active squad detected.</p>
                  </div>
                ) : (
                  followedUsers.map(followedUser => (
                    <div
                      key={followedUser.userId}
                      className="neo-brutal-card p-3 flex items-center gap-4 group hover:bg-orange-50 transition-all cursor-pointer"
                      onClick={() => navigate(`/profile/${followedUser.userId}`)}
                    >
                      <div className="border-2 border-black overflow-hidden shadow-neo-sm h-10 w-10 shrink-0 group-hover:-rotate-6 transition-transform">
                        <Avatar className="rounded-none h-full w-full">
                          <AvatarImage src={followedUser.avatarUrl || undefined} className="rounded-none" />
                          <AvatarFallback className="rounded-none bg-yellow-400 font-black text-xs">
                            {followedUser.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="min-w-0">
                        <p className="font-black uppercase tracking-tight text-xs truncate group-hover:underline decoration-2">@{followedUser.username}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase truncate">{followedUser.email}</p>
                      </div>
                      <div className="ml-auto">
                        <div className="w-2 h-2 rounded-none border border-black bg-green-500 shadow-neo-sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 bg-gray-50 border-t-2 border-black flex flex-col gap-3">
                <Button onClick={() => navigate('/friends')} className="w-full bg-black text-white font-black uppercase text-[10px] border-2 border-black shadow-neo-sm py-2">
                  Network Management
                </Button>
                <div className="flex items-center justify-between text-[8px] font-black uppercase text-gray-400 tracking-widest italic">
                  <span>Encryption Active</span>
                  <ShieldCheck className="h-3 w-3" />
                </div>
              </div>
            </div>

            <div className="neo-glass-card p-6 border-4 border-black bg-white/80 space-y-4">
              <h3 className="font-black uppercase italic tracking-tighter text-lg border-b-2 border-black/10 pb-2 flex items-center gap-2">
                <Terminal className="h-5 w-5" /> Transmission Metrics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Incoming Logs</span>
                  <span className="font-black text-purple-600">+14</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Active Links</span>
                  <span className="font-black">{followedUsers.length} Units</span>
                </div>
                <div className="pt-2">
                  <div className="w-full h-3 border-2 border-black bg-white overflow-hidden shadow-neo-sm">
                    <div className="h-full bg-purple-400 w-[65%] border-r-2 border-black" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-gray-400 mt-1 block">Network Saturation: 65%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Followed;
