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
import { cn } from '../lib/utils';

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
    const interval = setInterval(fetchAlertCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchAlertCounts]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full glass-effect border-b-4 border-black z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-black tracking-tighter uppercase italic bg-yellow-400 px-2 border-2 border-black shadow-neo-sm">
              FORUM_APP
            </Link>
          </div>
          
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            {isAuthenticated ? (
              <>
                <Link
                  to="/friends"
                  className="text-sm font-bold hover:bg-black/5 px-3 py-1 border-2 border-transparent hover:border-black transition-all relative"
                >
                  Friends ({profile?.friends?.length || 0})
                  {alertCounts.friendRequests > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-black" />
                  )}
                </Link>
                <TopicsDropdown />
                <GroupsDropdown />
                <Link
                  to="/followed"
                  className="text-sm font-bold hover:bg-black/5 px-3 py-1 border-2 border-transparent hover:border-black transition-all"
                >
                  Followed
                </Link>
                <Link
                  to="/alerts"
                  className="p-2 border-2 border-black bg-white shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all relative"
                >
                  <Bell className="h-5 w-5" />
                  {alertCounts.total > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold border-2 border-black flex items-center justify-center">
                      {alertCounts.total}
                    </span>
                  )}
                </Link>
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    className="p-2 border-2 border-black bg-purple-400 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    title="Admin Dashboard"
                  >
                    <Shield className="h-5 w-5" />
                  </Link>
                )}
                
                <div className="flex items-center space-x-4 ml-4 pl-4 border-l-2 border-black h-8">
                  <Link to="/personal-details" className="flex items-center space-x-2 group">
                    <div className="border-2 border-black shadow-neo-sm group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all bg-white">
                      <Avatar className="rounded-none h-8 w-8">
                        <AvatarImage src={profile?.avatarUrl || undefined} alt={user?.username} />
                        <AvatarFallback className="rounded-none bg-yellow-400 font-bold border-none text-black">
                          {user?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-sm font-black uppercase tracking-tight hidden md:inline-block">{user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className={cn(buttonVariants({ variant: "destructive", size: "sm" }), "rounded-none")}
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="font-bold hover:underline decoration-2 underline-offset-4 px-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={cn(buttonVariants({ variant: "default", size: "default" }), "rounded-none")}
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>  
  );
};

export default Navbar;

