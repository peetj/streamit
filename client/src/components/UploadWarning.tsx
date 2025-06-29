import React from 'react';
import { AlertTriangle, Shield, Info } from 'lucide-react';

interface UploadWarningProps {
  onContinue: () => void;
  onCancel: () => void;
}

export const UploadWarning: React.FC<UploadWarningProps> = ({ onContinue, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Copyright Warning
            </h3>
          </div>

          {/* Warning Content */}
          <div className="space-y-3 mb-6">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-orange-800 dark:text-orange-200 font-medium mb-1">
                    Before uploading music files:
                  </p>
                  <ul className="text-orange-700 dark:text-orange-300 space-y-1 text-xs">
                    <li>• You must own the music or have explicit permission</li>
                    <li>• Do not upload copyrighted material without licensing</li>
                    <li>• This is for educational/demo purposes only</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p className="font-medium mb-1">Educational Use Only</p>
                  <p className="text-xs">
                    This hackathon project is for learning and demonstration. 
                    You are responsible for ensuring you have the right to upload any music files.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel Upload
            </button>
            <button
              onClick={onContinue}
              className="flex-1 px-4 py-2 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              I Understand, Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 