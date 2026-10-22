import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AdminUser } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  walletBalance: number;
  authModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'admin';
  openAuthModal: (tab?: 'login' | 'register' | 'admin') => void;
  closeAuthModal: () => void;
  refreshAuth: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'admin'>('login');

  const refreshWallet = async () => {
    if (!user) return;
    try {
      const data = await api.getWallet();
      if (data?.wallet?.balance !== undefined) {
        setWalletBalance(data.wallet.balance);
      }
    } catch {
      // Ignore wallet fetch errors when not logged in
    }
  };

  const refreshAuth = async () => {
    try {
      const res = await api.me();
      if (res.authenticated && res.user) {
        setUser(res.user);
        refreshWallet();
      } else {
        setUser(null);
      }
      if (res.is_admin && res.admin) {
        setAdmin(res.admin);
      } else {
        setAdmin(null);
      }
    } catch (err) {
      console.warn('Auth check error:', err);
      setUser(null);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const openAuthModal = (tab: 'login' | 'register' | 'admin' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      if (admin) await api.adminLogout();
      await api.logout();
    } finally {
      setUser(null);
      setAdmin(null);
      setWalletBalance(0);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        admin,
        isAuthenticated: !!user,
        isAdmin: !!admin,
        isLoading,
        walletBalance,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        refreshAuth,
        refreshWallet,
        logout,
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

