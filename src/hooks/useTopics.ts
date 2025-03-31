import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Topic } from '../types';
import { useAuth } from './useAuth';

export function useTopics() {
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [friendTopics, setFriendTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserTopics = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/topics/user/${user.userId}`);
      
      // Ensure each topic has a posts array
      const processedTopics = response.data.map((topic: any) => ({
        ...topic,
        posts: topic.posts || []
      }));
      
      setUserTopics(processedTopics);
    } catch (err) {
      console.error('Failed to fetch user topics:', err);
      setError('Failed to fetch your topics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchFriendTopics = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/topics/friends/${user.userId}`);
      
      // Ensure each topic has a posts array
      const processedTopics = response.data.map((topic: any) => ({
        ...topic,
        posts: topic.posts || []
      }));
      
      setFriendTopics(processedTopics);
    } catch (err) {
      console.error('Failed to fetch friend topics:', err);
      setError('Failed to fetch friend topics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserTopics();
    fetchFriendTopics();
  }, [fetchUserTopics, fetchFriendTopics]);

  return {
    userTopics,
    friendTopics,
    loading,
    error,
    refreshTopics: useCallback(() => {
      fetchUserTopics();
      fetchFriendTopics();
    }, [fetchUserTopics, fetchFriendTopics])
  };
}
