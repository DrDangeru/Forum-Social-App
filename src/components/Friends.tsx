import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { BasicProfile } from "../types"; 
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { SendFriendRequest } from "./FriendRequests";
import { useFriends } from "@/hooks/useFriends";

export default function Friends() {
  const [friends, setFriends] = useState<BasicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { friends: friendsList, isLoading, error: friendsError } = useFriends();
  
  // Fetch friends from the useFriends hook
  useEffect(() => {
    if (!isLoading) {
      setFriends(friendsList);
      setLoading(false);
      if (friendsError) {
        setError(friendsError);
      }
    }
  }, [friendsList, isLoading, friendsError]);

  if (loading) return <div>Loading friends...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Friends</h1>
      {friends.length === 0 ? (
        <p>No friends found. Start following other users to make friends!</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend) => (
            <Card key={friend.userId}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarImage src={friend.avatar_url || ""} alt={friend.username} />
                  <AvatarFallback>{friend.first_name[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <CardTitle>{friend.username}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {friend.first_name} {friend.last_name}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <Link to={`/profile/${friend.userId}`}>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </Link>
                <SendFriendRequest userId={friend.userId} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
