import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check if token exists in localStorage
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Corrupted user data — clear everything
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
      }
    }
    setLoading(false);
  }, []);

  const persistSession = (newToken, userData) => {
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const login = async (username, password) => {
    if (MOCK_MODE) {
      // No backend in mock mode: accept any credentials locally.
      const userData = { id: 0, username, email: '' };
      persistSession('mock-token', userData);
      return userData;
    }
    const response = await apiClient.post('/auth/login/', { username, password });
    const { token: newToken, user: userData } = response.data;
    persistSession(newToken, userData);
    return userData;
  };

  const register = async (username, password, email) => {
    if (MOCK_MODE) {
      // Don't auto-login — let the user sign in manually after seeing success
      return { id: 0, username, email: email || '' };
    }
    const response = await apiClient.post('/auth/register/', { username, password, email });
    // Don't auto-login — let the user sign in manually after seeing success
    return response.data;
  };

  const logout = async () => {
    if (!MOCK_MODE) {
      try {
        await apiClient.post('/auth/logout/');
      } catch {
        // Token already invalid — still clear local state below.
      }
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
