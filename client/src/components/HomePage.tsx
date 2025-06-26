import React from 'react';
import { Play, Clock, Music } from 'lucide-react';
import { Song, Playlist } from '../types';

interface HomePageProps {
  onPlaySong: (song: Song) => void;
}

const mockSongs: Song[] = [
  {
    id: '1',
    title: 'Midnight Dreams',
    artist: 'Luna Sky',
    album: 'Nocturnal',
    duration: 245,
    url: '',
    albumArt: 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=300',
    genre: 'Electronic',
    year: 2023
  },
  {
    id: '2',
    title: 'Ocean Waves',
    artist: 'Coastal Sounds',
    album: 'Serenity',
    duration: 198,
    url: '',
    albumArt: 'https://images.pexels.com/photos/355952/pexels-photo-355952.jpeg?auto=compress&cs=tinysrgb&w=300',
    genre: 'Ambient',
    year: 2023
  },
  {
    id: '3',
    title: 'City Lights',
    artist: 'Urban Echo',
    album: 'Metropolitan',
    duration: 287,
    url: '',
    albumArt: 'https://images.pexels.com/photos/2264753/pexels-photo-2264753.jpeg?auto=compress&cs=tinysrgb&w=300',
    genre: 'Pop',
    year: 2023
  },
  {
    id: '4',
    title: 'Mountain High',
    artist: 'Nature\'s Call',
    album: 'Wilderness',
    duration: 312,
    url: '',
    albumArt: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=300',
    genre: 'Folk',
    year: 2023
  }
];

const mockPlaylists: Playlist[] = [
  {
    id: '1',
    name: 'Chill Vibes',
    description: 'Perfect for relaxing',
    songs: mockSongs.slice(0, 2),
    coverImage: 'https://images.pexels.com/photos/4709285/pexels-photo-4709285.jpeg?auto=compress&cs=tinysrgb&w=300',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Workout Mix',
    description: 'High energy tracks',
    songs: mockSongs.slice(2, 4),
    coverImage: 'https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=300',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const HomePage: React.FC<HomePageProps> = ({ onPlaySong }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-purple-900/20 to-transparent p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
          </h1>
          <p className="text-xl text-gray-300">What would you like to listen to today?</p>
        </div>

        {/* Quick Access Playlists */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Made For You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="group bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 hover:bg-gray-800/70 transition-all duration-300 cursor-pointer"
              >
                <div className="relative mb-4">
                  <img
                    src={playlist.coverImage}
                    alt={playlist.name}
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <button className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 hover:scale-105">
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  </button>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{playlist.name}</h3>
                <p className="text-gray-400 text-sm">{playlist.description}</p>
                <p className="text-gray-500 text-xs mt-2">{playlist.songs.length} songs</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Played */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Recently Played</h2>
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
            <div className="space-y-3">
              {mockSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-all cursor-pointer"
                  onClick={() => onPlaySong(song)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                      {song.albumArt ? (
                        <img src={song.albumArt} alt={song.album} className="w-full h-full object-cover" />
                      ) : (
                        <Music className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <button className="absolute inset-0 w-12 h-12 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{song.title}</div>
                    <div className="text-gray-400 text-sm truncate">{song.artist}</div>
                  </div>
                  
                  <div className="text-gray-400 text-sm">{song.album}</div>
                  
                  <div className="flex items-center text-gray-400 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(song.duration)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Discover New Music */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">Discover New Music</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mockSongs.map((song) => (
              <div
                key={`discover-${song.id}`}
                className="group bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 hover:bg-gray-800/50 transition-all cursor-pointer"
                onClick={() => onPlaySong(song)}
              >
                <div className="relative mb-3">
                  <div className="w-full aspect-square bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg overflow-hidden">
                    {song.albumArt ? (
                      <img src={song.albumArt} alt={song.album} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  <button className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <Play className="w-3 h-3 text-white ml-0.5" />
                  </button>
                </div>
                <h4 className="text-white font-medium text-sm truncate mb-1">{song.title}</h4>
                <p className="text-gray-400 text-xs truncate">{song.artist}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};