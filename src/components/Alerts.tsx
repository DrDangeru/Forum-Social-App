import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  RefreshCw
} from 'lucide-react';
import { AlertItem, AlertsResponse } from '../types/clientTypes';
import './Alerts.css';

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
      setCounts(response.data.counts);
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
      <div className="alerts-container">
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h1 className="alerts-title">
          <Bell className="h-6 w-6" />
          Alerts
        </h1>
        <Button variant="outline" size="sm" onClick={fetchAlerts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="alerts-summary">
        <Card className="summary-card">
          <CardContent className="pt-4">
            <div className="summary-icon friend-request">
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="summary-count">{counts.friendRequests}</div>
            <div className="summary-label">Friend Requests</div>
          </CardContent>
        </Card>
        <Card className="summary-card">
          <CardContent className="pt-4">
            <div className="summary-icon group-invitation">
              <Users className="h-5 w-5" />
            </div>
            <div className="summary-count">{counts.groupInvitations}</div>
            <div className="summary-label">Group Invitations</div>
          </CardContent>
        </Card>
        <Card className="summary-card">
          <CardContent className="pt-4">
            <div className="summary-icon topic-update">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="summary-count">{counts.topicUpdates}</div>
            <div className="summary-label">Topic Updates</div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="alerts-list-card">
        <CardHeader>
          <CardTitle className="text-lg">All Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="empty-alerts">
              <Bell className="h-12 w-12 text-gray-300" />
              <p>No new alerts</p>
              <span>You're all caught up!</span>
            </div>
          ) : (
            <div className="alerts-list">
              {alerts.map((alert) => (
                <div key={alert.id} className="alert-item">
                  <div className="alert-icon">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="alert-content">
                    <div className="alert-header-row">
                      {alert.fromAvatarUrl && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={alert.fromAvatarUrl} />
                          <AvatarFallback>
                            {alert.fromUsername?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="alert-text">
                        <p className="alert-message">{alert.message}</p>
                        <span className="alert-time">{formatTime(alert.createdAt)}</span>
                      </div>
                    </div>
                    {renderAlertActions(alert)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
