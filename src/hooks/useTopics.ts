import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Topic } from '../types';
import { useAuth } from './useAuth';

export function useTopics() {
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [friendTopics, setFriendTopics] = useState<Topic[]>([]);
  const [followedTopics, setFollowedTopics] = useState<Topic[]>([]);
  const [userTopicsLoading, setUserTopicsLoading] = useState(false);
  const [friendTopicsLoading, setFriendTopicsLoading] = useState(false);
  const [followedTopicsLoading, setFollowedTopicsLoading] = useState(false);
  const [userTopicsError, setUserTopicsError] = useState<string | null>(null);
  const [friendTopicsError, setFriendTopicsError] = useState<string | null>(null);
  const [followedTopicsError, setFollowedTopicsError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserTopics = useCallback(async () => {
    if (!user) return;
    
    try {
      setUserTopicsLoading(true);
      setUserTopicsError(null);
      const response = await axios.get(`/api/topics/user/${user.userId}`);
      
      // Ensure each topic has a posts array and correct isPublic field
      const processedTopics = response.data.map((topic: any) => ({
        ...topic,
        posts: topic.posts || [],
        isPublic: topic.isPublic === 1 || topic.isPublic === true
      }));
      
      setUserTopics(processedTopics);
    } catch (err) {
      console.error('Failed to fetch user topics:', err);
      setUserTopicsError('Failed to fetch your topics');
      setUserTopics([]);
    } finally {
      setUserTopicsLoading(false);
    }
  }, [user]);

  const fetchFriendTopics = useCallback(async () => {
    if (!user) return;
    
    try {
      setFriendTopicsLoading(true);
      setFriendTopicsError(null);
      const response = await axios.get(`/api/topics/friends/${user.userId}`);
      
      // Ensure each topic has a posts array and correct isPublic field
      const processedTopics = response.data.map((topic: any) => ({
        ...topic,
        posts: topic.posts || [],
        isPublic: topic.isPublic === 1 || topic.isPublic === true
      }));
      
      setFriendTopics(processedTopics);
    } catch (err) {
      console.error('Failed to fetch friend topics:', err);
      setFriendTopicsError('Failed to fetch friend topics');
      setFriendTopics([]);
    } finally {
      setFriendTopicsLoading(false);
    }
  }, [user]);

  const fetchFollowedTopics = useCallback(async () => {
    if (!user) return;
    
    try {
      setFollowedTopicsLoading(true);
      setFollowedTopicsError(null);
      const response = await axios.get(`/api/topics/followed/${user.userId}`);
      
      // Ensure each topic has a posts array and correct isPublic field
      const processedTopics = response.data.map((topic: any) => ({
        ...topic,
        posts: topic.posts || [],
        isPublic: topic.isPublic === 1 || topic.isPublic === true
      }));
      
      setFollowedTopics(processedTopics);
    } catch (err) {
      console.error('Failed to fetch followed topics:', err);
      setFollowedTopicsError('Failed to fetch followed topics');
      setFollowedTopics([]);
    } finally {
      setFollowedTopicsLoading(false);
    }
  }, [user]);

  const followTopic = useCallback(async (topicId: number) => {
    if (!user) return false;
    
    try {
      await axios.post(`/api/topics/follows`, { 
        userId: user.userId,
        topicId
      });
      // Refresh followed topics after following a new one
      fetchFollowedTopics();
      return true;
    } catch (err) {
      console.error('Failed to follow topic:', err);
      return false;
    }
  }, [user, fetchFollowedTopics]);

  const unfollowTopic = useCallback(async (topicId: number) => {
    if (!user) return false;
    
    try {
      await axios.delete(`/api/topics/follows`, { 
        data: { 
          userId: user.userId,
          topicId
        } 
      });
      // Refresh followed topics after unfollowing
      fetchFollowedTopics();
      return true;
    } catch (err) {
      console.error('Failed to unfollow topic:', err);
      return false;
    }
  }, [user, fetchFollowedTopics]);

  const checkFollowStatus = useCallback(async (topicId: number) => {
    if (!user) return false;
    
    try {
      // Get all follows for this user
      const response = await axios.get(`/api/topics/follows/${user.userId}`);
      // Check if the topicId is in the response
      return response.data.some((follow: any) => follow.topicId === topicId);
    } catch (err) {
      console.error('Failed to check follow status:', err);
      return false;
    }
  }, [user]);

  const refreshTopics = useCallback(() => {
    fetchUserTopics();
    fetchFriendTopics();
    fetchFollowedTopics();
  }, [fetchUserTopics, fetchFriendTopics, fetchFollowedTopics]);

  useEffect(() => {
    if (user) {
      refreshTopics();
    } else {
      setUserTopics([]);
      setFriendTopics([]);
      setFollowedTopics([]);
    }
  }, [user, refreshTopics]);

  return {
    userTopics,
    friendTopics,
    followedTopics,
    userTopicsLoading,
    friendTopicsLoading,
    followedTopicsLoading,
    userTopicsError,
    friendTopicsError,
    followedTopicsError,
    refreshTopics,
    followTopic,
    unfollowTopic,
    checkFollowStatus
  };
}
