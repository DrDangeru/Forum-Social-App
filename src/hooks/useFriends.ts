import { useState, useEffect, useCallback } from 'react';
import type { FriendRequest, BasicProfile, UseFriendsReturn, UserSearchFriendStatus } from '../types/clientTypes';
import { useAuth } from './useAuth';

/**
 * Interface for the return value of the useFriends hook.
 * This interface is divided into three sections:
 * 1. Data: This section contains the state variables for friends, requests, and loading status.
 * 2. Actions: This section contains functions to perform actions related to friends and requests.
 * 3. Status checks: This section contains functions to check the status of friends and requests.
 */
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

  // Fetch friends and requests
  const fetchFriendsAndRequests = useCallback(async () => {
    if (!user) return;

    await executeApiCall(async () => {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`/api/friends/${user.userId}`),
        fetch(`/api/friends/${user.userId}/requests`)
      ]);

      if (!friendsRes.ok || !requestsRes.ok) {
        throw new Error('Failed to fetch friends data');
      }

      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();

      setFriends(friendsData);
      setReceivedRequests(requestsData.received || []);
      setSentRequests(requestsData.sent || []);
    });
  }, [user, executeApiCall]);

  // Send a friend request
  const sendFriendRequest = useCallback(async (targetUserId: string): Promise<void> => {
    if (!user) return;
    
    console.log('[Frontend] Sending friend request:', { 
      senderId: user.userId, 
      receiverId: targetUserId 
    });
    
    await executeApiCall(async () => {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          senderId: user.userId,
          receiverId: targetUserId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Frontend] Friend request failed:', errorData);
        throw new Error(errorData.error || 'Failed to send friend request');
      }
      
      // Add the new request to the sent requests list
      const newRequest = await response.json();
      console.log('[Frontend] Friend request successful:', newRequest);
      setSentRequests(prev => [...prev, newRequest]);

      // Force refresh of friend requests
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
          userId: user.userId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept friend request');
      }

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
          userId: user.userId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject friend request');
      }

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
    (targetUserId: string): UserSearchFriendStatus => {
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
