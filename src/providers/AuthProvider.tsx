import React, { useState, useCallback } from 'react';
import type { AuthState, AuthCredentials, User } from '../types/auth';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false
    });

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
            .then(() => setAuthState({
                user: null,
                isAuthenticated: false
            }))
            .catch(() => setAuthState({
                user: null,
                isAuthenticated: false
            }));
    }, []);

    const register = useCallback(async (data: AuthCredentials & { 
        firstName: string; 
        lastName: string 
    }): Promise<User> => {
        try {
            const response = await axios.post('/api/auth/register', data);
            console.log('Registration response:', response.data);
            
            const user: User = {
                id: String(response.data.userId),
                username: data.username,
                email: data.email as any,
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
