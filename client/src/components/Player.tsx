import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart, List, X } from 'lucide-react';
import { PlayerState } from '../types';
import { songService } from '../services/songService';

interface PlayerProps {
  playerState: PlayerState;
  onTogglePlay: (onPause?: () => void) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onProgressChange: (progress: number) => void;
  onVolumeChange: (volume: number) => void;
  onStop: () => void;
}

export const Player: React.FC<PlayerProps> = ({
  playerState,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onProgressChange,
  onVolumeChange,
  onStop
}) => {
  const { currentSong, isPlaying, progress, volume, shuffle, repeat, currentPlaylist, currentIndex, queue } = playerState;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Fetch audio with authentication and create blob URL
  const loadAudio = async (songId: string) => {
    console.log('=== loadAudio function called ===');
    console.log('Song ID:', songId);
    
    try {
      setIsLoading(true);
      
      // Get token from localStorage - use the correct key
      const token = localStorage.getItem('streamflow_token');
      console.log('Token found:', !!token);
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Loading audio for song:', songId);
      console.log('Using token:', token.substring(0, 20) + '...');

      const url = `/api/stream/song/${songId}`;
      console.log('Fetching from URL:', url);

      // Fetch audio with authentication
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      // Check if response is actually audio
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (contentType && !contentType.startsWith('audio/')) {
        const htmlContent = await response.text();
        console.error('Backend returned HTML instead of audio:');
        console.error('HTML content:', htmlContent.substring(0, 500) + '...');
        throw new Error(`Backend returned ${contentType} instead of audio`);
      }

      // Create blob from response
      const blob = await response.blob();
      console.log('Blob size:', blob.size, 'bytes');
      console.log('Blob type:', blob.type);

      if (blob.size === 0) {
        throw new Error('Audio blob is empty');
      }

      // Create blob URL
      const blobUrl = URL.createObjectURL(blob);
      console.log('Created blob URL:', blobUrl);
      setAudioBlobUrl(blobUrl);

      // Set audio source
      if (audioRef.current) {
        audioRef.current.src = blobUrl;
        audioRef.current.load();
        console.log('Audio element src set to:', blobUrl);
      }
    } catch (error) {
      console.error('Error loading audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load audio when song changes
  useEffect(() => {
    console.log('=== useEffect triggered ===');
    console.log('currentSong:', currentSong);
    
    if (currentSong) {
      console.log('Calling loadAudio for song:', currentSong.id);
      // Clean up previous blob URL
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
        setAudioBlobUrl(null);
      }
      
      loadAudio(currentSong.id);
      
      // Check if song is liked
      const checkIfLiked = async () => {
        try {
          const likedSongs = await songService.getLikedSongs();
          const isSongLiked = likedSongs.some(song => song.id === currentSong.id);
          setIsLiked(isSongLiked);
        } catch (error) {
          console.error('Error checking if song is liked:', error);
          setIsLiked(false);
        }
      };
      
      checkIfLiked();
    }

    // Cleanup on unmount
    return () => {
      if (audioBlobUrl) {
        URL.revokeObjectURL(audioBlobUrl);
      }
    };
  }, [currentSong]);

  // Play/pause when isPlaying changes
  useEffect(() => {
    console.log('=== Audio play/pause effect ===');
    console.log('isPlaying:', isPlaying);
    console.log('audioRef.current:', !!audioRef.current);
    console.log('audioBlobUrl:', !!audioBlobUrl);
    
    if (audioRef.current && audioBlobUrl) {
      if (isPlaying) {
        console.log('Attempting to play audio...');
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      } else {
        console.log('Pausing audio...');
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioBlobUrl]);

  // Set volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Start listening session when song starts playing
  const startListeningSession = async () => {
    console.log('=== startListeningSession called ===');
    console.log('currentSong:', currentSong);
    console.log('currentPlaylist:', currentPlaylist);
    
    if (!currentSong) {
      console.log('No current song, returning');
      return;
    }
    
    try {
      const playlistId = currentPlaylist?.id;
      console.log('Calling songService.startListeningSession with:', {
        songId: currentSong.id,
        playlistId: playlistId
      });
      
      const response = await songService.startListeningSession(currentSong.id, playlistId);
      console.log('Listening session started successfully:', response);
      
      setCurrentSessionId(response.session_id);
      setSessionStartTime(Date.now());
      setSessionCompleted(false);
    } catch (error) {
      console.error('Failed to start listening session:', error);
    }
  };

  // Complete listening session when song ends or is stopped
  const completeListeningSession = async () => {
    console.log('=== completeListeningSession called ===');
    console.log('currentSessionId:', currentSessionId);
    console.log('sessionStartTime:', sessionStartTime);
    console.log('currentSong:', currentSong);
    console.log('sessionCompleted:', sessionCompleted);
    
    if (!currentSessionId || !sessionStartTime || !currentSong || sessionCompleted) {
      console.log('Missing required data for completing session or already completed');
      return;
    }
    
    try {
      const durationSeconds = (Date.now() - sessionStartTime) / 1000;
      console.log('Calculated duration:', durationSeconds, 'seconds');
      
      await songService.completeListeningSession(currentSong.id, currentSessionId, durationSeconds);
      console.log('Listening session completed successfully');
      
      // Mark as completed and reset session tracking
      setSessionCompleted(true);
      setCurrentSessionId(null);
      setSessionStartTime(null);
    } catch (error) {
      console.error('Failed to complete listening session:', error);
    }
  };

  // Event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (currentSong && audio.duration) {
        const newProgress = (audio.currentTime / audio.duration) * 100;
        onProgressChange(newProgress);
      }
    };
    
    const handleEnded = () => {
      console.log('Audio ended');
      completeListeningSession();
      onNext();
    };
    
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded:', {
        duration: audio.duration,
        currentTime: audio.currentTime,
        readyState: audio.readyState,
        networkState: audio.networkState
      });
    };

    const handleCanPlay = () => {
      console.log('Audio can play');
    };

    const handleCanPlayThrough = () => {
      console.log('Audio can play through');
    };

    const handlePlay = () => {
      console.log('=== Audio play event fired ===');
      console.log('Audio started playing');
      startListeningSession();
    };

    const handlePause = () => {
      console.log('=== Audio pause event fired ===');
      console.log('Audio paused');
      console.log('About to call completeListeningSession...');
      completeListeningSession();
    };

    const handleError = (event: Event) => {
      console.error('Audio error event:', event);
      const audioElement = event.target as HTMLAudioElement;
      console.error('Audio error details:', {
        error: audioElement.error,
        errorCode: audioElement.error?.code,
        errorMessage: audioElement.error?.message,
        readyState: audioElement.readyState,
        networkState: audioElement.networkState,
        src: audioElement.src
      });
      
      // Log specific error codes
      if (audioElement.error) {
        const errorCode = audioElement.error.code;
        const errorMessage = audioElement.error.message;
        console.error(`MediaError: Code ${errorCode} - ${errorMessage}`);
        
        switch (errorCode) {
          case 1:
            console.error('MEDIA_ERR_ABORTED: The user agent aborted the media resource download.');
            break;
          case 2:
            console.error('MEDIA_ERR_NETWORK: A network error occurred while the media resource was being loaded.');
            break;
          case 3:
            console.error('MEDIA_ERR_DECODE: An error occurred while decoding the media resource.');
            break;
          case 4:
            console.error('MEDIA_ERR_SRC_NOT_SUPPORTED: The media resource indicated by the src attribute was not suitable.');
            break;
          default:
            console.error('Unknown media error code:', errorCode);
        }
      }
    };

    const handleSeeked = () => {
      // Update progress after seeking
      if (currentSong && audio.duration) {
        const newProgress = (audio.currentTime / audio.duration) * 100;
        onProgressChange(newProgress);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('seeked', handleSeeked);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('seeked', handleSeeked);
    };
  }, [audioRef, currentSong, onNext, onProgressChange]);

  const handleProgressChange = (newProgress: number) => {
    if (audioRef.current && currentSong) {
      const targetTime = (newProgress / 100) * currentSong.duration;
      audioRef.current.currentTime = targetTime;
    }
    onProgressChange(newProgress);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle like/unlike functionality
  const handleLikeToggle = async () => {
    if (!currentSong || isLiking) return;
    
    try {
      setIsLiking(true);
      if (isLiked) {
        await songService.unlikeSong(currentSong.id);
        setIsLiked(false);
      } else {
        await songService.likeSong(currentSong.id);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  // Handle skip with immediate stop
  const handleNext = () => {
    // Complete current listening session
    completeListeningSession();
    
    // Stop current audio completely
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    
    // Clean up current blob URL
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    
    // Set loading state
    setIsLoading(true);
    
    // Call the original handler
    onNext();
  };

  const handlePrevious = () => {
    // Complete current listening session
    completeListeningSession();
    
    // Stop current audio completely
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
    }
    
    // Clean up current blob URL
    if (audioBlobUrl) {
      URL.revokeObjectURL(audioBlobUrl);
      setAudioBlobUrl(null);
    }
    
    // Set loading state
    setIsLoading(true);
    
    // Call the original handler
    onPrevious();
  };

  if (!currentSong) {
    return null;
  }

  const currentTime = (currentSong.duration * progress) / 100;
  const hasNextSong = currentPlaylist && currentIndex < queue.length - 1;
  const hasPreviousSong = currentPlaylist && currentIndex > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-4">
      {/* Close Button */}
      <button
        onClick={onStop}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors z-10"
        title="Stop playback and close player"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} hidden preload="metadata" />
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Current Song Info */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            {/* Show playlist cover when playing from playlist, otherwise show song album art */}
            {currentPlaylist && currentPlaylist.coverImage ? (
              <img src={currentPlaylist.coverImage} alt={currentPlaylist.name} className="w-full h-full object-cover" />
            ) : currentSong.albumArt ? (
              <img src={currentSong.albumArt} alt={currentSong.album} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {currentPlaylist ? currentPlaylist.name.charAt(0) : currentSong.title.charAt(0)}
                </span>
              </div>
            )}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-medium truncate">{currentSong.title}</div>
            <div className="text-gray-400 text-sm truncate">{currentSong.artist}</div>
            {currentPlaylist && (
              <div className="text-purple-400 text-xs truncate flex items-center space-x-2">
                <List className="w-3 h-3" />
                <span>{currentPlaylist.name}</span>
                {currentIndex >= 0 && (
                  <span className="text-gray-500">
                    {currentIndex + 1} of {queue.length}
                  </span>
                )}
              </div>
            )}
          </div>
          <button 
            onClick={handleLikeToggle}
            disabled={isLiking}
            className={`transition-colors p-2 ${isLiked ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
            title={isLiked ? 'Unlike song' : 'Like song'}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Player Controls */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="flex items-center justify-center space-x-4 mb-2">
            <button
              onClick={onToggleShuffle}
              className={`p-2 rounded-full transition-all ${
                shuffle ? 'text-green-400' : 'text-gray-400 hover:text-white'
              }`}
              disabled={!currentPlaylist || queue.length <= 1}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrevious}
              className={`transition-colors p-2 ${
                hasPreviousSong || repeat !== 'none' 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              disabled={!hasPreviousSong && repeat === 'none'}
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={() => onTogglePlay(completeListeningSession)}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            <button
              onClick={handleNext}
              className={`transition-colors p-2 ${
                hasNextSong || repeat !== 'none' 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-gray-600 cursor-not-allowed'
              }`}
              disabled={!hasNextSong && repeat === 'none'}
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleRepeat}
              className={`p-2 rounded-full transition-all ${
                repeat === 'all' ? 'text-green-400' : 
                repeat === 'one' ? 'text-purple-400' : 
                'text-gray-400 hover:text-white'
              }`}
              title={
                repeat === 'none' ? 'Repeat off' :
                repeat === 'all' ? 'Repeat all' :
                'Repeat one'
              }
            >
              <Repeat className={`w-4 h-4 ${repeat === 'one' ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 relative">
              <div className="h-1 bg-gray-700 rounded-full">
                <div
                  className="h-full bg-white rounded-full relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
            </div>
            <span className="text-xs text-gray-400 w-10">
              {formatTime(currentSong.duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3 min-w-0 flex-1 justify-end">
          <Volume2 className="w-5 h-5 text-gray-400" />
          <div className="w-24 relative">
            <div className="h-1 bg-gray-700 rounded-full">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${volume}%` }}
              ></div>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};