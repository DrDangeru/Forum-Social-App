import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { User, Topic } from '../types';

const Followed = ({ currentUserId }: { currentUserId: number }) => {
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [followedTopics, setFollowedTopics] = useState<Topic[]>([]);
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowData = async () => {
    try {
      const [followingRes, followersRes, followedTopicsRes, userTopicsRes] = await Promise.all([
        fetch(`http://localhost:3001/api/following/${currentUserId}`),
        fetch(`http://localhost:3001/api/followers/${currentUserId}`),
        fetch(`http://localhost:3001/api/topics/followed/${currentUserId}`),
        fetch(`http://localhost:3001/api/topics/user/${currentUserId}`)
      ]);
      

      setFollowedUsers(await followingRes.json());
      setFollowers(await followersRes.json());
      setFollowedTopics(await followedTopicsRes.json());
      setUserTopics(await userTopicsRes.json());
    } catch (error) {
      console.error('Error fetching follow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: number) => {
    try {
      await axios.post('http://localhost:3001/api/follow', {
        followerId: currentUserId,
        followingId: targetUserId
      });
      fetchFollowData(); // Refresh the lists
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const handleUnfollow = async (targetUserId: number) => {
    try {
      await axios.delete('http://localhost:3001/api/follow', {
        data: {
          followerId: currentUserId,
          followingId: targetUserId
        }
      });
      fetchFollowData(); // Refresh the lists
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  useEffect(() => {
    fetchFollowData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId ]); // fetchFollowData results in re-renders
  // which is not wanted. If excluding it causes some issues,
  // we can add it with memoization or use a different approach.

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Topics */}
        <div className="space-y-6">
          {/* Followed Topics Section */}
          <Card>
            <CardHeader>
              <CardTitle>Followed Topics ({followedTopics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {followedTopics.map(topic => (
                  <div key={topic.id} className="p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <h3 className="font-medium text-gray-900">{topic.title}</h3>
                    <p className="text-sm text-gray-500">
                      {topic.description || 'No description available'}
                    </p>
                    <div className="text-xs text-gray-400 mt-2">
                      Created: {new Date(topic.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {followedTopics.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No followed topics yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User's Own Topics Section */}
          <Card>
            <CardHeader>
              <CardTitle>My Topics ({userTopics.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userTopics.map(topic => (
                  <div key={topic.id} className="p-4 hover:bg-gray-50 rounded-lg transition-colors">
                    <h3 className="font-medium text-gray-900">{topic.title}</h3>
                    <p className="text-sm text-gray-500">
                      {topic.description || 'No description available'}
                    </p>
                    <div className="text-xs text-gray-400 mt-2">
                      Created: {new Date(topic.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {userTopics.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    You haven't created any topics yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Friends Updates */}
        <div className="space-y-6">
          {/* Following Section */}
          <Card>
            <CardHeader>
              <CardTitle>People You Follow ({followedUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {followedUsers.map(user => (
                  <div key={user.userId} className="flex items-center justify-between p-4 
                  hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>{user.username.substring(0, 2)
                        .toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">{user.username}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleUnfollow(user.userId as any)}
                    >
                      Unfollow
                    </Button>
                  </div>
                ))}
                {followedUsers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">You're not following anyone yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Followers Section */}
          <Card>
            <CardHeader>
              <CardTitle>Your Followers ({followers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {followers.map(user => (
                  <div key={user.userId} className="flex items-center justify-between p-4
                   hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl || undefined} />
                        <AvatarFallback>{user.username.substring(0, 2)
                        .toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">{user.username}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {!followedUsers.some(f => f.userId === user.userId) && (
                      <Button
                        variant="outline"
                        onClick={() => handleFollow(user.userId as any)}
                      >
                        Follow Back
                      </Button>
                    )}
                  </div>
                ))}
                {followers.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No followers yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Followed;
