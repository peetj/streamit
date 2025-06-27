// API Configuration
export const API_CONFIG = {
  // Backend API
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  
  // Image Search APIs
  UNSPLASH_ACCESS_KEY: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
  UNSPLASH_API_URL: 'https://api.unsplash.com',
  
  FLICKR_API_KEY: import.meta.env.VITE_FLICKR_API_KEY || '',
  FLICKR_API_URL: 'https://www.flickr.com/services/rest',
  
  // API Endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      REFRESH: '/api/auth/refresh',
    },
    SONGS: {
      LIST: '/api/songs',
      UPLOAD: '/api/songs/upload',
      DELETE: (id: string) => `/api/songs/${id}`,
      STREAM: (id: string) => `/api/songs/${id}/stream`,
    },
    PLAYLISTS: {
      LIST: '/api/playlists',
      CREATE: '/api/playlists',
      GET: (id: string) => `/api/playlists/${id}`,
      UPDATE: (id: string) => `/api/playlists/${id}`,
      DELETE: (id: string) => `/api/playlists/${id}`,
      ADD_SONG: (id: string) => `/api/playlists/${id}/songs`,
      REMOVE_SONG: (playlistId: string, songId: string) => `/api/playlists/${playlistId}/songs/${songId}`,
    },
  },
};

// Environment validation
export const validateConfig = () => {
  const missingKeys = [];
  
  if (!API_CONFIG.UNSPLASH_ACCESS_KEY && !API_CONFIG.FLICKR_API_KEY) {
    missingKeys.push('VITE_UNSPLASH_ACCESS_KEY or VITE_FLICKR_API_KEY');
  }
  
  if (missingKeys.length > 0) {
    console.warn('Missing environment variables:', missingKeys.join(', '));
    console.warn('Image search will fall back to stock images.');
  }
  
  return missingKeys.length === 0;
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BACKEND_URL}${endpoint}`;
};

// Helper function to get auth headers
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('streamflow_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API request helper
export const apiRequest = async (
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiUrl(endpoint);
  const headers = getAuthHeaders();
  
  const config: RequestInit = {
    headers,
    ...options,
  };

  return fetch(url, config);
}; 