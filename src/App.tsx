import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Register from './components/Register';
import Feed from './components/Feed';
import './App.css';
import Friends from './components/Friends';

const queryClient = new QueryClient();

// Temporary user ID for demo purposes
const DEMO_USER_ID = 1;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Feed userId={DEMO_USER_ID} /> User Here
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Feed userId={DEMO_USER_ID} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/following" element={<div className="p-4">Following page (Coming soon)</div>} />
              <Route path="/alerts" element={<div className="p-4">Alerts page (Coming soon)</div>} />
            </Routes>
          </main>
        </div>
      </Router>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App;
