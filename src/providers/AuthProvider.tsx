import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, AuthState, AuthCredentials } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

// Configure axios defaults
axios.defaults.withCredentials = true; // Important for cookies

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        loading: true,
        error: null
    });
    const navigate = useNavigate();

    // Check auth status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('/api/auth/me');
                if (response.data?.user) {
                    setAuthState({
                        user: response.data.user,
                        isAuthenticated: true,
                        loading: false,
                        error: null
                    });
                } else {
                    setAuthState(prev => ({ ...prev, loading: false }));
                }
            } catch {
                setAuthState(prev => ({ ...prev, loading: false }));
            }
        };
        
        checkAuth();
    }, []);

    const login = useCallback(async (credentials: AuthCredentials): Promise<User> => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            const response = await axios.post('/api/auth/login', credentials);
            
            if (!response.data?.user) {
                throw new Error('User data not found in response');
            }

            const { user } = response.data;
            
            setAuthState({
                user,
                isAuthenticated: true,
                loading: false,
                error: null
            });

            return user;
        } catch (error) {
            const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
                ? error.response.data.error 
                : 'Login failed';
                
            setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
            throw new Error(errorMessage);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await axios.post('/api/auth/logout');
        } finally {
            setAuthState({
                user: null,
                isAuthenticated: false,
                loading: false,
                error: null
            });
            navigate('/login');
        }
    }, [navigate]);

    const register = useCallback(
        async (data: Omit<AuthCredentials, 'userId'> & { 
            firstName: string; 
            lastName: string; 
            email: string 
        }): Promise<User> => {
            try {
                setAuthState(prev => ({ ...prev, loading: true, error: null }));
                const response = await axios.post('/api/auth/register', data);

                if (!response.data?.user) {
                    throw new Error('User data not found in response');
                }

                const { user } = response.data;
                
                setAuthState({
                    user,
                    isAuthenticated: true,
                    loading: false,
                    error: null
                });

                return user;
            } catch (error) {
                const errorMessage = axios.isAxiosError(error) && error.response?.data?.error 
                    ? error.response.data.error 
                    : 'Registration failed';
                    
                setAuthState(prev => ({ ...prev, loading: false, error: errorMessage }));
                throw new Error(errorMessage);
            }
        }, 
        []
    );

    return (
        <AuthContext.Provider value={{ ...authState, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
}
