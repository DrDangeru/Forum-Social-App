import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { GroupInvitation } from '../types';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Mail, Check, X } from 'lucide-react';

export default function GroupInvitations() {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInvitations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`/api/groups/invitations/${user.userId}`);
      setInvitations(response.data);
    } catch (error) {
      console.error('Failed to fetch invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleRespond = async (invitationId: number, accept: boolean) => {
    try {
      if (!user) return;
      
      await axios.put(`/api/groups/invitations/${invitationId}`, {
        userId: user.userId,
        accept
      });
      
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading invitations...</div>;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5" />
          Group Invitations ({invitations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div 
              key={invitation.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={invitation.inviterAvatarUrl || undefined} />
                  <AvatarFallback>
                    {invitation.inviterUsername?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{invitation.groupName}</p>
                  <p className="text-sm text-gray-500">
                    Invited by {invitation.inviterUsername}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleRespond(invitation.id, true)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleRespond(invitation.id, false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
