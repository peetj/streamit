import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Check } from 'lucide-react';
import { imageSearchService, ImageSearchResult } from '../services/imageSearchService';
import { toast } from 'react-hot-toast';

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  playlistName: string;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  playlistName
}) => {
  const [searchResults, setSearchResults] = useState<ImageSearchResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && playlistName) {
      setSearchResults([]);
      setSelectedImage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchImages = async () => {
      if (!playlistName.trim()) return;
      
      setIsLoading(true);
      try {
        const results = await imageSearchService.searchImages(playlistName);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching images:', error);
        toast.error('Failed to search for images');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(searchImages, 500);
    return () => clearTimeout(timeoutId);
  }, [playlistName]);

  const handleApplyImage = () => {
    if (selectedImage) {
      onSelectImage(selectedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Choose Playlist Cover</h2>
            <p className="text-gray-400 text-sm">Searching real images from Unsplash for "{playlistName}"</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-400 text-sm">Searching for images...</p>
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {searchResults.map((image) => (
                <div
                  key={image.id}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === image.url
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedImage(image.url)}
                >
                  <img
                    src={image.thumbnail}
                    alt={image.alt}
                    className="w-full h-24 object-cover"
                    loading="lazy"
                  />
                  {selectedImage === image.url && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">
                  {playlistName.trim() ? 'No images found' : 'Enter a playlist name to search for images'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex items-center justify-between flex-shrink-0">
          <p className="text-gray-400 text-sm">
            {selectedImage ? 'Image selected' : 'Select an image to use as your playlist cover'}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyImage}
              disabled={!selectedImage}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Cover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 