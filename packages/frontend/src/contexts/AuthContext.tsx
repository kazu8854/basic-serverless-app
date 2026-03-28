import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User } from '@basic-serverless-app/shared';

// Auth Context definitions
interface AuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to easily use auth state anywhere
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  // Decide whether to run in mock UI mode based on VITE variable
  const isMock = import.meta.env.VITE_MOCK_AWS === 'true';

  const login = () => {
    if (isMock) {
      setUser({
        id: crypto.randomUUID(),
        name: 'Mock User',
        email: 'mock@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Production AWS Cognito logic (e.g. redirect to AWS Amplify or Hosted UI)
      window.location.href = '/auth/login';
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isMock }}>
      {children}
    </AuthContext.Provider>
  );
}
