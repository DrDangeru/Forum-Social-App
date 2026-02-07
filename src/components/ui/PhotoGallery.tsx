import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import { useDropzone } from 'react-dropzone';
import { Trash2, User, Upload, Image as ImageIcon, Camera, ShieldCheck, Zap, ArrowLeft, RefreshCw, X } from 'lucide-react';
import type { UserPhoto } from '../../types/clientTypes';
import { Button } from './button';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function PhotoGalleryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch user's photos
  const { data: photos = [], isLoading } = useQuery({
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-orange-50/50">
        <div className="neo-brutal-card bg-white p-12 text-center border-black max-w-lg">
          <ShieldCheck className="h-16 w-16 mx-auto text-black mb-4" />
          <h2 className="text-3xl font-black uppercase text-black mb-4 tracking-tighter italic">Auth Required</h2>
          <p className="font-bold text-gray-600 mb-8">Access to visual assets requires valid operative clearance.</p>
          <Button onClick={() => navigate('/login')} className="bg-black text-white font-black uppercase tracking-widest px-8 border-2 border-black shadow-neo">
            Authenticate
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-orange-50/50">
        <div className="w-16 h-16 border-8 border-black border-t-blue-500 animate-spin shadow-neo" />
        <p className="font-black uppercase tracking-widest text-xl italic">Retrieving Visual Intel...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-10 pb-24">
      <div className="flex items-center">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-yellow-400 gap-2 transition-all"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3]" />
          HQ Overview
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 flex items-center gap-3">
            <Camera className="h-10 w-10 stroke-[3]" />
            Visual Intel
          </h1>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-xs italic">Asset management and operative identification protocol</p>
        </div>
        <div className="relative z-10 flex gap-4">
          <div className="px-4 py-2 border-2 border-black bg-black text-white text-xs font-black uppercase tracking-widest shadow-neo-sm">
            STORAGE: {photos.length}/10 NODES
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Current Profile Section */}
        <div className="lg:col-span-4">
          <div className="neo-brutal-card bg-white overflow-hidden sticky top-24">
            <div className="bg-yellow-400 p-4 border-b-4 border-black">
              <h2 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                <User className="h-5 w-5" /> Active ID
              </h2>
            </div>
            <div className="p-8 flex flex-col items-center gap-6">
              <div className="border-4 border-black shadow-neo bg-white p-1 transition-transform hover:-rotate-3">
                <img
                  src={user.avatarUrl || '/default-avatar.jpg'}
                  alt="Profile"
                  className="w-48 h-48 object-cover border-2 border-black"
                />
              </div>
              <div className="text-center space-y-2">
                <p className="font-black uppercase text-xs text-gray-400 tracking-widest">IDENTIFICATION_MODE</p>
                <p className="font-bold text-gray-600 text-sm leading-tight italic">
                  Select an asset from the terminal grid to update your operational identification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload & Grid Section */}
        <div className="lg:col-span-8 space-y-8">
          {/* Upload Dropzone */}
          <div 
            {...getRootProps()}
            className={cn(
              "neo-brutal-card border-dashed border-4 transition-all cursor-pointer group p-10",
              isDragActive ? "bg-blue-100 border-blue-600 translate-x-[2px] translate-y-[2px] shadow-none" : "bg-white border-black/20",
              photos.length >= 10 ? "opacity-50 cursor-not-allowed grayscale" : "hover:border-black hover:bg-orange-50"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className={cn(
                "p-4 border-4 border-black shadow-neo transition-transform group-hover:rotate-6",
                isDragActive ? "bg-blue-400" : "bg-yellow-400"
              )}>
                <Upload className="w-10 h-10 text-black stroke-[3]" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-2xl font-black uppercase tracking-tighter italic">
                  {isDragActive ? "Drop Assets Now" : "Ingest New Intel"}
                </p>
                <p className="font-bold text-gray-500 uppercase text-[10px] tracking-widest">
                  Drag & Drop or Click to Select Protocol (MAX 3 FILES)
                </p>
                {photos.length >= 10 && (
                  <div className="mt-4 px-4 py-2 border-2 border-black bg-red-100 text-red-600 font-black uppercase text-[10px]">
                    Maximum Node Limit Reached
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Photo Grid */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic whitespace-nowrap">Asset Terminal</h2>
              <div className="h-1 flex-1 bg-black" />
            </div>

            {photos.length === 0 ? (
              <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-24 text-center">
                <ImageIcon className="h-16 w-16 mx-auto text-black/10 mb-4" />
                <p className="font-black uppercase text-gray-400 italic">Inventory Depleted</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {photos.map((photo: UserPhoto) => (
                  <div 
                    key={photo.id}
                    className="neo-brutal-card bg-white aspect-square overflow-hidden group relative transition-all hover:-translate-rotate-1"
                  >
                    <img
                      src={photo.file_path}
                      alt={photo.original_name}
                      className={cn(
                        "w-full h-full object-cover transition-all duration-500",
                        user.avatarUrl === photo.file_path ? "grayscale-0 opacity-100" : "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100"
                      )}
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4 backdrop-blur-sm">
                      <Button
                        onClick={() => setProfilePicMutation.mutate(photo.file_path)}
                        className="w-full bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black font-black uppercase text-[10px] shadow-neo-sm h-8"
                      >
                        <User className="w-3 h-3 mr-2 stroke-[3]" /> Set Identification
                      </Button>
                      
                      <Button
                        onClick={() => deletePhotoMutation.mutate(photo.id)}
                        variant="destructive"
                        className="w-full border-2 border-black font-black uppercase text-[10px] shadow-neo-sm h-8"
                      >
                        <Trash2 className="w-3 h-3 mr-2 stroke-[3]" /> Scrap Asset
                      </Button>
                    </div>
                    
                    {/* Badge */}
                    {user.avatarUrl === photo.file_path && (
                      <div className="absolute top-2 left-2 bg-green-500 text-black border-2 border-black px-2 py-0.5 text-[8px] font-black uppercase flex items-center gap-1 shadow-neo-sm">
                        <ShieldCheck className="w-3 h-3" />
                        <span>ACTIVE_ID</span>
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 right-2 bg-black text-white border border-white/20 px-1.5 py-0.5 text-[6px] font-mono">
                      NODE_{photo.id.toString().padStart(3, '0')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload Status */}
          {(uploadMutation.isPending || uploadMutation.isError) && (
            <div className={cn(
              "neo-brutal-card p-4 flex items-center justify-between",
              uploadMutation.isError ? "bg-red-100 border-red-600 text-red-600" : "bg-blue-100 border-blue-600 text-blue-600"
            )}>
              <div className="flex items-center gap-3">
                {uploadMutation.isPending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                <span className="font-black uppercase text-xs tracking-widest italic">
                  {uploadMutation.isPending ? `Uploading ${uploadMutation.variables?.length} assets...` : `PROTOCOL_ERROR: ${uploadMutation.error?.message}`}
                </span>
              </div>
              {uploadMutation.isError && (
                <button onClick={() => uploadMutation.reset()} className="hover:scale-125 transition-transform"><X className="h-4 w-4" /></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}