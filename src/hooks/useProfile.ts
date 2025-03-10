import { useContext, useEffect } from 'react';
import { ProfileContext, ProfileContextType } from '../contexts/ProfileContext';
import { useParams } from 'react-router-dom';

export function useProfile(userId?: string): ProfileContextType {
  const context = useContext(ProfileContext);
  const params = useParams<{ userId?: string }>();
  
  // Get userId from params if not provided directly
  const targetUserId = userId || params.userId;
  
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  
  // If a userId is provided or in the URL params, set it as the current profile
  useEffect(() => {
    if (targetUserId && context.profile?.userId !== targetUserId) {
      context.setCurrentProfile(targetUserId);
    }
  }, [targetUserId, context]);
  
  return context;
}
