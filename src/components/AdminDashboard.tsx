import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import type { Ad, AdPlacement, AdFormData, AdStats } from '../types/clientTypes';
import { 
  BarChart3, 
  Plus, 
  Settings, 
  Trash2, 
  Edit3, 
  Eye, 
  MousePointer2, 
  Activity,
  ShieldCheck,
  X,
  Zap,
  Globe,
  Layout,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '../lib/utils';

const initialFormData: AdFormData = {
  title: '',
  imageUrl: '',
  linkUrl: '',
  placement: 'banner',
  isActive: true
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [formData, setFormData] = useState<AdFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [adsRes, statsRes] = await Promise.all([
        fetch('/api/admin/ads/all', { credentials: 'include' }),
        fetch('/api/admin/ads/stats', { credentials: 'include' })
      ]);

      if (!adsRes.ok || !statsRes.ok) {
        if (adsRes.status === 403 || statsRes.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        }
        throw new Error('Failed to fetch data');
      }

      const adsData = await adsRes.json();
      const statsData = await statsRes.json();

      setAds(adsData.ads || []);
      setStats(statsData.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = editingAd 
        ? `/api/admin/ads/${editingAd.id}` 
        : '/api/admin/ads';
      
      const response = await fetch(url, {
        method: editingAd ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save ad');
      }

      setShowForm(false);
      setEditingAd(null);
      setFormData(initialFormData);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save ad');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      placement: ad.placement,
      isActive: !!ad.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (adId: number) => {
    if (!confirm('Confirm termination of this promotion?')) return;

    try {
      const response = await fetch(`/api/admin/ads/${adId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete ad');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete ad');
    }
  };

  const handleToggleActive = async (ad: Ad) => {
    try {
      const response = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !ad.isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update ad');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ad');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingAd(null);
    setFormData(initialFormData);
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-orange-50/50">
        <div className="neo-brutal-card bg-red-100 p-12 text-center border-red-600 max-w-lg">
          <ShieldCheck className="h-16 w-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-3xl font-black uppercase text-red-600 mb-4 tracking-tighter italic">Access Restricted</h2>
          <p className="font-bold text-red-800 mb-8">Admin clearance required for sector access.</p>
          <Button onClick={() => window.location.href = '/'} className="bg-black text-white font-black uppercase tracking-widest px-8">
            Return to Surface
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-orange-50/50">
        <div className="w-16 h-16 border-8 border-black border-t-green-500 animate-spin shadow-neo" />
        <p className="font-black uppercase tracking-widest text-xl italic">Synchronizing Admin Data...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl space-y-10 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 flex items-center gap-3">
            <LayoutDashboard className="h-10 w-10 stroke-[3]" />
            Control
          </h1>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-xs">Promotion Management & Network Metrics</p>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          size="lg"
          className="relative z-10 bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo px-8 font-black uppercase tracking-widest"
        >
          <Plus className="h-5 w-5 mr-2 stroke-[3]" />
          New Promotion
        </Button>
      </div>

      {error && (
        <div className="p-4 border-4 border-black bg-red-100 text-red-600 font-black uppercase text-xs shadow-neo flex items-center gap-3">
          <ShieldCheck className="h-5 w-5" />
          ADMIN_ERROR: {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Inventory', value: stats.totalAds, icon: Layout, color: 'bg-blue-400' },
            { label: 'Deployed', value: stats.activeAds, icon: Zap, color: 'bg-green-400' },
            { label: 'Exposures', value: stats.totalImpressions, icon: Eye, color: 'bg-purple-400' },
            { label: 'Engagements', value: stats.totalClicks, icon: MousePointer2, color: 'bg-yellow-400' }
          ].map((item, i) => (
            <div key={i} className="neo-brutal-card bg-white p-6 flex items-center gap-4 group hover:-translate-rotate-1 transition-all">
              <div className={cn("p-3 border-2 border-black shadow-neo-sm", item.color)}>
                <item.icon className="h-6 w-6 text-black" />
              </div>
              <div>
                <div className="text-3xl font-black tracking-tighter">{item.value}</div>
                <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ad Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-neo-lg w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-yellow-400 p-4 border-b-4 border-black flex items-center justify-between text-black font-black uppercase italic tracking-tight">
              <h2 className="text-xl">{editingAd ? 'Edit_Protocol' : 'New_Protocol'}</h2>
              <button onClick={cancelForm} className="hover:rotate-90 transition-transform">
                <X className="h-6 w-6 stroke-[3]" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="font-black uppercase tracking-widest text-[10px]">Subject Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border-2 border-black p-3 font-bold shadow-neo-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all"
                  placeholder="PROMO_DESIGNATION"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="font-black uppercase tracking-widest text-[10px]">Asset URL (Image)</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full border-2 border-black p-3 font-bold shadow-neo-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all"
                  placeholder="https://intel.node/asset.jpg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="font-black uppercase tracking-widest text-[10px]">Destination Node (Link)</label>
                <input
                  type="url"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full border-2 border-black p-3 font-bold shadow-neo-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all"
                  placeholder="https://target.grid/landing"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="font-black uppercase tracking-widest text-[10px]">Placement Sector</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value as AdPlacement })}
                    className="w-full border-2 border-black p-3 font-black uppercase text-xs shadow-neo-sm appearance-none bg-white"
                  >
                    <option value="banner">BANNER (TOP)</option>
                    <option value="sidebar">SIDEBAR</option>
                    <option value="feed">IN-FEED</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="font-black uppercase tracking-widest text-[10px]">Status</label>
                  <label className={cn(
                    "flex items-center gap-3 p-3 border-2 border-black cursor-pointer transition-all shadow-neo-sm h-[50px]",
                    formData.isActive ? "bg-green-100" : "bg-red-50"
                  )}>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-5 w-5 border-2 border-black rounded-none appearance-none checked:bg-black transition-colors"
                    />
                    <span className="font-black uppercase text-xs">{formData.isActive ? 'ACTIVE' : 'OFFLINE'}</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo px-10 py-6 font-black uppercase tracking-widest"
                >
                  {submitting ? 'EXECUTING...' : editingAd ? 'UPDATE_PROTOCOL' : 'DEPLOY_PROTOCOL'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ads List Redesign */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic whitespace-nowrap">Operational Inventory</h2>
          <div className="h-1 flex-1 bg-black" />
          <span className="text-[10px] font-black uppercase bg-black text-white px-3 py-1 shadow-neo-sm">{ads.length} UNITS</span>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {ads.length === 0 ? (
            <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-24 text-center space-y-6">
              <BarChart3 className="h-20 w-20 mx-auto text-black/10 stroke-[1]" />
              <div>
                <p className="text-2xl font-black uppercase text-gray-400 italic">Inventory Depleted</p>
                <p className="font-bold text-gray-400 mt-2">No active promotions detected in the grid.</p>
              </div>
              <Button onClick={() => setShowForm(true)} className="bg-black text-white font-black uppercase px-10 py-4 border-2 border-black shadow-neo">
                Establish Protocol
              </Button>
            </div>
          ) : (
            ads.map((ad) => (
              <div key={ad.id} className="neo-brutal-card bg-white overflow-hidden flex flex-col md:flex-row group transition-all hover:-translate-y-1">
                <div className="md:w-64 h-48 md:h-auto border-b-2 md:border-b-0 md:border-r-4 border-black relative bg-black flex items-center justify-center overflow-hidden">
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black text-white border border-white/20 text-[8px] font-black uppercase">PREVIEW_NODE</div>
                </div>
                
                <div className="flex-1 p-8 flex flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "px-2 py-0.5 border-2 border-black text-[10px] font-black uppercase shadow-neo-sm",
                          ad.isActive ? "bg-green-400 text-black" : "bg-red-500 text-white"
                        )}>
                          {ad.isActive ? "ONLINE" : "OFFLINE"}
                        </div>
                        <div className="px-2 py-0.5 border-2 border-black bg-purple-400 text-[10px] font-black uppercase shadow-neo-sm flex items-center gap-1">
                          <Layout className="h-3 w-3" /> {ad.placement}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Efficiency</span>
                          <span className="font-black text-sm">{ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0}%</span>
                        </div>
                        <Activity className="h-4 w-4 text-gray-300" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-3xl font-black uppercase tracking-tight italic group-hover:underline decoration-4 decoration-yellow-400">{ad.title}</h3>
                      <p className="font-mono text-xs font-bold text-gray-400 mt-1 truncate max-w-md italic">{ad.linkUrl}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t-2 border-black/5">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Exposures</span>
                        <span className="font-black flex items-center gap-2 italic">
                          <Eye className="h-4 w-4 stroke-[3]" /> {ad.impressions}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Engagements</span>
                        <span className="font-black flex items-center gap-2 italic">
                          <MousePointer2 className="h-4 w-4 stroke-[3]" /> {ad.clicks}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleToggleActive(ad)}
                        className="border-2 border-black font-black uppercase text-[10px] shadow-neo-sm hover:bg-yellow-400 transition-all"
                      >
                        {ad.isActive ? 'DISABLE' : 'ACTIVATE'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(ad)}
                        className="border-2 border-black font-black uppercase text-[10px] shadow-neo-sm hover:bg-blue-400 transition-all"
                      >
                        <Edit3 className="h-3 w-3 mr-1 stroke-[3]" /> EDIT
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDelete(ad.id)}
                        className="border-2 border-black font-black uppercase text-[10px] shadow-neo-sm transition-all"
                      >
                        <Trash2 className="h-3 w-3 mr-1 stroke-[3]" /> SCRAP
                      </Button>
                    </div>
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

export default AdminDashboard;
