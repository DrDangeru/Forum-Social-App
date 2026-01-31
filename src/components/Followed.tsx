import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
// import { Button } from './ui/button';
import { useEffect, useState } from 'react';
// import axios from 'axios';
import { User, Topic } from '../types/clientTypes';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Followed = () => {
  const { user } = useAuth();
  const currentUserId = user?.userId;
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [followedTopics, setFollowedTopics] = useState<Topic[]>([]);
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFollowData = async () => {
    if (!currentUserId) {
      return;
    }

    try {
      const [friendsRes, friendsTopicsRes, userTopicsRes] = await Promise.all([
        // Fetch friends
        fetch(`http://localhost:3001/api/friends/${currentUserId}`, {
          credentials: 'include',
        }),
        // Fetch friends' public topics
        fetch(`http://localhost:3001/api/topics/friends/${currentUserId}`, {
          credentials: 'include',
        }),
        // Fetch user's own topics
        fetch(`http://localhost:3001/api/topics/user/${currentUserId}`, {
          credentials: 'include',
        }),
      ]);

      if (!friendsRes.ok || !friendsTopicsRes.ok || !userTopicsRes.ok) {
        // Log specific errors
        if (!friendsRes.ok) console.error('Failed to fetch friends:', friendsRes.status,
           await friendsRes.text());
        if (!friendsTopicsRes.ok) console.error('Failed to fetch friends topics:',
           friendsTopicsRes.status, await friendsTopicsRes.text());
        if (!userTopicsRes.ok) console.error('Failed to fetch user topics:', 
          userTopicsRes.status, await userTopicsRes.text());
        throw new Error("Failed to fetch data");
      }

      const friendsData = await friendsRes.json();
      const friendsTopicsData = await friendsTopicsRes.json();
      const userTopicsData = await userTopicsRes.json();

      console.log("API Response - Friends:", friendsData); // Log friends
      console.log("API Response - Friends' Topics:", friendsTopicsData); // Log friends' topics
      console.log("API Response - User topics:", userTopicsData);

      setFollowedUsers(friendsData); // Update state with friends data
      setFollowedTopics(friendsTopicsData); // Update state with friends' topics data
      setUserTopics(userTopicsData);
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  // const handleUnfollow = async (targetUserId: number) => {
  //   try {
  //     await axios.delete('http://localhost:3001/api/follow', {
  //       data: {
  //         followerId: currentUserId,
  //         followingId: targetUserId
  //       }
  //     });
  //     fetchFollowData(); // Refresh the lists
  //   } catch (error) {
  //     console.error('Error unfollowing user:', error);
  //   }
  // };

  useEffect(() => {
    fetchFollowData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId ]);

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-6"> 
          {/* First Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Friends' Topics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Friends' Public Topics 
                  ({followedTopics.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center">
                  {Array.isArray(followedTopics) ? followedTopics.map(topic => (
                    <div
                      key={topic.id}
                      className="p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate(`/topics/${topic.id}`)}
                    >
                      <h3 className="font-medium text-gray-900">{topic.title}</h3>
                      <p className="text-sm text-gray-500">
                        {topic.description || 'No description available'}
                      </p>
                      <div className="text-xs text-gray-400 mt-2">
                        Created: {new Date(topic.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">No topics loaded or followed.</p>
                  )}
                  {Array.isArray(followedTopics) && followedTopics.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No friends' public topics yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User's Own Topics Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">My Topics ({userTopics.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-center">
                  {Array.isArray(userTopics) ? userTopics.map(topic => (
                    <div
                      key={topic.id}
                      className="p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate(`/topics/${topic.id}`)}
                    >
                      <h3 className="font-medium text-gray-900">{topic.title}</h3>
                      <p className="text-sm text-gray-500">
                        {topic.description || 'No description available'}
                      </p>
                      <div className="text-xs text-gray-400 mt-2">
                        Created: {new Date(topic.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-center py-4">No user topics loaded.</p>
                  )}
                  {Array.isArray(userTopics) && userTopics.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      You haven't created any topics yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Friends Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Friends ({followedUsers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Changed to flex column and centered items */}
                <div className="flex flex-col items-center space-y-4"> 
                  {followedUsers.map(user => (
                    <div
                      key={user.userId}
                      // Changed to flex column, centered items, removed justify-between
                      className="flex flex-col items-center p-4 w-full 
                       hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate(`/profile/${user.userId}`)}
                    >
                      {/* This inner div keeps Avatar and text side-by-side */}
                      <div className="flex items-center space-x-4"> 
                        <Avatar>
                          <AvatarImage className='align-center' src={user.avatarUrl || undefined} />
                          <AvatarFallback className='align-center'>
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{user.username}</h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {followedUsers.length === 0 && (
                    <p className="text-gray-500 text-center py-4">You don't have any friends yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Empty Column 1 */}
            <div></div> 

            {/* Feed - Coming Soon Section (Middle Column) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Feed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-full text-center">
                  <p className="text-gray-500 text-lg font-semibold">Coming Soon</p>
                </div>
              </CardContent>
            </Card>

            {/* Empty Column 3 */}
            <div></div> 
          </div>
        </div>
      )}
    </div>
  );
};

export default Followed;
