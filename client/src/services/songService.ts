import { apiRequest, getApiUrl } from '../config/api';
import { Song } from '../types';

export interface SongSearchParams {
  search?: string;
  genre?: string;
  skip?: number;
  limit?: number;
}

export const songService = {
  // Get all songs with optional search and filtering
  async getSongs(params: SongSearchParams = {}): Promise<Song[]> {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.genre) queryParams.append('genre', params.genre);
    if (params.skip) queryParams.append('skip', params.skip.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const url = `/songs/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
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
      url: `/api/stream/song/${song.id}`,
      albumArt: song.album_art_path ? `/api/stream/album-art/${song.id}` : undefined,
      genre: song.genre,
      year: song.year
    }));
  },

  // Get a specific song by ID
  async getSong(songId: string): Promise<Song> {
    const response = await apiRequest(`/songs/${songId}`);
    
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
      url: `/api/stream/song/${song.id}`,
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
  }
}; 