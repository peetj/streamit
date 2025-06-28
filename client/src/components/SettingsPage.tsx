import React, { useState, useEffect } from 'react';
import { Settings, Volume2, Moon, Sun, Monitor, Smartphone, Wifi, Shield, Bell, Palette, ArrowLeft } from 'lucide-react';

interface SettingsPageProps {
  onBackToLibrary: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBackToLibrary }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [crossfade, setCrossfade] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('streamflow_dark_mode');
    const savedNotifications = localStorage.getItem('streamflow_notifications');
    const savedAutoPlay = localStorage.getItem('streamflow_auto_play');
    const savedCrossfade = localStorage.getItem('streamflow_crossfade');
    const savedCrossfadeDuration = localStorage.getItem('streamflow_crossfade_duration');

    // Default to dark mode (true) if no preference is saved
    setDarkMode(savedDarkMode === null ? true : savedDarkMode === 'true');
    if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    if (savedAutoPlay !== null) setAutoPlay(savedAutoPlay === 'true');
    if (savedCrossfade !== null) setCrossfade(savedCrossfade === 'true');
    if (savedCrossfadeDuration !== null) setCrossfadeDuration(Number(savedCrossfadeDuration));
  }, []);

  // Apply dark mode changes
  useEffect(() => {
    localStorage.setItem('streamflow_dark_mode', darkMode.toString());
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Trigger a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'streamflow_dark_mode',
      newValue: darkMode.toString()
    }));
  }, [darkMode]);

  // Save other settings
  useEffect(() => {
    localStorage.setItem('streamflow_notifications', notifications.toString());
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('streamflow_auto_play', autoPlay.toString());
  }, [autoPlay]);

  useEffect(() => {
    localStorage.setItem('streamflow_crossfade', crossfade.toString());
  }, [crossfade]);

  useEffect(() => {
    localStorage.setItem('streamflow_crossfade_duration', crossfadeDuration.toString());
  }, [crossfadeDuration]);

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-700 dark:text-gray-400">Customize your StreamFlow experience</p>
      </div>

      <div className="space-y-6">
        {/* Appearance */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <Palette className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Theme Mode</p>
                <p className="text-gray-700 dark:text-gray-400 text-sm">
                  {darkMode ? 'Dark mode for better experience' : 'Light mode for daytime use'}
                </p>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-400">
              {darkMode ? (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode Active</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode Active</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Playback */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <Volume2 className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Playback</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Auto-play</p>
                <p className="text-gray-700 dark:text-gray-400 text-sm">Automatically play next song</p>
              </div>
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoPlay ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoPlay ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Crossfade</p>
                <p className="text-gray-700 dark:text-gray-400 text-sm">Smooth transition between songs</p>
              </div>
              <button
                onClick={() => setCrossfade(!crossfade)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  crossfade ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    crossfade ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {crossfade && (
              <div className="pt-2">
                <label className="text-gray-900 dark:text-white text-sm font-medium">Crossfade Duration: {crossfadeDuration}s</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={crossfadeDuration}
                  onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                  className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 dark:text-white font-medium">Push Notifications</p>
                <p className="text-gray-700 dark:text-gray-400 text-sm">Get notified about new features and updates</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">About</h2>
          </div>
          
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Build:</strong> Development</p>
            <p><strong>License:</strong> MIT</p>
            <p className="text-sm text-gray-700 dark:text-gray-400">
              StreamFlow is a modern music streaming platform built with React, FastAPI, and PostgreSQL.
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-500/20">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">More Settings Coming Soon</h3>
          <p className="text-gray-700 dark:text-gray-400">
            Audio quality settings, download preferences, and advanced customization options are on the way!
          </p>
        </div>
      </div>
    </div>
  );
}; 