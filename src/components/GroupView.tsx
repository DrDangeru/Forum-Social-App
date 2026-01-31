import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Group, GroupMember } from '../types/clientTypes';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import axios from 'axios';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Users, Lock, Globe, ArrowLeft, UserPlus, Crown, Shield } from 'lucide-react';

export default function GroupView() {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchGroup = useCallback(async () => {
    if (!groupId || !user) return;
    
    try {
      setLoading(true);
      const [groupRes, membersRes] = await Promise.all([
        axios.get(`/api/groups/${groupId}?userId=${user.userId}`),
        axios.get(`/api/groups/${groupId}/members`)
      ]);
      
      setGroup(groupRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Failed to fetch group:', error);
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const handleJoinGroup = async () => {
    try {
      if (!user || !groupId) return;
      
      await axios.post(`/api/groups/${groupId}/join`, {
        userId: user.userId
      });
      
      fetchGroup();
    } catch (error: any) {
      console.error('Failed to join group:', error);
      alert(error.response?.data?.error || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      if (!user || !groupId) return;
      
      await axios.delete(`/api/groups/${groupId}/leave`, {
        data: { userId: user.userId }
      });
      
      navigate('/groups');
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      alert(error.response?.data?.error || 'Failed to leave group');
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const response = await axios.get(`/api/users/search?q=${query}`);
      // Filter out existing members
      const memberIds = members.map(m => m.userId);
      setSearchResults(response.data.filter((u: any) => !memberIds.includes(u.userId)));
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleInviteUser = async (inviteeId: string) => {
    try {
      if (!user || !groupId) return;
      
      await axios.post(`/api/groups/${groupId}/invite`, {
        inviterId: user.userId,
        inviteeId
      });
      
      alert('Invitation sent successfully');
      setInviteUsername('');
      setSearchResults([]);
      setShowInviteForm(false);
    } catch (error: any) {
      console.error('Failed to invite user:', error);
      alert(error.response?.data?.error || 'Failed to send invitation');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const canInvite = group?.isMember && 
    (group?.userRole === 'owner' || group?.userRole === 'admin');

  if (loading) {
    return <div className="text-center py-8">Loading group...</div>;
  }

  if (!group) {
    return <div className="text-center py-8">Group not found</div>;
  }

  return (
    <div className="space-y-4">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/groups')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Groups
      </Button>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                {group.name}
                {group.accessType === 'invitation' ? (
                  <Lock className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Globe className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {group.accessType === 'invitation' ? 'Invitation Only' : 'Open Group'}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {group.isMember ? (
                <>
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded">
                    {group.userRole === 'owner' ? 'Owner' : 
                     group.userRole === 'admin' ? 'Admin' : 'Member'}
                  </span>
                  {group.userRole !== 'owner' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleLeaveGroup}
                    >
                      Leave Group
                    </Button>
                  )}
                </>
              ) : (
                group.accessType === 'open' && (
                  <Button 
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={handleJoinGroup}
                  >
                    Join Group
                  </Button>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">{group.description}</p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={group.creatorAvatarUrl || undefined} />
                <AvatarFallback>
                  {group.creatorUsername?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span>Created by {group.creatorUsername}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{group.memberCount || members.length} members</span>
            </div>
            <span>
              Created {new Date(group.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({members.length})
            </CardTitle>
            {canInvite && (
              <Button 
                size="sm"
                onClick={() => setShowInviteForm(!showInviteForm)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showInviteForm && canInvite && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Invite a User</h4>
              <div className="flex gap-2">
                <Input
                  value={inviteUsername}
                  onChange={(e) => {
                    setInviteUsername(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  placeholder="Search by username..."
                  className="flex-1"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                  {searchResults.map((searchUser) => (
                    <div 
                      key={searchUser.userId}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleInviteUser(searchUser.userId)}
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={searchUser.avatarUrl || undefined} />
                          <AvatarFallback>
                            {searchUser.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{searchUser.username}</p>
                          <p className="text-xs text-gray-500">
                            {searchUser.firstName} {searchUser.lastName}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Invite
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {members.map((member) => (
              <div 
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback>
                      {member.username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{member.username}</p>
                      {getRoleIcon(member.role)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {member.firstName} {member.lastName}
                    </p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
