import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import type { Topic, Post, UserTopicsProps } from '../types/clientTypes';
import { Textarea } from './ui/textarea.tsx';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { MessageSquare, Calendar, Globe, Lock, Send, Terminal } from 'lucide-react';

export default function UserTopics({
  userId,
  showCreateButton = false,
  onCreateTopic,
}: UserTopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [postContents, setPostContents] = useState<Record<number, string>>({});
  const { user } = useAuth();

  useEffect(() => {
    const fetchTopics = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await axios.get(`/api/topics/user/${userId}`);

        // Ensure each topic has a posts array
        const processedTopics = response.data.map((topic: any) => ({
          ...topic,
          posts: topic.posts || [],
        }));

        setTopics(processedTopics);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [userId]);

  const handleCreatePost = async (topicId: number) => {
    try {
      if (!user) {
        alert('You must be logged in to create a post');
        return;
      }

      const content = postContents[topicId];
      if (!content || !content.trim()) {
        alert('Post content cannot be empty');
        return;
      }

      setLoading(true);

      const response = await axios.post(`/api/topics/${topicId}/posts`, {
        content,
        createdBy: user.userId,
      });

      // Update the topics state with the new post
      setTopics((prev) =>
        prev.map((topic) => {
          if (topic.id === topicId) {
            return {
              ...topic,
              posts: [...(topic.posts || []), response.data],
            };
          }
          return topic;
        })
      );

      // Clear the post input for this topic
      setPostContents((prev) => ({ ...prev, [topicId]: '' }));
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && topics.length === 0) {
    return (
      <div className="my-12 space-y-4">
        <div className="h-40 neo-brutal-card animate-pulse bg-gray-100" />
        <div className="h-40 neo-brutal-card animate-pulse bg-gray-100" />
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="my-12">
        <div className="neo-brutal-card p-12 text-center bg-white border-dashed border-4 border-black/20">
          <Terminal className="h-16 w-16 mx-auto text-gray-300 mb-4 stroke-[1.5]" />
          <p className="font-black uppercase text-gray-400 italic mb-6">No transmissions detected in this sector.</p>
          {showCreateButton && onCreateTopic && (
            <Button
              onClick={onCreateTopic}
              className="bg-green-500 hover:bg-green-400 text-black border-2 border-black shadow-neo font-black uppercase tracking-widest px-8"
            >
              Initiate First Protocol
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="my-12 space-y-8">
      <div className="flex justify-between items-baseline gap-4">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Sector Transmissions</h2>
        <div className="h-1 flex-1 bg-black" />
        {showCreateButton && onCreateTopic && (
          <Button
            onClick={onCreateTopic}
            className="bg-green-500 hover:bg-green-400 text-black border-2 border-black shadow-neo font-black uppercase tracking-widest px-6"
            size="sm"
          >
            Start Topic
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-12">
        {topics.map((topic) => (
          <div key={topic.id} className="neo-brutal-card bg-white overflow-hidden flex flex-col">
            <div className="bg-yellow-400 p-6 border-b-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {topic.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{topic.isPublic ? 'Unencrypted' : 'Secure Line'}</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight italic">{topic.title}</h3>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase bg-white border-2 border-black px-3 py-1 shadow-neo-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(topic.createdAt).toLocaleDateString()}
                </div>
                <div className="w-px h-3 bg-black" />
                <div>ID: {topic.id}</div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              <div className="relative">
                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-orange-400" />
                <p className="text-lg font-bold leading-tight pl-4">{topic.description}</p>
              </div>

              {/* Posts section */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 stroke-[3]" />
                    Intel Log ({topic.posts?.length || 0})
                  </h4>
                  <div className="h-px flex-1 bg-black/10" />
                </div>

                {/* Existing posts */}
                {topic.posts && topic.posts.length > 0 ? (
                  <div className="space-y-4">
                    {topic.posts
                      .sort((a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                      )
                      .map((post: Post) => (
                        <div key={post.postId} className="group relative p-4 border-2 border-black bg-gray-50 hover:bg-white transition-all shadow-neo-sm hover:shadow-neo">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black uppercase text-purple-600">
                              @{post.authorUsername}
                            </span>
                            <span className="text-[8px] font-bold text-gray-400">
                              {new Date(post.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="font-bold text-gray-800 leading-snug">{post.content}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-8 text-center border-2 border-dashed border-black/5 bg-gray-50/50">
                    <p className="text-xs font-bold text-gray-400 italic">No field data recorded yet.</p>
                  </div>
                )}

                {/* New post input */}
                {user && (
                  <div className="pt-6 border-t-2 border-black/5 space-y-4">
                    <div className="relative">
                      <div className="absolute -top-3 left-4 bg-white px-2 border-2 border-black text-[10px] font-black uppercase tracking-widest">Add Intel</div>
                      <Textarea
                        value={postContents[topic.id] || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setPostContents((prev) => ({ ...prev, [topic.id]: e.target.value }))
                        }
                        placeholder="Log your findings..."
                        className="min-h-[100px] rounded-none border-2 border-black shadow-neo-sm focus:shadow-none focus:translate-x-[1px] focus:translate-y-[1px] transition-all font-bold p-4"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleCreatePost(topic.id)}
                        size="sm"
                        className="bg-black text-white hover:bg-gray-800 border-2 border-black shadow-neo-sm font-black uppercase text-xs px-6 gap-2"
                        disabled={loading}
                      >
                        <Send className="h-3 w-3" />
                        Transmit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
