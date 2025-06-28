import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { LibraryPage } from './components/LibraryPage';
import LikedSongsPage from './components/LikedSongsPage';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { useAuth } from './hooks/useAuth';
import { usePlayer } from './hooks/usePlayer';
import { validateConfig } from './config/api';
import { playlistService } from './services/playlistService';
import { Playlist } from './types';

function App() {
  const { user, loading, error, login, logout, register, clearError } = useAuth();
  const { 
    playerState, 
    playSong, 
    playPlaylist,
    togglePlay, 
    setProgress, 
    setVolume, 
    nextSong, 
    previousSong, 
    toggleShuffle, 
    toggleRepeat 
  } = usePlayer();
  const [activeSection, setActiveSection] = useState('library');
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Validate configuration on app startup
  useEffect(() => {
    validateConfig();
  }, []);

  // Load playlists
  const loadPlaylists = async () => {
    try {
      const fetchedPlaylists = await playlistService.getPlaylists();
      setPlaylists(fetchedPlaylists);
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  };

  // Load playlists on mount and when user changes
  useEffect(() => {
    if (user) {
      loadPlaylists();
    }
  }, [user]);

  // Handle create playlist section change
  useEffect(() => {
    if (activeSection === 'create-playlist') {
      setShowCreatePlaylistModal(true);
      setActiveSection('library'); // Return to library after opening modal
    }
  }, [activeSection]);

  const handleCreatePlaylist = async (name: string, description: string) => {
    try {
      const newPlaylist = await playlistService.createPlaylist({ name, description });
      setPlaylists(prev => [newPlaylist, ...prev]);
      setShowCreatePlaylistModal(false);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={login} onRegister={register} error={error} onClearError={clearError} />;
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'library':
        return <LibraryPage 
          onPlaySong={playSong} 
          onPlayPlaylist={playPlaylist} 
          currentPlaylist={playerState.currentPlaylist}
          playlists={playlists}
          onPlaylistsUpdate={loadPlaylists}
        />;
      case 'liked-songs':
        return <LikedSongsPage />;
      default:
        return <LibraryPage 
          onPlaySong={playSong} 
          onPlayPlaylist={playPlaylist} 
          currentPlaylist={playerState.currentPlaylist}
          playlists={playlists}
          onPlaylistsUpdate={loadPlaylists}
        />;
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          user={user}
          onLogout={logout}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <main className="flex-1 overflow-y-auto">
          {renderMainContent()}
        </main>
      </div>
      
      <Player
        playerState={playerState}
        onTogglePlay={togglePlay}
        onNext={nextSong}
        onPrevious={previousSong}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        onProgressChange={setProgress}
        onVolumeChange={setVolume}
      />

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <CreatePlaylistModal
          isOpen={showCreatePlaylistModal}
          onClose={() => setShowCreatePlaylistModal(false)}
          onCreatePlaylist={handleCreatePlaylist}
        />
      )}
    </div>
  );
}

export default App;