import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './components/Register';
import Login from './components/Login';
// import Feed from './components/Feed';
import Friends from './components/Friends';
// import Followed from './components/Followed';
import PersonalDetails from './components/PersonalDetails';
import { AuthProvider } from './lib/AuthContext';
import { ProfileProvider } from './lib/ProfileContext';
import { useAuth } from './lib/useAuth';
import './App.css';
import PhotoGalleryPage from './components/ui/PhotoGallery';
// import { MemberProfile } from './types/profile';

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
    <AuthProvider>
      <ProfileProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="pt-16">
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Navigate to="/login" />} />
                {/* <Route 
                  path="/" 
                  element={
                    <ProtectedRoute>
                      <Feed isOwner={true}     />
                    </ProtectedRoute>
                  } 
                /> */}
                <Route 
                  path="/friends" 
                  element={
                    <ProtectedRoute>
                      <Friends />
                    </ProtectedRoute>
                  } 
                />
                <Route 
            path="/photos"
            
            element={
              <ProtectedRoute>
                <PhotoGalleryPage />
              </ProtectedRoute>


            }
            />              
                {/* <Route 
                  path="/followed" 
                  element={
                    <ProtectedRoute>
                      <Followed /> 
                     </ProtectedRoute>
                  } 
                /> */}
                <Route 
                  path="/alerts" 
                  element={
                    <ProtectedRoute>
                      <div className="p-4">Alerts page (Coming soon)</div>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/personal-details" 
                  element={
                    <ProtectedRoute>
                      <PersonalDetails isOwner={true} />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
