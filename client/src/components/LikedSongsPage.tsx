import React, { useState, useEffect } from 'react';
import { Song } from '../types';
import { songService } from '../services/songService';
import { usePlayer } from '../hooks/usePlayer';

const LikedSongsPage: React.FC = () => {
  const [likedSongs, setLikedSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playSong, currentSong, isPlaying } = usePlayer();

  useEffect(() => {
    fetchLikedSongs();
  }, []);

  const fetchLikedSongs = async () => {
    try {
      setLoading(true);
      const songs = await songService.getLikedSongs();
      setLikedSongs(songs);
      setError(null);
    } catch (err) {
      setError('Failed to load liked songs');
      console.error('Error fetching liked songs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (songId: string) => {
    try {
      await songService.unlikeSong(songId);
      // Remove the song from the local state
      setLikedSongs(prev => prev.filter(song => song.id !== songId));
    } catch (err) {
      console.error('Error unliking song:', err);
      setError('Failed to unlike song');
    }
  };

  const handlePlay = (song: Song) => {
    playSong(song);
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading liked songs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Liked Songs</h1>
        <p className="text-gray-400">
          {likedSongs.length} {likedSongs.length === 1 ? 'song' : 'songs'}
        </p>
      </div>

      {likedSongs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">No liked songs yet</div>
          <div className="text-gray-600">
            Like songs from your library to see them here
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {likedSongs.map((song, index) => (
            <div
              key={song.id}
              className={`flex items-center p-3 rounded-lg hover:bg-gray-800 transition-colors ${
                currentSong?.id === song.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-10 h-10 bg-gray-700 rounded mr-4 flex-shrink-0 flex items-center justify-center">
                  {song.album_art ? (
                    <img
                      src={`${import.meta.env.VITE_BACKEND_URL}/uploads/artwork/${song.album_art}`}
                      alt="Album art"
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-gray-400 text-sm">🎵</div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <button
                      onClick={() => handlePlay(song)}
                      className="text-white hover:text-green-400 transition-colors mr-3"
                    >
                      {currentSong?.id === song.id && isPlaying ? (
                        <span className="text-green-400">⏸️</span>
                      ) : (
                        <span>▶️</span>
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {song.title || 'Unknown Title'}
                      </div>
                      <div className="text-gray-400 text-sm truncate">
                        {song.artist || 'Unknown Artist'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 text-gray-400 text-sm">
                <span>{song.album || 'Unknown Album'}</span>
                <span>{formatDuration(song.duration || 0)}</span>
                <button
                  onClick={() => handleUnlike(song.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Unlike song"
                >
                  ❤️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedSongsPage; 