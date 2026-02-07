import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Pencil, 
  Save, 
  X, 
  Plus, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Shield, 
  Briefcase, 
  User, 
  MapPin, 
  Heart, 
  Dog, 
  History,
  Lock,
  Monitor,
  Smartphone,
  AlertTriangle,
  Zap,
  Globe,
  Terminal,
  Calendar
} from 'lucide-react';
import type { Profile, LoginHistory, IpRestrictionSettings, PersonalDetailsProps } from '../types/clientTypes';
import { useProfile } from '../hooks/useProfile';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useParams } from 'react-router-dom';
import { SendFriendRequest } from './FriendRequests';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { Textarea } from './ui/textarea';

const PersonalDetailsPage: React.FC<PersonalDetailsProps> = ({ isOwner }) => {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [details, setDetails] = useState<Profile>(
    profile || {
      userId: '',
      firstName: '',
      lastName: '',
      username: '',
      bio: '',
      location: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      socialLinks: null,
      relationshipStatus: null,
      interests: [],
      hobbies: [],
      pets: [],
      avatarUrl: null,
      galleryImages: []
    }
  );

  // Update details when profile changes
  useEffect(() => {
    if (profile) {
      setDetails(profile);
      setGalleryImages(profile.galleryImages || []);
    }
  }, [profile]);

  const handleChange = (field: string, value: any) => {
    setDetails((prevDetails) => {
      // Handle nested properties (e.g., 'profile.relationshipStatus')
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prevDetails,
          [parent]: {
            ...(prevDetails[parent as keyof Profile] as any),
            [child]: value
          }
        };
      }
      
      // Handle top-level properties
      return {
        ...prevDetails,
        [field]: value,
      };
    });
  }; // Updated to handle nested properties
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>(details.galleryImages || []);
  const [isUploading, setIsUploading] = useState(false);

  // Account Settings state
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [ipSettings, setIpSettings] = useState<IpRestrictionSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch account settings data
  const fetchSettingsData = useCallback(async () => {
    if (!isOwner || !user) return;
    setSettingsError(null);
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
      setSettingsError('Failed to load account settings');
      console.error('Error fetching settings:', err);
    }
  }, [isOwner, user]);

  useEffect(() => {
    fetchSettingsData();
  }, [fetchSettingsData]);

  const handleToggleIpRestriction = async () => {
    if (!ipSettings) return;
    
    setActionLoading(true);
    setSettingsError(null);
    
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
      setSettingsError('Failed to update IP restriction');
      console.error('Error updating IP restriction:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const parseUserAgent = (ua: string | null): { name: string; icon: any } => {
    if (!ua) return { name: 'Unknown device', icon: Monitor };
    if (ua.includes('Windows')) return { name: 'Windows', icon: Monitor };
    if (ua.includes('Mac')) return { name: 'macOS', icon: Monitor };
    if (ua.includes('Linux')) return { name: 'Linux', icon: Monitor };
    if (ua.includes('Android')) return { name: 'Android', icon: Smartphone };
    if (ua.includes('iPhone') || ua.includes('iPad')) return { name: 'iOS', icon: Smartphone };
    return { name: 'Unknown device', icon: Monitor };
  };

  const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.userId) return;
    
    try {
      setIsUploading(true);
      
      // Create form data for upload - use a single file
      const formData = new FormData();
      formData.append('files', file);
      
      console.log('Uploading profile picture:', {
        userId: user.userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      // Upload file to server - don't specify content-type, let browser set it
      const response = await axios.post(`/api/upload/${user.userId}`, formData);
      console.log('Profile picture upload response:', response.data);
      
      if (!response.data.files || response.data.files.length === 0) {
        throw new Error('No files were uploaded');
      }
      
      // Get the file info from the response
      const fileInfo = response.data.files[0];
      
      // Get the server-relative path for the avatar
      // Standardize to use /uploads prefix
      const filePath = fileInfo.path ? 
        (fileInfo.path.startsWith('/uploads') ? fileInfo.path : `/uploads/${user.userId}/${fileInfo.filename}`) : 
        `/uploads/${user.userId}/${fileInfo.filename}`;
      
      // Save the profile immediately to persist the change
      const updatedDetails = {
        ...details,
        avatarUrl: filePath
      };
      await updateProfile(updatedDetails);
      console.log('Profile updated with new avatar:', filePath);
      
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response error:', error.response.data);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !user?.userId) return;
    
    try {
      setIsUploading(true);
      
      // Create form data for upload
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      console.log('Uploading gallery images:', Array.from(files).map(file => ({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })));
      
      // Upload files to server - let browser set the Content-Type header
      const response = await axios.post(`/api/upload/${user.userId}`, formData);
      console.log('Gallery upload response:', response.data);
      
      if (response.data.files && response.data.files.length > 0) {
        // Add the server-relative paths to the gallery
        const newPaths = response.data.files
          .filter((file: any) => file && (file.path || file.filename))
          .map((file: any) => file.path || `/uploads/${user.userId}/${file.filename}`);
        
        if (newPaths.length > 0) {
          const updatedGallery = [...galleryImages, ...newPaths];
          setGalleryImages(updatedGallery);
          
          // Save the profile immediately to persist the change
          const updatedDetails = {
            ...details,
            galleryImages: updatedGallery
          };
          await updateProfile(updatedDetails);
          console.log('Profile updated with new gallery images:', newPaths);
        }
      }
    } catch (error) {
      console.error('Failed to upload gallery images:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response error:', error.response.data);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryImage = async (index: number) => {
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updatedGallery);
    
    // Save the profile immediately to persist the change
    try {
      const updatedDetails = {
        ...details,
        galleryImages: updatedGallery
      };
      await updateProfile(updatedDetails);
      console.log('Profile updated after removing gallery image');
    } catch (error) {
      console.error('Failed to update profile after removing gallery image:', error);
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      // Include gallery images in the profile update
      const updatedDetails = {
        ...details,
        galleryImages
      };
      console.log('Saving profile with data:', updatedDetails);
      await updateProfile(updatedDetails);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDetails(profile || {
      userId: '',
      firstName: '',
      lastName: '',
      username: '',
      bio: '',
      location: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      socialLinks: null,
      relationshipStatus: null,
      interests: [],
      hobbies: [],
      pets: [],
      avatarUrl: null,
      galleryImages: []
    });
    setGalleryImages(profile?.galleryImages || []);
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl space-y-12 pb-32">
      <div className="neo-brutal-card bg-white overflow-hidden">
        <div className="bg-black text-white p-6 border-b-4 border-black flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Personal_Dossier</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-1">Operational Personnel Records</p>
          </div>
          <div className="flex items-center gap-4">
            {isOwner ? (
              <div className="flex gap-3">
                {!isEditing ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-neo-sm font-black uppercase text-xs"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Modify Entry
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-400 text-black border-2 border-black shadow-neo-sm font-black uppercase text-xs"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Commit Changes
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleCancel}
                      className="border-2 border-black shadow-neo-sm font-black uppercase text-xs"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Abort
                    </Button>
                  </>
                )}
              </div>
            ) : (
              userId && <SendFriendRequest userId={userId} />
            )}
          </div>
        </div>

        <div className="p-8 space-y-12">
          {/* Profile Picture Section */}
          <div className="flex flex-col md:flex-row items-center gap-10 pb-12 border-b-4 border-black/5">
            <div className="relative shrink-0">
              <div className="border-4 border-black shadow-neo bg-white p-1 transition-transform hover:rotate-3">
                <Avatar className="h-40 w-40 rounded-none border-2 border-black">
                  {details.avatarUrl ? (
                    <AvatarImage src={details.avatarUrl} alt="Profile" className="rounded-none object-cover" />
                  ) : (
                    <AvatarFallback className="rounded-none bg-orange-400 font-black text-4xl">
                      {details.firstName?.[0]}{details.lastName?.[0]}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-4 -right-4 p-3 bg-yellow-400 border-2 border-black shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <Upload className="h-6 w-6 stroke-[3]" />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleProfilePicUpload}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Subject Designation</span>
                <h2 className="text-5xl font-black uppercase tracking-tighter italic leading-none">
                  {details.firstName} {details.lastName}
                </h2>
                <p className="text-xl font-bold text-purple-600 italic">@{details.username}</p>
              </div>
              
              <div className="relative max-w-2xl">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="font-black uppercase tracking-widest text-[10px]">Transmission Summary (Bio)</Label>
                    <Input
                      id="bio"
                      value={details.bio || ''}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      className="font-bold h-12"
                      placeholder="ENTER_SITREP..."
                    />
                  </div>
                ) : (
                  <div className="bg-orange-50 border-4 border-black p-4 shadow-neo-sm relative">
                    <div className="absolute -top-3 -left-3 bg-white border-2 border-black px-2 py-0.5 text-[10px] font-black uppercase">SITREP</div>
                    <p className="font-bold text-gray-800 leading-tight italic">
                      "{details.bio || 'NO_TRANSMISSION_DATA_RECORDED.'}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic & Work Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="neo-brutal-card bg-white flex flex-col overflow-hidden">
              <div className="bg-yellow-400 p-4 border-b-2 border-black">
                <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2 text-black">
                  <User className="h-5 w-5" /> Bio-Data
                </h3>
              </div>
              <div className="p-6 space-y-6 flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-[10px] font-black uppercase">First Name</Label>
                        <Input id="firstName" value={details.firstName || ''} onChange={(e) => handleChange('firstName', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-[10px] font-black uppercase">Last Name</Label>
                        <Input id="lastName" value={details.lastName || ''} onChange={(e) => handleChange('lastName', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-[10px] font-black uppercase">Callsign</Label>
                      <Input id="username" value={details.username || ''} onChange={(e) => handleChange('username', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-[10px] font-black uppercase">Age</Label>
                        <Input id="age" type="number" value={details.age || ''} onChange={(e) => handleChange('age', parseInt(e.target.value) || undefined)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-[10px] font-black uppercase">Coordinates</Label>
                        <Input id="location" value={details.location || ''} onChange={(e) => handleChange('location', e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="region" className="text-[10px] font-black uppercase text-blue-600">Operational Sector (Region)</Label>
                      <Input id="region" value={details.region || ''} onChange={(e) => handleChange('region', e.target.value.toUpperCase())} placeholder="US, UK, NYC..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="relationshipStatus" className="text-[10px] font-black uppercase">Uplink Status</Label>
                      <Select value={details.relationshipStatus || ''} onValueChange={(value) => handleChange('relationshipStatus', value)}>
                        <SelectTrigger id="relationshipStatus" className="border-2 border-black rounded-none font-bold uppercase text-xs">
                          <SelectValue placeholder="STATUS_SELECT" />
                        </SelectTrigger>
                        <SelectContent className="border-2 border-black rounded-none font-bold uppercase text-xs">
                          <SelectItem value="Single">UNATTACHED</SelectItem>
                          <SelectItem value="In a relationship">LINKED</SelectItem>
                          <SelectItem value="Married">ENCRYPTED_BOND</SelectItem>
                          <SelectItem value="Prefer not to say">CLASSIFIED</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      { label: 'Coordinates', value: details.location, icon: MapPin },
                      { label: 'Sector', value: details.region, icon: Globe },
                      { label: 'Age', value: details.age, icon: Calendar },
                      { label: 'Uplink', value: details.relationshipStatus, icon: Zap },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between border-b-2 border-black/5 pb-2 last:border-0 group">
                        <div className="flex items-center gap-3">
                          <div className="p-1 border border-black bg-gray-50 group-hover:bg-yellow-400 transition-colors">
                            <item.icon className="h-3 w-3" />
                          </div>
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.label}</span>
                        </div>
                        <span className="font-black uppercase tracking-tight">{item.value || 'CLASSIFIED'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="neo-brutal-card bg-white flex flex-col overflow-hidden">
              <div className="bg-purple-400 p-4 border-b-2 border-black">
                <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2 text-black">
                  <Briefcase className="h-5 w-5" /> Operational Sector
                </h3>
              </div>
              <div className="p-6 space-y-6 flex-1 bg-gray-50/30">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-[10px] font-black uppercase">Primary Role</Label>
                      <Input id="occupation" value={details.occupation || ''} onChange={(e) => handleChange('occupation', e.target.value)} placeholder="E.G. INFILTRATOR" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-[10px] font-black uppercase">Coalition Hub (Company)</Label>
                      <Input id="company" value={details.company || ''} onChange={(e) => handleChange('company', e.target.value)} placeholder="E.G. THE_GRID" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="text-center space-y-2 p-6 border-4 border-black border-dashed bg-white">
                      <Terminal className="h-10 w-10 mx-auto text-black/20" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-gray-400">Current Role</p>
                        <p className="text-2xl font-black uppercase tracking-tight italic">{details.occupation || 'UNASSIGNED'}</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] font-black uppercase text-gray-400">Deployed At</p>
                        <p className="font-bold text-gray-600 uppercase tracking-widest">{details.company || 'FREE_AGENT'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interests & Training */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="neo-brutal-card bg-white flex flex-col overflow-hidden">
              <div className="bg-green-400 p-4 border-b-2 border-black">
                <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2 text-black">
                  <Heart className="h-5 w-5" /> Field Training (Hobbies)
                </h3>
              </div>
              <div className="p-6 flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="hobbies" className="text-[10px] font-black uppercase">Training Modules (Comma-Separated)</Label>
                    <Textarea
                      id="hobbies"
                      value={details.hobbies?.join(', ') || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('hobbies', e.target.value.split(',').map((h: string) => h.trim()).filter((h: string) => h))}
                      placeholder="PARKOUR, CRYPTOGRAPHY, DRONE_PILOTING..."
                      className="min-h-[100px] font-bold uppercase"
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {details.hobbies?.length ? 
                      details.hobbies.map((hobby, index) => (
                        <div key={index} className="px-4 py-2 border-2 border-black bg-purple-100 font-black uppercase text-xs shadow-neo-sm">
                          {hobby}
                        </div>
                      )) : 
                      <p className="font-bold italic text-gray-400 text-sm py-4">No field training recorded.</p>
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="neo-brutal-card bg-white flex flex-col overflow-hidden">
              <div className="bg-orange-400 p-4 border-b-2 border-black">
                <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2 text-black">
                  <Dog className="h-5 w-5" /> Biological Units (Pets)
                </h3>
              </div>
              <div className="p-6 flex-1 bg-orange-50/20">
                {isEditing ? (
                  <div className="space-y-4">
                    {details.pets?.map((pet, index) => (
                      <div key={index} className="flex items-end gap-3 p-3 border-2 border-black bg-white shadow-neo-sm">
                        <div className="space-y-1 flex-1">
                          <Label className="text-[8px] font-black uppercase">Species</Label>
                          <Input value={pet.type} onChange={(e) => {
                            const newPets = [...(details.pets || [])];
                            newPets[index] = { ...pet, type: e.target.value };
                            setDetails({ ...details, pets: newPets });
                          }} className="h-8 text-xs font-bold uppercase" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <Label className="text-[8px] font-black uppercase">Codename</Label>
                          <Input value={pet.name} onChange={(e) => {
                            const newPets = [...(details.pets || [])];
                            newPets[index] = { ...pet, name: e.target.value };
                            setDetails({ ...details, pets: newPets });
                          }} className="h-8 text-xs font-bold uppercase" />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const newPets = details.pets?.filter((_, i) => i !== index);
                          setDetails({ ...details, pets: newPets });
                        }} className="hover:text-red-600"><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setDetails({ ...details, pets: [...(details.pets || []), { type: '', name: '' }] })} className="w-full border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-orange-100">
                      <Plus className="h-4 w-4 mr-2" /> Recruit Pet Unit
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {details.pets?.length ? 
                      details.pets.map((pet, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border-2 border-black bg-white shadow-neo-sm group">
                          <div className="p-2 border-2 border-black bg-orange-100 group-hover:rotate-12 transition-transform">
                            <Dog className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-black uppercase text-sm leading-none">{pet.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pet.type}</p>
                          </div>
                        </div>
                      )) : 
                      <p className="font-bold italic text-gray-400 text-sm py-4">No bio-units assigned.</p>
                    }
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Asset Terminal (Gallery) */}
          <div className="neo-brutal-card bg-white overflow-hidden">
            <div className="bg-black text-white p-4 border-b-4 border-black flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-widest italic flex items-center gap-3">
                <ImageIcon className="h-6 w-6" /> Visual Asset Terminal
              </h3>
              {isEditing && (
                <Button 
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black shadow-neo-sm font-black uppercase text-[10px] px-4"
                >
                  <Plus className="h-4 w-4 mr-2 stroke-[3]" /> Add Assets
                </Button>
              )}
              <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" multiple className="hidden" />
            </div>
            <div className="p-8">
              {galleryImages.length === 0 ? (
                <div className="py-20 text-center border-4 border-dashed border-black/10 bg-gray-50">
                  <ImageIcon className="h-16 w-16 mx-auto text-black/10 mb-4 stroke-[1]" />
                  <p className="font-black uppercase text-gray-400 italic">Inventory Depleted</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {galleryImages.map((image, index) => (
                    <div key={index} className="neo-brutal-card bg-white aspect-square overflow-hidden group relative transition-all hover:-translate-rotate-1">
                      <img src={image} alt={`Gallery ${index}`} className="w-full h-full object-cover transition-all group-hover:scale-110 duration-500" />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => removeGalleryImage(index)}
                            className="border-2 border-black font-black uppercase text-[10px] shadow-neo-sm"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Scrap
                          </Button>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black text-white border border-white/20 px-1.5 py-0.5 text-[6px] font-mono">
                        ASSET_{index.toString().padStart(3, '0')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Account Security (Owner Only) */}
          {isOwner && (
            <div className="pt-12 border-t-8 border-black">
              <div className="flex items-center gap-4 mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                  <Shield className="h-10 w-10 stroke-[3] text-blue-600" />
                  Security Protocols
                </h3>
                <div className="h-1 flex-1 bg-black" />
              </div>

              {settingsError && (
                <div className="p-4 border-4 border-black bg-red-100 text-red-600 font-black uppercase text-xs shadow-neo flex items-center gap-3 mb-8">
                  <AlertTriangle className="h-5 w-5" />
                  PROTOCOL_ERROR: {settingsError}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7">
                  <div className="neo-brutal-card bg-white overflow-hidden h-full">
                    <div className="bg-blue-400 p-4 border-b-4 border-black">
                      <h4 className="text-xl font-black uppercase tracking-tight italic">Coordinate Lock</h4>
                    </div>
                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 border-2 border-black bg-orange-50/50 shadow-neo-sm">
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Current Coordinate</span>
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-600" />
                            <span className="font-mono font-bold">{ipSettings?.currentIp || 'DETECTING...'}</span>
                          </div>
                        </div>
                        {ipSettings?.ipRestricted && (
                          <div className="p-4 border-2 border-black bg-green-50 shadow-neo-sm">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">Authorized Coordinate</span>
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-green-600" />
                              <span className="font-mono font-bold">{ipSettings.allowedIp}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="neo-glass-card p-6 border-2 border-black flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/80">
                        <div className="space-y-1 text-center sm:text-left">
                          <p className="font-black uppercase text-xs">Restrict access to current coordinate only</p>
                          <p className="text-[10px] font-bold text-gray-500 uppercase italic">
                            {ipSettings?.ipRestricted 
                              ? 'PROTOCOL_ACTIVE: Access restricted to whitelisted IP.'
                              : 'PROTOCOL_INACTIVE: Multi-coordinate access enabled.'}
                          </p>
                        </div>
                        <Button
                          onClick={handleToggleIpRestriction}
                          disabled={actionLoading}
                          className={cn(
                            "font-black uppercase text-[10px] tracking-widest border-2 border-black shadow-neo-sm px-6 py-4 transition-all",
                            ipSettings?.ipRestricted ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-green-500 hover:bg-green-400 text-black'
                          )}
                        >
                          {actionLoading ? 'PROCESSING...' : ipSettings?.ipRestricted ? 'DISABLE_LOCK' : 'ENABLE_LOCK'}
                        </Button>
                      </div>

                      {ipSettings?.ipRestricted && (
                        <div className="p-4 border-2 border-black bg-yellow-50 flex items-start gap-4">
                          <AlertTriangle className="h-5 w-5 text-yellow-700 shrink-0 mt-0.5" />
                          <p className="text-[10px] font-bold text-yellow-800 leading-tight">
                            WARNING: Ensure your coordinate is static. If your network endpoint changes, authentication will fail.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="neo-brutal-card bg-white overflow-hidden flex flex-col h-full">
                    <div className="bg-purple-400 p-4 border-b-4 border-black">
                      <h4 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                        <History className="h-5 w-5" /> Access Log
                      </h4>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto max-h-[400px] bg-gray-50/50 space-y-3">
                      {loginHistory.length === 0 ? (
                        <p className="font-bold text-gray-400 uppercase italic text-[10px] text-center py-12">No log data found.</p>
                      ) : (
                        loginHistory.slice(0, 10).map((entry) => {
                          const device = parseUserAgent(entry.userAgent);
                          const isCurrent = ipSettings?.currentIp === entry.ipAddress;
                          return (
                            <div key={entry.id} className={cn(
                              "p-3 border-2 border-black shadow-neo-sm flex items-center justify-between group transition-all hover:bg-white",
                              isCurrent ? "bg-white border-green-500 border-l-4" : "bg-white"
                            )}>
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 border border-black bg-gray-100 shadow-neo-sm group-hover:bg-yellow-400 transition-colors">
                                  <device.icon className="h-3 w-3" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black uppercase text-[10px] truncate">{device.name}</p>
                                  <p className="font-mono text-[8px] font-bold text-gray-400">{entry.ipAddress}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] font-black uppercase text-gray-400">TIMESTAMP</p>
                                <p className="text-[8px] font-bold text-gray-800">{new Date(entry.createdAt).toLocaleDateString()}</p>
                                <p className="text-[8px] font-bold text-gray-800 leading-none">{new Date(entry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="p-3 bg-black text-white flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase tracking-widest italic">Monitoring Active</span>
                      <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsPage;
