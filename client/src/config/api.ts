// API Configuration
export const API_CONFIG = {
  // Backend API - Force HTTPS in production
  BACKEND_URL: (() => {
    const envUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    console.log('🔍 Raw VITE_BACKEND_URL:', envUrl);
    
    // Force HTTPS in production (when not localhost)
    if (envUrl.includes('railway.app') && envUrl.startsWith('http://')) {
      const httpsUrl = envUrl.replace('http://', 'https://');
      console.log('🔧 Forcing HTTPS:', httpsUrl);
      return httpsUrl;
    }
    
    return envUrl;
  })(),
  
  // Image Search APIs
  UNSPLASH_ACCESS_KEY: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',
  UNSPLASH_API_URL: 'https://api.unsplash.com',
  
  FLICKR_API_KEY: import.meta.env.VITE_FLICKR_API_KEY || '',
  FLICKR_API_URL: 'https://www.flickr.com/services/rest',
  
  // Music APIs
  LASTFM_API_KEY: import.meta.env.VITE_LASTFM_API_KEY || '',
  LASTFM_API_URL: 'https://ws.audioscrobbler.com/2.0/',
  
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
      LIKE: (id: string) => `/api/songs/${id}/like`,
      UNLIKE: (id: string) => `/api/songs/${id}/unlike`,
      LIKED: '/api/songs/liked',
      PLAY: (id: string) => `/api/songs/${id}/play`,
      LISTEN: (id: string) => `/api/songs/${id}/listen`,
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

// Debug logging
console.log('🔍 API Config Debug:');
console.log('VITE_BACKEND_URL from env:', import.meta.env.VITE_BACKEND_URL);
console.log('BACKEND_URL resolved:', API_CONFIG.BACKEND_URL);
console.log('Environment mode:', import.meta.env.MODE);
console.log('All env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));

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
  const fullUrl = `${API_CONFIG.BACKEND_URL}${endpoint}`;
  console.log('🔗 API URL constructed:', fullUrl);
  return fullUrl;
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
  
  console.log('🌐 Making API request to:', url);
  console.log('🌐 Request method:', options.method || 'GET');
  console.log('🌐 Request headers:', headers);
  
  const config: RequestInit = {
    headers,
    ...options,
  };

  return fetch(url, config);
}; 