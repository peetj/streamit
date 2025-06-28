import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { LibraryPage } from './components/LibraryPage';
import LikedSongsPage from './components/LikedSongsPage';
import { ProfilePage } from './components/ProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { ArtistOfTheDayModal } from './components/ArtistOfTheDayModal';
import { useAuth } from './hooks/useAuth';
import { usePlayer } from './hooks/usePlayer';
import { validateConfig } from './config/api';
import { playlistService } from './services/playlistService';
import { Playlist } from './types';
import { ArtistOfTheDay } from './services/artistOfTheDayService';

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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentUser, setCurrentUser] = useState(user);
  
  // Artist modal state
  const [selectedArtist, setSelectedArtist] = useState<ArtistOfTheDay | null>(null);
  const [isArtistModalOpen, setIsArtistModalOpen] = useState(false);
  const [artistDayLabel, setArtistDayLabel] = useState('');

  // Update currentUser when user changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('streamflow_dark_mode');
    const shouldUseDarkMode = savedDarkMode === null ? true : savedDarkMode === 'true';
    setIsDarkMode(shouldUseDarkMode);
    applyTheme(shouldUseDarkMode);
  }, []);

  // Apply theme to document
  const applyTheme = (darkMode: boolean) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Listen for theme changes from settings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'streamflow_dark_mode') {
        const newDarkMode = e.newValue === 'true';
        setIsDarkMode(newDarkMode);
        applyTheme(newDarkMode);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

  const handleUserUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
  };

  // Artist modal handlers
  const handleArtistClick = (artist: ArtistOfTheDay, dayLabel: string) => {
    setSelectedArtist(artist);
    setArtistDayLabel(dayLabel);
    setIsArtistModalOpen(true);
  };

  const handleCloseArtistModal = () => {
    setIsArtistModalOpen(false);
    setSelectedArtist(null);
    setArtistDayLabel('');
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
      case 'profile':
        return <ProfilePage 
          user={currentUser || user} 
          onBackToLibrary={() => setActiveSection('library')} 
          onUserUpdate={handleUserUpdate}
        />;
      case 'settings':
        return <SettingsPage onBackToLibrary={() => setActiveSection('library')} />;
      default:
        // Handle playlist sections
        if (activeSection.startsWith('playlist-')) {
          return <LibraryPage 
            onPlaySong={playSong} 
            onPlayPlaylist={playPlaylist} 
            currentPlaylist={playerState.currentPlaylist}
            playlists={playlists}
            onPlaylistsUpdate={loadPlaylists}
          />;
        }
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
    <div className="h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#1f2937' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#1f2937',
            border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
          },
        }}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          user={currentUser || user}
          playlists={playlists}
          onLogout={logout}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onArtistClick={handleArtistClick}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black">
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

      {/* Artist of the Day Modal */}
      {selectedArtist && isArtistModalOpen && (
        <ArtistOfTheDayModal
          artist={selectedArtist}
          isOpen={isArtistModalOpen}
          onClose={handleCloseArtistModal}
          dayLabel={artistDayLabel}
        />
      )}
    </div>
  );
}

export default App;