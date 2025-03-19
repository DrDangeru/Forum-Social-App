import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button} from './ui/button'; //Variants should be attached as ext class props
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
  Pencil, Save, X, Plus, Upload, Image, Trash2
} from 'lucide-react';
import { Profile } from '../types';
import { useProfile } from '../hooks/useProfile';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { useParams } from 'react-router-dom';
import { SendFriendRequest } from './FriendRequests';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface PersonalDetailsProps {
  isOwner: boolean;
}

const PersonalDetailsPage: React.FC<PersonalDetailsProps> = ({ isOwner }) => {
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [details, setDetails] = useState<Profile>(
    profile || {
      userId: '',
      first_name: '',
      last_name: '',
      username: '',
      bio: '',
      location: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      social_links: null,
      relationship_status: null,
      interests: [],
      hobbies: [],
      pets: [],
      avatar_url: null,
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
      // Handle nested properties (e.g., 'profile.relationship_status')
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

  const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.userId) return;
    
    try {
      setIsUploading(true);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('files', file);
      
      // Upload file to server
      const response = await axios.post(`/api/upload/${user.userId}`, formData);
      console.log('Profile picture upload response:', response.data);
      
      if (response.data.files && response.data.files.length > 0) {
        // Use the returned file path for the avatar
        const filePath = response.data.files[0].path;
        handleChange('avatar_url', filePath);
        
        // Save the profile immediately to persist the change
        const updatedDetails = {
          ...details,
          avatar_url: filePath
        };
        await updateProfile(updatedDetails);
        console.log('Profile updated with new avatar:', filePath);
      }
    } catch (error) {
      console.error('Failed to upload profile picture:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGalleryUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user?.userId) return;
    
    try {
      setIsUploading(true);
      
      // Create form data for upload
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      
      // Upload files to server
      const response = await axios.post(`/api/upload/${user.userId}`, formData);
      console.log('Gallery upload response:', response.data);
      
      if (response.data.files && response.data.files.length > 0) {
        // Add the returned file paths to the gallery
        const newPaths = response.data.files.map((file: any) => file.path);
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
    } catch (error) {
      console.error('Failed to upload gallery images:', error);
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
      first_name: '',
      last_name: '',
      username: '',
      bio: '',
      location: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      social_links: null,
      relationship_status: null,
      interests: [],
      hobbies: [],
      pets: [],
      avatar_url: null,
      galleryImages: []
    });
    setGalleryImages(profile?.galleryImages || []);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Personal Details</CardTitle>
          <div className="flex space-x-2">
            {isOwner ? (
              <div className="flex space-x-2">
                {!isEditing ? (
                  <Button variant="ghost" size="default" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="default" onClick={handleSave}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="default" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              // Friend request UI for non-owner views
              userId && <SendFriendRequest userId={userId} />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Picture</h3>
            <div className="flex items-center space-x-4">
              <Avatar className="h-24 w-24">
                {details.avatar_url ? (
                  <AvatarImage src={details.avatar_url} alt="Profile" />
                ) : (
                  <AvatarFallback className="text-lg">
                    {details.first_name?.[0]}{details.last_name?.[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {isEditing && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePicUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span>Uploading...</span>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Photo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={details.age || ''}
                      onChange={(e) => handleChange('age', parseInt(e.target.value) || undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationshipStatus">Relationship Status</Label>
                    <Select
                      value={details.relationship_status || ''}
                      onValueChange={(value) => handleChange('relationship_status', 
                        value as any)}
                    >
                      <SelectTrigger id="relationshipStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="In a relationship">In a relationship</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Age</Label>
                    <p className="text-gray-600">{details.age || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Relationship Status</Label>
                    <p className="text-gray-600">
                      {details.relationship_status || 'Not specified'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Work</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={details.occupation || ''}
                      onChange={(e) => handleChange('occupation', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={details.company || ''}
                      onChange={(e) => handleChange('company', e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Occupation</Label>
                    <p className="text-gray-600">{details.occupation || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Company</Label>
                    <p className="text-gray-600">{details.company || 'Not specified'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Hobbies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hobbies</h3>
            {isEditing ? (
              <div className="space-y-2">
                <Label htmlFor="hobbies">Hobbies (comma-separated)</Label>
                <Input
                  id="hobbies"
                  value={details.hobbies?.join(', ') || ''}
                  onChange={(e) => handleChange('hobbies', e.target.value.split(',').
                    map(h => h.trim()).filter(h => h))}
                  placeholder="Enter hobbies separated by commas"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {details.hobbies?.length ? 
                  details.hobbies.map((hobby, index) => (
                    <Card key={index} className="inline-block mr-2 mb-2 p-2">
                      <CardContent className="p-0 text-sm">{hobby}</CardContent>
                    </Card>
                  )) : 
                  <p className="text-gray-600">No hobbies specified</p>
                }
              </div>
            )}
          </div>

          {/* Pets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pets</h3>
            {isEditing ? (
              <div className="space-y-4">
                {details.pets?.map((pet, index) => (
                  <div key={index} className="flex items-end gap-4">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor={`pet-type-${index}`}>Pet Type</Label>
                      <Input
                        id={`pet-type-${index}`}
                        value={pet.type}
                        onChange={(e) => {
                          const newPets = [...(details.pets || [])];
                          newPets[index] = { ...pet, type: e.target.value };
                          setDetails({ ...details, pets: newPets });
                        }}
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor={`pet-name-${index}`}>Pet Name</Label>
                      <Input
                        id={`pet-name-${index}`}
                        value={pet.name}
                        onChange={(e) => {
                          const newPets = [...(details.pets || [])];
                          newPets[index] = { ...pet, name: e.target.value };
                          setDetails({ ...details, pets: newPets });
                        }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => {
                        const newPets = details.pets?.filter((_, i) => i !== index);
                        setDetails({ ...details, pets: newPets });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setDetails({
                    ...details,
                    pets: [...(details.pets || []), { type: '', name: '' }]
                  })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Pet
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {details.pets?.length ? 
                  details.pets.map((pet, index) => (
                    <p key={index} className="text-gray-600">
                      {pet.name} ({pet.type})
                    </p>
                  )) : 
                  <p className="text-gray-600">No pets specified</p>
                }
              </div>
            )}
          </div>

          {/* Photo Gallery */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Photo Gallery</h3>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Gallery ${index}`} 
                        className="w-full h-32 object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                        transition-opacity"
                        onClick={() => removeGalleryImage(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div>
                  <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleGalleryUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span>Uploading...</span>
                    ) : (
                      <>
                        <Image className="h-4 w-4 mr-2" />
                        Add Photos
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {galleryImages.length > 0 ? (
                  galleryImages.map((image, index) => (
                    <img 
                      key={index} 
                      src={image} 
                      alt={`Gallery ${index}`} 
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))
                ) : (
                  <p className="text-gray-600 col-span-full">No photos in gallery</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDetailsPage;
