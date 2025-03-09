import { useContext } from 'react';
import { ProfileContext, ProfileContextType } from '../contexts/ProfileContext';

export function useProfile(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
