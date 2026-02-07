import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Edit3, Upload, Calendar, Terminal, Zap, X, Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Textarea } from './textarea';
import { Button } from './button';
import type { Post, PostsProps } from '../../types/clientTypes';

export const Posts: React.FC<PostsProps> = ({
  posts,
  onEdit,
  onUploadImage,
  onCreatePost,
  allowNewPosts = false
}) => {
  const { user } = useAuth();
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEditClick = (post: Post) => {
    setEditingPostId(post.postId);
    setEditContent(post.content);
  };

  const handleSaveEdit = async (postId: number) => {
    if (onEdit && editContent.trim()) {
      setLoading(true);
      try {
        await onEdit(postId, editContent);
        setEditingPostId(null);
        setEditContent('');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImageUpload = async (postId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onUploadImage) {
      setLoading(true);
      try {
        await onUploadImage(postId, file);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCreatePost = async () => {
    if (onCreatePost && newPostContent.trim()) {
      setLoading(true);
      try {
        await onCreatePost(newPostContent, newPostImage);
        setNewPostContent('');
        setNewPostImage(null);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-10">
        {posts.map((post) => (
          <div key={post.postId} className="neo-brutal-card bg-white overflow-hidden flex flex-col group transition-all hover:-translate-y-1">
            <div className="flex flex-row items-center gap-4 p-4 border-b-2 border-black bg-gray-50/50">
              <div className="border-2 border-black shadow-neo-sm bg-white overflow-hidden transition-transform group-hover:-rotate-3">
                <Avatar className="h-10 w-10 rounded-none border-none shadow-none">
                  {post.authorAvatarUrl ? (
                    <AvatarImage src={post.authorAvatarUrl} alt={post.authorUsername || ''} className="rounded-none" />
                  ) : (
                    <AvatarFallback className="rounded-none bg-orange-400 font-black text-xs">
                      {post.authorUsername?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase tracking-tight text-sm hover:underline decoration-2 cursor-pointer">@{post.authorUsername}</span>
                  <div className="flex items-center gap-2">
                    {post.updatedAt !== post.createdAt && (
                      <div className="px-2 py-0.5 border border-black bg-purple-100 text-[8px] font-black uppercase shadow-neo-sm">EDITED</div>
                    )}
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {editingPostId === post.postId ? (
                <div className="space-y-4">
                  <div className="relative">
                    <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black text-[10px] font-black uppercase tracking-widest">Edit Log</div>
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[120px] rounded-none border-2 border-black shadow-neo-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all font-bold p-4"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      onClick={() => setEditingPostId(null)}
                      variant="ghost"
                      size="sm"
                      className="font-black uppercase text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => handleSaveEdit(post.postId)}
                      disabled={loading || !editContent.trim()}
                      className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo-sm font-black uppercase text-xs px-6 flex items-center gap-2"
                    >
                      <Save className="h-3 w-3" /> Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-lg font-bold leading-tight whitespace-pre-wrap">{post.content}</p>
                  {post.imageUrl && (
                    <div className="border-4 border-black shadow-neo-sm overflow-hidden bg-black transition-transform hover:rotate-1">
                      <img
                        src={post.imageUrl}
                        alt="Post attachment"
                        className="w-full h-auto max-h-[500px] object-cover opacity-90 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  )}
                </div>
              )}

              {user && post.posterId === user.userId && !editingPostId && (
                <div className="flex items-center gap-3 pt-4 border-t-2 border-black/5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(post)}
                    className="border-2 border-black shadow-neo-sm font-black uppercase text-[10px] hover:bg-yellow-400 gap-2"
                  >
                    <Edit3 className="h-3 w-3 stroke-[3]" /> Edit Log
                  </Button>
                  <label className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white hover:bg-orange-50 cursor-pointer shadow-neo-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all group">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(post.postId, e)}
                    />
                    <Upload className="h-3 w-3 stroke-[3] group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase">Add Intel Asset</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {allowNewPosts && user && (
        <div className="mt-12 neo-brutal-card bg-white overflow-hidden flex flex-col border-l-8 border-l-green-500">
          <div className="bg-black text-white p-4 border-b-2 border-black flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <h3 className="font-black uppercase tracking-widest text-xs">Establish New Transmission</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="relative">
              <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black text-[10px] font-black uppercase tracking-widest">Message Feed</div>
              <Textarea
                placeholder="LOG YOUR FINDINGS..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[150px] rounded-none border-2 border-black shadow-neo-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all font-bold p-4 text-green-600"
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-orange-50 cursor-pointer shadow-neo-sm active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setNewPostImage(file);
                  }}
                />
                <Upload className="h-4 w-4 stroke-[3] group-hover:rotate-12 transition-transform" />
                <span className="text-xs font-black uppercase">Attach Intel</span>
              </label>
              
              {newPostImage && (
                <div className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase italic border-2 border-black flex items-center gap-2">
                  <span className="truncate max-w-[150px]">{newPostImage.name}</span>
                  <button onClick={() => setNewPostImage(null)} className="hover:text-red-400"><X className="h-3 w-3" /></button>
                </div>
              )}

              <Button 
                onClick={handleCreatePost}
                disabled={!newPostContent.trim() || loading}
                className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo font-black uppercase tracking-widest px-10 py-6 text-lg ml-auto flex items-center gap-2"
              >
                <Zap className="h-5 w-5 fill-yellow-400 text-yellow-400" /> Transmit Intel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};