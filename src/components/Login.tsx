import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ChevronDown, ChevronUp, Users, BookOpen, Globe } from 'lucide-react';
import axios from 'axios';

import { PreviewTopic } from '../types/clientTypes';

interface FormData {
  username: string;
  password: string;
  email: string;
}

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    email: ''
  });

  // Preview sections state
  const [friendUpdates, setFriendUpdates] = useState<PreviewTopic[]>([]);
  const [followedTopics, setFollowedTopics] = useState<PreviewTopic[]>([]);
  const [regionalTopics, setRegionalTopics] = useState<PreviewTopic[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Fetch preview data
  useEffect(() => {
    const fetchPreviews = async () => {
      try {
        const response = await axios.get('/api/topics/public-preview');
        setFriendUpdates(response.data.friendUpdates || []);
        setFollowedTopics(response.data.followedTopics || []);
        setRegionalTopics(response.data.regionalTopics || []);
      } catch (err) {
        // Use mock data if API fails
        setRegionalTopics([
          { id: 901, title: 'Increase in Inflation for 2025', postCount: 47 },
          { id: 902, title: 'New Goalie for Local Team', postCount: 89 }
        ]);
        setFollowedTopics([
          { id: 903, title: 'President Makes New Party', postCount: 156 },
          { id: 904, title: 'Gold Price Hits New Highs', postCount: 34 }
        ]);
        setFriendUpdates([
          { id: 905, title: 'Champions League Finals Preview', postCount: 203 },
          { id: 901, title: 'Increase in Inflation for 2025', postCount: 47 }
        ]);
      }
    };
    fetchPreviews();
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderPreviewSection = (
    title: string,
    icon: React.ReactNode,
    items: PreviewTopic[],
    sectionKey: string
  ) => (
    <div className="mb-4">
      <div
        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer
          hover:bg-gray-100 transition-colors"
        onClick={() => toggleSection(sectionKey)}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-700">{title}</span>
        </div>
        {expandedSection === sectionKey ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </div>
      <div className="mt-2 space-y-2">
        {items.slice(0, 2).map((item) => (
          <div
            key={item.id}
            className="p-2 bg-white border border-gray-200 rounded text-sm"
          >
            <p className="font-medium text-gray-800 truncate">{item.title}</p>
            {item.postCount && (
              <p className="text-xs text-gray-500">{item.postCount} posts</p>
            )}
          </div>
        ))}
      </div>
      {expandedSection === sectionKey && items.length > 2 && (
        <div className="mt-2 space-y-2">
          {items.slice(2).map((item) => (
            <div
              key={item.id}
              className="p-2 bg-white border border-gray-200 rounded text-sm"
            >
              <p className="font-medium text-gray-800 truncate">{item.title}</p>
              {item.postCount && (
                <p className="text-xs text-gray-500">{item.postCount} posts</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    try {
      // Email is NOT used for login in the current backend, only username.
      const { email, ...loginData } = formData;
      await login(loginData);
      navigate('/'); // Navigate to home page after successful login
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl">
        {/* Preview Sections */}
        <div className="w-full lg:w-1/2 space-y-4">
          {renderPreviewSection(
            'Friend Updates',
            <Users className="h-4 w-4 text-blue-500" />,
            friendUpdates,
            'friends'
          )}
          {renderPreviewSection(
            'Followed Topics',
            <BookOpen className="h-4 w-4 text-green-500" />,
            followedTopics,
            'followed'
          )}
          {renderPreviewSection(
            'Regional News',
            <Globe className="h-4 w-4 text-purple-500" />,
            regionalTopics,
            'regional'
          )}
        </div>

        {/* Login Form */}
        <Card className="w-full lg:w-1/2">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
          </CardHeader>
          <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="
                  p-3
                  bg-red-100
                  text-red-600
                  rounded-md
                  text-sm
                "
              >
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="
                  w-full
                  p-2
                  border
                  border-gray-300
                  rounded-md
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />
            </div>
            {/* Email on login is not required. */}
            {/* <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="
                  w-full
                  p-2
                  border
                  border-gray-300
                  rounded-md
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />
            </div> */}
            
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="
                  w-full
                  p-2
                  border
                  border-gray-300
                  rounded-md
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />
            </div>
            
            <button
              type="submit"
              className="
                w-full
                p-2
                bg-blue-600
                text-white
                rounded-md
                hover:bg-blue-700
                focus:outline-none
                focus:ring-2
                focus:ring-blue-500
                focus:ring-offset-2
              "
            >
              Login
            </button>
            
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <a
                href="/register"
                className="text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
              >
                Register
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Login;
