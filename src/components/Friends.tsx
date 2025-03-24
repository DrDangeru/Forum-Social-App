import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useFriends } from "../hooks/useFriends";
import { getInitials } from "../lib/utils";
import { UserCheck, UserX, Clock } from "lucide-react";
import { Badge } from "./ui/badge";

export default function Friends() {
  const { 
    friends, 
    receivedRequests, 
    sentRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    getFriendRequestStatus,
    isLoading,
    error: friendsError 
  } = useFriends();

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (friendsError) return <div className="p-4 text-red-500">Error: {friendsError}</div>;

  const getStatusBadge = (userId: string) => {
    const status = getFriendRequestStatus(userId);
    switch (status) {
      case 'friends':
        return <Badge variant="success">Friends</Badge>;
      case 'received':
        return <Badge variant="warning">Request Received</Badge>;
      case 'sent':
        return <Badge variant="secondary">Request Sent</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Friends</h1>
      
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            Friends
            {friends.length > 0 && (
              <span 
                className="ml-2 rounded-full bg-primary text-primary-foreground 
                px-2 py-0.5 text-xs"
              >
                {friends.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="received">
            Received
            {receivedRequests.length > 0 && (
              <span 
                className="ml-2 rounded-full bg-primary text-primary-foreground 
                px-2 py-0.5 text-xs"
              >
                {receivedRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent
            {sentRequests.length > 0 && (
              <span 
                className="ml-2 rounded-full bg-primary text-primary-foreground 
                px-2 py-0.5 text-xs"
              >
                {sentRequests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friends.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground">
                No friends yet. Start connecting with others!
              </div>
            ) : (
              friends.map((friend) => (
                <Card key={friend.userId}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarImage src={friend.avatarUrl || ""} alt={friend.username} />
                      <AvatarFallback>
                        {friend.firstName ? getInitials(friend.firstName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <CardTitle className="text-lg">
                        {friend.firstName} {friend.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">@{friend.username}</p>
                      {getStatusBadge(friend.userId)}
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <Link to={`/profile/${friend.userId}`}>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeFriend(friend.userId)}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {receivedRequests.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground">
                No pending friend requests
              </div>
            ) : (
              receivedRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarImage 
                        src={request.senderAvatarUrl || ""} 
                        alt={request.senderUsername || ""}
                      />
                      <AvatarFallback>
                        {request.senderFirstName ? getInitials(request.senderFirstName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <CardTitle className="text-lg">
                        {request.senderFirstName} {request.senderLastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        @{request.senderUsername}
                      </p>
                      <Badge variant="warning" className="mt-1">Pending</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground italic">
                      {request.message || "No message"}
                    </p>
                    <div className="flex justify-between gap-2">
                      <Button 
                        className="flex-1"
                        onClick={() => request.id && acceptFriendRequest(request.id.toString())}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => request.id && rejectFriendRequest(request.id.toString())}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sentRequests.length === 0 ? (
              <div className="col-span-full text-center text-muted-foreground">
                No sent friend requests
              </div>
            ) : (
              sentRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar>
                      <AvatarImage 
                        src={request.receiverAvatarUrl || ""} 
                        alt={request.receiverUsername || ""}
                      />
                      <AvatarFallback>
                        {request.receiverFirstName ? getInitials(request.receiverFirstName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <CardTitle className="text-lg">
                        {request.receiverFirstName} {request.receiverLastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        @{request.receiverUsername}
                      </p>
                      <Badge variant="secondary" className="mt-1">Sent</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground italic">
                      {request.message || "No message"}
                    </p>
                    <div className="flex items-center justify-between">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Button 
                        variant="ghost"
                        size="sm"
                        onClick={() => request.id && rejectFriendRequest(request.id.toString())}
                      >
                        Cancel Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
