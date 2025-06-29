import React, { useState, useEffect, useRef } from 'react';
import { Plus, Music, Clock, Play, MoreHorizontal, Upload, RefreshCw, Volume2, Trash2, Edit, ArrowLeft, Heart, MoreVertical, Image, X, CheckCircle, AlertCircle, GripVertical } from 'lucide-react';
import { Playlist, Song } from '../types';
import { playlistService } from '../services/playlistService';
import { songService } from '../services/songService';
import { AddSongToPlaylistModal } from './AddSongToPlaylistModal';
import { ImageSearchModal } from './ImageSearchModal';
import { UploadWarning } from './UploadWarning';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LibraryPageProps {
  onPlaySong: (song: Song) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  currentPlaylist?: Playlist | null;
  playlists?: Playlist[];
  onPlaylistsUpdate?: () => Promise<void>;
}

// Draggable Song Item Component
const DraggableSongItem = ({ song, index, onPlaySong, likedSongs, handleLikeSong }: {
  song: Song;
  index: number;
  onPlaySong: (song: Song) => void;
  likedSongs: Set<string>;
  handleLikeSong: (songId: string, event: React.MouseEvent) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? 'rgba(147, 51, 234, 0.1)' : 'transparent',
    boxShadow: isDragging ? '0 10px 20px rgba(0, 0, 0, 0.3)' : 'none',
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-4 p-4 hover:bg-gray-800/50 transition-all cursor-pointer ${
        isDragging ? 'z-50' : ''
      }`}
      onClick={() => onPlaySong(song)}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="p-1 text-gray-400 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Song Number */}
      <div className="w-8 text-center text-gray-400 text-sm font-medium">
        {index + 1}
      </div>

      {/* Album Art */}
      <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
        {song.albumArt ? (
          <img src={song.albumArt} alt={song.album} className="w-full h-full object-cover" />
        ) : (
          <Music className="w-6 h-6 text-gray-400" />
        )}
      </div>

      {/* Song Info */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{song.title}</div>
        <div className="text-gray-400 text-sm truncate">{song.artist}</div>
      </div>

      {/* Album */}
      <div className="hidden md:block text-gray-400 text-sm truncate max-w-32">
        {song.album}
      </div>

      {/* Duration */}
      <div className="text-gray-400 text-sm">
        {formatTime(song.duration)}
      </div>

      {/* Like Button */}
      <button
        onClick={(e) => handleLikeSong(song.id, e)}
        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
        title={likedSongs.has(song.id) ? 'Remove from liked songs' : 'Add to liked songs'}
      >
        <Heart 
          className={`w-4 h-4 ${likedSongs.has(song.id) ? 'fill-current text-red-400' : ''}`} 
        />
      </button>

      {/* More Options */}
      <button className="p-2 text-gray-400 hover:text-white transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
};

// Playlist Detail Page Component
const PlaylistDetailPage = ({ 
  playlist, 
  onPlaySong, 
  onPlayPlaylist, 
  currentPlaylist, 
  likedSongs, 
  handleLikeSong,
  setSelectedPlaylist,
  setShowAddSongModal,
  setPage,
  setDetailPlaylist
}: {
  playlist: Playlist;
  onPlaySong: (song: Song) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  currentPlaylist?: Playlist | null;
  likedSongs: Set<string>;
  handleLikeSong: (songId: string, event: React.MouseEvent) => void;
  setSelectedPlaylist: (playlist: Playlist) => void;
  setShowAddSongModal: (show: boolean) => void;
  setPage: (page: string) => void;
  setDetailPlaylist: (playlist: Playlist | null) => void;
}) => {
  const isCurrentlyPlaying = currentPlaylist?.id === playlist.id;
  
  // Use useRef to store the current songs order - this won't trigger re-renders
  const songsRef = useRef<Song[]>(playlist.songs);
  const [songs, setSongs] = useState<Song[]>(playlist.songs);
  const [isReordering, setIsReordering] = useState(false);
  const [listeningStats, setListeningStats] = useState<{
    total_listening_minutes: number;
    total_listening_seconds: number;
    song_stats: Array<{
      song_id: string;
      title: string;
      artist: string;
      play_count: number;
      listening_minutes: number;
    }>;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Initialize songs only once
  useEffect(() => {
    songsRef.current = playlist.songs;
    setSongs(playlist.songs);
  }, [playlist.id]); // Only when playlist ID changes

  // Load listening statistics
  useEffect(() => {
    const loadListeningStats = async () => {
      try {
        setLoadingStats(true);
        const stats = await playlistService.getListeningStats(playlist.id);
        setListeningStats(stats);
      } catch (error) {
        console.error('Failed to load listening stats:', error);
        setListeningStats(null);
      } finally {
        setLoadingStats(false);
      }
    };

    loadListeningStats();
  }, [playlist.id]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const currentSongs = songsRef.current;
      const oldIndex = currentSongs.findIndex((item) => item.id === active.id);
      const newIndex = currentSongs.findIndex((item) => item.id === over?.id);
      const newSongs = arrayMove(currentSongs, oldIndex, newIndex);
      
      console.log('Drag and drop - Old order:', currentSongs.map(s => s.title));
      console.log('Drag and drop - New order:', newSongs.map(s => s.title));
      
      // Update both ref and state
      songsRef.current = newSongs;
      setSongs(newSongs);

      // Save the new order to the backend
      try {
        setIsReordering(true);
        const newSongOrder = newSongs.map(song => song.id);
        await playlistService.reorderSongs(playlist.id, newSongOrder);
        
        console.log('Drag and drop - Backend save successful');
      } catch (error) {
        console.error('Failed to reorder songs:', error);
        // Revert the order if the API call fails
        songsRef.current = playlist.songs;
        setSongs(playlist.songs);
      } finally {
        setIsReordering(false);
      }
    }
  };

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
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">{playlist.description || 'No description'}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>{songs.length} songs</span>
            <span>•</span>
            <span>Updated {formatDate(playlist.updatedAt)}</span>
            {isReordering && <span className="text-purple-400">• Reordering...</span>}
          </div>
          {listeningStats && (
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{listeningStats.total_listening_minutes.toFixed(1)} minutes listened</span>
              </span>
            </div>
          )}
          {loadingStats && (
            <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading listening stats...</span>
            </div>
          )}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={() => {
                setSelectedPlaylist(playlist);
                setShowAddSongModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-purple-600 hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Songs</span>
            </button>
            {songs.length > 0 && (
              <button
                onClick={() => onPlayPlaylist(playlist)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all ${isCurrentlyPlaying ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
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
          <p className="text-gray-400">Total duration: {formatTime(songs.reduce((acc, song) => acc + song.duration, 0))}</p>
          <p className="text-gray-500 text-sm mt-1">Drag and drop songs to reorder them</p>
        </div>
        <div className="divide-y divide-gray-800">
          {songs.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={songs.map(song => song.id)}
                strategy={verticalListSortingStrategy}
              >
                {songs.map((song, index) => (
                  <DraggableSongItem
                    key={song.id}
                    song={song}
                    index={index}
                    onPlaySong={onPlaySong}
                    likedSongs={likedSongs}
                    handleLikeSong={handleLikeSong}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 hover:scale-105 transition-all"
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

export const LibraryPage: React.FC<LibraryPageProps> = ({ onPlaySong, onPlayPlaylist, currentPlaylist, playlists = [], onPlaylistsUpdate }) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const [showUploadWarning, setShowUploadWarning] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [showEditPlaylistModal, setShowEditPlaylistModal] = useState(false);
  const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null);
  const [removingSongId, setRemovingSongId] = useState<string | null>(null);
  const [page, setPage] = useState<'grid' | 'detail'>('grid');
  const [detailPlaylist, setDetailPlaylist] = useState<Playlist | null>(null);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());
  const [loadingLikedSongs, setLoadingLikedSongs] = useState(false);
  
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

  // Load liked songs
  const loadLikedSongs = async () => {
    try {
      setLoadingLikedSongs(true);
      const likedSongsList = await songService.getLikedSongs();
      const likedSongIds = new Set(likedSongsList.map(song => song.id));
      setLikedSongs(likedSongIds);
    } catch (err) {
      console.error('Error loading liked songs:', err);
    } finally {
      setLoadingLikedSongs(false);
    }
  };

  // Load liked songs on component mount
  useEffect(() => {
    loadLikedSongs();
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
      // Update playlists by refreshing from parent
      if (onPlaylistsUpdate) {
        await onPlaylistsUpdate();
      }
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

  const handlePlaylistDetailClick = async (playlist: Playlist, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Fetch the playlist directly from the backend to ensure correct song order
    try {
      const freshPlaylist = await playlistService.getPlaylist(playlist.id);
      setDetailPlaylist(freshPlaylist);
    } catch (err) {
      console.error('Failed to fetch playlist details:', err);
      // Fallback to the playlist data from props
      setDetailPlaylist(playlist);
    }
    
    setPage('detail');
  };

  const handleSongAdded = () => {
    // Refresh playlists to show the newly added song
    if (onPlaylistsUpdate) {
      onPlaylistsUpdate();
    }
    setShowAddSongModal(false);
    setSelectedPlaylist(null);
  };

  // Handle like/unlike song
  const handleLikeSong = async (songId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      if (likedSongs.has(songId)) {
        await songService.unlikeSong(songId);
        setLikedSongs(prev => {
          const newSet = new Set(prev);
          newSet.delete(songId);
          return newSet;
        });
        showNotification('Song removed from liked songs', 'success');
      } else {
        await songService.likeSong(songId);
        setLikedSongs(prev => new Set([...prev, songId]));
        showNotification('Song added to liked songs', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update liked status';
      showNotification(errorMessage, 'error');
      console.error('Error updating liked status:', err);
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
      // Update playlists by refreshing from parent
      if (onPlaylistsUpdate) {
        await onPlaylistsUpdate();
      }
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
      // Update playlists by refreshing from parent
      if (onPlaylistsUpdate) {
        await onPlaylistsUpdate();
      }
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

  const handleRemoveSongFromPlaylist = async (songId: string) => {
    if (!playlistToEdit) return;
    setRemovingSongId(songId);
    try {
      await playlistService.removeSongFromPlaylist(playlistToEdit.id, songId);
      // Update the local playlist state
      setPlaylistToEdit(prev => prev ? {
        ...prev,
        songs: prev.songs.filter(song => song.id !== songId)
      } : null);
      // Update playlists by refreshing from parent
      if (onPlaylistsUpdate) {
        await onPlaylistsUpdate();
      }
      showNotification('Song removed from playlist successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove song from playlist';
      showNotification(errorMessage, 'error');
      console.error('Error removing song from playlist:', err);
    } finally {
      setRemovingSongId(null);
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
      
      // Update local state by refreshing playlists from the parent
      if (onPlaylistsUpdate) {
        await onPlaylistsUpdate();
      }
      
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

  // Upload warning handlers
  const handleUploadButtonClick = () => {
    setShowUploadWarning(true);
  };

  const handleUploadWarningContinue = () => {
    setShowUploadWarning(false);
    setShowUploadModal(true);
  };

  const handleUploadWarningCancel = () => {
    setShowUploadWarning(false);
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
                    onClick={handleUploadButtonClick}
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
                        className={`relative group backdrop-blur-sm rounded-xl p-4 transition-all duration-200 cursor-pointer border ${
                          isCurrentlyPlaying 
                            ? 'bg-purple-100/50 dark:bg-purple-900/40 ring-2 ring-purple-500 border-purple-300/50 dark:border-purple-500/50' 
                            : 'bg-white/20 dark:bg-gray-800/70 hover:bg-white/30 dark:hover:bg-gray-800/90 border-white/20 dark:border-gray-700/70'
                        }`}
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
                            className="absolute bottom-2 right-2 w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:scale-105 hover:bg-purple-700"
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
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{playlist.description || 'No description'}</p>
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
        {page === 'detail' && detailPlaylist && <PlaylistDetailPage
          playlist={detailPlaylist}
          onPlaySong={onPlaySong}
          onPlayPlaylist={onPlayPlaylist}
          currentPlaylist={currentPlaylist}
          likedSongs={likedSongs}
          handleLikeSong={handleLikeSong}
          setSelectedPlaylist={setSelectedPlaylist}
          setShowAddSongModal={setShowAddSongModal}
          setPage={setPage}
          setDetailPlaylist={setDetailPlaylist}
        />}
        {/* Modals */}
        {showDeleteConfirm && playlistToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4">
              <div className="flex items-center space-x-4 mb-6">
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
        {/* Upload Warning Modal */}
        {showUploadWarning && (
          <UploadWarning
            onContinue={handleUploadWarningContinue}
            onCancel={handleUploadWarningCancel}
          />
        )}
        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            isDragOver={isDragOver}
            handleDragOver={handleDragOver}
            handleDragLeave={handleDragLeave}
            handleDrop={handleDrop}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            uploadFiles={uploadFiles}
            uploadStatus={uploadStatus}
            uploadProgress={uploadProgress}
            uploadErrors={uploadErrors}
            removeFile={removeFile}
            handleUploadFiles={handleUploadFiles}
            closeUploadModal={closeUploadModal}
          />
        )}
        {/* Add Song Modal */}
        {showAddSongModal && selectedPlaylist && (
          <AddSongToPlaylistModal
            playlist={selectedPlaylist}
            onClose={() => {
              setShowAddSongModal(false);
              setSelectedPlaylist(null);
            }}
            onSongAdded={handleSongAdded}
          />
        )}
        {/* Image Search Modal */}
        {showImageSearchModal && (
          <ImageSearchModal
            onClose={() => setShowImageSearchModal(false)}
            onImageSelected={handleCoverImageSelected}
          />
        )}
      </div>
    </div>
  );
};

// UploadModal component moved inside the main component to access state
const UploadModal = ({ 
  isDragOver, 
  handleDragOver, 
  handleDragLeave, 
  handleDrop, 
  fileInputRef, 
  handleFileSelect, 
  uploadFiles, 
  uploadStatus, 
  uploadProgress, 
  uploadErrors, 
  removeFile, 
  handleUploadFiles, 
  closeUploadModal 
}: {
  isDragOver: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (files: FileList | null) => void;
  uploadFiles: File[];
  uploadStatus: { [key: string]: 'pending' | 'uploading' | 'success' | 'error' };
  uploadProgress: { [key: string]: number };
  uploadErrors: { [key: string]: string };
  removeFile: (file: File) => void;
  handleUploadFiles: () => Promise<void>;
  closeUploadModal: () => void;
}) => (
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