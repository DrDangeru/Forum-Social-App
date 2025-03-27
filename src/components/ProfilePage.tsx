import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFriends } from '../hooks/useFriends';
import type { MemberProfile, BasicProfile } from '../../server/types';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { isFriend } = useFriends();
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error || !profile) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error || 'Profile not found or user has not added things yet!'}
      </div>
    );
  }

  const userBasicInfo = profile.friends?.[0] as BasicProfile || {
    firstName: '',
    lastName: '',
    username: '',
    avatarUrl: null
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden">
            <img
              src={userBasicInfo.avatarUrl || '/default-avatar.png'}
              alt="Profile avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">
              {userBasicInfo.firstName} {userBasicInfo.lastName}
            </h1>
            <p className="text-gray-600 mb-4">@{userBasicInfo.username}</p>
            {profile.bio && (
              <p className="text-gray-700 mb-4">{profile.bio}</p>
            )}
            {userId && !isFriend(userId) && user?.userId !== userId && (
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Add Friend
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Age:</span>{' '}
              <span className="text-gray-700">
                {profile.age || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="font-medium">Location:</span>{' '}
              <span className="text-gray-700">
                {profile.location || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="font-medium">Relationship Status:</span>{' '}
              <span className="text-gray-700">
                {profile.profile?.relationshipStatus || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="font-medium">Occupation:</span>{' '}
              <span className="text-gray-700">
                {profile.occupation ? (
                  `${profile.occupation}${
                    profile.company ? ` at ${profile.company}` : ''
                  }`
                ) : (
                  'Not specified'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Interests & Hobbies */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Interests & Hobbies</h2>
          <div className="space-y-3">
            {profile.interests && Array.isArray(profile.interests) && (
              <div>
                <span className="font-medium">Interests:</span>{' '}
                <span className="text-gray-700">
                  {profile.interests.join(', ')}
                </span>
              </div>
            )}
            {profile.hobbies && Array.isArray(profile.hobbies) && (
              <div>
                <span className="font-medium">Hobbies:</span>{' '}
                <span className="text-gray-700">
                  {profile.hobbies.join(', ')}
                </span>
              </div>
            )}
            {profile.pets && Array.isArray(profile.pets) && (
              <div>
                <span className="font-medium">Pets:</span>{' '}
                <span className="text-gray-700">
                  {profile.pets.map((pet: { name: string }) => pet.name).join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Photo Gallery */}
        {profile.galleryImages && profile.galleryImages.length > 0 && (
          <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Photo Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {profile.galleryImages.map((imageUrl: string, index: number) => (
                <div key={index} className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Gallery image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
