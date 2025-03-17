import { useQuery } from '@tanstack/react-query';
import { Post } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const Feed = ({ userId }: { userId: number }) => {
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ['feed', userId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3001/api/feed?userId=${userId}`);
      return response.json();
    },
  });

  if (isLoading) return <div className="text-lg">Loading...</div>;

  return (
    <div className="max-w-[600px] mx-auto">
      {posts?.map((post) => (
        <Card key={post.id} className="mb-4">
          <CardHeader>
            <CardTitle className="text-xl">{post.author?.first_name} 
              {post.author?.last_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">{post.content}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Feed;
