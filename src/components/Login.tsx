import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    try {
      // Email is optional for login, use username if not provided
      const loginData = { 
        ...formData, 
        email: formData.email || formData.username // Use username as email if not provided
      };
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
    <div
      className="
        flex
        items-center
        justify-center
        min-h-screen
        bg-gray-100
      "
    >
      <Card className="w-full max-w-md">
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
  );
};

export default Login;
