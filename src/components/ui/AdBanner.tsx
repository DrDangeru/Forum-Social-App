import React, { useEffect, useState } from 'react';
import type { Ad } from '../../types/clientTypes';

interface AdBannerProps {
  placement?: 'banner' | 'sidebar' | 'feed';
  className?: string;
}

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
      className={`relative cursor-pointer overflow-hidden rounded-lg ${placementStyles[placement]} ${className}`}
      onClick={handleClick}
    >
      <img 
        src={ad.imageUrl} 
        alt={ad.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
        Ad
      </div>
    </div>
  );
};

export default AdBanner;
