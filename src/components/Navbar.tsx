import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { mockUsers } from '../data/mockData';
import GuyProfilePic from '../Pics/Guy-20s.webp';

const Navbar = () => {
  // Using first mock user as the current user
  const currentUser = mockUsers[0];
  const user = {
    isAuthenticated: true,
    ...currentUser,
    profilePic: GuyProfilePic // Explicitly set the profile pic
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
            <Link
              to="/friends"
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
            >
              Friends ({user.friends.length})
            </Link>
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
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                0
              </span>
            </Link>
            
            {user.isAuthenticated ? (
              <Link to={`/user/${user.id}/details`} className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user.profilePic} alt={user.username} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{user.username}</span>
              </Link>
            ) : (
              <Link
                to="/register"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md"
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
