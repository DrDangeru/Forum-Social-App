import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './components/Register';
import Feed from './components/Feed';
import Friends from './components/Friends';
import Followed from './components/Followed';
import PersonalDetails from './components/PersonalDetails';
import { mockUsers } from './data/mockData';
import './App.css';

// Temporary user ID for demo purposes
const DEMO_USER_ID = 1;

function App() {
  const currentUser = mockUsers.find(user => user.id === DEMO_USER_ID);

  return (
    <QueryClientProvider client={new QueryClient()}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Feed userId={DEMO_USER_ID} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/followed" element={<Followed currentUserId={DEMO_USER_ID} />} />
              <Route path="/alerts" element={<div className="p-4">Alerts page (Coming soon)</div>} />
              <Route 
                path="/user/:userId/details" 
                element={
                  <PersonalDetails 
                    user={currentUser!} 
                    isOwner={true}
                    onUpdateDetails={(details) => {
                      // TODO: Implement update logic when backend is ready
                      console.log('Updated details:', details);
                    }}
                  />
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
