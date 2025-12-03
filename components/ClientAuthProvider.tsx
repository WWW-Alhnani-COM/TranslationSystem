// components/ClientAuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import { UserResponseDto } from '@/types';

// --- تعريف نوع البيانات ---
interface AuthContextType {
  user: UserResponseDto | null | undefined;
  loading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

// --- إنشاء السياق ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- مكون المزود ---
interface ClientAuthProviderProps {
  children: ReactNode;
}

export function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  const [user, setUser] = useState<UserResponseDto | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (token) {
          const userData: UserResponseDto = await apiClient.get('Users/me');
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user on load:", error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    try {
      setLoading(true);
      const response = await apiClient.post('Users/login', credentials);
      const { token, ...userData } = response;
      localStorage.setItem('token', token);
      setUser(userData);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a ClientAuthProvider');
  }
  return context;
}