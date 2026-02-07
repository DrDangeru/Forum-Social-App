import React, { useEffect, useState } from 'react';
import type { Ad, AdBannerProps } from '../../types/clientTypes';

const AdBanner: React.FC<AdBannerProps> = ({ placement = 'banner',
  className = '' }) => {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAd();
  }, [placement]);

  const fetchAd = async () => {
    try {
      const response = await fetch(`/api/ads/placement/${placement}`);
      if (response.ok) {
        const data = await response.json();
        setAd(data.ad);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    if (!ad) return;
    
    try {
      const response = await fetch(`/api/ads/click/${ad.id}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        window.open(data.linkUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error tracking click:', error);
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading || !ad) {
    return null;
  }

  const placementStyles = {
    banner: 'w-full h-24 md:h-32',
    sidebar: 'w-full h-48',
    feed: 'w-full h-32'
  };

  return (
    <div 
      className={`relative cursor-pointer overflow-hidden border-4 border-black shadow-neo group hover:-translate-y-1 transition-all ${placementStyles[placement]} ${className}`}
      onClick={handleClick}
    >
      <img 
        src={ad.imageUrl} 
        alt={ad.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute top-2 left-2 bg-yellow-400 border-2 border-black text-black text-[10px] font-black uppercase px-2 py-0.5 shadow-neo-sm">
        Intel_Promotion
      </div>
      <div className="absolute bottom-2 right-2 bg-black text-white text-[8px] font-black uppercase px-2 py-1 border border-white/20">
        AD_NODE
      </div>
    </div>
  );
};

export default AdBanner;
