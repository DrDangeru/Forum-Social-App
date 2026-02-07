import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Star, X, Globe } from 'lucide-react';
import type { WelcomeModalProps } from '../types/clientTypes';

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, userName, userRegion }) => {
  const navigate = useNavigate();
  const [newRegion, setNewRegion] = useState('');
  const [regionSet, setRegionSet] = useState(!!userRegion);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const goTo = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleSetRegion = async () => {
    if (!newRegion.trim()) return;
    try {
      const res = await fetch('/api/regional/set-region', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ region: newRegion.trim() })
      });
      if (res.ok) {
        setRegionSet(true);
        setNewRegion('');
        setError(null);
      } else {
        setError('Failed to set region');
      }
    } catch {
      setError('Failed to set region');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black shadow-neo w-full max-w-md mx-4">
        <div className="bg-yellow-400 border-b-4 border-black p-4 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-tight">
            Welcome back, {userName}!
          </h2>
          <button
            onClick={onClose}
            className="p-1 border-2 border-black bg-white hover:bg-red-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {!regionSet && (
            <div className="p-4 border-2 border-black bg-blue-50 space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-black uppercase tracking-wider text-blue-700">Set Your Region</p>
              </div>
              <p className="text-xs font-bold text-gray-500">Country code or city (e.g. US, EU, NYC)</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value.toUpperCase())}
                  placeholder="REGION..."
                  className="flex-1 px-3 py-2 border-2 border-black font-black uppercase text-sm"
                />
                <button
                  onClick={handleSetRegion}
                  disabled={!newRegion.trim()}
                  className="px-4 py-2 border-2 border-black bg-blue-500 text-white font-black uppercase text-xs hover:bg-blue-400 disabled:opacity-50 transition-colors"
                >
                  Set
                </button>
              </div>
              {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            </div>
          )}

          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Browse:
          </p>

          <button
            onClick={() => goTo('/followed')}
            className="w-full flex items-center gap-4 p-4 border-2 border-black bg-white hover:bg-purple-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-neo-sm transition-all text-left"
          >
            <Star className="h-6 w-6 text-purple-600 flex-shrink-0" />
            <div>
              <h3 className="font-black uppercase text-sm">Followed Topics</h3>
              <p className="text-xs text-gray-500 font-bold">Your subscribed discussions</p>
            </div>
          </button>

          <button
            onClick={() => goTo('/regional')}
            className="w-full flex items-center gap-4 p-4 border-2 border-black bg-white hover:bg-blue-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-neo-sm transition-all text-left"
          >
            <MapPin className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-black uppercase text-sm">Regional Feed</h3>
              <p className="text-xs text-gray-500 font-bold">What's happening in your area</p>
            </div>
          </button>

          <button
            onClick={() => goTo('/friends')}
            className="w-full flex items-center gap-4 p-4 border-2 border-black bg-white hover:bg-green-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none shadow-neo-sm transition-all text-left"
          >
            <Users className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <h3 className="font-black uppercase text-sm">Friend Updates</h3>
              <p className="text-xs text-gray-500 font-bold">See what your squad is up to</p>
            </div>
          </button>

          <button
            onClick={onClose}
            className="w-full mt-2 p-3 border-2 border-black bg-gray-100 hover:bg-gray-200 font-black uppercase text-xs tracking-widest transition-colors"
          >
            Stay on Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
