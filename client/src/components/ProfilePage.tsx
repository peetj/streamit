import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Music, Edit3, ArrowLeft, Save, X, Upload } from 'lucide-react';
import { User as UserType, Playlist } from '../types';
import { playlistService } from '../services/playlistService';
import { songService } from '../services/songService';
import { imageUploadService } from '../services/imageUploadService';
import toast from 'react-hot-toast';

interface ProfilePageProps {
  user: UserType;
  onBackToLibrary: () => void;
  onUserUpdate?: (updatedUser: UserType) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onBackToLibrary, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState('Music enthusiast');
  const [playlistsCount, setPlaylistsCount] = useState(0);
  const [songsCount, setSongsCount] = useState(0);
  const [likedSongsCount, setLikedSongsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(user.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user statistics
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        setIsLoading(true);
        
        // Get playlists count
        const playlists = await playlistService.getPlaylists();
        setPlaylistsCount(playlists.length);
        
        // Get songs count (this would need to be implemented in the backend)
        // For now, we'll use a placeholder
        setSongsCount(0);
        
        // Get liked songs count
        try {
          const likedSongs = await songService.getLikedSongs();
          setLikedSongsCount(likedSongs.length);
        } catch (error) {
          console.log('Liked songs not available yet');
          setLikedSongsCount(0);
        }
      } catch (error) {
        console.error('Error loading user stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserStats();
  }, []);

  const handleSave = () => {
    // Here you would typically save the changes to the backend
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditedDescription('Music enthusiast');
    setIsEditing(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      
      // Show upload toast
      const uploadToast = toast.loading('Uploading image...');
      
      // Upload the image
      const result = await imageUploadService.uploadProfileImage(file);
      
      if (result.success && result.filename) {
        // Update the image URL
        const newImageUrl = imageUploadService.getProfileImageUrl(result.filename);
        setCurrentImageUrl(newImageUrl);
        
        // Update user context if callback is provided
        if (onUserUpdate) {
          const updatedUser = {
            ...user,
            avatar: newImageUrl
          };
          onUserUpdate(updatedUser);
        }
        
        toast.success('Profile image updated successfully!', { id: uploadToast });
      } else {
        toast.error(result.error || 'Failed to upload image', { id: uploadToast });
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
      // Clean up the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header with Back Button */}
      <div className="mb-8">
        <button
          onClick={onBackToLibrary}
          className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-700 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-8 border border-gray-200 dark:border-gray-800">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0 relative group">
            <img
              src={currentImageUrl}
              alt={user.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-500/20"
            />
            <div 
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={handleImageClick}
            >
              {isUploadingImage ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              ) : (
                <Upload className="w-6 h-6 text-white" />
              )}
            </div>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.username}</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-800 dark:text-gray-300">
                <Mail className="w-5 h-5 text-purple-400" />
                <span>{user.email}</span>
              </div>
              
              <div className="flex items-center space-x-3 text-gray-800 dark:text-gray-300">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span>Member since {new Date().toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-start space-x-3 text-gray-800 dark:text-gray-300">
                <Music className="w-5 h-5 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white resize-none"
                        rows={2}
                        placeholder="Tell us about yourself..."
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSave}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-sm transition-colors flex items-center space-x-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm transition-colors flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span>{editedDescription}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? '...' : songsCount}
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm">Songs Uploaded</p>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? '...' : playlistsCount}
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm">Playlists Created</p>
            </div>
          </div>
        </div>

        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isLoading ? '...' : likedSongsCount}
              </p>
              <p className="text-gray-700 dark:text-gray-400 text-sm">Liked Songs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="mt-8 bg-gradient-to-r from-purple-900/10 to-blue-900/10 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-500/20">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Coming Soon</h3>
        <p className="text-gray-700 dark:text-gray-400">
          Profile customization, listening history, and more features are on the way!
        </p>
      </div>
    </div>
  );
}; 