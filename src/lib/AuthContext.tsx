/* eslint-disable no-unused-vars */
import React, { createContext, useState, useCallback } from 'react';
import { AuthState, AuthCredentials } from '../types/auth';

export interface AuthContextType extends AuthState {
    login: (credentials: AuthCredentials) => Promise<void>; // disabled no unused vars
    logout: () => void;
    register: (credentials: AuthCredentials & { firstName: string; lastName: string }) => 
        Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false
    });

    const login = useCallback(async (credentials: AuthCredentials) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }

            const data = await response.json();
            setAuthState({
                user: data.user,
                isAuthenticated: true
            });
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            setAuthState({ user: null, isAuthenticated: false });
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear the local state even if the API call fails
            setAuthState({ user: null, isAuthenticated: false });
        }
    }, []);

    const register = useCallback(async (data: AuthCredentials & { 
        firstName: string; lastName: string }) => {
        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Registration failed');
            }

            const userData = await response.json();
            
            // After successful registration, create a user object
            const user = {
                id: String(userData.userId),
                username: data.username,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName
            };

            setAuthState({
                user,
                isAuthenticated: true
            });
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ ...authState, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};
