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
      // Use path if available, otherwise construct it from userId and filename
      const filePath = fileInfo.path || `/uploads/${user.userId}/${fileInfo.filename}`;
      
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
                {details.avatarUrl ? (
                  <AvatarImage src={details.avatarUrl} alt="Profile" />
                ) : (
                  <AvatarFallback className="text-lg">
                    {details.firstName?.[0]}{details.lastName?.[0]}
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
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      value={details.firstName || ''}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={details.lastName || ''}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={details.username || ''}
                      onChange={(e) => handleChange('username', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input
                      id="bio"
                      type="text"
                      value={details.bio || ''}
                      onChange={(e) => handleChange('bio', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={details.location || ''}
                      onChange={(e) => handleChange('location', e.target.value)}
                    />
                  </div>
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
                      value={details.relationshipStatus || ''}
                      onValueChange={(value) => handleChange('relationshipStatus', value)}
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
                    <Label>First Name</Label>
                    <p className="text-gray-600">{details.firstName || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <p className="text-gray-600">{details.lastName || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Username</Label>
                    <p className="text-gray-600">{details.username || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <p className="text-gray-600">{details.bio || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p className="text-gray-600">{details.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Age</Label>
                    <p className="text-gray-600">{details.age || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label>Relationship Status</Label>
                    <p className="text-gray-600">{details.relationshipStatus || 'Not specified'}</p>
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
                      <Label htmlFor={`petType-${index}`}>Pet Type</Label>
                      <Input
                        id={`petType-${index}`}
                        value={pet.type}
                        onChange={(e) => {
                          const newPets = [...(details.pets || [])];
                          newPets[index] = { ...pet, type: e.target.value };
                          setDetails({ ...details, pets: newPets });
                        }}
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <Label htmlFor={`petName-${index}`}>Pet Name</Label>
                      <Input
                        id={`petName-${index}`}
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
