import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Post } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const Feed = ({ userId }: { userId: string }) => {
  const navigate = useNavigate();
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['feed', userId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/api/feed?userId=${userId}`);
      return response.json();
    },
  });

  const handleStartTopic = () => {
    navigate('/topics');
  };

  if (isLoading) return <div className="text-lg">Loading...</div>;
  if (!posts) return <div className="text-lg">No posts found. Follow stuff for posts.</div>;

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Feed</h2>
        <Button 
          onClick={handleStartTopic}
          className="bg-green-500 hover:bg-green-600"
        >
          Start a Topic
        </Button>
      </div>

      {!posts || posts.length === 0 ? (
        <Card className="mb-4">
          <CardContent className="py-6">
            <p className="text-center text-gray-500">
              No posts found. Follow topics or users to see their posts here.
            </p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="mb-4">
            <CardHeader>
              <CardTitle className="text-xl">
                {post.author?.firstName} {post.author?.lastName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base">{post.content}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default Feed;
