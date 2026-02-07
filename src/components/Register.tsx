import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Send registration data without userId (server will generate it)
      await register(formData);
      setSuccess('Registration successful! Please log in.');
      setTimeout(() => {
        navigate('/login');
      }, 2000); // Give user time to see success message before redirect
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-orange-50/50">
      <div className="w-full max-w-md neo-brutal-card bg-white p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-24 h-24 bg-purple-400 border-b-2 border-r-2 border-black -ml-12 -mt-12 rotate-45" />
        
        <div className="mb-8">
          <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-2">Join_Us</h1>
          <div className="h-2 w-20 bg-black" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 border-2 border-black bg-red-100 text-red-600 font-black uppercase text-xs shadow-neo-sm">
              ERROR: {error}
            </div>
          )}
          {success && (
            <div className="p-4 border-2 border-black bg-green-100 text-green-600 font-black uppercase text-xs shadow-neo-sm">
              SUCCESS: {success}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="font-black uppercase tracking-widest text-[10px]">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="OPERATIVE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="font-black uppercase tracking-widest text-[10px]">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="NAME"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="font-black uppercase tracking-widest text-[10px]">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              placeholder="CALLSIGN"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="font-black uppercase tracking-widest text-[10px]">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="INTEL_NODE@MAIL.COM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-black uppercase tracking-widest text-[10px]">Access Key (Min 10 chars)</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={10}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••••••"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full font-black uppercase tracking-widest text-lg bg-yellow-400 hover:bg-yellow-300 mt-4"
          >
            Deploy Profile →
          </Button>

          <div className="pt-4 text-center border-t-2 border-black border-dashed">
            <p className="font-bold text-gray-600 mb-2">Already mobilized?</p>
            <Link
              to="/login"
              className="inline-block font-black uppercase text-sm underline decoration-4 underline-offset-4 hover:bg-black hover:text-white px-2 py-1 transition-all"
            >
              Back to Command
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
