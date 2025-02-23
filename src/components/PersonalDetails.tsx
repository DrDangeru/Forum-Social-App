import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button, ButtonProps } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Badge } from './ui/badge';
import { Pencil, Save, X, Plus } from 'lucide-react';
import { MemberProfile } from './../types/profile';

interface PersonalDetailsProps {
  profile?: MemberProfile;
  isOwner: boolean;
  onUpdateDetails?: (details: MemberProfile) => void;
}


const PersonalDetailsPage: React.FC<PersonalDetailsProps> = ({ profile, isOwner, onUpdateDetails }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState<MemberProfile>(
    profile || {
      bio: '',
      location: '',
      joinedDate: '', // Ensure type matches your interface
      socialLinks: {}, // Assuming SocialLinks is an object
      relationshipStatus: '',
      age: undefined,
      interests: [],
      pets: undefined,
    }
  );
  
  const handleChange = (field: keyof MemberProfile, value: any) => {
    setDetails((prevDetails) => ({
      ...prevDetails,
      [field]: value,
    }));
  };
  
  const handleSave = () => {
    setIsEditing(false);
    if (onUpdateDetails) {
      onUpdateDetails(details);
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setDetails(profile || {
      bio: '',
      location: '',
      joinedDate: '',
      socialLinks: {},
      relationshipStatus: '',
      age: undefined,
      interests: [],
      pets: undefined
    });
  };
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-2xl font-bold">Personal Details</CardTitle>
          {isOwner && (
            <div className="flex space-x-2">
              {!isEditing ? (
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="icon" onClick={handleSave}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
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
                      onChange={(e) => setDetails({ ...details, age: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationshipStatus">Relationship Status</Label>
                    <Select
                      value={details.relationshipStatus}
                      onValueChange={(value) => setDetails({ ...details, relationshipStatus: value as any })}
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
                      onChange={(e) => setDetails({ ...details, occupation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={details.company || ''}
                      onChange={(e) => setDetails({ ...details, company: e.target.value })}
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
                  onChange={(e) => setDetails({
                    ...details,
                    hobbies: e.target.value.split(',').map(h => h.trim()).filter(h => h)
                  })}
                  placeholder="Enter hobbies separated by commas"
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {details.hobbies?.length ? 
                  details.hobbies.map((hobby, index) => (
                    <Badge key={index} variant="secondary">{hobby}</Badge>
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
                      size="icon"
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalDetailsPage;
