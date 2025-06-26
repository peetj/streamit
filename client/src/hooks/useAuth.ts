import { useState, useEffect } from 'react';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const token = localStorage.getItem('token');
    if (token) {
      // Mock user data
      setUser({
        id: '1',
        username: 'musiclover',
        email: 'user@example.com',
        avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
        playlists: []
      });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login
    localStorage.setItem('token', 'mock-token');
    setUser({
      id: '1',
      username: 'musiclover',
      email,
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      playlists: []
    });
    return true;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const register = async (username: string, email: string, password: string) => {
    // Mock registration
    localStorage.setItem('token', 'mock-token');
    setUser({
      id: '1',
      username,
      email,
      avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      playlists: []
    });
    return true;
  };

  return { user, loading, login, logout, register };
};