import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart } from 'lucide-react';
import { PlayerState } from '../types';

interface PlayerProps {
  playerState: PlayerState;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onProgressChange: (progress: number) => void;
  onVolumeChange: (volume: number) => void;
}

export const Player: React.FC<PlayerProps> = ({
  playerState,
  onTogglePlay,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onProgressChange,
  onVolumeChange
}) => {
  const { currentSong, isPlaying, progress, volume, shuffle, repeat } = playerState;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return null;
  }

  const currentTime = (currentSong.duration * progress) / 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Current Song Info */}
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 relative overflow-hidden">
            {currentSong.albumArt ? (
              <img src={currentSong.albumArt} alt={currentSong.album} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {currentSong.title.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white font-medium truncate">{currentSong.title}</div>
            <div className="text-gray-400 text-sm truncate">{currentSong.artist}</div>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors p-2">
            <Heart className="w-5 h-5" />
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
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={onPrevious}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-black" />
              ) : (
                <Play className="w-5 h-5 text-black ml-0.5" />
              )}
            </button>
            <button
              onClick={onNext}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleRepeat}
              className={`p-2 rounded-full transition-all ${
                repeat !== 'none' ? 'text-green-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Repeat className="w-4 h-4" />
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
                onChange={(e) => onProgressChange(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer"
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