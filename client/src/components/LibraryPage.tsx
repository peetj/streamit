import React, { useState, useEffect, useRef } from 'react';
import { Plus, Music, Clock, Play, MoreHorizontal, Upload, RefreshCw, Volume2, Trash2, Edit, ArrowLeft, Heart, MoreVertical, Image, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Playlist, Song } from '../types';
import { playlistService } from '../services/playlistService';
import { songService } from '../services/songService';
import { AddSongToPlaylistModal } from './AddSongToPlaylistModal';
import { ImageSearchModal } from './ImageSearchModal';

interface LibraryPageProps {
  onPlaySong: (song: Song) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  currentPlaylist?: Playlist | null;
  playlists?: Playlist[];
  onPlaylistsUpdate?: () => Promise<void>;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ onPlaySong, onPlayPlaylist, currentPlaylist, playlists = [], onPlaylistsUpdate }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [showEditPlaylistModal, setShowEditPlaylistModal] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [page, setPage] = useState<'grid' | 'detail'>('grid');
  const [detailPlaylist, setDetailPlaylist] = useState<Playlist | null>(null);
  
  // Upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'pending' | 'uploading' | 'success' | 'error' }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load playlists from API
  const loadPlaylists = async () => {
    if (!onPlaylistsUpdate) return;
    
    setLoading(true);
    setError(null);
    try {
      await onPlaylistsUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load playlists on component mount
  useEffect(() => {
    loadPlaylists();
  }, []);

  // Handle Escape key for closing modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDeleteConfirm) {
          cancelDeletePlaylist();
        }
        if (showEditPlaylistModal) {
          cancelEditPlaylist();
        }
        if (showImageSearchModal) {
          setShowImageSearchModal(false);
        }
        if (page === 'detail') {
          setPage('grid');
          setDetailPlaylist(null);
        }
      }
    };
    if (showDeleteConfirm || showEditPlaylistModal || showImageSearchModal || page === 'detail') {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showDeleteConfirm, showEditPlaylistModal, showImageSearchModal, page]);

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
      setSelectedPlaylist(playlist);
      setShowAddSongModal(true);
    }
  };

  const handlePlaylistDetailClick = (playlist: Playlist, event: React.MouseEvent) => {
    event.stopPropagation();
    setDetailPlaylist(playlist);
    setPage('detail');
  };

  const handleSongAdded = () => {
    loadPlaylists();
    if (detailPlaylist) {
      const updatedPlaylist = playlists.find(p => p.id === detailPlaylist.id);
      if (updatedPlaylist) {
        setDetailPlaylist(updatedPlaylist);
      }
    }
  };

  const handleDeletePlaylist = async (playlist: Playlist, event: React.MouseEvent) => {
    event.stopPropagation();
    setPlaylistToDelete(playlist);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    setDeletingPlaylistId(playlistToDelete.id);
    try {
      await playlistService.deletePlaylist(playlistToDelete.id);
      setPlaylists(prev => prev.filter(p => p.id !== playlistToDelete.id));
      if (detailPlaylist?.id === playlistToDelete.id) {
        setPage('grid');
        setDetailPlaylist(null);
      }
      showNotification('Playlist deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete playlist';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      console.error('Error deleting playlist:', err);
    } finally {
      setDeletingPlaylistId(null);
      setShowDeleteConfirm(false);
      setPlaylistToDelete(null);
    }
  };

  const cancelDeletePlaylist = () => {
    setShowDeleteConfirm(false);
    setPlaylistToDelete(null);
  };

  const handleEditPlaylist = (playlist: Playlist, event: React.MouseEvent) => {
    event.stopPropagation();
    setPlaylistToEdit(playlist);
    setShowEditPlaylistModal(true);
  };

  const handleUpdatePlaylist = async (name: string, description: string) => {
    if (!playlistToEdit) return;
    try {
      const updatedPlaylist = await playlistService.updatePlaylist(playlistToEdit.id, { name, description });
      setPlaylists(prev => prev.map(p => p.id === playlistToEdit.id ? updatedPlaylist : p));
      if (detailPlaylist?.id === playlistToEdit.id) {
        setDetailPlaylist(updatedPlaylist);
      }
      showNotification('Playlist updated successfully', 'success');
      setShowEditPlaylistModal(false);
      setPlaylistToEdit(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update playlist';
      showNotification(errorMessage, 'error');
      console.error('Error updating playlist:', err);
    }
  };

  const cancelEditPlaylist = () => {
    setShowEditPlaylistModal(false);
    setPlaylistToEdit(null);
  };

  const handleEditCover = (playlist: Playlist, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedPlaylist(playlist);
    setShowImageSearchModal(true);
  };

  const handleCoverImageSelected = async (imageUrl: string) => {
    if (!selectedPlaylist) return;
    
    try {
      const updatedPlaylist = await playlistService.updatePlaylist(selectedPlaylist.id, { 
        cover_image: imageUrl 
      });
      
      // Update local state
      setPlaylists(prev => prev.map(p => p.id === selectedPlaylist.id ? updatedPlaylist : p));
      
      // Update detail view if it's open
      if (detailPlaylist?.id === selectedPlaylist.id) {
        setDetailPlaylist(updatedPlaylist);
      }
      
      showNotification('Playlist cover updated successfully', 'success');
      setShowImageSearchModal(false);
      setSelectedPlaylist(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update playlist cover';
      showNotification(errorMessage, 'error');
      console.error('Error updating playlist cover:', err);
    }
  };

  // Upload functions
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3'];
      return validTypes.includes(file.type) || file.name.toLowerCase().endsWith('.mp3') || 
             file.name.toLowerCase().endsWith('.wav') || file.name.toLowerCase().endsWith('.flac');
    });
    
    setUploadFiles(prev => [...prev, ...validFiles]);
    
    // Initialize status for new files
    const newStatus: { [key: string]: 'pending' | 'uploading' | 'success' | 'error' } = {};
    const newProgress: { [key: string]: number } = {};
    
    validFiles.forEach(file => {
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      newStatus[fileId] = 'pending';
      newProgress[fileId] = 0;
    });
    
    setUploadStatus(prev => ({ ...prev, ...newStatus }));
    setUploadProgress(prev => ({ ...prev, ...newProgress }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (file: File) => {
    const fileId = `${file.name}-${file.size}-${file.lastModified}`;
    setUploadFiles(prev => prev.filter(f => f !== file));
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileId];
      return newStatus;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileId];
      return newErrors;
    });
  };

  const handleUploadFiles = async () => {
    if (uploadFiles.length === 0) return;
    
    const results: Song[] = [];
    
    for (const file of uploadFiles) {
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      
      try {
        setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
        
        // Simulate progress (since we can't track actual upload progress with fetch)
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[fileId] || 0;
            if (current < 90) {
              return { ...prev, [fileId]: current + Math.random() * 10 };
            }
            return prev;
          });
        }, 200);
        
        const song = await songService.uploadSong(file);
        results.push(song);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        setUploadStatus(prev => ({ ...prev, [fileId]: 'success' }));
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
        setUploadErrors(prev => ({ ...prev, [fileId]: errorMessage }));
        console.error('Upload error:', err);
      }
    }
    
    if (results.length > 0) {
      showNotification(`Successfully uploaded ${results.length} song${results.length > 1 ? 's' : ''}`, 'success');
      // Close modal after a short delay to show success states
      setTimeout(() => {
        setShowUploadModal(false);
        resetUploadState();
      }, 1500);
    }
  };

  const resetUploadState = () => {
    setUploadFiles([]);
    setUploadProgress({});
    setUploadStatus({});
    setUploadErrors({});
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    resetUploadState();
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full ${type === 'success' ? 'bg-green-500 text-white' : type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => { notification.classList.remove('translate-x-full'); }, 100);
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => { if (document.body.contains(notification)) { document.body.removeChild(notification); } }, 300);
    }, 3000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Playlist Detail Page
  const PlaylistDetailPage = ({ playlist }: { playlist: Playlist }) => {
    const isCurrentlyPlaying = currentPlaylist?.id === playlist.id;
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex items-center space-x-6 mb-8 mt-2">
          <button
            onClick={() => { setPage('grid'); setDetailPlaylist(null); }}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg overflow-hidden flex-shrink-0">
            {playlist.coverImage ? (
              <img src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{playlist.name}</h1>
            <p className="text-gray-400 text-lg mb-2">{playlist.description || 'No description'}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{playlist.songs.length} songs</span>
              <span>•</span>
              <span>Updated {formatDate(playlist.updatedAt)}</span>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setSelectedPlaylist(playlist);
                  setShowAddSongModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Songs</span>
              </button>
              {playlist.songs.length > 0 && (
                <button
                  onClick={() => onPlayPlaylist(playlist)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all ${isCurrentlyPlaying ? 'bg-purple-600 text-white' : 'bg-green-500 text-white hover:bg-green-600'}`}
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Volume2 className="w-5 h-5" />
                      <span>Playing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 ml-0.5" />
                      <span>Play</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-2">Songs</h2>
            <p className="text-gray-400">Total duration: {formatTime(playlist.songs.reduce((acc, song) => acc + song.duration, 0))}</p>
          </div>
          <div className="divide-y divide-gray-800">
            {playlist.songs.length > 0 ? (
              playlist.songs.map((song, index) => (
                <div
                  key={song.id}
                  className="group flex items-center space-x-4 p-4 hover:bg-gray-800/50 transition-all cursor-pointer"
                  onClick={() => onPlaySong(song)}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {song.albumArt ? (
                        <img src={song.albumArt} alt={song.album} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">{song.title}</div>
                      <div className="text-gray-400 text-sm truncate">{song.artist}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-400">
                    <span className="hidden md:block">{song.album}</span>
                    <span className="hidden sm:block">{song.genre}</span>
                    <span>{formatTime(song.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <Music className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-4">No songs yet</h3>
                <p className="text-gray-400 mb-6">Add some songs to get started</p>
                <button
                  onClick={() => {
                    setSelectedPlaylist(playlist);
                    setShowAddSongModal(true);
                  }}
                  className="px-6 py-3 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform"
                >
                  Add Songs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const UploadModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={closeUploadModal}>
      <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Upload Music</h2>
          </div>
          <button
            onClick={closeUploadModal}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-all ${
            isDragOver 
              ? 'border-purple-500 bg-purple-500/10' 
              : 'border-gray-600 hover:border-purple-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300 mb-2">Drag and drop your music files here</p>
          <p className="text-gray-500 text-sm mb-4">or</p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".mp3,.wav,.flac,audio/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <p className="text-gray-500 text-xs mt-4">Supported formats: MP3, WAV, FLAC</p>
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Selected Files ({uploadFiles.length})</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uploadFiles.map((file, index) => {
                const fileId = `${file.name}-${file.size}-${file.lastModified}`;
                const status = uploadStatus[fileId] || 'pending';
                const progress = uploadProgress[fileId] || 0;
                const error = uploadErrors[fileId];
                
                return (
                  <div key={fileId} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium truncate">{file.name}</p>
                        <button
                          onClick={() => removeFile(file)}
                          className="text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-400 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      
                      {/* Progress Bar */}
                      {status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}%</p>
                        </div>
                      )}
                      
                      {/* Status Icons */}
                      {status === 'success' && (
                        <div className="flex items-center space-x-2 mt-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 text-sm">Uploaded successfully</span>
                        </div>
                      )}
                      
                      {status === 'error' && (
                        <div className="flex items-center space-x-2 mt-2">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 text-sm">{error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={closeUploadModal}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleUploadFiles}
            disabled={uploadFiles.length === 0 || Object.values(uploadStatus).some(s => s === 'uploading')}
            className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Object.values(uploadStatus).some(s => s === 'uploading') ? 'Uploading...' : 'Upload Files'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-gradient-to-b from-purple-900/20 to-transparent p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {page === 'grid' && (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
                  </h1>
                  <p className="text-xl text-gray-300">What do you want to play today?</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Music</span>
                  </button>
                </div>
              </div>
              {playlists.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">{playlists.length} playlist{playlists.length !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            {/* Content */}
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
                        className={`group bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 hover:bg-gray-800/50 transition-all cursor-pointer ${isCurrentlyPlaying ? 'ring-2 ring-purple-500 bg-purple-900/20' : ''}`}
                        onClick={(e) => handlePlaylistDetailClick(playlist, e)}
                      >
                        <div className="relative mb-4">
                          <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg overflow-hidden">
                            {playlist.coverImage ? (
                              <img src={playlist.coverImage} alt={playlist.name} className="w-full h-full object-cover" />
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
                        {/* Context Menu */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                          <div className="relative flex space-x-1">
                            <button
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaylistClick(playlist);
                              }}
                              title="Add songs to playlist"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                              onClick={(e) => handleEditCover(playlist, e)}
                              title="Edit playlist cover"
                            >
                              <Image className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                              onClick={(e) => handleEditPlaylist(playlist, e)}
                              title="Edit playlist"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                              onClick={(e) => handleDeletePlaylist(playlist, e)}
                              disabled={deletingPlaylistId === playlist.id}
                              title="Delete playlist"
                            >
                              {deletingPlaylistId === playlist.id ? (
                                <div className="w-5 h-5 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
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
                  <p className="text-gray-400 mb-6">Use the "Create Playlist" button in the sidebar to get started</p>
                </div>
              )}
            </div>
          </>
        )}
        {page === 'detail' && detailPlaylist && <PlaylistDetailPage playlist={detailPlaylist} />}
        {/* Modals */}
        {showUploadModal && <UploadModal />}
        <AddSongToPlaylistModal
          isOpen={showAddSongModal}
          onClose={() => setShowAddSongModal(false)}
          playlistId={selectedPlaylist?.id || ''}
          playlistName={selectedPlaylist?.name || ''}
          onSongAdded={handleSongAdded}
        />
        <ImageSearchModal
          isOpen={showImageSearchModal}
          onClose={() => setShowImageSearchModal(false)}
          onSelectImage={handleCoverImageSelected}
          playlistName={selectedPlaylist?.name || ''}
        />
        {/* Edit Playlist Modal */}
        {showEditPlaylistModal && playlistToEdit && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={cancelEditPlaylist}>
            <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Edit className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Edit Playlist</h2>
                  <p className="text-gray-400">Update playlist details</p>
                </div>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name') as string;
                const description = formData.get('description') as string;
                handleUpdatePlaylist(name, description);
              }}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                      Playlist Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      defaultValue={playlistToEdit.name}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter playlist name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      defaultValue={playlistToEdit.description || ''}
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Enter playlist description"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={cancelEditPlaylist}
                    className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Playlist
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && playlistToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={cancelDeletePlaylist}>
            <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Delete Playlist</h2>
                  <p className="text-gray-400">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">"{playlistToDelete.name}"</span>? This will permanently remove the playlist, but your songs will remain in your library.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeletePlaylist}
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  disabled={deletingPlaylistId === playlistToDelete.id}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlaylist}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  disabled={deletingPlaylistId === playlistToDelete.id}
                >
                  {deletingPlaylistId === playlistToDelete.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Playlist</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};