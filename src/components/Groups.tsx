import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Group, GroupAccessType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea.tsx';
import axios from 'axios';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Users, Lock, Globe } from 'lucide-react';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState<GroupAccessType>('open');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my'>('my');
  const navigate = useNavigate();

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [allGroupsRes, myGroupsRes] = await Promise.all([
        axios.get(`/api/groups?userId=${user.userId}`),
        axios.get(`/api/groups/my/${user.userId}`)
      ]);
      
      setGroups(allGroupsRes.data);
      setMyGroups(myGroupsRes.data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreateGroup = async () => {
    try {
      if (!user) {
        alert('You must be logged in to create a group');
        return;
      }
      
      if (!name.trim() || !description.trim()) {
        alert('Please fill in all required fields');
        return;
      }

      setLoading(true);
      
      const response = await axios.post('/api/groups', {
        name,
        description,
        accessType,
        createdBy: user.userId
      });
      
      setMyGroups(prev => [response.data, ...prev]);
      if (accessType === 'open') {
        setGroups(prev => [response.data, ...prev]);
      }
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      if (!user) return;
      
      await axios.post(`/api/groups/${groupId}/join`, {
        userId: user.userId
      });
      
      // Refresh groups
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to join group:', error);
      alert(error.response?.data?.error || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      if (!user) return;
      
      await axios.delete(`/api/groups/${groupId}/leave`, {
        data: { userId: user.userId }
      });
      
      // Refresh groups
      fetchGroups();
    } catch (error: any) {
      console.error('Failed to leave group:', error);
      alert(error.response?.data?.error || 'Failed to leave group');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setAccessType('open');
  };

  const displayGroups = activeTab === 'my' ? myGroups : groups;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Button 
            variant={activeTab === 'my' ? 'default' : 'outline'}
            onClick={() => setActiveTab('my')}
          >
            My Groups
          </Button>
          <Button 
            variant={activeTab === 'discover' ? 'default' : 'outline'}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </Button>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Create New Group'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setName(e.target.value)}
                  placeholder="Enter group name"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setDescription(e.target.value)
                  }
                  placeholder="Enter group description"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Access Type</Label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accessType"
                      checked={accessType === 'open'}
                      onChange={() => setAccessType('open')}
                      className="h-4 w-4"
                    />
                    <Globe className="h-4 w-4 text-green-500" />
                    <span>Open (Anyone can join)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accessType"
                      checked={accessType === 'invitation'}
                      onChange={() => setAccessType('invitation')}
                      className="h-4 w-4"
                    />
                    <Lock className="h-4 w-4 text-yellow-500" />
                    <span>Invitation Only</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateGroup}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={loading}
                >
                  Create Group
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div>Loading groups...</div>
      ) : (
        <div className="space-y-4">
          {displayGroups.map((group) => (
            <Card 
              key={group.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/groups/${group.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    {group.name}
                    {group.accessType === 'invitation' ? (
                      <Lock className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Globe className="h-4 w-4 text-green-500" />
                    )}
                  </CardTitle>
                  {group.isMember && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {group.userRole === 'owner' ? 'Owner' : 
                       group.userRole === 'admin' ? 'Admin' : 'Member'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600">{group.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={group.creatorAvatarUrl || undefined} />
                          <AvatarFallback>
                            {group.creatorUsername?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span>By {group.creatorUsername}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{group.memberCount || 0} members</span>
                      </div>
                      <span>
                        {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div onClick={(e) => e.stopPropagation()}>
                      {group.isMember ? (
                        group.userRole !== 'owner' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleLeaveGroup(group.id)}
                          >
                            Leave
                          </Button>
                        )
                      ) : (
                        group.accessType === 'open' && (
                          <Button 
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => handleJoinGroup(group.id)}
                          >
                            Join
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {displayGroups.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {activeTab === 'my' 
                ? "You haven't joined any groups yet" 
                : "No open groups available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
