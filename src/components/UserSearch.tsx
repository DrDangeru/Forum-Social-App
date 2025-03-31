import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { UserPlus, UserCheck, Clock } from 'lucide-react';
import { Button } from './ui/button';
import type { BasicProfile } from '../types';

interface UserSearchProps {
  // eslint-disable-next-line no-unused-vars 
  onUserSelect?: (user: BasicProfile) => void;
  // eslint-disable-next-line no-unused-vars
  getFriendStatus?: (targetUserId: string) => 'none' | 'friends' | 'received' | 'sent';
  className?: string;
}

export function UserSearch({ onUserSelect, getFriendStatus, className }: UserSearchProps) {
  const [query, setQuery] = useState<string>('');
  const [users, setUsers] = useState<BasicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      searchUsers(query);
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  const handleUserSelect = async (user: BasicProfile) => {
    if (selectedUserId === user.userId) return; // Prevent double clicks
    setSelectedUserId(user.userId);
    try {
      await onUserSelect?.(user);
      // Keep the loading state for a moment to show feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setSelectedUserId(null);
    }
  };

  const getStatusBadge = (targetUserId: string) => {
    if (!getFriendStatus) return null;
    
    const status = getFriendStatus(targetUserId);
    switch (status) {
      case 'friends':
        return (
          <Badge variant="success" className="ml-2">
            <UserCheck className="w-3 h-3 mr-1" />
            Friends
          </Badge>
        );
      case 'sent':
        return (
          <Badge variant="secondary" className="ml-2">
            <Clock className="w-3 h-3 mr-1" />
            Request Sent
          </Badge>
        );
      case 'received':
        return (
          <Badge variant="warning" className="ml-2">
            Pending Request
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <Input
        type="text"
        placeholder="Search by name or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4"
      />
      
      {isLoading && (
        <div className="text-center text-gray-500">Loading...</div>
      )}

      <div className="space-y-2">
        {users.map((user) => {
          const status = getFriendStatus?.(user.userId) || 'none';
          return (
            <Card
              key={user.userId}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <img
                    src={user.avatarUrl || '/default-avatar.png'}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="object-cover"
                  />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
                {status === 'none' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserSelect(user)}
                    disabled={selectedUserId === user.userId}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    {selectedUserId === user.userId ? 'Sending...' : 'Add Friend'}
                  </Button>
                )}
                {getStatusBadge(user.userId)}
              </div>
            </Card>
          );
        })}
        
        {!isLoading && query && users.length === 0 && (
          <div className="text-center text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
