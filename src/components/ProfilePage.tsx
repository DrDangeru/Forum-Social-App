import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import type { Profile } from '../types/clientTypes';
import { Button } from './ui/button';
import UserTopics from './UserTopics';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { isFriend } = useFriends();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profile/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const handleStartTopic = () => {
    navigate('/topics');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-orange-50/50">
      <div className="w-16 h-16 border-8 border-black border-t-purple-500 animate-spin shadow-neo" />
      <p className="font-black uppercase tracking-widest text-xl italic">Loading Dossier...</p>
    </div>
  );

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-orange-50/50">
        <div className="neo-brutal-card bg-red-100 p-12 text-center border-red-600 max-w-lg">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-3xl font-black uppercase text-red-600 mb-4 tracking-tighter italic">Access Denied</h2>
          <p className="font-bold text-red-800 mb-8">{error || 'Target profile is encrypted or non-existent.'}</p>
          <Button onClick={() => navigate('/')} className="bg-black text-white font-black uppercase tracking-widest px-8">
            Return to HQ
          </Button>
        </div>
      </div>
    );
  }

  const userBasicInfo = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    username: profile.username,
    avatarUrl: profile.avatarUrl
  };

  // Check if the current user can view topics (own profile or friend)
  const canViewTopics = user?.userId === userId || (userId && isFriend(userId));

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-12">
      {/* Profile Header */}
      <div className="neo-brutal-card bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400 border-b-4 border-l-4 border-black -mr-24 -mt-24 rotate-45" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 relative z-10">
          <div className="shrink-0">
            <div className="border-4 border-black shadow-neo bg-white p-1 transition-transform hover:-rotate-3">
              <img
                src={userBasicInfo.avatarUrl || '/default-avatar.png'}
                alt="Profile avatar"
                className="w-40 h-40 object-cover border-2 border-black"
              />
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="inline-block bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest mb-2">
                Operational Operative
              </div>
              <h1 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
                {userBasicInfo.firstName} {userBasicInfo.lastName}
              </h1>
              <p className="text-xl font-bold text-gray-500 italic mt-1">@{userBasicInfo.username}</p>
            </div>

            {profile.bio && (
              <div className="max-w-2xl bg-orange-50 border-2 border-black p-4 shadow-neo-sm">
                <p className="font-bold text-gray-800 leading-tight">"{profile.bio}"</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              {userId && !isFriend(userId) && user?.userId !== userId && (
                <Button className="bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-widest border-2 border-black shadow-neo px-8">
                  Recruit Operative
                </Button>
              )}
              {user?.userId === userId && (
                <Button 
                  onClick={handleStartTopic} 
                  className="bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest border-2 border-black shadow-neo px-8"
                >
                  Broadcast Intel
                </Button>
              )}
              <Button variant="outline" className="border-2 border-black font-black uppercase tracking-widest shadow-neo-sm px-6">
                Share Dossier
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Personal Info */}
        <div className="neo-brutal-card bg-white flex flex-col">
          <div className="bg-purple-400 p-4 border-b-2 border-black">
            <h2 className="text-xl font-black uppercase tracking-tight italic">Bio-Data</h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {[
              { label: 'Age', value: profile.age },
              { label: 'Location', value: profile.location },
              { label: 'Status', value: profile.relationshipStatus },
              { label: 'Sector', value: profile.occupation ? `${profile.occupation}${profile.company ? ` @ ${profile.company}` : ''}` : null }
            ].map((item, i) => (
              <div key={i} className="flex flex-col border-b-2 border-black/5 pb-2 last:border-0">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.label}</span>
                <span className="font-black uppercase tracking-tight text-lg">{item.value || 'CLASSIFIED'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interests & Hobbies */}
        <div className="neo-brutal-card bg-white flex flex-col md:col-span-2">
          <div className="bg-yellow-400 p-4 border-b-2 border-black">
            <h2 className="text-xl font-black uppercase tracking-tight italic">Operational Interests</h2>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-8 flex-1">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b-2 border-black/5 pb-1">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 ? (
                  profile.interests.map((int, i) => (
                    <span key={i} className="px-3 py-1 border-2 border-black bg-white font-bold text-xs uppercase shadow-neo-sm">{int}</span>
                  ))
                ) : <span className="font-bold italic text-gray-400 text-sm">No specialties listed.</span>}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b-2 border-black/5 pb-1">Field Training</h3>
              <div className="flex flex-wrap gap-2">
                {profile.hobbies && Array.isArray(profile.hobbies) && profile.hobbies.length > 0 ? (
                  profile.hobbies.map((hob, i) => (
                    <span key={i} className="px-3 py-1 border-2 border-black bg-purple-100 font-bold text-xs uppercase shadow-neo-sm">{hob}</span>
                  ))
                ) : <span className="font-bold italic text-gray-400 text-sm">No training logged.</span>}
              </div>
            </div>

            {profile.pets && Array.isArray(profile.pets) && profile.pets.length > 0 && (
              <div className="sm:col-span-2 space-y-4">
                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest border-b-2 border-black/5 pb-1">K9 & Avian Units</h3>
                <div className="flex flex-wrap gap-4">
                  {profile.pets.map((pet: { name: string }, i) => (
                    <div key={i} className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-orange-100 shadow-neo-sm">
                      <div className="w-2 h-2 bg-black rotate-45" />
                      <span className="font-black uppercase text-sm italic">{pet.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photo Gallery */}
        {profile.galleryImages && profile.galleryImages.length > 0 && (
          <div className="md:col-span-3 neo-brutal-card bg-white overflow-hidden">
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-black uppercase tracking-widest italic">Visual Intel</h2>
              <span className="text-[10px] font-black bg-white text-black px-2 py-1 uppercase">{profile.galleryImages.length} EXPOSURES</span>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {profile.galleryImages.map((imageUrl: string, index: number) => (
                  <div key={index} className="aspect-square border-4 border-black shadow-neo-sm bg-black overflow-hidden group relative hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer">
                    <img
                      src={imageUrl}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 grayscale-[0.2] group-hover:grayscale-0 transition-all"
                    />
                    <div className="absolute bottom-2 left-2 bg-white border-2 border-black px-2 py-0.5 text-[8px] font-black uppercase">INTEL_0{index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Topics Section */}
      {canViewTopics && userId && (
        <div className="space-y-8">
          <div className="flex items-baseline gap-4">
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Field Reports</h2>
            <div className="h-1 flex-1 bg-black" />
          </div>
          <UserTopics 
            userId={userId} 
            showCreateButton={user?.userId === userId}
            onCreateTopic={handleStartTopic}
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
