import { Link, useNavigate } from 'react-router-dom';
import { Bell, Shield } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import TopicsDropdown from './TopicsDropdown';
import GroupsDropdown from './GroupsDropdown';
import { buttonVariants } from './ui/buttonVariants';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertCounts } from '../types/clientTypes';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [alertCounts, setAlertCounts] = useState<AlertCounts>({
    friendRequests: 0,
    groupInvitations: 0,
    total: 0
  });

  const fetchAlertCounts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await axios.get<AlertCounts>('/api/alerts/counts');
      setAlertCounts(response.data);
    } catch (error) {
      console.error('Failed to fetch alert counts:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAlertCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchAlertCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlertCounts]);

  const handleLogout = () => {
    logout();
    navigate('/register');
  };

  return (
    <nav className="fixed top-0 w-full bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="text-xl font-bold">
              Forum App
            </Link>
          </div>
          
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {isAuthenticated ? (
              <>
                <Link
                  to="/friends"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md relative"
                >
                  Friends ({profile?.friends?.length || 0})
                  {alertCounts.friendRequests > 0 && (
                    <span className="notification-dot" />
                  )}
                </Link>
                <TopicsDropdown />
                <GroupsDropdown />
                <Link
                  to="/followed"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
                >
                  Followed
                </Link>
                <Link
                  to="/alerts"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md relative"
                >
                  <Bell className="h-5 w-5" />
                  {alertCounts.total > 0 && (
                    <span className="notification-dot" />
                  )}
                </Link>
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
                    title="Admin Dashboard"
                  >
                    <Shield className="h-5 w-5" />
                  </Link>
                )}
                
                <div className="flex items-center space-x-4">
                  <Link to="/personal-details" className="flex items-center space-x-2">
                    <Avatar>
                      <AvatarImage src={profile?.avatarUrl || undefined} alt={user?.username} />
                      <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={buttonVariants({ variant: "default", size: "default" })}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/register"
                className={buttonVariants({ variant: "default", size: "lg" })} 
                // was inline and not this
              >
                Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>  
  );
};

export default Navbar;
