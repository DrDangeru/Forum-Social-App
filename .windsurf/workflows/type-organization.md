---
description: Type organization standards for frontend and backend
---

# Type Organization Standards

## Overview

All TypeScript interfaces and types must be organized in their respective type files:

- **Server types**: `server/types/types.ts`
- **Client types**: `src/types/clientTypes.ts`

## Rules

### 1. Never Define Interfaces Locally in Route/Component Files

- All interfaces should be defined in the central type files
- Import types from the appropriate type file
- Exception: Very small, single-use types that are truly local to one function

### 2. Server Types (`server/types/types.ts`)

Contains:

- User & Auth types (User, AuthCredentials, AuthState, LoginCredentials)
- Profile types (Profile, BasicProfile, MemberProfile, SocialLinks)
- Content types (Topic, Post, Follow, GalleryImage)
- Group types (Group, GroupMember, GroupInvitation)
- Regional/Activity types (RegionalPost, FriendActivity, FollowedTopic)
- Alert types (AlertItem, AlertType)
- Friend request types (FriendRequest, ReceivedFriendRequest, SentFriendRequest)
- Utility types (UserFile, DbOperationResult, DbHelpers)
- Ad types (Ad, AdPlacement)

### 3. Client Types (`src/types/clientTypes.ts`)

Contains:

- User & Auth types (User, AuthCredentials, AuthState)
- Profile types (Profile, BasicProfile, SocialLinks)
- Content types (Topic, Post, Follow, GalleryImage)
- Group types (Group, GroupMember, GroupInvitation)
- Regional/Activity types (RegionalPost, FriendActivity, FollowedTopic)
- Alert types (AlertItem, AlertsResponse, AlertType)
- Settings types (LoginHistory, IpRestrictionSettings)
- Utility types (UserFile, DbOperationResult)
- Ad types (Ad, AdPlacement)

### 4. Key Differences Between Server and Client Types

- Server types may have database-specific fields (e.g., `isActive: number` vs `boolean`)
- Server has `DbHelpers` interface for database operations
- Client has `AlertsResponse` for API response typing
- Server has `LoginCredentials` with `isAdmin` field

### 5. Import Patterns

**Server routes:**

```typescript
import { User, Topic, AlertItem } from '../types/types.js';
```

**Client components:**

```typescript
import { User, Topic, AlertItem } from '../types/clientTypes';
```

### 6. Adding New Types

1. Determine if the type is server-only, client-only, or shared
2. Add to the appropriate section in the type file
3. If shared, add to BOTH files (they are intentionally separate)
4. Update any local definitions to import from the central file

### 7. Type Naming Conventions

- Use PascalCase for interface/type names
- Use descriptive names (e.g., `ReceivedFriendRequest` not `ReceivedRequest`)
- Prefix extended types with context (e.g., `RegionalPost extends Post`)
