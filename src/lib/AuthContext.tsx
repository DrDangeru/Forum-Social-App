import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, AuthState, AuthCredentials } from '../types/auth';

interface AuthContextType extends AuthState {
    login: (credentials: AuthCredentials) => Promise<void>;
    logout: () => void;
    register: (credentials: AuthCredentials & { firstName: string; lastName: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
    });

    const login = useCallback(async (credentials: AuthCredentials) => {
        try {
            // Here you would typically make an API call to your backend
            // For now, we'll simulate a successful login
            const user: User = {
                id: 'temp-id',
                username: credentials.username,
                firstName: 'John',
                lastName: 'Doe',
            };
            
            setAuthState({ user, isAuthenticated: true });
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }, []);

    const logout = useCallback(() => {
        setAuthState({ user: null, isAuthenticated: false });
    }, []);

    const register = useCallback(async (data: AuthCredentials & { firstName: string; lastName: string }) => {
        try {
            // Here you would typically make an API call to your backend
            // For now, we'll simulate a successful registration
            const user: User = {
                id: 'temp-id',
                username: data.username,
                firstName: data.firstName,
                lastName: data.lastName,
            };
            
            setAuthState({ user, isAuthenticated: true });
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ ...authState, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
