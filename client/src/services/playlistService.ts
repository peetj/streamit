import { apiRequest, getApiUrl } from '../config/api';
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
    const response = await apiRequest('/playlists/');
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
    const response = await apiRequest(`/playlists/${playlistId}`);
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
    const response = await fetch(getApiUrl('/playlists/'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('streamflow_token')}`
      },
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
    const response = await fetch(getApiUrl(`/playlists/${playlistId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('streamflow_token')}`
      },
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
    const response = await apiRequest(`/playlists/${playlistId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete playlist');
    }
  },

  // Add a song to a playlist
  async addSongToPlaylist(playlistId: string, songData: AddSongToPlaylistData): Promise<void> {
    const response = await fetch(getApiUrl(`/playlists/${playlistId}/songs`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('streamflow_token')}`
      },
      body: JSON.stringify(songData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add song to playlist');
    }
  },

  // Remove a song from a playlist
  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    const response = await apiRequest(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to remove song from playlist');
    }
  }
}; 