import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, FileText, Plus } from 'lucide-react';
import { useTopics } from '../hooks/useTopics';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

export const TopicsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { 
    userTopics, 
    friendTopics, 
    userTopicsLoading, 
    friendTopicsLoading,
    userTopicsError,
    friendTopicsError,
    refreshTopics
  } = useTopics();
  
  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim()) return;

    try {
      setIsSubmitting(true);
      await axios.post('/api/topics', {
        title: title.trim(),
        description: description.trim(),
        createdBy: user.userId,
        isPublic
      });
      
      setTitle('');
      setDescription('');
      setIsPublic(true);
      setIsCreateModalOpen(false);
      refreshTopics();
    } catch (error) {
      console.error('Failed to create topic:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className={
          "flex items-center space-x-1 text-gray-700 hover:text-gray-900 " +
          "px-3 py-2 rounded-md"
        }
      >
        <span>Topics</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      {isOpen && (
        <div
          className={
            "absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg z-50 py-2 " +
            "border border-gray-200"
          }
        >
          <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-sm">Your Topics</h3>
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                setIsOpen(false);
              }}
              className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create
            </button>
          </div>
          
          {userTopicsLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : userTopicsError ? (
            <div className="px-4 py-2 text-sm text-red-500">{userTopicsError}</div>
          ) : userTopics.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {userTopics.slice(0, 5).map(topic => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.id}`}
                  className={
                    "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 " +
                    "flex items-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="truncate">{topic.title}</span>
                </Link>
              ))}
              {userTopics.length > 5 && (
                <Link
                  to="/topics"
                  className={
                    "block px-4 py-2 text-xs text-blue-600 hover:bg-gray-100 text-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  View all ({userTopics.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No topics yet</div>
          )}
          
          <div className="px-4 py-2 border-t border-b border-gray-200">
            <h3 className="font-medium text-sm">Friend Topics</h3>
          </div>
          
          {friendTopicsLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : friendTopicsError ? (
            <div className="px-4 py-2 text-sm text-red-500">{friendTopicsError}</div>
          ) : friendTopics.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {friendTopics.slice(0, 5).map(topic => (
                <Link
                  key={topic.id}
                  to={`/topics/${topic.id}`}
                  className={
                    "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 " +
                    "flex items-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="truncate">{topic.title}</span>
                </Link>
              ))}
              {friendTopics.length > 5 && (
                <Link
                  to="/friend-topics"
                  className={
                    "block px-4 py-2 text-xs text-blue-600 hover:bg-gray-100 text-center"
                  }
                  onClick={() => setIsOpen(false)}
                >
                  View all ({friendTopics.length})
                </Link>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No friend topics yet</div>
          )}
        </div>
      )}

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Topic</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTopic} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter topic title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter topic description"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="isPublic">Make topic public</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || !description.trim()}
                className="bg-blue-400 hover:bg-blue-500 text-white"
              >
                {isSubmitting ? 'Creating...' : 'Create Topic'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TopicsDropdown;
