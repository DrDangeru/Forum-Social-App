import React, { useState, useCallback } from 'react';
import { AuthState, AuthCredentials, User } from '../types/Auth';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';

// Default auth state
const defaultAuthState: AuthState = {
    user: null,
    isAuthenticated: false
};

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

    const login = useCallback(async (credentials: AuthCredentials): Promise<User> => {
        try {
            const response = await axios.post('/api/auth/login', credentials);
            if (!response.data?.user) {
                throw new Error('User data not found in response');
            }

            const user = response.data.user;
            setAuthState({
                user,
                isAuthenticated: true
            });

            return user;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data?.error || 'Login failed');
            }
            throw new Error('Login failed');
        }
    }, []);

    const logout = useCallback(() => {
        axios.post('/api/auth/logout')
            .then(() => setAuthState(defaultAuthState))
            .catch(() => setAuthState(defaultAuthState));
    }, []);

    const register = useCallback(async (data: AuthCredentials & { 
        firstName: string; 
        lastName: string 
    }): Promise<User> => {
        try {
            const response = await axios.post('/api/auth/register', data);
            
            const user: User = {
                id: String(response.data.userId),
                username: data.username,
                email: data.email as string,
                firstName: data.firstName,
                lastName: data.lastName
            };

            setAuthState({
                user,
                isAuthenticated: true
            });
            
            return user;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data?.error || 'Registration failed');
            }
            throw new Error('Registration failed');
        }
    }, []);

    const value = {
        ...authState,
        login,
        logout,
        register
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
