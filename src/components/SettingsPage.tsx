import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import type { LoginHistory, IpRestrictionSettings } from '../types/clientTypes';
import { 
  Shield, 
  History, 
  Lock, 
  Unlock, 
  Smartphone, 
  Monitor, 
  AlertTriangle,
  ArrowLeft,
  Settings as SettingsIcon,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    if (!ua) return { name: 'Unknown device', icon: Monitor };
    if (ua.includes('Windows') || ua.includes('Mac') || ua.includes('Linux')) 
      return { name: ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : 'Linux', icon: Monitor };
    if (ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPad')) 
      return { name: ua.includes('Android') ? 'Android' : 'iOS', icon: Smartphone };
    return { name: 'Unknown device', icon: Monitor };
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-orange-50/50">
        <div className="neo-brutal-card bg-white p-12 text-center border-black max-w-lg">
          <Lock className="h-16 w-16 mx-auto text-black mb-4" />
          <h2 className="text-3xl font-black uppercase text-black mb-4 tracking-tighter italic">Authentication Required</h2>
          <p className="font-bold text-gray-600 mb-8">Access to security parameters requires a valid session.</p>
          <Button onClick={() => navigate('/login')} className="bg-black text-white font-black uppercase tracking-widest px-8 border-2 border-black shadow-neo">
            Authenticate
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-orange-50/50">
        <div className="w-16 h-16 border-8 border-black border-t-yellow-400 animate-spin shadow-neo" />
        <p className="font-black uppercase tracking-widest text-xl italic">Accessing Core Security...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-10 pb-24">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-yellow-400 gap-2 transition-all"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3]" />
          HQ Overview
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 flex items-center gap-3">
            <SettingsIcon className="h-10 w-10 stroke-[3]" />
            Config
          </h1>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-xs">Security protocols and session management</p>
        </div>
      </div>

      {error && (
        <div className="p-4 border-4 border-black bg-red-100 text-red-600 font-black uppercase text-xs shadow-neo flex items-center gap-3">
          <AlertTriangle className="h-5 w-5" />
          PROTOCOL_ERROR: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* IP Security Section */}
        <div className="lg:col-span-7 space-y-8">
          <div className="neo-brutal-card bg-white overflow-hidden">
            <div className="bg-yellow-400 p-4 border-b-4 border-black flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">Security Grid</h2>
              <Shield className="h-6 w-6 stroke-[3]" />
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 border-2 border-black bg-orange-50/50 shadow-neo-sm">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Current IP</span>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="font-mono font-bold text-lg">{ipSettings?.currentIp || 'DETECTING...'}</span>
                  </div>
                </div>
                {ipSettings?.ipRestricted && (
                  <div className="p-4 border-2 border-black bg-green-50 shadow-neo-sm">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Whitelisted IP</span>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-green-600" />
                      <span className="font-mono font-bold text-lg">{ipSettings.allowedIp}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="neo-glass-card p-6 border-4 border-black flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    {ipSettings?.ipRestricted ? <Lock className="h-5 w-5 text-red-600 stroke-[3]" /> : <Unlock className="h-5 w-5 text-green-600 stroke-[3]" />}
                    <h3 className="text-xl font-black uppercase tracking-tight italic">Location Lock</h3>
                  </div>
                  <p className="font-bold text-gray-600 text-sm max-w-sm leading-tight">
                    {ipSettings?.ipRestricted 
                      ? 'ACESS RESTRICTED: Authentication is only permitted from your whitelisted coordinate.'
                      : 'ACESS OPEN: Authentication is permitted from any grid coordinate. Security level: Standard.'}
                  </p>
                </div>
                <Button
                  onClick={handleToggleIpRestriction}
                  disabled={actionLoading}
                  className={cn(
                    "font-black uppercase tracking-widest border-2 border-black shadow-neo px-8 py-6 transition-all min-w-[200px]",
                    ipSettings?.ipRestricted 
                      ? 'bg-red-500 hover:bg-red-400 text-white' 
                      : 'bg-green-500 hover:bg-green-400 text-black'
                  )}
                >
                  {actionLoading 
                    ? 'PROCESSING...' 
                    : ipSettings?.ipRestricted 
                      ? 'DEACTIVATE LOCK' 
                      : 'ACTIVATE LOCK'}
                </Button>
              </div>

              {ipSettings?.ipRestricted && (
                <div className="p-4 border-2 border-black bg-red-50 flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-1" />
                  <p className="text-xs font-bold text-red-800 leading-tight">
                    CRITICAL: If your network coordinate changes, you will lose access to this terminal. 
                    Ensure your connection point is static before proceeding.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Login History Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="neo-brutal-card bg-white overflow-hidden flex flex-col h-full">
            <div className="bg-purple-400 p-4 border-b-4 border-black flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase tracking-tight italic">Access Log</h2>
              <History className="h-6 w-6 stroke-[3]" />
            </div>
            <div className="p-6 flex-1 bg-gray-50/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Recent Activity</span>
                  <span className="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5 shadow-neo-sm">Last 20 Logins</span>
                </div>

                {loginHistory.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-black/10">
                    <p className="font-bold text-gray-400 italic uppercase">No log data found.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loginHistory.map((entry) => {
                      const device = parseUserAgent(entry.userAgent);
                      const isCurrent = ipSettings?.currentIp === entry.ipAddress;
                      return (
                        <div key={entry.id} className={cn(
                          "neo-brutal-card p-4 flex items-center justify-between transition-all hover:-translate-y-1",
                          isCurrent ? "bg-white border-green-500 border-l-8" : "bg-white"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-2 border-2 border-black shadow-neo-sm",
                              isCurrent ? "bg-green-100" : "bg-gray-100"
                            )}>
                              <device.icon className="h-5 w-5 text-black" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-black uppercase tracking-tight text-sm truncate">{device.name} Terminal</span>
                                {isCurrent && <span className="bg-green-500 text-white text-[8px] font-black uppercase px-1 border border-black">Active</span>}
                              </div>
                              <p className="font-mono text-[10px] font-bold text-gray-500">{entry.ipAddress}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">TIMESTAMP</p>
                            <p className="text-[10px] font-bold text-gray-800">{new Date(entry.createdAt).toLocaleDateString()}</p>
                            <p className="text-[10px] font-bold text-gray-800 leading-none">{new Date(entry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest italic">System Monitoring Active</span>
              <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
