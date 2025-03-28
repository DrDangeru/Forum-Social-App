import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useFriends } from '../hooks/useFriends';
import { BasicProfile } from '../types';
import { getInitials } from '../lib/utils';
import { UserX } from 'lucide-react';

interface FriendsListProps {
  profileId?: string; // Optional: to show friends of another user
  isOwner?: boolean; // If true, show remove friend button
}

const FriendsList: React.FC<FriendsListProps> = ({ 
  profileId,
  isOwner = false
}) => {
  const { friends, isLoading, error, removeFriend, refreshFriends } = useFriends();

  // If profileId is provided, fetch friends for that specific profile
  useEffect(() => {
    if (profileId) {
      // This would ideally call a specific function to get another user's friends
      // For now, we'll just refresh the current user's friends
      refreshFriends();
    }
  }, [profileId, refreshFriends]);

  if (isLoading) {
    return <div className="text-center py-4">Loading friends...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {profileId ? "User's Friends" : "Friends"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {friends.length === 0 ? (
          <p className="text-muted-foreground text-center">No friends yet</p>
        ) : (
          <div className="space-y-4">
            {friends.map((friend) => (
              <FriendItem
                key={friend.userId}
                friend={friend}
                isOwner={isOwner}
                onRemove={() => removeFriend(friend.userId)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface FriendItemProps {
  friend: BasicProfile;
  isOwner: boolean;
  onRemove: () => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, isOwner, onRemove }) => {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center space-x-3">
        <Avatar>
          {friend.avatarUrl ? (
            <AvatarImage src={friend.avatarUrl} alt={`${friend.firstName} ${friend.lastName}`} />
          ) : (
            <AvatarFallback>{getInitials(`${friend.firstName} ${friend.lastName}`)}
            </AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-medium">{friend.firstName} {friend.lastName}</p>
          <p className="text-sm text-muted-foreground">@{friend.username}</p>
        </div>
      </div>
      
      {isOwner && (
        <Button 
          onClick={onRemove}
          variant="outline" 
          size="sm"
          className="text-red-500 hover:text-red-700 border-red-300 hover:bg-red-50"
        >
          <UserX size={16} className="mr-1" />
          Remove
        </Button>
      )}
    </div>
  );
};

export default FriendsList;
