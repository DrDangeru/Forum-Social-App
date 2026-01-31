import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { UserCheck, UserX, UserPlus, Clock } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import { getInitials } from '../lib/utils';
import { useState, useEffect } from 'react';
import { FriendRequest } from '../types/clientTypes';

// SendFriendRequest component for profile pages
export const SendFriendRequest: React.FC<{
  userId: string;
  className?: string;
}> = ({ userId, className = '' }) => {
  const { 
    sendFriendRequest, 
    getFriendRequestStatus, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    removeFriend,
    receivedRequests 
  } = useFriends();
  const [friendRequestStatus, setFriendRequestStatus] = 
    useState<'none' | 'friends' | 'received' | 'sent'>('none');
  const [isRequestLoading, setIsRequestLoading] = useState(false);

  // Update friend request status when userId changes
  useEffect(() => {
    if (userId) {
      const status = getFriendRequestStatus(userId);
      setFriendRequestStatus(status);
    }
  }, [userId, getFriendRequestStatus, receivedRequests]);

  // Handle sending friend request
  const handleFriendRequest = async () => {
    if (!userId) return;

    setIsRequestLoading(true);
    try {
      await sendFriendRequest(userId);
      setFriendRequestStatus('sent');
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setIsRequestLoading(false);
    }
  };

  // Handle accepting friend request
  const handleAcceptRequest = async () => {
    if (!userId) return;

    setIsRequestLoading(true);
    try {
      // Find the request ID from the received requests
      const request = receivedRequests.find(req => req.senderId === userId);
      if (request && request.id) {
        await acceptFriendRequest(request.id.toString());
        setFriendRequestStatus('friends');
      }
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    } finally {
      setIsRequestLoading(false);
    }
  };

  // Handle rejecting friend request
  const handleRejectRequest = async () => {
    if (!userId) return;

    setIsRequestLoading(true);
    try {
      // Find the request ID from the received requests
      const request = receivedRequests.find(req => req.senderId === userId);
      if (request && request.id) {
        await rejectFriendRequest(request.id.toString());
        setFriendRequestStatus('none');
      }
    } catch (error) {
      console.error('Failed to reject friend request:', error);
    } finally {
      setIsRequestLoading(false);
    }
  };

  // Handle removing friend
  const handleRemoveFriend = async () => {
    if (!userId) return;

    setIsRequestLoading(true);
    try {
      await removeFriend(userId);
      setFriendRequestStatus('none');
    } catch (error) {
      console.error('Failed to remove friend:', error);
    } finally {
      setIsRequestLoading(false);
    }
  };

  return (
    <div className={className}>
      {friendRequestStatus === 'none' && (
        <Button 
          onClick={handleFriendRequest}
          disabled={isRequestLoading}
          className="flex items-center"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      )}
      
      {friendRequestStatus === 'sent' && (
        <Button 
          variant="outline" 
          disabled
          className="flex items-center"
        >
          <Clock className="h-4 w-4 mr-2" />
          Request Sent
        </Button>
      )}
      
      {friendRequestStatus === 'received' && (
        <div className="flex space-x-2">
          <Button 
            onClick={handleAcceptRequest}
            disabled={isRequestLoading} 
            className="flex items-center"
            variant="default"
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Accept
          </Button>
          <Button 
            onClick={handleRejectRequest}
            disabled={isRequestLoading}
            className="flex items-center"
            variant="outline"
          >
            <UserX className="h-4 w-4 mr-2" />
            Decline
          </Button>
        </div>
      )}
      
      {friendRequestStatus === 'friends' && (
        <Button 
          onClick={handleRemoveFriend}
          disabled={isRequestLoading}
          className="flex items-center"
          variant="outline"
        >
          <UserCheck className="h-4 w-4 mr-2" />
          Friends
        </Button>
      )}
    </div>
  );
};

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
                {receivedRequests.map((request: FriendRequest) => (
                  <div
                    key={request.senderId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        {request.senderAvatarUrl ? (
                          <AvatarImage
                            src={request.senderAvatarUrl || ''}
                            alt={`${request.senderFirstName || ''} 
                            ${request.senderLastName || ''}`}
                          />
                        ) : (
                          <AvatarFallback>
                            {getInitials(
                              `${request.senderFirstName || ''} ${request.senderLastName || ''}`
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.senderFirstName} {request.senderLastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{request.senderUsername}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => request.id && acceptFriendRequest(request.id.toString())}
                        size="sm"
                        variant="outline"
                        className="
                          border-green-500 text-green-500 hover:bg-green-500 hover:text-white
                        "
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => request.id && rejectFriendRequest(request.id.toString())}
                        size="sm"
                        variant="outline"
                        className="
                          border-red-500 text-red-500 hover:bg-red-500 hover:text-white
                        "
                      >
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
                {sentRequests.map((request: FriendRequest) => (
                  <div
                    key={request.receiverId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        {request.receiverAvatarUrl ? (
                          <AvatarImage
                            src={request.receiverAvatarUrl || ''}
                            alt={`${request.receiverFirstName || ''} 
                            ${request.receiverLastName || ''}`}
                          />
                        ) : (
                          <AvatarFallback>
                            {getInitials(
                              `${request.receiverFirstName || ''}
                               ${request.receiverLastName || ''}`
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {request.receiverFirstName} {request.receiverLastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{request.receiverUsername}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Button
                        onClick={() => 
                          request.receiverId && rejectFriendRequest(request.receiverId.toString())
                        }
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
