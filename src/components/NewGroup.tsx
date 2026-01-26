import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea.tsx';
import { useAuth } from '../hooks/useAuth';
import type { GroupAccessType } from '../types';
import { Globe, Lock } from 'lucide-react';

export default function NewGroup() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState<GroupAccessType>('open');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !!user && groupName.trim().length > 0 && description.trim().length > 0;
  }, [description, groupName, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be logged in to create a group.');
      return;
    }

    if (! groupName.trim() || !description.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await axios.post('/api/groups', {
        name: groupName.trim(),
        description: description.trim(),
        accessType,
        createdBy: user.userId
      });

      const createdGroupId = response.data?.id;
      if (createdGroupId) {
        navigate(`/groups/${createdGroupId}`);
        return;
      }

      navigate('/groups');
    } catch (error: any) {
      console.error('Failed to create group:', error);
      setErrorMessage(error?.response?.data?.error || 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupDescription">Description</Label>
              <Textarea
                id="groupDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter group description"
                className="min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Access Type</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === 'open'}
                    onChange={() => setAccessType('open')}
                    className="h-4 w-4"
                  />
                  <Globe className="h-4 w-4 text-green-500" />
                  <span>Open (Anyone can join)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="accessType"
                    checked={accessType === 'invitation'}
                    onChange={() => setAccessType('invitation')}
                    className="h-4 w-4"
                  />
                  <Lock className="h-4 w-4 text-yellow-500" />
                  <span>Invitation Only</span>
                </label>
              </div>
            </div>

            {errorMessage && (
              <div className="text-sm text-red-600">{errorMessage}</div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/groups')}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
