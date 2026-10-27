'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginMode, setLoginMode] = useState('login');

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('customer_token');
      const savedUser = localStorage.getItem('customer_user');

      let parsedUser = null;

      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
        } catch {
          localStorage.removeItem('customer_user');
          localStorage.removeItem('customer_token');
        }
      }

      if (savedToken && parsedUser) {
        setToken(savedToken);
        setUser(parsedUser);
      } else {
        localStorage.removeItem('customer_token');
        localStorage.removeItem('customer_user');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Unable to restore authentication:', error);
      setToken(null);
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  const openLogin = useCallback((mode = 'login') => {
    setLoginMode(mode);
    setLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
  }, []);

  const handleAuthSuccess = useCallback((auth) => {
    const nextToken =
      auth?.token ||
      auth?.access_token ||
      auth?.data?.token ||
      auth?.data?.access_token ||
      null;

    const nextUser =
      auth?.user ||
      auth?.customer ||
      auth?.data?.user ||
      auth?.data?.customer ||
      null;

    if (!nextToken || !nextUser) {
      console.error(
        'Authentication response must contain a token and user.'
      );
      return false;
    }

    try {
      const serializedUser = JSON.stringify(nextUser);

      localStorage.setItem('customer_token', nextToken);
      localStorage.setItem('customer_user', serializedUser);

      setToken(nextToken);
      setUser(nextUser);
      setIsReady(true);
      setLoginOpen(false);
      setLoginMode('login');

      return true;
    } catch (error) {
      console.error('Unable to save authentication:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('customer_token');
      localStorage.removeItem('customer_user');
    } catch (error) {
      console.error('Unable to clear authentication:', error);
    } finally {
      setToken(null);
      setUser(null);
      setLoginOpen(false);
      setLoginMode('login');
      setIsReady(true);
    }
  }, []);

  const value = {
    token,
    user,
    isReady,
    isAuthenticated: Boolean(token && user),
    loginOpen,
    loginMode,
    setLoginMode,
    openLogin,
    closeLogin,
    handleAuthSuccess,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider.'
    );
  }

  return context;
}
