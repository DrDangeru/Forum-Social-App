import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { User,  } from '../types';

const Followed = ({ currentUserId }: { currentUserId: number }) => {
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowData = async () => {
    try {
      const [followingRes, followersRes] = await Promise.all([
        fetch(`http://localhost:3001/api/following/${currentUserId}`),
        fetch(`http://localhost:3001/api/followers/${currentUserId}`)
      ]);

      setFollowedUsers(await followingRes.json());
      setFollowers(await followersRes.json());
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
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
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
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Followed;
