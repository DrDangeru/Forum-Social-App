import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useDropzone } from 'react-dropzone';
import { Trash2, User, Upload } from 'lucide-react';

interface UserPhoto {
  id: number;
  file_path: string;
  original_name: string;
  userId: string;
  created_at: string;
  size: number;
  mimetype: string;
}

export default function PhotoGalleryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's photos
  const { data: photos = [] } = useQuery({
    queryKey: ['userPhotos', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      const { data } = await axios.get<UserPhoto[]>(`/api/files/${user.userId}`);
      return data;
    },
    enabled: !!user?.userId
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      console.log(`Uploading ${files.length} files for user ${user?.userId}`);
      
      const { data } = await axios.post(
        `/api/upload/${user?.userId}`, 
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPhotos', user?.userId] });
    }
  });

  // Set profile picture mutation
  const setProfilePicMutation = useMutation({
    mutationFn: async (filePath: string) => {
      await axios.patch(`/api/users/${user?.userId}/profile-pic`, { filePath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    }
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (fileId: number) => {
      await axios.delete(`/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPhotos', user?.userId] });
    }
  });

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 3,
    onDrop: (files: File[]) => uploadMutation.mutate(files),
    disabled: uploadMutation.isPending || photos.length >= 10
  });

  if (!user) {
    return <div className="p-6 text-center">Please log in to manage your photos</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold">Photo Management</h1>
        <p className="text-gray-600 mt-2">
          Upload and manage your profile pictures (Max 10 photos)
        </p>
      </div>

      {/* Current Profile Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Current Profile Picture</h2>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <img
              src={user.avatar_url || '/default-avatar.jpg'}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
          </div>
          <p className="text-gray-600">
            Select a new photo below to update your profile picture
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div 
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${photos.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-blue-600">
            <Upload className="w-12 h-12 mx-auto" />
          </div>
          {isDragActive ? (
            <p className="text-blue-600">Drop the files here...</p>
          ) : (
            <>
              <p className="font-medium">
                Drag & drop photos here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Maximum 3 files per upload • Max size 5MB each • JPG, PNG, GIF
              </p>
              {photos.length >= 10 && (
                <p className="text-red-500 text-sm mt-2">
                  Maximum limit of 10 photos reached
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo: UserPhoto) => (
          <div 
            key={photo.id}
            className="relative group aspect-square rounded-lg overflow-hidden shadow-sm"
          >
            <img
              src={photo.file_path}
              alt={photo.original_name}
              className="w-full h-full object-cover"
            />
            
            {/* Photo Actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 
            group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => setProfilePicMutation.mutate(photo.file_path)}
                className="p-2 bg-white/90 text-gray-900 rounded-full 
                hover:bg-white transition-colors"
                title="Set as profile picture"
              >
                <User className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => deletePhotoMutation.mutate(photo.id)}
                className="p-2 bg-red-500/90 text-white rounded-full 
                hover:bg-red-600 transition-colors"
                title="Delete photo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            {/* Current Profile Badge */}
            {user.avatar_url === photo.file_path && (
              <div className="absolute top-2 left-2 bg-blue-500 
              text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>Profile</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Status */}
      {uploadMutation.isPending && (
        <div className="text-center text-gray-600">
          Uploading {uploadMutation.variables?.length} files...
        </div>
      )}
      {uploadMutation.isError && (
        <div className="text-center text-red-500">
          Error uploading files: {(uploadMutation.error as Error).message}
        </div>
      )}
    </div>
  );
}