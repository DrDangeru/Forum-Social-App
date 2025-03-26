import { useState, useEffect, useCallback } from 'react';
import { FriendRequest, BasicProfile } from '../types';
import { useAuth } from './useAuth';

/**
 * Interface for the return value of the useFriends hook.
 * This interface is divided into three sections:
 * 1. Data: This section contains the state variables for friends, requests, and loading status.
 * 2. Actions: This section contains functions to perform actions related to friends and requests.
 * 3. Status checks: This section contains functions to check the status of friends and requests.
 */
export interface UseFriendsReturn {
  // Data
  friends: BasicProfile[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  /* eslint-disable no-unused-vars */
  // Actions
  sendFriendRequest: (targetUserId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  rejectFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  refreshFriends: () => Promise<void>;
  
  // Status checks
  isFriend: (targetUserId: string) => boolean;
  hasPendingRequestFrom: (targetUserId: string) => boolean;
  hasPendingRequestTo: (targetUserId: string) => boolean;
  getFriendRequestStatus: (targetUserId: string) => 'none' | 'friends' | 'received' | 'sent';
}
/* eslint-enable no-unused-vars */
export function useFriends(): UseFriendsReturn {
  const { user } = useAuth();
  const [friends, setFriends] = useState<BasicProfile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to execute API calls with error handling
  const executeApiCall = useCallback(async <T>(
    apiCallFn: () => Promise<T>
  ): Promise<T | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await apiCallFn();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('API call error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch friends and friend requests
  const fetchFriendsAndRequests = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    await executeApiCall(async () => {
      // Fetch friends
      const friendsResponse = await fetch(`/api/friends/${user.userId}`);
      if (!friendsResponse.ok) {
        throw new Error('Failed to fetch friends');
      }
      const friendsData = await friendsResponse.json();
      setFriends(friendsData);
      
      // Fetch friend requests
      const requestsResponse = await fetch(`/api/friends/${user.userId}/requests`);
      if (!requestsResponse.ok) {
        throw new Error('Failed to fetch friend requests');
      }
      const requestsData = await requestsResponse.json();
      
      setReceivedRequests(requestsData.received);
      setSentRequests(requestsData.sent);
    });
  }, [user, executeApiCall]);

  // Send a friend request
  const sendFriendRequest = useCallback(async (targetUserId: string): Promise<void> => {
    if (!user) return;
    
    await executeApiCall(async () => {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.userId,
          receiverId: targetUserId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send friend request');
      }
      
      // Add the new request to the sent requests list
      const newRequest = await response.json();
      setSentRequests(prev => [...prev, newRequest]);
    });
  }, [user, executeApiCall]);

  // Accept a friend request
  const acceptFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    if (!user) return;
    
    await executeApiCall(async () => {
      const response = await fetch(`/api/friends/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'accepted',
          userId: user.userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept friend request');
      }
      
      // Find the request that was accepted
      const request = receivedRequests.find(r => r.id?.toString() === requestId);
      if (request) {
        // Remove from received requests
        setReceivedRequests(prev => prev.filter(r => r.id?.toString() !== requestId));
        
        // Add to friends list
        setFriends(prev => [...prev, {
          userId: request.senderId,
          username: request.senderUsername || '',
          firstName: request.senderFirstName || '',
          lastName: request.senderLastName || '',
          avatarUrl: request.senderAvatarUrl || null,
        }]);
      }
    });
  }, [user, executeApiCall, receivedRequests]);

  // Reject a friend request
  const rejectFriendRequest = useCallback(async (requestId: string): Promise<void> => {
    if (!user) return;
    
    await executeApiCall(async () => {
      const response = await fetch(`/api/friends/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'rejected',
          userId: user.userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject friend request');
      }
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(r => r.id?.toString() !== requestId));
    });
  }, [user, executeApiCall]);

  // Remove a friend
  const removeFriend = useCallback(async (friendId: string): Promise<void> => {
    if (!user) return;
    
    await executeApiCall(async () => {
      const response = await fetch(`/api/friends/${user.userId}/friend/${friendId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove friend');
      }
      
      // Refresh friends
      await fetchFriendsAndRequests();
    });
  }, [user, executeApiCall, fetchFriendsAndRequests]);

  // Utility function to check if a user is a friend
  const isFriend = useCallback((targetUserId: string): boolean => {
    return friends.some(friend => friend.userId === targetUserId);
  }, [friends]);

  // Utility function to check if there's a pending request from a user
  const hasPendingRequestFrom = useCallback((targetUserId: string): boolean => {
    return receivedRequests.some(
      request => request.senderId === targetUserId && request.status === 'pending'
    );
  }, [receivedRequests]);

  // Utility function to check if there's a pending request to a user
  const hasPendingRequestTo = useCallback((targetUserId: string): boolean => {
    return sentRequests.some(
      request => request.receiverId === targetUserId && request.status === 'pending'
    );
  }, [sentRequests]);

  // Get the overall friend status with a user
  const getFriendRequestStatus = useCallback(
    (targetUserId: string): 'none' | 'friends' | 'received' | 'sent' => {
      if (isFriend(targetUserId)) return 'friends';
      if (hasPendingRequestFrom(targetUserId)) return 'received';
      if (hasPendingRequestTo(targetUserId)) return 'sent';
      return 'none';
    },
    [isFriend, hasPendingRequestFrom, hasPendingRequestTo]
  );

  // Initial fetch
  useEffect(() => {
    fetchFriendsAndRequests();
  }, [fetchFriendsAndRequests]);

  return {
    friends,
    receivedRequests,
    sentRequests,
    isLoading,
    error,
    
    // Friend request actions
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    refreshFriends: fetchFriendsAndRequests,
    isFriend,
    // Friend request status checks
    hasPendingRequestFrom,
    hasPendingRequestTo,
    getFriendRequestStatus,
  };
}
