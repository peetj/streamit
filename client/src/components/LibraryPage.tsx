import React, { useState, useEffect } from 'react';
import { Plus, Music, Clock, Play, MoreHorizontal, Upload, RefreshCw, Volume2 } from 'lucide-react';
import { Playlist, Song } from '../types';
import { playlistService } from '../services/playlistService';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { AddSongToPlaylistModal } from './AddSongToPlaylistModal';

interface LibraryPageProps {
  onPlaySong: (song: Song) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  currentPlaylist?: Playlist | null;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onPlaySong, onPlayPlaylist, currentPlaylist }) => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'artists' | 'albums'>('playlists');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'playlists', label: 'Playlists' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' }
  ];

  // Load playlists from API
  const loadPlaylists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedPlaylists = await playlistService.getPlaylists();
      setPlaylists(fetchedPlaylists);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load playlists on component mount
  useEffect(() => {
    if (activeTab === 'playlists') {
      loadPlaylists();
    }
  }, [activeTab]);

  const handleCreatePlaylist = async (name: string, description: string) => {
    try {
      const newPlaylist = await playlistService.createPlaylist({ name, description });
      setPlaylists(prev => [newPlaylist, ...prev]);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowAddSongModal(true);
  };

  const handlePlayPlaylist = (playlist: Playlist, event: React.MouseEvent) => {
    event.stopPropagation();
    if (playlist.songs.length > 0) {
      onPlayPlaylist(playlist);
    } else {
      // If playlist is empty, open the add song modal instead
      setSelectedPlaylist(playlist);
      setShowAddSongModal(true);
    }
  };

  const handleSongAdded = () => {
    // Refresh the playlists to show updated song count
    loadPlaylists();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const UploadModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUploadModal(false)}>
      <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">Upload Music</h2>
        
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-6 hover:border-purple-500 transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">Drag and drop your music files here</p>
          <p className="text-gray-500 text-sm mb-4">or</p>
          <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Choose Files
          </button>
          <p className="text-gray-500 text-xs mt-4">Supported formats: MP3, WAV, FLAC</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowUploadModal(false)}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Upload
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-gradient-to-b from-purple-900/20 to-transparent p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Your Library</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Music</span>
            </button>
            <button 
              onClick={() => setShowCreatePlaylistModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Playlist</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-800/30 rounded-full p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'playlists' && (
          <div>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-between">
                <span className="text-red-200">{error}</span>
                <button
                  onClick={loadPlaylists}
                  className="text-red-300 hover:text-red-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-300">Loading playlists...</span>
                </div>
              </div>
            )}

            {/* Playlists Grid */}
            {!loading && playlists.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {playlists.map((playlist) => {
                  const isCurrentlyPlaying = currentPlaylist?.id === playlist.id;
                  return (
                    <div
                      key={playlist.id}
                      className={`group bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 hover:bg-gray-800/50 transition-all cursor-pointer ${
                        isCurrentlyPlaying ? 'ring-2 ring-purple-500 bg-purple-900/20' : ''
                      }`}
                      onClick={(e) => handlePlayPlaylist(playlist, e)}
                    >
                      <div className="relative mb-4">
                        <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg overflow-hidden">
                          {playlist.coverImage ? (
                            <img
                              src={playlist.coverImage}
                              alt={playlist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-12 h-12 text-white" />
                            </div>
                          )}
                        </div>
                        <button 
                          className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:scale-105"
                          onClick={(e) => handlePlayPlaylist(playlist, e)}
                        >
                          {isCurrentlyPlaying ? (
                            <Volume2 className="w-5 h-5 text-white" />
                          ) : (
                            <Play className="w-5 h-5 text-white ml-0.5" />
                          )}
                        </button>
                        {isCurrentlyPlaying && (
                          <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                            <Volume2 className="w-3 h-3" />
                            <span>Playing</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-white font-semibold text-lg mb-2 truncate">{playlist.name}</h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">{playlist.description || 'No description'}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{playlist.songs.length} songs</span>
                        <span>Updated {formatDate(playlist.updatedAt)}</span>
                      </div>
                      
                      <button 
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlaylistClick(playlist);
                        }}
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!loading && playlists.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <Music className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">Create your first playlist</h3>
                <p className="text-gray-400 mb-6">It's easy, we'll help you</p>
                <button 
                  onClick={() => setShowCreatePlaylistModal(true)}
                  className="px-8 py-3 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform"
                >
                  Create playlist
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'artists' && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
              <Music className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Follow your first artist</h3>
            <p className="text-gray-400 mb-6">Follow artists you like by tapping the follow button</p>
          </div>
        )}

        {activeTab === 'albums' && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
              <Music className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Save your first album</h3>
            <p className="text-gray-400 mb-6">Save albums by tapping the heart icon</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUploadModal && <UploadModal />}
      <CreatePlaylistModal
        isOpen={showCreatePlaylistModal}
        onClose={() => setShowCreatePlaylistModal(false)}
        onCreatePlaylist={handleCreatePlaylist}
      />
      <AddSongToPlaylistModal
        isOpen={showAddSongModal}
        onClose={() => setShowAddSongModal(false)}
        playlistId={selectedPlaylist?.id || ''}
        playlistName={selectedPlaylist?.name || ''}
        onSongAdded={handleSongAdded}
      />
    </div>
  );
};