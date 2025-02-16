import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function Friends() {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      const response = await fetch(`http://localhost:3001/api/friends/${userId}`);
      const data = await response.json();
      setFriends(data);
    };
    fetchFriends();
  }, []);

  return (
    <div>
      <h1>Friends</h1>
      {friends.length > 0 ? (
        friends.map((friend, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{friend}</CardTitle>
              </CardHeader>
            <CardContent>
              <p>{friend}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <div>No friends</div>
      )}
    </div>
  );
}

