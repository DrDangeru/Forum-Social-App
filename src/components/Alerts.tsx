import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { 
  Bell, 
  UserPlus, 
  Users, 
  MessageSquare, 
  Check, 
  X,
  RefreshCw,
  Zap
} from 'lucide-react';
import { AlertItem, AlertsResponse } from '../types/clientTypes';
import { cn } from '../lib/utils';

const Alerts: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [counts, setCounts] = useState({ friendRequests: 0, groupInvitations: 0, topicUpdates: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get<AlertsResponse>('/api/alerts');
      setAlerts(response.data.alerts);
      setCounts({
        friendRequests: response.data.counts.friendRequests,
        groupInvitations: response.data.counts.groupInvitations,
        topicUpdates: response.data.counts.topicUpdates || 0,
        total: response.data.counts.total
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      await axios.post(`/api/alerts/friend-request/${requestId}/accept`);
      setAlerts(prev => prev.filter(a => a.id !== `fr_${requestId}`));
      setCounts(prev => ({ ...prev, friendRequests: prev.friendRequests - 1, total: prev.total - 1 }));
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId);
      await axios.post(`/api/alerts/friend-request/${requestId}/decline`);
      setAlerts(prev => prev.filter(a => a.id !== `fr_${requestId}`));
      setCounts(prev => ({ ...prev, friendRequests: prev.friendRequests - 1, total: prev.total - 1 }));
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptGroupInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await axios.post(`/api/alerts/group-invitation/${invitationId}/accept`);
      setAlerts(prev => prev.filter(a => a.id !== `gi_${invitationId}`));
      setCounts(prev => ({ ...prev, groupInvitations: prev.groupInvitations - 1, total: prev.total - 1 }));
    } catch (error) {
      console.error('Failed to accept group invitation:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineGroupInvitation = async (invitationId: string) => {
    try {
      setActionLoading(invitationId);
      await axios.post(`/api/alerts/group-invitation/${invitationId}/decline`);
      setAlerts(prev => prev.filter(a => a.id !== `gi_${invitationId}`));
      setCounts(prev => ({ ...prev, groupInvitations: prev.groupInvitations - 1, total: prev.total - 1 }));
    } catch (error) {
      console.error('Failed to decline group invitation:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'group_invitation':
        return <Users className="h-5 w-5 text-purple-500" />;
      case 'topic_update':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderAlertActions = (alert: AlertItem) => {
    const isLoading = actionLoading === alert.relatedId?.toString();
    
    if (alert.type === 'friend_request') {
      return (
        <div className="alert-actions">
          <Button 
            size="sm" 
            className="accept-btn"
            onClick={() => handleAcceptFriendRequest(alert.relatedId!.toString())}
            disabled={isLoading}
          >
            <Check className="h-4 w-4" />
            Accept
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="decline-btn"
            onClick={() => handleDeclineFriendRequest(alert.relatedId!.toString())}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Decline
          </Button>
        </div>
      );
    }

    if (alert.type === 'group_invitation') {
      return (
        <div className="alert-actions">
          <Button 
            size="sm" 
            className="accept-btn"
            onClick={() => handleAcceptGroupInvitation(alert.relatedId!.toString())}
            disabled={isLoading}
          >
            <Check className="h-4 w-4" />
            Join
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="decline-btn"
            onClick={() => handleDeclineGroupInvitation(alert.relatedId!.toString())}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Decline
          </Button>
        </div>
      );
    }

    if (alert.type === 'topic_update') {
      return (
        <Link to={`/topics/${alert.relatedId}`}>
          <Button size="sm" variant="outline" className="view-btn">
            View Topic
          </Button>
        </Link>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <RefreshCw className="h-12 w-12 animate-spin text-black" />
        <p className="font-black uppercase tracking-widest italic">Intercepting Signals...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 flex items-center gap-3">
            <Bell className="h-10 w-10 stroke-[3]" />
            Alerts
          </h1>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-xs">Real-time intelligence and incoming protocols</p>
        </div>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={fetchAlerts}
          className="border-2 border-black font-black uppercase tracking-widest shadow-neo-sm hover:bg-yellow-400 relative z-10"
        >
          <RefreshCw className="h-4 w-4 mr-2 stroke-[3]" />
          Sync
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Recruits', count: counts.friendRequests, icon: UserPlus, color: 'bg-blue-400' },
          { label: 'Intel', count: counts.topicUpdates, icon: MessageSquare, color: 'bg-green-400' },
          { label: 'Ops', count: counts.groupInvitations, icon: Users, color: 'bg-purple-400' }
        ].map((item, i) => (
          <div key={i} className="neo-brutal-card bg-white p-6 flex items-center gap-4 group hover:-translate-rotate-1 transition-all">
            <div className={cn("p-3 border-2 border-black shadow-neo-sm", item.color)}>
              <item.icon className="h-6 w-6 text-black" />
            </div>
            <div>
              <div className="text-3xl font-black">{item.count}</div>
              <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts List */}
      <div className="neo-brutal-card bg-white overflow-hidden">
        <div className="bg-black text-white p-4 border-b-2 border-black flex items-center justify-between">
          <h2 className="font-black uppercase tracking-widest italic flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Active Feed
          </h2>
          <span className="text-[10px] font-black uppercase bg-white text-black px-2 py-0.5">{alerts.length} NOTIFICATIONS</span>
        </div>
        
        <div className="divide-y-2 divide-black/5">
          {alerts.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 mx-auto border-4 border-dashed border-black/10 flex items-center justify-center rotate-12">
                <Bell className="h-10 w-10 text-black/10" />
              </div>
              <p className="font-black uppercase text-gray-400 italic text-xl">Static on all channels.</p>
              <p className="font-bold text-gray-400 text-sm">You're fully up to date, operative.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-orange-50/30 transition-colors flex items-start gap-6 group">
                <div className="shrink-0 mt-1">
                  <div className="p-2 border-2 border-black bg-white shadow-neo-sm group-hover:shadow-none group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                    {getAlertIcon(alert.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {alert.fromAvatarUrl && (
                        <div className="border-2 border-black overflow-hidden shadow-neo-sm h-10 w-10">
                          <Avatar className="rounded-none h-full w-full">
                            <AvatarImage src={alert.fromAvatarUrl} className="rounded-none" />
                            <AvatarFallback className="rounded-none bg-yellow-400 font-black">
                              {alert.fromUsername?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      )}
                      <div>
                        <p className="font-black uppercase tracking-tight text-lg leading-none">{alert.message}</p>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatTime(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Area */}
                  <div className="flex items-center gap-3">
                    {renderAlertActions(alert)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
