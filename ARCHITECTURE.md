# Forum Social App — Architecture & Module Relations

## Database Schema (SQLite via better-sqlite3)

```text
┌─────────────────────────────────────────────────────────────────────┐
│                            users                                    │
├─────────────────────────────────────────────────────────────────────┤
│ id (PK, AUTO)                                                       │
│ userId (UNIQUE, TEXT)  ◄── used as FK everywhere                    │
│ username (UNIQUE)                                                    │
│ email (UNIQUE)                                                       │
│ passwordHash                                                         │
│ firstName, lastName                                                  │
│ avatarUrl, bio, region                                               │
│ ipRestricted, allowedIp                                              │
│ isAdmin                                                              │
│ createdAt                                                            │
└──────┬──────────────────────────────────────────────────────────────┘
       │
       │ userId FK
       ▼
┌──────────────┐   ┌───────────────┐   ┌───────────────┐
│   profiles   │   │ galleryImages │   │   userFiles    │
├──────────────┤   ├───────────────┤   ├───────────────┤
│ userId (PK)  │   │ id (PK)       │   │ id (PK)       │
│ location     │   │ userId ──►user│   │ userId ──►user│
│ socialLinks  │   │ imageUrl      │   │ filename      │
│ relationship │   │ createdAt     │   │ originalName  │
│ age          │   └───────────────┘   │ filePath      │
│ interests    │                       │ size, mimetype│
│ occupation   │                       └───────────────┘
│ company      │
│ hobbies,pets │
│ createdAt    │
│ updatedAt    │
└──────────────┘

┌──────────────────┐        ┌──────────────────────┐
│   friendships    │        │    loginHistory       │
├──────────────────┤        ├──────────────────────┤
│ id (PK)          │        │ id (PK)              │
│ userId ──────►user│       │ userId ──────►user   │
│ friendId ────►user│       │ ipAddress            │
│ status           │        │ userAgent            │
│ createdAt        │        │ createdAt            │
└──────────────────┘        └──────────────────────┘
  status: 'pending' | 'accepted' | 'rejected'

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│     topics       │     │      posts       │     │     follows      │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ id (PK)          │◄──┐ │ id (PK)          │     │ id (PK)          │
│ title            │   │ │ topicId ────►topic│     │ followerId ►user │
│ description      │   │ │ content          │     │ followingId ►user│
│ createdBy ──►user│   │ │ createdBy ──►user│     │ topicId ──►topic │
│ isPublic         │   │ │ imageUrl         │     │ createdAt        │
│ region           │   │ │ createdAt        │     └──────────────────┘
│ createdAt        │   │ │ updatedAt        │      follows can link a
│ updatedAt        │   │ └──────────────────┘      user to a user OR
└──────────────────┘   │                           a user to a topic
                       │
┌──────────────────┐   │
│   userTopics     │   │  (join table: user ↔ topic ownership)
├──────────────────┤   │
│ userId ──────►user│  │
│ topicId ─────────┘   │
│ createdAt            │
└──────────────────────┘

┌──────────────────┐   ┌──────────────────┐   ┌────────────────────┐
│     groups       │   │  groupMembers    │   │ groupInvitations   │
├──────────────────┤   ├──────────────────┤   ├────────────────────┤
│ id (PK)          │◄──│ groupId ───►group│   │ id (PK)            │
│ name             │   │ userId ────►user │   │ groupId ────►group │
│ description      │   │ role             │   │ inviterId ──►user  │
│ accessType       │   │ joinedAt         │   │ inviteeId ──►user  │
│ createdBy ──►user│   └──────────────────┘   │ status             │
│ createdAt        │    role: 'owner' |       │ createdAt          │
│ updatedAt        │    'admin' | 'member'    │ updatedAt          │
└──────────────────┘                          └────────────────────┘
  accessType: 'open' | 'invitation'

┌──────────────────┐
│      ads         │
├──────────────────┤
│ id (PK)          │
│ title            │
│ imageUrl, linkUrl│
│ placement        │   'banner' | 'sidebar' | 'feed'
│ isActive         │
│ clicks           │
│ impressions      │
│ createdBy ──►user│
│ createdAt        │
│ updatedAt        │
└──────────────────┘
```

## Entity Relationships Summary

