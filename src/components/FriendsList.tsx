import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useFriends } from '../hooks/useFriends';
import { BasicProfile } from '../types/Profile';
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
  const { friends, isLoading, error, removeFriend } = useFriends();

  if (isLoading) {
    return <div className="text-center py-4">Loading friends...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Friends</CardTitle>
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
  const name = `${friend.firstName} ${friend.lastName}`;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center space-x-3">
        <Avatar>
          {friend.avatarUrl ? (
            <AvatarImage src={friend.avatarUrl} alt={name} />
          ) : (
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          )}
        </Avatar>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">@{friend.userNickname}</p>
        </div>
      </div>
      
      {isOwner && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-100"
        >
          <UserX size={16} className="mr-1" />
          Remove
        </Button>
      )}
    </div>
  );
};

export default FriendsList;
