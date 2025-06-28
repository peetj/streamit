import React, { useState, useEffect } from 'react';
import { RefreshCw, Star } from 'lucide-react';
import { artistOfTheDayService, ArtistOfTheDay, ArtistCriteria } from '../services/artistOfTheDayService';

interface ArtistOfTheDayProps {
  criteria?: ArtistCriteria;
}

export const ArtistOfTheDayComponent: React.FC<ArtistOfTheDayProps> = ({ criteria }) => {
  const [artist, setArtist] = useState<ArtistOfTheDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArtist = async () => {
    try {
      setLoading(true);
      setError(null);
      const artistData = await artistOfTheDayService.getArtistOfTheDay(criteria);
      setArtist(artistData);
    } catch (err) {
      setError('Failed to load artist of the day');
      console.error('Error loading artist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    artistOfTheDayService.clearCache();
    loadArtist();
  };

  useEffect(() => {
    loadArtist();
  }, [criteria]);

  if (loading) {
    return (
      <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50">
        <div className="flex items-center space-x-2 mb-3">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-gray-300">Artist of the Day</span>
        </div>
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-700 rounded-full mb-3"></div>
          <div className="h-4 bg-gray-700 rounded mb-2"></div>
          <div className="h-3 bg-gray-700 rounded mb-1"></div>
          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-gray-300">Artist of the Day</span>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
        <div className="text-sm text-gray-400">Unable to load artist information</div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-800 rounded-lg bg-gray-900/50 max-h-[28rem] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium text-gray-300">Artist of the Day</span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 text-gray-400 hover:text-white transition-colors"
          title="Refresh artist"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-start space-x-3 mb-3">
        <img
          src={artist.image}
          alt={artist.name}
          className="w-16 h-16 rounded-full object-cover border-2 border-gray-700 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{artist.name}</h3>
          <p className="text-xs text-gray-400">{artist.genre} • {artist.country}</p>
          <p className="text-xs text-gray-500">{artist.activeYears}</p>
        </div>
      </div>

      <p className="text-xs text-gray-300 mb-3 leading-relaxed">
        {artist.description}
      </p>

      <div className="space-y-1">
        <h4 className="text-xs font-medium text-gray-400 mb-2">Key Achievements:</h4>
        {artist.achievements.slice(0, 2).map((achievement, index) => (
          <div key={index} className="flex items-start space-x-2">
            <div className="w-1 h-1 bg-yellow-400 rounded-full mt-1.5 flex-shrink-0"></div>
            <p className="text-xs text-gray-400 leading-relaxed">{achievement}</p>
          </div>
        ))}
        {artist.achievements.length > 2 && (
          <p className="text-xs text-gray-500 italic">
            +{artist.achievements.length - 2} more achievements
          </p>
        )}
      </div>
    </div>
  );
}; 