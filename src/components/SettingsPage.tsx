import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import type { LoginHistory, IpRestrictionSettings } from '../types/index';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [ipSettings, setIpSettings] = useState<IpRestrictionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, settingsRes] = await Promise.all([
        fetch('/api/settings/login-history', { credentials: 'include' }),
        fetch('/api/settings/ip-restriction', { credentials: 'include' })
      ]);

      if (!historyRes.ok || !settingsRes.ok) {
        throw new Error('Failed to fetch settings');
      }

      const historyData = await historyRes.json();
      const settingsData = await settingsRes.json();

      setLoginHistory(historyData.history || []);
      setIpSettings(settingsData);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleIpRestriction = async () => {
    if (!ipSettings) return;
    
    setActionLoading(true);
    setError(null);
    
    try {
      const endpoint = ipSettings.ipRestricted 
        ? '/api/settings/ip-restriction/disable'
        : '/api/settings/ip-restriction/enable';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to update IP restriction');
      }

      const data = await response.json();
      setIpSettings({
        ...ipSettings,
        ipRestricted: data.ipRestricted,
        allowedIp: data.allowedIp
      });
    } catch (err) {
      setError('Failed to update IP restriction');
      console.error('Error updating IP restriction:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const parseUserAgent = (ua: string | null) => {
    if (!ua) return 'Unknown device';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    return 'Unknown device';
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Please log in to view settings.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* IP Restriction Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">IP Security</h2>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            <strong>Your current IP:</strong> {ipSettings?.currentIp || 'Unknown'}
          </p>
          {ipSettings?.ipRestricted && (
            <p className="text-gray-600 mb-2">
              <strong>Allowed IP:</strong> {ipSettings.allowedIp}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Restrict login to current IP only</h3>
            <p className="text-sm text-gray-500">
              {ipSettings?.ipRestricted 
                ? 'Only your current IP address can log into this account.'
                : 'Anyone with your credentials can log in from any IP address.'}
            </p>
          </div>
          <Button
            onClick={handleToggleIpRestriction}
            disabled={actionLoading}
            className={ipSettings?.ipRestricted 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'}
          >
            {actionLoading 
              ? 'Processing...' 
              : ipSettings?.ipRestricted 
                ? 'Disable Restriction' 
                : 'Enable Restriction'}
          </Button>
        </div>

        {ipSettings?.ipRestricted && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> If your IP address changes, you will not be able to log in. 
              Make sure you have a stable IP before enabling this feature.
            </p>
          </div>
        )}
      </div>

      {/* Login History Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Login History</h2>
        <p className="text-gray-500 text-sm mb-4">Last 20 login attempts</p>

        {loginHistory.length === 0 ? (
          <p className="text-gray-500">No login history available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Date & Time</th>
                  <th className="text-left py-3 px-2">IP Address</th>
                  <th className="text-left py-3 px-2">Device</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">{formatDate(entry.createdAt)}</td>
                    <td className="py-3 px-2 font-mono text-xs">
                      {entry.ipAddress}
                      {ipSettings?.currentIp === entry.ipAddress && (
                        <span className="ml-2 text-green-600 text-xs">(current)</span>
                      )}
                    </td>
                    <td className="py-3 px-2">{parseUserAgent(entry.userAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
