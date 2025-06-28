import { useState, useCallback } from 'react';
import { PlayerState, Song, Playlist } from '../types';
import { songService } from '../services/songService';

export const usePlayer = () => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    progress: 0,
    volume: 75,
    queue: [],
    shuffle: false,
    repeat: 'none',
    currentPlaylist: null,
    currentIndex: -1
  });

  const playSong = useCallback(async (song: Song) => {
    // Increment play count when song starts playing
    try {
      await songService.playSong(song.id);
    } catch (error) {
      console.error('Failed to increment play count:', error);
    }

    setPlayerState(prev => ({
      ...prev,
      currentSong: song,
      isPlaying: true,
      currentIndex: -1, // Not part of a playlist
      currentPlaylist: null,
      progress: 0
    }));
  }, []);

  const playPlaylist = useCallback(async (playlist: Playlist, startIndex: number = 0) => {
    if (!playlist.songs || playlist.songs.length === 0) {
      console.warn('Playlist has no songs');
      return;
    }

    const startSong = playlist.songs[startIndex];
    if (!startSong) {
      console.warn('Invalid start index for playlist');
      return;
    }

    // Increment play count for the starting song
    try {
      await songService.playSong(startSong.id);
    } catch (error) {
      console.error('Failed to increment play count:', error);
    }

    setPlayerState(prev => ({
      ...prev,
      currentSong: startSong,
      isPlaying: true,
      queue: playlist.songs,
      currentPlaylist: playlist,
      currentIndex: startIndex,
      shuffle: false, // Reset shuffle when starting a new playlist
      progress: 0
    }));
  }, []);

  const togglePlay = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setPlayerState(prev => ({ ...prev, progress }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setPlayerState(prev => ({ ...prev, volume }));
  }, []);

  const nextSong = useCallback(async () => {
    setPlayerState(prev => {
      if (!prev.currentPlaylist || prev.queue.length === 0) {
        return prev;
      }

      let nextIndex = prev.currentIndex + 1;
      
      // Handle repeat modes
      if (nextIndex >= prev.queue.length) {
        if (prev.repeat === 'all') {
          nextIndex = 0; // Loop back to start
        } else if (prev.repeat === 'one') {
          nextIndex = prev.currentIndex; // Stay on same song
        } else {
          // No repeat - stop playback
          return {
            ...prev,
            isPlaying: false,
            currentSong: null,
            currentIndex: -1,
            progress: 0
          };
        }
      }

      const nextSong = prev.queue[nextIndex];
      
      // Increment play count for the next song
      songService.playSong(nextSong.id).catch(error => {
        console.error('Failed to increment play count:', error);
      });

      return {
        ...prev,
        currentSong: nextSong,
        currentIndex: nextIndex,
        isPlaying: true,
        progress: 0
      };
    });
  }, []);

  const previousSong = useCallback(async () => {
    setPlayerState(prev => {
      if (!prev.currentPlaylist || prev.queue.length === 0) {
        return prev;
      }

      let prevIndex = prev.currentIndex - 1;
      
      // Handle repeat modes
      if (prevIndex < 0) {
        if (prev.repeat === 'all') {
          prevIndex = prev.queue.length - 1; // Loop to end
        } else if (prev.repeat === 'one') {
          prevIndex = prev.currentIndex; // Stay on same song
        } else {
          // No repeat - stop playback
          return {
            ...prev,
            isPlaying: false,
            currentSong: null,
            currentIndex: -1,
            progress: 0
          };
        }
      }

      const prevSong = prev.queue[prevIndex];
      
      // Increment play count for the previous song
      songService.playSong(prevSong.id).catch(error => {
        console.error('Failed to increment play count:', error);
      });

      return {
        ...prev,
        currentSong: prevSong,
        currentIndex: prevIndex,
        isPlaying: true,
        progress: 0
      };
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlayerState(prev => {
      if (!prev.currentPlaylist || prev.queue.length === 0) {
        return { ...prev, shuffle: !prev.shuffle };
      }

      if (!prev.shuffle) {
        // Enable shuffle - create shuffled queue
        const shuffledQueue = [...prev.queue];
        for (let i = shuffledQueue.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
        }
        
        return {
          ...prev,
          shuffle: true,
          queue: shuffledQueue,
          currentIndex: shuffledQueue.findIndex(song => song.id === prev.currentSong?.id)
        };
      } else {
        // Disable shuffle - restore original order
        const originalQueue = prev.currentPlaylist.songs;
        return {
          ...prev,
          shuffle: false,
          queue: originalQueue,
          currentIndex: originalQueue.findIndex(song => song.id === prev.currentSong?.id)
        };
      }
    });
  }, []);

  const toggleRepeat = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      repeat: prev.repeat === 'none' ? 'all' : prev.repeat === 'all' ? 'one' : 'none'
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      queue: [],
      currentPlaylist: null,
      currentIndex: -1
    }));
  }, []);

  const stopPlayback = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      currentSong: null,
      isPlaying: false,
      queue: [],
      currentPlaylist: null,
      currentIndex: -1,
      progress: 0
    }));
  }, []);

  return {
    playerState,
    playSong,
    playPlaylist,
    togglePlay,
    setProgress,
    setVolume,
    nextSong,
    previousSong,
    toggleShuffle,
    toggleRepeat,
    clearQueue,
    stopPlayback
  };
};