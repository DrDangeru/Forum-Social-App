import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Topic } from '../types';
import { useAuth } from './useAuth';

export function useTopics() {
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [friendTopics, setFriendTopics] = useState<Topic[]>([]);
  const [userTopicsLoading, setUserTopicsLoading] = useState(false);
  const [friendTopicsLoading, setFriendTopicsLoading] = useState(false);
  const [userTopicsError, setUserTopicsError] = useState<string | null>(null);
  const [friendTopicsError, setFriendTopicsError] = useState<string | null>(null);
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

  const refreshTopics = useCallback(() => {
    fetchUserTopics();
    fetchFriendTopics();
  }, [fetchUserTopics, fetchFriendTopics]);

  useEffect(() => {
    if (user) {
      refreshTopics();
    } else {
      setUserTopics([]);
      setFriendTopics([]);
    }
  }, [user, refreshTopics]);

  return {
    userTopics,
    friendTopics,
    userTopicsLoading,
    friendTopicsLoading,
    userTopicsError,
    friendTopicsError,
    refreshTopics
  };
}
