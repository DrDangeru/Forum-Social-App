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
import './App.css';
import PhotoGalleryPage from './components/ui/PhotoGallery';
import Home from './components/Home';
import { UserSearch } from './components/UserSearch';
import ProfilePage from './components/ProfilePage';

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
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
                <Route path="/friends" element={
                  <ProtectedRoute>
                    <Friends />
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
              </Routes>
            </main>
          </div>
        </ProfileProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