```text
User ──1:1──► Profile
User ──1:N──► GalleryImages
User ──1:N──► UserFiles
User ──1:N──► LoginHistory
User ──M:N──► User          (via friendships)
User ──M:N──► Topic         (via userTopics — ownership)
User ──M:N──► Topic         (via follows — subscriptions)
User ──M:N──► User          (via follows — user follows)
User ──1:N──► Post          (authored posts)
User ──1:N──► Topic         (created topics)
User ──M:N──► Group         (via groupMembers)
User ──1:N──► GroupInvitation (as inviter or invitee)
User ──1:N──► Ad            (created ads, admin only)
Topic ──1:N──► Post
Group ──1:N──► GroupMember
Group ──1:N──► GroupInvitation
```

## Server API Routes

```text
/api
├── /auth                          (server/routes/auth.ts)
│   ├── POST   /register           Create account
│   ├── POST   /login              Login, set HttpOnly cookie
│   ├── POST   /logout             Clear cookie
│   └── GET    /me                 Current user from cookie
│
├── /profile                       (server/routes/profile.ts)
│   ├── GET    /:userId            Get profile + user data
│   └── PUT    /:userId            Update profile + user data
│
├── /friends                       (server/routes/friends.ts)
│   ├── GET    /:userId            List accepted friends
│   ├── POST   /request            Send friend request
│   ├── PUT    /accept/:id         Accept request
│   ├── PUT    /reject/:id         Reject request
│   └── DELETE /:userId/:friendId  Remove friend
│
├── /topics                        (server/routes/topics.ts)
│   ├── GET    /                   All public topics
│   ├── GET    /:topicId           Single topic + posts
│   ├── POST   /                   Create topic
│   ├── GET    /user/:userId       User's own topics
│   ├── GET    /friends/:userId    Friends' topics
│   ├── GET    /followed/:userId   Topics user follows
│   ├── GET    /follows/:userId    Follow status for topics
│   ├── POST   /:topicId/follow    Follow a topic
│   ├── DELETE /:topicId/follow    Unfollow a topic
│   └── POST   /:topicId/posts     Create post in topic
│
├── /groups                        (server/routes/groups.ts)
│   ├── GET    /                   All groups
│   ├── GET    /my/:userId         User's groups
│   ├── GET    /:groupId           Single group + members
│   ├── POST   /                   Create group
│   ├── POST   /:groupId/join      Join open group
│   ├── POST   /:groupId/invite    Invite to group
│   ├── PUT    /invitations/:id    Accept/reject invitation
│   └── GET    /invitations/:userId Pending invitations
│
├── /regional                      (server/routes/regional.ts)
│   ├── GET    /activity           Regional posts for user
│   ├── GET    /topics             Topics in user's region
│   ├── GET    /friends-activity   Friends' recent activity
│   ├── GET    /followed-topics    Followed topic summaries
│   └── PUT    /set-region         Update user's region
│
├── /alerts                        (server/routes/alerts.ts)
│   ├── GET    /                   All alerts (requests + invites)
│   └── GET    /counts             Unread alert counts
│
├── /feed                          (server/routes/feed.ts)
│   └── GET    /                   Aggregated home feed
│
├── /settings                      (server/routes/settings.ts)
│   ├── GET    /login-history      Login history
│   ├── GET    /ip-restriction     IP restriction status
│   └── PUT    /ip-restriction     Update IP restriction
│
├── /ads                           (server/routes/ads.ts)
│   ├── GET    /                   Active ads
│   ├── GET    /admin              All ads (admin)
│   ├── POST   /                   Create ad (admin)
│   ├── PUT    /:id                Update ad (admin)
│   ├── DELETE /:id                Delete ad (admin)
│   └── POST   /:id/click          Track click
│
├── /users                         (server/routes/users.ts)
│   └── GET    /search             Search users by name
│
└── /sse                           (server/routes/sse.ts)
    ├── GET    /regional-topics    SSE stream: regional topics
    └── GET    /followed-topics    SSE stream: followed topics
```

## Frontend Architecture

### Providers & Context (wraps entire app)

```text
<Router>
  <AuthProvider>              ← manages login/logout/user state
    <ProfileProvider>         ← manages current profile data
      <Navbar />
      <Routes ... />
    </ProfileProvider>
  </AuthProvider>
</Router>
```

### Hooks

```text
useAuth          ← access AuthContext (user, login, logout, isAuthenticated)
useProfile       ← access ProfileContext (profile, updateProfile)
useTopics        ← fetches userTopics + friendTopics
useFriends       ← friend list operations
useDropdownAutoClose ← auto-close dropdowns on outside click
```

### Page Components & Routes

