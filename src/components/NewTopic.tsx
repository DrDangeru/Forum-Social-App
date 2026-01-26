import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { useAuth } from '../hooks/useAuth';

export default function NewTopic() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [topicTitle , setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !!user &&  topicTitle.trim().length > 0;
  }, [topicTitle, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('You must be logged in to create a topic.');
      return;
    }

    const trimmedTitle = topicTitle.trim();
    if (!trimmedTitle) {
      setErrorMessage('Topic name is required.');
      return;
    }

    const trimmedDescription = description.trim() || trimmedTitle;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const response = await axios.post('/api/topics', {
        title: trimmedTitle,
        description: trimmedDescription,
        createdBy: user.userId,
        isPublic
      });

      const createdTopicId = response.data?.id;
      if (createdTopicId) {
        navigate(`/topics/${createdTopicId}`);
        return;
      }

      navigate('/topics');
    } catch (error: any) {
      console.error('Failed to create topic:', error);
      setErrorMessage(error?.response?.data?.error || 'Failed to create topic. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create New Topic</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topicTitle">Topic Name</Label>
              <Input
                id="topicTitle"
                value={topicTitle}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter topic name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topicDescription">Description (optional)</Label>
              <Input
                id="topicDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="topicIsPublic" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="topicIsPublic">Public topic</Label>
            </div>

            {errorMessage && (
              <div className="text-sm text-red-600">{errorMessage}</div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => navigate('/topics')}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Topic'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
