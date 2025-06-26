import React, { useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import { HomePage } from './components/HomePage';
import { SearchPage } from './components/SearchPage';
import { LibraryPage } from './components/LibraryPage';
import { useAuth } from './hooks/useAuth';
import { usePlayer } from './hooks/usePlayer';

function App() {
  const { user, loading, login, logout, register } = useAuth();
  const { playerState, playSong, togglePlay, setProgress, setVolume, nextSong, previousSong, toggleShuffle, toggleRepeat } = usePlayer();
  const [activeSection, setActiveSection] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={login} onRegister={register} />;
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'home':
        return <HomePage onPlaySong={playSong} />;
      case 'search':
        return <SearchPage onPlaySong={playSong} />;
      case 'library':
        return <LibraryPage onPlaySong={playSong} />;
      default:
        return <HomePage onPlaySong={playSong} />;
    }
  };

  return (
    <div className="h-screen bg-black text-white flex flex-col">
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