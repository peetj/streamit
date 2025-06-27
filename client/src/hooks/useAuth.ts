import { useState, useEffect } from 'react';
import { User } from '../types';
import { apiRequest, getApiUrl, API_CONFIG } from '../config/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('streamflow_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiRequest('/api/auth/me');
      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id.toString(),
          username: userData.username,
          email: userData.email,
          avatar: userData.avatar || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
          playlists: []
        });
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('streamflow_token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('streamflow_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('streamflow_token', data.access_token);
        
        // Fetch user data
        const userResponse = await apiRequest('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser({
            id: userData.id.toString(),
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            playlists: []
          });
        }
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REGISTER), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('streamflow_token', data.access_token);
        
        // Fetch user data
        const userResponse = await apiRequest('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser({
            id: userData.id.toString(),
            username: userData.username,
            email: userData.email,
            avatar: userData.avatar || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
            playlists: []
          });
        }
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('streamflow_token');
    setUser(null);
    setError(null);
  };

  return { 
    user, 
    loading, 
    error,
    login, 
    logout, 
    register,
    clearError: () => setError(null)
  };
};