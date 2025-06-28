import React from 'react';
import { X, Star, Calendar, MapPin, Music, Award, ExternalLink } from 'lucide-react';
import { ArtistOfTheDay } from '../services/artistOfTheDayService';

interface ArtistOfTheDayModalProps {
  artist: ArtistOfTheDay;
  isOpen: boolean;
  onClose: () => void;
  dayLabel: string;
}

export const ArtistOfTheDayModal: React.FC<ArtistOfTheDayModalProps> = ({
  artist,
  isOpen,
  onClose,
  dayLabel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{dayLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Artist Header */}
          <div className="flex items-center space-x-4 mb-6">
            <img
              src={artist.image}
              alt={artist.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/20"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{artist.name}</h2>
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Music className="w-4 h-4" />
                  <span>{artist.genre}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{artist.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {artist.description}
            </p>
          </div>

          {/* Achievements */}
          {artist.achievements && artist.achievements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span>Achievements</span>
              </h3>
              <div className="space-y-3">
                {artist.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {achievement}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Info Placeholder */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">More Information</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                More details coming soon...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                We're working on adding discography, popular tracks, and more!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col space-y-3">
            {/* LastFM Link */}
            <a
              href={artist.lastfmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
            >
              <span>Read more on LastFM</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 