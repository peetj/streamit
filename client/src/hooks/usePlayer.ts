import { useState, useCallback } from 'react';
import { PlayerState, Song } from '../types';

export const usePlayer = () => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    progress: 0,
    volume: 75,
    queue: [],
    shuffle: false,
    repeat: 'none'
  });

  const playSong = useCallback((song: Song) => {
    setPlayerState(prev => ({
      ...prev,
      currentSong: song,
      isPlaying: true
    }));
  }, []);

  const togglePlay = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  }, []);

  const setProgress = useCallback((progress: number) => {
    setPlayerState(prev => ({
      ...prev,
      progress
    }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setPlayerState(prev => ({
      ...prev,
      volume
    }));
  }, []);

  const nextSong = useCallback(() => {
    // Logic for next song
    console.log('Next song');
  }, []);

  const previousSong = useCallback(() => {
    // Logic for previous song
    console.log('Previous song');
  }, []);

  const toggleShuffle = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      shuffle: !prev.shuffle
    }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      repeat: prev.repeat === 'none' ? 'all' : prev.repeat === 'all' ? 'one' : 'none'
    }));
  }, []);

  return {
    playerState,
    playSong,
    togglePlay,
    setProgress,
    setVolume,
    nextSong,
    previousSong,
    toggleShuffle,
    toggleRepeat
  };
};