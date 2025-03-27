import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useFriends } from "../hooks/useFriends";
import { getInitials } from "../lib/utils";
import { UserCheck, UserX, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { UserSearch } from './UserSearch';
import type { BasicProfile } from '../types';

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

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (friendsError) return <div className="p-4 text-red-500">Error: {friendsError}</div>;

  const handleUserSelect = async (user: BasicProfile) => {
    const status = getFriendRequestStatus(user.userId);
    console.log('[Frontend] Friend status check:',
       { userId: user.userId, status });
    if (status === 'none') {
      console.log('[Frontend] Initiating friend request for:', user);
      await sendFriendRequest(user.userId);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
              <TabsTrigger value="received">
                Received ({receivedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="sent">Sent ({sentRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-4">
              <div className="space-y-4">
                <UserSearch 
                  onUserSelect={handleUserSelect}
                  getFriendStatus={(userId: string) => getFriendRequestStatus(userId)}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="friends">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend) => (
                  <Card key={friend.userId}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={friend.avatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(`${friend.firstName} ${friend.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/profile/${friend.userId}`} 
                            className="text-sm font-medium text-gray-900 hover:underline"
                          >
                            {friend.firstName} {friend.lastName}
                          </Link>
                          <p className="text-sm text-gray-500 truncate">
                            @{friend.username}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeFriend(friend.userId)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="received">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {receivedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={request.senderAvatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(
                              `${request.senderFirstName} ${request.senderLastName}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/profile/${request.senderId}`} 
                            className="text-sm font-medium text-gray-900 hover:underline"
                          >
                            {request.senderFirstName} {request.senderLastName}
                          </Link>
                          <p className="text-sm text-gray-500 truncate">
                            @{request.senderUsername}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => acceptFriendRequest(request.id as any)}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => rejectFriendRequest(request.id as any)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sent">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sentRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={request.receiverAvatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(
                              `${request.receiverFirstName} ${request.receiverLastName}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/profile/${request.receiverId}`} 
                            className="text-sm font-medium text-gray-900 hover:underline"
                          >
                            {request.receiverFirstName} {request.receiverLastName}
                          </Link>
                          <p className="text-sm text-gray-500 truncate">
                            @{request.receiverUsername}
                          </p>
                          <Badge variant="secondary" className="mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
