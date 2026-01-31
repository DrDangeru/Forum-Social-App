import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useFriends } from '../hooks/useFriends';
import { BasicProfile } from '../types/clientTypes';
import { getInitials } from '../lib/utils';
import { Search, UserPlus } from 'lucide-react';

const AddFriend: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BasicProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const { sendFriendRequest, getFriendRequestStatus } = useFriends();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search for users');
      }
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error searching for users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Search by name or username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            <Search size={16} className="mr-1" />
            Search
          </Button>
        </div>
        
        {isSearching && (
          <div className="text-center py-4">Searching...</div>
        )}
        
        {searchError && (
          <div className="text-red-500 text-center py-2">{searchError}</div>
        )}
        
        {!isSearching && searchResults.length > 0 && (
          <div className="space-y-4 mt-2">
            {searchResults.map((user) => {
              const status = getFriendRequestStatus(user.userId);
              
              return (
                <div key={user.userId} className="flex items-center justify-between
                 p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} 
                        alt={`${user.firstName} ${user.lastName}`} />
                      ) : (
                        <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                  
                  {status === 'none' && (
                    <Button 
                      onClick={() => sendFriendRequest(user.userId)}
                      size="sm"
                    >
                      <UserPlus size={16} className="mr-1" />
                      Add Friend
                    </Button>
                  )}
                  
                  {status === 'sent' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled
                    >
                      Request Sent
                    </Button>
                  )}
                  
                  {status === 'received' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled
                    >
                      Request Received
                    </Button>
                  )}
                  
                  {status === 'friends' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled
                    >
                      Already Friends
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {!isSearching && searchResults.length === 0 && searchTerm && (
          <div className="text-center py-4">No users found</div>
        )}
      </CardContent>
    </Card>
  );
};

export default AddFriend;
