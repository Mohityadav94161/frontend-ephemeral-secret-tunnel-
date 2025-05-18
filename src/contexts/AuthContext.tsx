import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as api from '../lib/api';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in local storage
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get user data
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      // Call API to validate token and get user data
      const data = await api.verifyToken(token);
      setUser(data.user);
    } catch (err) {
      // If token is invalid, clear it
      console.error('Token verification error:', err);
      localStorage.removeItem('auth_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      if (!username || !password) {
        setError('Username and password are required');
        return false;
      }

      // Call the API login function
      const data = await api.login(username, password);
      
      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      return false;
    }
  };

  const register = async (username: string, password: string): Promise<boolean> => {
    try {
      if (!username || !password) {
        setError('Username and password are required');
        return false;
      }

      // Call the API register function
      const data = await api.register(username, password);
      
      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
      return false;
    }
  };

  const logout = () => {
    // Clear auth data
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    error,
    isAuthenticated: !!token && !!user
  };

  // Don't render children until we've checked for an existing token
  if (isLoading) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
