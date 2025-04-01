import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useTopics } from '../hooks/useTopics';
import { Avatar, AvatarFallback } from './ui/avatar';

export default function FriendTopics() {
  const { 
    friendTopics,
    friendTopicsLoading: loading,
    friendTopicsError: error
  } = useTopics();

  if (loading) {
    return <div>Loading friend topics...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-4">Friend Topics</h1>

      {friendTopics.length === 0 ? (
        <div className="text-center text-gray-500">
          No friend topics yet
        </div>
      ) : (
        <div className="space-y-4">
          {friendTopics.map((topic) => (
            <Card key={topic.id}>
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600">{topic.description}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback>{topic.creatorUsername?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>Created by {topic.creatorUsername}</span>
                    </div>
                  </div>
                  
                  {topic.posts && topic.posts.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Latest Post</h3>
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-center mb-2">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback>
                              {topic.posts[0].authorUsername?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-600">
                            {topic.posts[0].authorUsername}
                          </span>
                        </div>
                        <p className="text-gray-800">{topic.posts[0].content}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
