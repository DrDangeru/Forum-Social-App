/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { Card, CardContent } from './card';
import { buttonVariants } from './buttonVariants';
import { Edit, Upload } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Textarea } from './textarea';
import { Button } from './button';
import type { Post } from '../../types/clientTypes';

interface PostsProps {
  posts: Post[];
  onEdit?: (postId: number, content: string) => Promise<void>;
  onUploadImage?: (postId: number, file: File) => Promise<void>;
  onCreatePost?: (content: string, image?: File | null) => Promise<void>;
  allowNewPosts?: boolean;
}

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
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.postId} className="bg-white">
          <CardContent className="pt-4">
            <div className="flex items-center mb-2">
              <Avatar className="h-6 w-6 mr-2">
                {post.authorAvatarUrl ? (
                  <AvatarImage src={post.authorAvatarUrl} alt={post.authorUsername || ''} />
                ) : (
                  <AvatarFallback>
                    {post.authorUsername?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{post.authorUsername}</span>
                <span className="text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {post.updatedAt !== post.createdAt && (
                    <span 
                      className="ml-1 text-gray-400" 
                      title={new Date(post.updatedAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    >
                      (edited)
                    </span>
                  )}
                </span>
              </div>
            </div>

            {editingPostId === post.postId ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleSaveEdit(post.postId)}
                    disabled={loading || !editContent.trim()}
                    variant="default"
                    size="sm"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingPostId(null)}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="mt-2">{post.content}</p>
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Post attachment"
                    className="mt-4 rounded-lg max-h-96 object-cover w-full"
                  />
                )}
              </div>
            )}

            {user && post.posterId === user.userId && !editingPostId && (
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => handleEditClick(post)}
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                <label
                  className={`${buttonVariants({ variant: "ghost", size: "sm" })} cursor-pointer`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(post.postId, e)}
                  />
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Image
                </label>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {allowNewPosts && user && (
        <div className="mt-6">
          <Textarea style={{color: 'green'}}
            placeholder="Write a new post..."
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="mb-2"
          />
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className={`${buttonVariants({ variant: "ghost", size: "sm" })} cursor-pointer`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setNewPostImage(file);
                }}
              />
              <Upload className="h-4 w-4 mr-1" />
              Upload Image
            </label>
            {newPostImage && (
              <span className="text-xs text-muted-foreground truncate max-w-[55%]">
                {newPostImage.name}
              </span>
            )}
          </div>
          <Button 
            onClick={handleCreatePost}
            disabled={!newPostContent.trim() || loading}
            variant="default"
          >
            Post Reply
          </Button>
        </div>
      )}
    </div>
  );
};