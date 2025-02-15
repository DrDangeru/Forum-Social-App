import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function Friends() {
  const [friends, setFriends] = useState([]);

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

