import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { UserCheck, UserX } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import { getInitials } from '../lib/utils';

const FriendRequests: React.FC = () => {
  const {
    receivedRequests,
    sentRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    isLoading
  } = useFriends();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              Received
              {receivedRequests.length > 0 && (
                <span
                  className="
                    ml-2 rounded-full bg-primary text-primary-foreground 
                    px-2 py-0.5 text-xs
                  "
                >
                  {receivedRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent
              {sentRequests.length > 0 && (
                <span
                  className="
                    ml-2 rounded-full bg-primary text-primary-foreground 
                    px-2 py-0.5 text-xs
                  "
                >
                  {sentRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : receivedRequests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No friend requests received
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        {request.sender_avatar_url ? (
                          <AvatarImage
                            src={request.sender_avatar_url}
                            alt={`${request.sender_first_name} ${request.sender_last_name}`}
                          />
                        ) : (
                          <AvatarFallback>
                            {getInitials(
                              `${request.sender_first_name} ${request.sender_last_name}`
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.sender_first_name} {request.sender_last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{request.sender_username}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => acceptFriendRequest(request.id)}
                        size="sm"
                        variant="outline"
                        className="
                          text-green-600 border-green-600 hover:bg-green-50
                        "
                      >
                        <UserCheck size={16} className="mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => rejectFriendRequest(request.id)}
                        size="sm"
                        variant="outline"
                        className="
                          text-red-600 border-red-600 hover:bg-red-50
                        "
                      >
                        <UserX size={16} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sent">
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No friend requests sent
              </div>
            ) : (
              <div className="space-y-4 mt-2">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        {request.receiver_avatar_url ? (
                          <AvatarImage
                            src={request.receiver_avatar_url}
                            alt={`${request.receiver_first_name} ${request.receiver_last_name}`}
                          />
                        ) : (
                          <AvatarFallback>
                            {getInitials(
                              `${request.receiver_first_name} ${request.receiver_last_name}`
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.receiver_first_name} {request.receiver_last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{request.receiver_username}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Button
                        onClick={() => rejectFriendRequest(request.id)}
                        size="sm"
                        variant="outline"
                      >
                        Cancel Request
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FriendRequests;
