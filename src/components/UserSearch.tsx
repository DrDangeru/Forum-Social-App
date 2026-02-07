import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { Avatar } from './ui/avatar';
import { UserPlus, UserCheck, Clock, Search, Terminal, Zap, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import type { BasicProfile, UserSearchProps } from '../types/clientTypes';
import { cn } from '../lib/utils';

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
          <div className="px-2 py-1 border-2 border-black bg-green-400 text-[8px] font-black uppercase shadow-neo-sm flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            Active_Contact
          </div>
        );
      case 'sent':
        return (
          <div className="px-2 py-1 border-2 border-black bg-yellow-400 text-[8px] font-black uppercase shadow-neo-sm flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Uplink_Pending
          </div>
        );
      case 'received':
        return (
          <div className="px-2 py-1 border-2 border-black bg-purple-400 text-white text-[8px] font-black uppercase shadow-neo-sm flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Action_Required
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black stroke-[3]" />
        <Input
          type="text"
          placeholder="SEARCH_GRID_BY_CALLSIGN_OR_NODE..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-12 h-14 font-black uppercase tracking-widest text-sm border-4 border-black shadow-neo focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all bg-white"
        />
      </div>
      
      {isLoading && (
        <div className="flex items-center justify-center py-4 gap-2">
          <Terminal className="h-4 w-4 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest italic text-gray-400">Scanning sector...</span>
        </div>
      )}

      <div className="grid gap-4">
        {users.map((user) => {
          const status = getFriendStatus?.(user.userId) || 'none';
          return (
            <div
              key={user.userId}
              className="neo-brutal-card bg-white p-4 group hover:bg-orange-50 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="border-2 border-black shadow-neo-sm bg-white overflow-hidden transition-transform group-hover:-rotate-3 shrink-0">
                  <Avatar className="h-12 w-12 rounded-none">
                    <img
                      src={user.avatarUrl || '/default-avatar.png'}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="object-cover h-full w-full"
                    />
                  </Avatar>
                </div>
                <div className="min-w-0">
                  <h3 className="font-black uppercase tracking-tight text-lg group-hover:underline decoration-2">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-xs font-bold text-gray-500 italic">@{user.username}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {status === 'none' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserSelect(user)}
                    disabled={selectedUserId === user.userId}
                    className="border-2 border-black font-black uppercase text-[10px] shadow-neo-sm hover:bg-black hover:text-white transition-all gap-2"
                  >
                    <UserPlus className="w-4 h-4 stroke-[3]" />
                    {selectedUserId === user.userId ? 'Transmitting...' : 'Establish Uplink'}
                  </Button>
                )}
                {getStatusBadge(user.userId)}
              </div>
            </div>
          );
        })}
        
        {!isLoading && query && users.length === 0 && (
          <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-12 text-center space-y-4">
            <ShieldCheck className="h-12 w-12 mx-auto text-black/10" />
            <p className="font-black uppercase text-gray-400 italic">Zero matches in current sector.</p>
          </div>
        )}
      </div>
    </div>
  );
}
