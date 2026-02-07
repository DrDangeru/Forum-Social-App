import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useFriends } from "../hooks/useFriends";
import { getInitials } from "../lib/utils";
import { UserCheck, UserX, Clock, Search, Users as UsersIcon, UserPlus, ShieldAlert } from "lucide-react";
import { UserSearch } from './UserSearch';
import type { BasicProfile } from '../types/clientTypes';

export default function Friends() {
  const { 
    friends, 
    receivedRequests, 
    sentRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriendRequestStatus,
    sendFriendRequest,
    isLoading,
    error: friendsError 
  } = useFriends();

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="w-12 h-12 border-4 border-black border-t-yellow-400 animate-spin" />
      <p className="font-black uppercase tracking-widest">Accessing Databases...</p>
    </div>
  );

  if (friendsError) return (
    <div className="container mx-auto p-8">
      <div className="neo-brutal-card bg-red-100 p-8 text-center border-red-600">
        <ShieldAlert className="h-16 w-16 mx-auto text-red-600 mb-4" />
        <h2 className="text-2xl font-black uppercase text-red-600 mb-2">System Breach</h2>
        <p className="font-bold text-red-800">{friendsError}</p>
      </div>
    </div>
  );

  const handleUserSelect = async (user: BasicProfile) => {
    const status = getFriendRequestStatus(user.userId);
    if (status === 'none') {
      await sendFriendRequest(user.userId);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-8">
      <div className="bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 relative z-10">Network</h1>
        <p className="font-bold text-gray-600 uppercase tracking-widest text-xs relative z-10">Manage your operatives and connections</p>
      </div>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Recruit</span>
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            <span className="hidden md:inline">Squad</span> ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden md:inline">Incoming</span> ({receivedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden md:inline">Pending</span> ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="mt-0">
          <div className="neo-brutal-card bg-white p-8">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-6 flex items-center gap-2">
              <Search className="h-6 w-6 stroke-[3]" />
              Search the Grid
            </h2>
            <UserSearch 
              onUserSelect={handleUserSelect}
              getFriendStatus={(userId: string) => getFriendRequestStatus(userId)}
              className="w-full"
            />
          </div>
        </TabsContent>

        <TabsContent value="friends" className="mt-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {friends.length === 0 ? (
              <div className="col-span-full py-20 neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 flex flex-col items-center justify-center">
                <UsersIcon className="h-16 w-16 text-gray-300 mb-4 stroke-[1.5]" />
                <p className="font-black uppercase text-gray-400 italic">No connections detected.</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.userId} className="neo-brutal-card bg-white p-4 group hover:bg-yellow-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="border-2 border-black shadow-neo-sm bg-white overflow-hidden transition-transform group-hover:-rotate-2">
                      <Avatar className="h-14 w-14 rounded-none">
                        <AvatarImage src={friend.avatarUrl || undefined} className="rounded-none" />
                        <AvatarFallback className="rounded-none bg-orange-400 font-black">
                          {getInitials(`${friend.firstName} ${friend.lastName}`)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/profile/${friend.userId}`} 
                        className="text-lg font-black uppercase tracking-tight hover:underline decoration-2"
                      >
                        {friend.firstName} {friend.lastName}
                      </Link>
                      <p className="text-xs font-bold text-gray-500 italic">
                        @{friend.username}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeFriend(friend.userId)}
                      className="rounded-none border-2 border-black shadow-neo-sm p-2 hover:bg-red-600"
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="received" className="mt-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {receivedRequests.length === 0 ? (
              <div className="col-span-full py-20 neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 flex flex-col items-center justify-center">
                <UserPlus className="h-16 w-16 text-gray-300 mb-4 stroke-[1.5]" />
                <p className="font-black uppercase text-gray-400 italic">No incoming requests.</p>
              </div>
            ) : (
              receivedRequests.map((request) => (
                <div key={request.id} className="neo-brutal-card bg-white p-4">
                  <div className="flex items-center gap-4">
                    <div className="border-2 border-black shadow-neo-sm bg-white overflow-hidden">
                      <Avatar className="h-14 w-14 rounded-none">
                        <AvatarImage src={request.senderAvatarUrl || undefined} className="rounded-none" />
                        <AvatarFallback className="rounded-none bg-purple-400 font-black text-white">
                          {getInitials(`${request.senderFirstName} ${request.senderLastName}`)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/profile/${request.senderId}`} 
                        className="text-lg font-black uppercase tracking-tight hover:underline decoration-2"
                      >
                        {request.senderFirstName} {request.senderLastName}
                      </Link>
                      <p className="text-xs font-bold text-gray-500 italic">
                        @{request.senderUsername}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id as any)}
                        className="bg-green-500 border-2 border-black shadow-neo-sm hover:bg-green-400"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => rejectFriendRequest(request.id as any)}
                        className="border-2 border-black shadow-neo-sm"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent" className="mt-0">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sentRequests.length === 0 ? (
              <div className="col-span-full py-20 neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 flex flex-col items-center justify-center">
                <Clock className="h-16 w-16 text-gray-300 mb-4 stroke-[1.5]" />
                <p className="font-black uppercase text-gray-400 italic">No active outbound requests.</p>
              </div>
            ) : (
              sentRequests.map((request) => (
                <div key={request.id} className="neo-brutal-card bg-white p-4 opacity-80 grayscale-[0.5] hover:grayscale-0 hover:opacity-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="border-2 border-black shadow-neo-sm bg-white overflow-hidden">
                      <Avatar className="h-14 w-14 rounded-none">
                        <AvatarImage src={request.receiverAvatarUrl || undefined} className="rounded-none" />
                        <AvatarFallback className="rounded-none bg-blue-400 font-black text-white">
                          {getInitials(`${request.receiverFirstName} ${request.receiverLastName}`)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/profile/${request.receiverId}`} 
                        className="text-lg font-black uppercase tracking-tight hover:underline decoration-2"
                      >
                        {request.receiverFirstName} {request.receiverLastName}
                      </Link>
                      <p className="text-xs font-bold text-gray-500 italic mb-2">
                        @{request.receiverUsername}
                      </p>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black bg-yellow-400 text-[10px] font-black uppercase shadow-neo-sm">
                        <Clock className="h-3 w-3 stroke-[3]" />
                        Transmitting...
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