```text
Route                Component            Description
─────────────────────────────────────────────────────────────────
/                    Home                 Dashboard: feed, regional, followed
/login               Login                Login form
/register            Register             Registration form
/topics              Topics               List & create topics
/topics/new          NewTopic             Create new topic form
/topics/:topicId     TopicView            Single topic + posts
/friend-topics       FriendTopics         Topics from friends
/friends             Friends              Friend list + requests
/followed            Followed             Followed users & topics
/profile/:userId     ProfilePage          Public profile view
/personal-details    PersonalDetails      Own profile editor
/gallery             PhotoGalleryPage     Photo gallery
/search              UserSearch           Search users
/groups              Groups               Group list
/groups/new          NewGroup             Create new group
/groups/:groupId     GroupView            Single group view
/alerts              Alerts               Notifications center
/settings            SettingsPage         Security & IP settings
/admin               AdminDashboard       Admin panel (ads, users)
/regional            RegionalFeed         Region-based topics
```

### Shared / UI Components

```text
Navbar               ← top bar: links, dropdowns, avatar, alerts badge
├── TopicsDropdown   ← dropdown: user topics + friend topics
├── GroupsDropdown   ← dropdown: user groups
└── WelcomeModal     ← login popup: region setter + quick nav

ui/
├── Posts            ← reusable post list + create post
├── AdBanner         ← ad display component
├── PhotoGallery     ← image gallery page
├── avatar           ← Avatar, AvatarImage, AvatarFallback
├── badge            ← Badge + badgeVariants
├── button           ← Button + buttonVariants
├── card             ← Card, CardHeader, CardContent, etc.
├── dialog           ← Dialog modal
├── label            ← Form label
├── select           ← Select dropdown
├── switch           ← Toggle switch
├── tabs             ← Tab navigation
└── textarea         ← Text area input

Supporting:
├── LocalFeed        ← regional news sidebar on Home
├── Feed             ← main feed component
├── AddFriend        ← friend request UI
├── FriendRequests   ← pending request list
├── FriendsList      ← accepted friends list
├── GroupInvitations ← pending group invites
└── UserTopics       ← user's topic list
```

### Data Flow Diagram

```text
┌─────────────┐     HttpOnly Cookie      ┌──────────────────┐
│   Browser   │ ◄──────────────────────► │  Express Server  │
│  (React)    │     JSON over REST       │  (port 3001)     │
│  port 5173  │     SSE streams          │                  │
└──────┬──────┘                          └────────┬─────────┘
       │                                          │
       │  useAuth / useProfile                    │  db.prepare()
       │  axios / fetch                           │
       ▼                                          ▼
┌──────────────┐                         ┌──────────────────┐
│  AuthContext  │                         │  SQLite (WAL)    │
│  ProfileCtx   │                         │  forum.db        │
│  useTopics    │                         │  + uploads/      │
│  useFriends   │                         └──────────────────┘
└──────────────┘

Auth Flow:
  Login ──► POST /api/auth/login ──► Set HttpOnly cookie
  Every request ──► Cookie auto-sent ──► verifyToken middleware
  Refresh ──► GET /api/auth/me ──► Validate cookie, return user

SSE Flow (real-time updates):
  Home mounts ──► GET /api/sse/regional-topics ──► EventSource stream
              ──► GET /api/sse/followed-topics ──► EventSource stream
```

### Module Dependency Map

```text
                    ┌─────────┐
                    │   App   │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
        AuthProvider  ProfileProvider  Router
              │          │              │
              ▼          ▼              ▼
           useAuth   useProfile     All Pages
              │          │              │
              └──────┬───┘         uses hooks
                     ▼
              Navbar (always visible)
              ├── TopicsDropdown (useTopics)
              ├── GroupsDropdown (useAuth)
              └── Alert badge (axios polling)

Home ──► WelcomeModal (on first login)
     ──► LocalFeed (SSE regional)
     ──► Feed (followed topics SSE)
     ──► Posts (reusable)

Friends ──► FriendsList
        ──► FriendRequests
        ──► AddFriend

Topics ──► TopicView ──► Posts (reusable)
       ──► NewTopic

Groups ──► GroupView
       ──► NewGroup
       ──► GroupInvitations
```

## Type System

```text
Types are strictly separated:

  Client types:  src/types/clientTypes.ts
  Server types:  server/types/types.ts

  Both define matching interfaces but are never imported
  across the client/server boundary.

Key shared shapes (defined independently on each side):
  User, Profile, Topic, Post, Group, GroupMember,
  GroupInvitation, Follow, FriendRequest, Ad, AlertItem
```
