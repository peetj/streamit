import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { LibraryPage } from './components/LibraryPage';
import { useAuth } from './hooks/useAuth';
import { usePlayer } from './hooks/usePlayer';
import { validateConfig } from './config/api';

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

  // Validate configuration on app startup
  useEffect(() => {
    validateConfig();
  }, []);

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
        return <LibraryPage onPlaySong={playSong} onPlayPlaylist={playPlaylist} currentPlaylist={playerState.currentPlaylist} />;
      default:
        return <LibraryPage onPlaySong={playSong} onPlayPlaylist={playPlaylist} currentPlaylist={playerState.currentPlaylist} />;
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
        <main className="flex-1 overflow-hidden">
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
    </div>
  );
}

export default App;