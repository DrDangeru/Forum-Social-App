import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { LoginFormData } from '../types/clientTypes';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
    email: ''
  });

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
    <div className="flex items-center justify-center min-h-screen p-4 bg-orange-50/50">
      <div className="w-full max-w-md neo-brutal-card bg-white p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400 border-b-2 border-l-2 border-black -mr-12 -mt-12 rotate-45" />
        
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-2">Login</h1>
          <div className="h-2 w-20 bg-black" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 border-2 border-black bg-red-100 text-red-600 font-black uppercase text-xs shadow-neo-sm">
              ERROR: {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username" className="font-black uppercase tracking-widest text-xs">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="YOUR_NICKNAME"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="font-black uppercase tracking-widest text-xs">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••••"
            />
          </div>
          
          <Button
            type="submit"
            size="lg"
            className="w-full font-black uppercase tracking-widest text-lg"
          >
            Authenticate →
          </Button>
          
          <div className="pt-4 text-center border-t-2 border-black border-dashed">
            <p className="font-bold text-gray-600 mb-2">New to this place? Reg now!</p>
            <Link
              to="/register"
              className="inline-block font-black uppercase text-sm underline decoration-4 underline-offset-4 hover:bg-black hover:text-white px-2 py-1 transition-all"
            >
              Join the Happening
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
