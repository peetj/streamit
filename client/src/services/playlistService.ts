import { API_CONFIG, apiRequest } from '../config/api';
import { Playlist } from '../types';

export interface CreatePlaylistData {
  name: string;
  description?: string;
}

export interface UpdatePlaylistData {
  name?: string;
  description?: string;
  cover_image?: string;
}

export interface AddSongToPlaylistData {
  song_id: string;
  position?: number;
}

export const playlistService = {
  // Get all playlists for the current user
  async getPlaylists(): Promise<Playlist[]> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.PLAYLISTS.LIST);
    if (!response.ok) {
      throw new Error('Failed to fetch playlists');
    }
    const data = await response.json();
    
    // Transform backend data to frontend format
    return data.map((playlist: any) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      songs: playlist.songs || [],
      coverImage: playlist.cover_image,
      createdAt: new Date(playlist.created_at),
      updatedAt: new Date(playlist.updated_at)
    }));
  },

  // Get a specific playlist
  async getPlaylist(playlistId: string): Promise<Playlist> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.PLAYLISTS.GET(playlistId));
    if (!response.ok) {
      throw new Error('Failed to fetch playlist');
    }
    const playlist = await response.json();
    
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      songs: playlist.songs || [],
      coverImage: playlist.cover_image,
      createdAt: new Date(playlist.created_at),
      updatedAt: new Date(playlist.updated_at)
    };
  },

  // Create a new playlist
  async createPlaylist(playlistData: CreatePlaylistData): Promise<Playlist> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.PLAYLISTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(playlistData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create playlist');
    }

    const playlist = await response.json();
    
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      songs: playlist.songs || [],
      coverImage: playlist.cover_image,
      createdAt: new Date(playlist.created_at),
      updatedAt: new Date(playlist.updated_at)
    };
  },

  // Update a playlist
  async updatePlaylist(playlistId: string, updateData: UpdatePlaylistData): Promise<Playlist> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.PLAYLISTS.UPDATE(playlistId), {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update playlist');
    }

    const playlist = await response.json();
    
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      songs: playlist.songs || [],
      coverImage: playlist.cover_image,
      createdAt: new Date(playlist.created_at),
      updatedAt: new Date(playlist.updated_at)
    };
  },

  // Delete a playlist
  async deletePlaylist(playlistId: string): Promise<void> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.PLAYLISTS.DELETE(playlistId), {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete playlist');
    }
  },

  // Add a song to a playlist
  async addSongToPlaylist(playlistId: string, songData: AddSongToPlaylistData): Promise<void> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.PLAYLISTS.ADD_SONG(playlistId), {
      method: 'POST',
      body: JSON.stringify(songData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add song to playlist');
    }
  },

  // Remove a song from a playlist
  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.PLAYLISTS.REMOVE_SONG(playlistId, songId), {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to remove song from playlist');
    }
  },

  // Reorder songs in a playlist
  async reorderSongs(playlistId: string, songOrder: string[]): Promise<void> {
    const response = await apiRequest(`/api/playlists/${playlistId}/songs/reorder`, {
      method: 'PUT',
      body: JSON.stringify(songOrder),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to reorder songs in playlist');
    }
  },

  // Get playlist listening statistics
  async getListeningStats(playlistId: string): Promise<{
    total_listening_minutes: number;
    total_listening_seconds: number;
    song_stats: Array<{
      song_id: string;
      title: string;
      artist: string;
      play_count: number;
      listening_minutes: number;
    }>;
  }> {
    const response = await apiRequest(`/api/playlists/${playlistId}/listening-stats`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get playlist listening stats');
    }

    return response.json();
  }
}; 