import React, { useState } from 'react';
import { Search, Filter, Clock, Play, Music } from 'lucide-react';
import { Song } from '../types';

interface SearchPageProps {
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
  },
  {
    id: '5',
    title: 'Thunder Storm',
    artist: 'Electric Pulse',
    album: 'Power Play',
    duration: 203,
    url: '',
    albumArt: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300',
    genre: 'Rock',
    year: 2022
  },
  {
    id: '6',
    title: 'Starlight Melody',
    artist: 'Cosmic Dreams',
    album: 'Galaxy',
    duration: 276,
    url: '',
    albumArt: 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=300',
    genre: 'Synthwave',
    year: 2023
  }
];

export const SearchPage: React.FC<SearchPageProps> = ({ onPlaySong }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);

  const genres = ['All', 'Electronic', 'Ambient', 'Pop', 'Folk', 'Rock', 'Synthwave'];

  const handleSearch = () => {
    let results = mockSongs;

    if (searchQuery.trim()) {
      results = results.filter(song =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.album.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedGenre !== 'All') {
      results = results.filter(song => song.genre === selectedGenre);
    }

    setFilteredSongs(results);
  };

  React.useEffect(() => {
    handleSearch();
  }, [searchQuery, selectedGenre]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const topGenres = [
    { name: 'Pop', color: 'from-pink-500 to-rose-500', image: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Rock', color: 'from-red-500 to-orange-500', image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Electronic', color: 'from-purple-500 to-blue-500', image: 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Jazz', color: 'from-yellow-500 to-orange-500', image: 'https://images.pexels.com/photos/1407322/pexels-photo-1407322.jpeg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Classical', color: 'from-indigo-500 to-purple-500', image: 'https://images.pexels.com/photos/33597/guitar-classical-guitar-acoustic-guitar-electric-guitar.jpg?auto=compress&cs=tinysrgb&w=300' },
    { name: 'Hip Hop', color: 'from-green-500 to-teal-500', image: 'https://images.pexels.com/photos/1047442/pexels-photo-1047442.jpeg?auto=compress&cs=tinysrgb&w=300' }
  ];

  return (
    <div className="flex-1 bg-gradient-to-b from-purple-900/20 to-transparent p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">Search</h1>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="What do you want to listen to?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="pl-10 pr-8 py-3 bg-gray-800/50 border border-gray-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!searchQuery && filteredSongs.length === 0 && (
          <>
            {/* Browse by Genre */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">Browse all</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {topGenres.map((genre) => (
                  <div
                    key={genre.name}
                    onClick={() => setSelectedGenre(genre.name)}
                    className={`relative h-32 rounded-lg bg-gradient-to-br ${genre.color} cursor-pointer overflow-hidden group hover:scale-105 transition-transform`}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    <img
                      src={genre.image}
                      alt={genre.name}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                    />
                    <div className="relative p-4 h-full flex items-end">
                      <h3 className="text-white font-bold text-lg">{genre.name}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Searches */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Recent searches</h2>
              <div className="text-gray-400">
                <p>Try searching for artists, songs, or albums</p>
              </div>
            </div>
          </>
        )}

        {/* Search Results */}
        {(searchQuery || selectedGenre !== 'All') && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">
              {searchQuery ? `Results for "${searchQuery}"` : `${selectedGenre} Music`}
            </h2>
            
            {filteredSongs.length > 0 ? (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
                <div className="space-y-3">
                  {filteredSongs.map((song, index) => (
                    <div
                      key={song.id}
                      className="group flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 transition-all cursor-pointer"
                      onClick={() => onPlaySong(song)}
                    >
                      <div className="text-gray-400 w-6 text-center">
                        <span className="group-hover:hidden">{index + 1}</span>
                        <Play className="w-4 h-4 hidden group-hover:block" />
                      </div>
                      
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                          {song.albumArt ? (
                            <img src={song.albumArt} alt={song.album} className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{song.title}</div>
                        <div className="text-gray-400 text-sm truncate">{song.artist}</div>
                      </div>
                      
                      <div className="text-gray-400 text-sm min-w-0 flex-1 truncate">{song.album}</div>
                      
                      <div className="text-gray-400 text-sm">{song.genre}</div>
                      
                      <div className="flex items-center text-gray-400 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(song.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
                <p className="text-gray-400">
                  Try searching with different keywords or check your spelling.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};