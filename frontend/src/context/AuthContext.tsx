import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import { authService } from '../services/authService';
import { setAccessToken } from '../services/api';
import { mockUsers } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  switchPersona: (role: UserRole) => void;
  updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('medassist_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Initial session restoration
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('medassist_user');
      const savedToken = localStorage.getItem('medassist_token');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('medassist_user');
        }
      } else if (savedToken) {
        try {
          const me = await authService.getMe();
          setUser(me);
        } catch {
          setAccessToken(null);
          setTokenState(null);
        }
      } else {
        // Default to active patient persona for effortless out-of-the-box exploration
        const defaultPatient = mockUsers[0];
        setUser(defaultPatient);
        localStorage.setItem('medassist_user', JSON.stringify(defaultPatient));
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      setUser(res.user);
      setTokenState(res.access_token);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: any) => {
    setLoading(true);
    try {
      await authService.register(data);
      // Auto login
      await login(data.email, data.password);
    } finally {
      setLoading(false);
    }
  }, [login]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setTokenState(null);
  }, []);

  // Development convenience: switch between Patient, Doctor, and Admin roles instantly
  const switchPersona = useCallback((role: UserRole) => {
    const targetUser = mockUsers.find(u => u.role === role) || mockUsers[0];
    setUser(targetUser);
    setTokenState(`mock-token-${targetUser.id}`);
    localStorage.setItem('medassist_user', JSON.stringify(targetUser));
  }, []);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('medassist_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        switchPersona,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
