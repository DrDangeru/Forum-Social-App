import { useState, useEffect, useCallback } from 'react';
import { FriendRequest, BasicProfile } from '../types';
import { useAuth } from './useAuth';

interface UseFriendsReturn {
  // Data
  friends: BasicProfile[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  
  // Friend request actions
  // eslint-disable-next-line no-unused-vars
  sendFriendRequest: (userId: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  acceptFriendRequest: (requestId: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  rejectFriendRequest: (requestId: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  removeFriend: (friendId: string) => Promise<void>;
  
  // Utility functions
  refreshFriends: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  isFriend: (userId: string) => boolean;
  // eslint-disable-next-line no-unused-vars
  hasPendingRequestFrom: (userId: string) => boolean;
  // eslint-disable-next-line no-unused-vars
  hasPendingRequestTo: (userId: string) => boolean;
  // eslint-disable-next-line no-unused-vars
  getFriendRequestStatus: (userId: string) => 'none' | 'friends' | 'received' | 'sent';
}

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
      
      // Map received requests to ensure they use the correct field names
      setReceivedRequests(requestsData.received.map((request: any) => ({
        ...request,
        senderId: request.sender_userId || request.senderId,
        receiverId: request.receiver_id || request.receiverId
      })));
      
      // Map sent requests to ensure they use the correct field names
      setSentRequests(requestsData.sent.map((request: any) => ({
        ...request,
        senderId: request.sender_userId || request.senderId,
        receiverId: request.receiver_id || request.receiverId
      })));
    });
  }, [user, executeApiCall]);

  // Send a friend request
  const sendFriendRequest = useCallback(async (userId: string): Promise<void> => {
    if (!user) return;
    
    await executeApiCall(async () => {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: user.userId,
          receiverId: userId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send friend request');
      }
      
      // Refresh friend requests
      await fetchFriendsAndRequests();
    });
  }, [user, executeApiCall, fetchFriendsAndRequests]);

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
      
      // Refresh friends and requests
      await fetchFriendsAndRequests();
    });
  }, [user, executeApiCall, fetchFriendsAndRequests]);

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
      
      // Refresh friend requests
      await fetchFriendsAndRequests();
    });
  }, [user, executeApiCall, fetchFriendsAndRequests]);

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
  const isFriend = useCallback((userId: string): boolean => {
    return friends.some(friend => friend.userId === userId);
  }, [friends]);

  // Utility function to check if there's a pending request from a user
  const hasPendingRequestFrom = useCallback((userId: string): boolean => {
    return receivedRequests.some(request => request.senderId === userId);
  }, [receivedRequests]);

  // Utility function to check if there's a pending request to a user
  const hasPendingRequestTo = useCallback((userId: string): boolean => {
    return sentRequests.some(request => request.receiverId === userId);
  }, [sentRequests]);

  // Get the overall friend status with a user
  const getFriendRequestStatus = useCallback(
    (userId: string): 'none' | 'friends' | 'received' | 'sent' => {
      if (isFriend(userId)) {
        return 'friends';
      }
      
      if (hasPendingRequestFrom(userId)) {
        return 'received';
      }
      
      if (hasPendingRequestTo(userId)) {
        return 'sent';
      }
      
      return 'none';
    },
    [isFriend, hasPendingRequestFrom, hasPendingRequestTo]
  );

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchFriendsAndRequests();
    }
  }, [user, fetchFriendsAndRequests]);

  // Return all the functions and data
  return {
    // Data
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
    
    // Utility functions
    refreshFriends: fetchFriendsAndRequests,
    isFriend,
    hasPendingRequestFrom,
    hasPendingRequestTo,
    getFriendRequestStatus,
  };
}
