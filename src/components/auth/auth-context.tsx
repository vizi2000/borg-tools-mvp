'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  public_repos?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  loginDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const isAuthenticated = !!user;

  const login = (token: string, userData: User) => {
    localStorage.setItem('borg_tools_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('borg_tools_token');
    localStorage.removeItem('demo_mode');
    setUser(null);
    setIsDemoMode(false);
  };

  const loginDemo = () => {
    const demoUser: User = {
      id: 'demo_user_123',
      username: 'demo-developer',
      name: 'Demo Developer',
      email: 'demo@example.com',
      avatar_url: 'https://avatars.githubusercontent.com/u/583231?v=4',
      public_repos: 42
    };
    
    localStorage.setItem('demo_mode', 'true');
    setUser(demoUser);
    setIsDemoMode(true);
    setIsLoading(false);
  };

  const refreshUser = async () => {
    // Check for demo mode first
    const isDemoModeStored = localStorage.getItem('demo_mode') === 'true';
    if (isDemoModeStored) {
      loginDemo();
      return;
    }

    const token = localStorage.getItem('borg_tools_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        // Token is invalid/expired, remove it silently
        localStorage.removeItem('borg_tools_token');
        setUser(null);
      } else {
        // Other errors - log but don't show to user since this is a background operation
        console.error('Failed to refresh user:', response.status, response.statusText);
        // Don't remove token for temporary errors, let user try again
        if (response.status >= 500) {
          // Server errors - keep token and user can try again
          return;
        }
        // Client errors other than 401 - remove token
        localStorage.removeItem('borg_tools_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Network error during user refresh:', error);
      // Don't remove token on network errors - user might be offline
      // They can try again when connection is restored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isDemoMode,
    login,
    logout,
    refreshUser,
    loginDemo,
  };

  return (
    <AuthContext.Provider value={value}>
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