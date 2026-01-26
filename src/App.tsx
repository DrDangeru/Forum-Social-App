import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './components/Register';
import Login from './components/Login';
import Friends from './components/Friends';
import PersonalDetails from './components/PersonalDetails';
import { AuthProvider } from './providers/AuthProvider';
import { ProfileProvider } from './providers/ProfileProvider';
import { useAuth } from './hooks/useAuth';
import Topics from './components/Topics';
import FriendTopics from './components/FriendTopics';
import TopicView from './components/TopicView';
import './App.css';
import PhotoGalleryPage from './components/ui/PhotoGallery';
import Home from './components/Home';
import { UserSearch } from './components/UserSearch';
import ProfilePage from './components/ProfilePage';
import Followed from './components/Followed';
import Groups from './components/Groups';
import GroupView from './components/GroupView';
import NewTopic from './components/NewTopic';
import NewGroup from './components/NewGroup';

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Followed page with auth
const FollowedWithAuth = () => {
  const { user, loading } = useAuth();
  
  if (loading || !user) {
    return <div className="p-4">Loading...</div>;
  }
  
  return <Followed />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ProfileProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-16">
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />
                <Route path="/topics" element={
                  <ProtectedRoute>
                    <Topics />
                  </ProtectedRoute>
                } />
                <Route path="/topics/new" element={
                  <ProtectedRoute>
                    <NewTopic />
                  </ProtectedRoute>
                } />
                <Route path="/topics/:topicId" element={
                  <ProtectedRoute>
                    <TopicView />
                  </ProtectedRoute>
                } />
                <Route path="/friend-topics" element={
                  <ProtectedRoute>
                    <FriendTopics />
                  </ProtectedRoute>
                } />
                <Route path="/friends" element={
                  <ProtectedRoute>
                    <Friends />
                  </ProtectedRoute>
                } />
                <Route path="/followed" element={
                  <ProtectedRoute>
                    <FollowedWithAuth />
                  </ProtectedRoute>
                } />
                <Route path="/profile/:userId" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/alerts" element={
                  <ProtectedRoute>
                    <div className="p-4">Alerts page (Coming soon)</div>
                  </ProtectedRoute>
                } />
                <Route path="/personal-details" element={
                  <ProtectedRoute>
                    <PersonalDetails isOwner={true} />
                  </ProtectedRoute>
                } />
                <Route path="/gallery" element={
                  <ProtectedRoute>
                    <PhotoGalleryPage />
                  </ProtectedRoute>
                } />
                <Route path="/search" element={
                  <ProtectedRoute>
                    <UserSearch />
                  </ProtectedRoute>
                } />
                <Route path="/groups" element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                } />
                <Route path="/groups/new" element={
                  <ProtectedRoute>
                    <NewGroup />
                  </ProtectedRoute>
                } />
                <Route path="/groups/:groupId" element={
                  <ProtectedRoute>
                    <GroupView />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
