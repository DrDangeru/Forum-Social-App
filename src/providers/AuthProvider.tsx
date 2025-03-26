import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User, AuthState, AuthCredentials } from '../types';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
    });
    const navigate = useNavigate();

    const login = useCallback(async (credentials: AuthCredentials): Promise<User> => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            const response = await axios.post('/api/auth/login', credentials);
            
            if (!response.data?.user) {
                throw new Error('User data not found in response');
            }

            const user = response.data.user;
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

    const logout = useCallback(() => {
        axios.post('/api/auth/logout')
            .then(() => {
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    loading: false,
                    error: null
                });
                navigate('/login');
            })
            .catch(() => {
                setAuthState({
                    user: null,
                    isAuthenticated: false,
                    loading: false,
                    error: 'Logout failed'
                });
                navigate('/login');
            });
    }, [navigate]);

    const register = useCallback(async (
        data: Omit<AuthCredentials, 'userId'> & { firstName: string; lastName: string }
    ): Promise<User> => {
        try {
            setAuthState(prev => ({ ...prev, loading: true, error: null }));
            const response = await axios.post('/api/auth/register', data);
            
            if (!response.data?.user) {
                throw new Error('User data not found in response');
            }

            const user = response.data.user;
            setAuthState({
                user: null,
                isAuthenticated: false,
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
    }, []);

    return (
        <AuthContext.Provider value={{
            ...authState,
            login,
            logout,
            register
        }}>
            {children}
        </AuthContext.Provider>
    );
}
