import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Music, Clock } from 'lucide-react';
import { Song } from '../types';
import { songService } from '../services/songService';
import { playlistService } from '../services/playlistService';

interface AddSongToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  playlistName: string;
  onSongAdded: () => void;
}

export const AddSongToPlaylistModal: React.FC<AddSongToPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlistId,
  playlistName,
  onSongAdded
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addingSongId, setAddingSongId] = useState<string | null>(null);

  // Load songs on modal open
  useEffect(() => {
    if (isOpen) {
      loadSongs();
    }
  }, [isOpen]);

  // Search songs when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        searchSongs(searchQuery);
      } else {
        loadSongs();
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const loadSongs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedSongs = await songService.getSongs({ limit: 50 });
      setSongs(fetchedSongs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load songs');
      console.error('Error loading songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchSongs = async (query: string) => {
    setSearchLoading(true);
    setError(null);
    
    try {
      const searchResults = await songService.getSongs({ search: query, limit: 50 });
      setSongs(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search songs');
      console.error('Error searching songs:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddSong = async (song: Song) => {
    setAddingSongId(song.id);
    setError(null);
    
    try {
      await playlistService.addSongToPlaylist(playlistId, { song_id: song.id });
      onSongAdded();
      // Remove the song from the list to show it was added
      setSongs(prev => prev.filter(s => s.id !== song.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add song to playlist');
      console.error('Error adding song to playlist:', err);
    } finally {
      setAddingSongId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    return songService.formatDuration(seconds);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Add Songs to Playlist</h2>
            <p className="text-gray-400 text-sm mt-1">{playlistName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search songs by title, artist, or album..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <span className="text-red-200 text-sm">{error}</span>
          </div>
        )}

        {/* Songs List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-300">Loading songs...</span>
              </div>
            </div>
          ) : searchLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-300">Searching...</span>
              </div>
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-16">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchQuery ? 'No songs found matching your search.' : 'No songs available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {songs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Album Art */}
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg overflow-hidden flex-shrink-0">
                      {song.albumArt ? (
                        <img
                          src={song.albumArt}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Song Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{song.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{song.album}</span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(song.duration)}
                        </span>
                        {song.genre && <span>{song.genre}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() => handleAddSong(song)}
                    disabled={addingSongId === song.id}
                    className="ml-4 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    {addingSongId === song.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 