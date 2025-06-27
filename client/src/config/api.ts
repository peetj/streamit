// API Configuration for StreamFlow Backend
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api',
  ENDPOINTS: {
    // Authentication
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
    
    // Songs
    SONGS: '/songs/',
    SONG_DETAIL: (id: string) => `/songs/${id}`,
    SONG_STREAM: (id: string) => `/songs/${id}/stream`,
    SONG_ARTWORK: (id: string) => `/songs/${id}/artwork`,
    
    // Playlists
    PLAYLISTS: '/playlists/',
    PLAYLIST_DETAIL: (id: string) => `/playlists/${id}`,
    
    // Admin
    ADMIN_CLEANUP: '/admin/cleanup',
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
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