import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getMe } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('reelvault_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('reelvault_token') || null);
  const [loading, setLoading] = useState(true);
  const [isServerWaking, setIsServerWaking] = useState(false);

  // Theme state (Dark / Light)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('reelvault_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('reelvault_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('reelvault_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  // Listen for Render free-tier cold start event from axios interceptor
  useEffect(() => {
    const handleWaking = (e) => {
      setIsServerWaking(Boolean(e.detail));
    };

    window.addEventListener('reelvault:server-waking', handleWaking);
    return () => {
      window.removeEventListener('reelvault:server-waking', handleWaking);
    };
  }, []);

  // Check persistent login on app mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('reelvault_token');
      if (!storedToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
          localStorage.setItem('reelvault_user', JSON.stringify(response.data.user));
        } else {
          logout();
        }
      } catch {
        // If token invalid, clean up
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    const response = await loginUser({ email, password });
    if (response.success && response.data?.token) {
      const { user: userData, token: jwtToken } = response.data;
      localStorage.setItem('reelvault_token', jwtToken);
      localStorage.setItem('reelvault_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return response;
    }
    throw new Error(response.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const response = await registerUser({ name, email, password });
    if (response.success && response.data?.token) {
      const { user: userData, token: jwtToken } = response.data;
      localStorage.setItem('reelvault_token', jwtToken);
      localStorage.setItem('reelvault_user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return response;
    }
    throw new Error(response.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('reelvault_token');
    localStorage.removeItem('reelvault_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        darkMode,
        toggleTheme,
        isServerWaking
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

export default AuthContext;
