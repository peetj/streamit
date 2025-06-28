import React from 'react';
import { Library, Plus, Heart, Music, User, Settings, LogOut } from 'lucide-react';
import { User as UserType, Playlist } from '../types';
import { ArtistOfTheDayComponent } from './ArtistOfTheDay';

interface SidebarProps {
  user: UserType;
  playlists: Playlist[];
  onLogout: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, playlists, onLogout, activeSection, onSectionChange }) => {
  const playlistItems = [
    { id: 'library', label: 'Library', icon: Library },
    { id: 'create-playlist', label: 'Create Playlist', icon: Plus },
    { id: 'liked-songs', label: 'Liked Songs', icon: Heart },
  ];

  // Calculate gradient colors based on playlist popularity
  const getPlaylistTextColor = (playlist: Playlist, index: number) => {
    if (playlists.length === 0) return 'text-gray-400';
    
    // Sort playlists by total_play_count to determine popularity ranking
    const sortedPlaylists = [...playlists].sort((a, b) => (b.total_play_count || 0) - (a.total_play_count || 0));
    const popularityRank = sortedPlaylists.findIndex(p => p.id === playlist.id);
    
    // Calculate brightness based on popularity (0 = most popular, length-1 = least popular)
    const brightness = 1 - (popularityRank / Math.max(playlists.length - 1, 1));
    
    // Custom salmon gradient - brightest to dullest
    if (brightness >= 0.8) return 'text-salmon-bright'; // Very bright salmon
    if (brightness >= 0.6) return 'text-salmon-medium'; // Medium salmon
    if (brightness >= 0.4) return 'text-salmon-dull'; // Dull salmon
    if (brightness >= 0.2) return 'text-salmon-dark'; // Dark salmon
    return 'text-salmon-darker'; // Darkest salmon
  };

  return (
    <div className="w-64 bg-black/95 backdrop-blur-sm h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white text-xl font-bold">StreamFlow</span>
            <div className="text-xs text-gray-400 font-medium tracking-wide">Your Sound, Your Style</div>
          </div>
        </div>

        <nav className="space-y-2">
          {/* Removed "Your Library" button as it's redundant - we always show the library */}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <div className="space-y-2">
          {playlistItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === item.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Your Playlists ({playlists.length})</div>
          <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {playlists.map((playlist, index) => (
              <button
                key={playlist.id}
                onClick={() => onSectionChange(`playlist-${playlist.id}`)}
                className={`w-full text-left px-3 py-1 text-sm truncate transition-colors ${
                  activeSection === `playlist-${playlist.id}`
                    ? 'text-white bg-gray-800 rounded'
                    : `${getPlaylistTextColor(playlist, index)} hover:text-white`
                }`}
              >
                {index + 1}. {playlist.name}
              </button>
            ))}
          </div>
        </div>

        {/* Artist of the Day Section */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <ArtistOfTheDayComponent />
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={user.avatar}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user.username}</div>
            <div className="text-gray-400 text-xs truncate">{user.email}</div>
          </div>
        </div>

        <div className="flex space-x-1">
          <button
            onClick={() => onSectionChange('profile')}
            className="flex-1 flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <User className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSectionChange('settings')}
            className="flex-1 flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};