import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import type { Ad, AdPlacement } from '../types/index';

interface AdStats {
  totalAds: number;
  activeAds: number;
  totalClicks: number;
  totalImpressions: number;
}

interface AdFormData {
  title: string;
  imageUrl: string;
  linkUrl: string;
  placement: AdPlacement;
  isActive: boolean;
}

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
    if (!confirm('Are you sure you want to delete this ad?')) return;

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
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Access denied. Admin privileges required.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard - Ads Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalAds}</div>
            <div className="text-gray-500 text-sm">Total Ads</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.activeAds}</div>
            <div className="text-gray-500 text-sm">Active Ads</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalImpressions}</div>
            <div className="text-gray-500 text-sm">Impressions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.totalClicks}</div>
            <div className="text-gray-500 text-sm">Clicks</div>
          </div>
        </div>
      )}

      {/* Add New Ad Button */}
      <div className="mb-6">
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600"
        >
          + Create New Ad
        </Button>
      </div>

      {/* Ad Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">
              {editingAd ? 'Edit Ad' : 'Create New Ad'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="https://example.com/ad-image.jpg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Link URL</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="https://example.com/landing-page"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Placement</label>
                  <select
                    value={formData.placement}
                    onChange={(e) => setFormData({ ...formData, placement: e.target.value as AdPlacement })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="banner">Banner (Top)</option>
                    <option value="sidebar">Sidebar</option>
                    <option value="feed">In-Feed</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm">Active</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" onClick={cancelForm} variant="outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingAd ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ads Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4">Preview</th>
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Placement</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Stats</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ads.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No ads yet. Create your first ad!
                </td>
              </tr>
            ) : (
              ads.map((ad) => (
                <tr key={ad.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <img 
                      src={ad.imageUrl} 
                      alt={ad.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{ad.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">{ad.linkUrl}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                      {ad.placement}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className={`px-2 py-1 rounded text-sm ${
                        ad.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {ad.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div>{ad.impressions} views</div>
                    <div>{ad.clicks} clicks</div>
                    <div className="text-gray-500">
                      {ad.impressions > 0 
                        ? ((ad.clicks / ad.impressions) * 100).toFixed(1) 
                        : 0}% CTR
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(ad)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
