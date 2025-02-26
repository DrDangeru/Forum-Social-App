/* eslint-disable no-unused-vars */
import React, { createContext, useState, useCallback } from 'react';
import { AuthState, AuthCredentials, User } from '../types/auth';
import axios from 'axios';

export interface AuthContextType extends AuthState {
    login: (credentials: AuthCredentials) => Promise<User>; 
    logout: () => void;
    register: (credentials: AuthCredentials & { firstName: string; lastName: string }) => 
        Promise<User>;
}

const defaultAuthState = {
    user: null,
    isAuthenticated: false
};

export const AuthContext = createContext<AuthContextType>({
    ...defaultAuthState,
    login: async () => { throw new Error('AuthContext not initialized'); },
    logout: () => {},
    register: async () => { throw new Error('AuthContext not initialized'); }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

    const login = useCallback(async (credentials: AuthCredentials): Promise<User> => {
        try {
            console.log('Login with credentials:', credentials);
            const response = await axios.post('/api/auth/login', credentials);
            console.log('Login response:', response.data);

            if (!response.data || !response.data.user) {
                throw new Error('User data not found in response');
            }

            const user = response.data.user;
            setAuthState({
                user,
                isAuthenticated: true
            });

            return user;
        } catch (error) {
            console.error('Login error:', error);
            if (axios.isAxiosError(error) && error.response) {
                throw new Error(error.response.data?.error || 'Login failed');
            }
            throw new Error('Login failed');
        }
    }, []);

    const logout = useCallback(() => {
        axios.post('/api/auth/logout')
            .then(() => {
                setAuthState(defaultAuthState);
            })
            .catch(error => {
                console.error('Logout error:', error);
                // Still clear the local state even if the server call fails
                setAuthState(defaultAuthState);
            });
    }, []);

    const register = useCallback(async (data: AuthCredentials & { 
        firstName: string; lastName: string }): Promise<User> => {
        try {
            console.log('Registering with data:', data);
            const response = await axios.post('/api/auth/register', data);
            console.log('Registration response:', response.data);
            
            // After successful registration, create a user object
            const user: User = {
                id: String(response.data.userId || 'temp-id'),
                username: data.username,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName
            };

            setAuthState({
                user,
                isAuthenticated: true
            });
            
            return user;
        } catch (error) {
            console.error('Registration error:', error);
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
};
