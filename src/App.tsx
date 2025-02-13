import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import Feed from './components/Feed';
import './App.css';

const queryClient = new QueryClient();

// Temporary user ID for demo purposes
const DEMO_USER_ID = 1;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app">
        <Feed userId={DEMO_USER_ID} />
      </div>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default App
