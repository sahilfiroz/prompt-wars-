/**
 * Campus Pulse - Auth Context & RBAC State
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api, getStoredToken, getStoredUser, clearStoredAuth } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<string>;
  isFaculty: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canCreatePost: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await api.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        clearStoredAuth();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: authedUser, token: authToken } = await api.login(email, password);
      setUser(authedUser);
      setToken(authToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  };

  const requestPasswordReset = async (email: string) => {
    return await api.requestPasswordReset(email);
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = isSuperAdmin || user?.role === 'admin';
  const isFaculty = isAdmin || user?.role === 'faculty';
  const canCreatePost = isFaculty && (user?.isActive ?? false);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        requestPasswordReset,
        isFaculty,
        isAdmin,
        isSuperAdmin,
        canCreatePost,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
