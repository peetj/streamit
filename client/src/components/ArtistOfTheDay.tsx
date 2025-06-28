import React, { useState, useEffect } from 'react';
import { RefreshCw, Star, Calendar } from 'lucide-react';
import { artistOfTheDayService, ArtistOfTheDay, ArtistCriteria } from '../services/artistOfTheDayService';

interface ArtistOfTheDayProps {
  criteria?: ArtistCriteria;
  onArtistClick: (artist: ArtistOfTheDay, dayLabel: string) => void;
}

export const ArtistOfTheDayComponent: React.FC<ArtistOfTheDayProps> = ({ criteria, onArtistClick }) => {
  const [artists, setArtists] = useState<ArtistOfTheDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      const artistsData = await artistOfTheDayService.getArtistsOfTheWeek(criteria);
      setArtists(artistsData);
    } catch (err) {
      setError('Failed to load artists of the week');
      console.error('Error loading artists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    artistOfTheDayService.clearCache();
    loadArtists();
  };

  const handleArtistClick = (artist: ArtistOfTheDay) => {
    const dayLabel = getDayLabel(artists.findIndex(a => a.id === artist.id));
    onArtistClick(artist, dayLabel);
  };

  useEffect(() => {
    loadArtists();
  }, [criteria]);

  const getDayLabel = (index: number): string => {
    const days = ['Today', 'Yesterday', '2 days ago', '3 days ago', '4 days ago', '5 days ago', '6 days ago'];
    return days[index] || `${index + 1} days ago`;
  };

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white/50 dark:bg-gray-900/50 max-h-64 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Artists of the Week</span>
          </div>
        </div>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || artists.length === 0) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white/50 dark:bg-gray-900/50 max-h-64 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Artists of the Week</span>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Unable to load artist information</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Artists of the Week</span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          title="Refresh artists"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        {artists.map((artist, index) => (
          <div 
            key={artist.id} 
            className="p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-white/50 dark:bg-gray-900/50 hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
            onClick={() => handleArtistClick(artist)}
          >
            <div className="flex items-center space-x-3 mb-2">
              <img
                src={artist.image}
                alt={artist.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{artist.name}</h3>
                  {index === 0 && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{artist.genre} • {artist.country}</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-500">{getDayLabel(index)}</p>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {artist.description}
              </p>
              {index === 0 && artist.achievements.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-700">
                  <div className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{artist.achievements[0]}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 