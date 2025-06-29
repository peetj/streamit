import { API_CONFIG, getAuthHeaders } from '../config/api';
import { Song } from '../types';

export interface SongSearchParams {
  search?: string;
  genre?: string;
  skip?: number;
  limit?: number;
}

// Helper function for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('streamflow_token');
  const url = `${API_CONFIG.BACKEND_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  return fetch(url, defaultOptions);
};

export const songService = {
  // Get all songs with optional search and filtering
  async getSongs(params: SongSearchParams = {}): Promise<Song[]> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.genre) queryParams.append('genre', params.genre);
    if (params.skip) queryParams.append('skip', params.skip.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = `${API_CONFIG.ENDPOINTS.SONGS.LIST}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiRequest(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch songs');
    }
    
    const data = await response.json();
    
    // Transform backend data to frontend format
    return data.map((song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || 'Unknown Album',
      duration: song.duration || 0,
      url: API_CONFIG.ENDPOINTS.SONGS.STREAM(song.id),
      albumArt: song.album_art_path ? `/api/stream/album-art/${song.id}` : undefined,
      genre: song.genre,
      year: song.year
    }));
  },

  // Get a specific song by ID
  async getSong(songId: string): Promise<Song> {
    const response = await apiRequest(`${API_CONFIG.ENDPOINTS.SONGS.LIST}/${songId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch song');
    }
    
    const song = await response.json();
    
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || 'Unknown Album',
      duration: song.duration || 0,
      url: API_CONFIG.ENDPOINTS.SONGS.STREAM(song.id),
      albumArt: song.album_art_path ? `/api/stream/album-art/${song.id}` : undefined,
      genre: song.genre,
      year: song.year
    };
  },

  // Upload a song file
  async uploadSong(file: File): Promise<Song> {
    const token = localStorage.getItem('streamflow_token');
    const url = `${API_CONFIG.BACKEND_URL}${API_CONFIG.ENDPOINTS.SONGS.UPLOAD}`;
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData, let the browser set it with boundary
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to upload song');
    }
    
    const song = await response.json();
    
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || 'Unknown Album',
      duration: song.duration || 0,
      url: API_CONFIG.ENDPOINTS.SONGS.STREAM(song.id),
      albumArt: song.album_art_path ? `/api/stream/album-art/${song.id}` : undefined,
      genre: song.genre,
      year: song.year
    };
  },

  // Format duration from seconds to MM:SS format
  formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  async deleteSong(songId: string): Promise<void> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.SONGS.DELETE(songId), {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete song');
    }
  },

  async likeSong(songId: string): Promise<void> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.SONGS.LIKE(songId), {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to like song');
    }
  },

  async unlikeSong(songId: string): Promise<void> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.SONGS.UNLIKE(songId), {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to unlike song');
    }
  },

  async getLikedSongs(): Promise<Song[]> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.SONGS.LIKED);

    if (!response.ok) {
      throw new Error('Failed to fetch liked songs');
    }

    return response.json();
  },

  async playSong(songId: string): Promise<void> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.SONGS.PLAY(songId), {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to increment play count');
    }
  },

  // Track listening sessions
  async startListeningSession(songId: string, playlistId?: string): Promise<{ session_id: string }> {
    const params = new URLSearchParams();
    if (playlistId) {
      params.append('playlist_id', playlistId);
    }
    
    const response = await apiRequest(`${API_CONFIG.ENDPOINTS.SONGS.LISTEN(songId)}?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to start listening session');
    }

    return response.json();
  },

  async completeListeningSession(songId: string, sessionId: string, durationSeconds: number): Promise<void> {
    const response = await apiRequest(`${API_CONFIG.ENDPOINTS.SONGS.LISTEN(songId)}/${sessionId}/`, {
      method: 'PUT',
      body: JSON.stringify({ duration_seconds: durationSeconds }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete listening session');
    }
  }
}; 