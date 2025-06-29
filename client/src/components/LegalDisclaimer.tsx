import React, { useState } from 'react';
import { AlertTriangle, Info, Shield, FileText } from 'lucide-react';

interface LegalDisclaimerProps {
  onAccept: () => void;
  onDecline: () => void;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ onAccept, onDecline }) => {
  const [showFullTerms, setShowFullTerms] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-8 h-8 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Important Legal Notice
            </h2>
          </div>

          {/* Main Disclaimer */}
          <div className="space-y-4 mb-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    Copyright & Licensing Notice
                  </h3>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    This application is for <strong>educational and demonstration purposes only</strong>. 
                    You must only upload music that you own or have explicit permission to use.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Hackathon Project
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    This is a hackathon entry demonstrating web development skills. 
                    It is not intended for commercial use or public distribution of copyrighted content.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Terms of Use</span>
            </h3>
            
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
              <p><strong>By using this application, you agree to:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Only upload music files that you own or have explicit permission to use</li>
                <li>Not upload copyrighted material without proper licensing</li>
                <li>Use this application for educational/demo purposes only</li>
                <li>Not use this application for commercial music distribution</li>
                <li>Accept responsibility for any copyright violations</li>
              </ul>
              
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <strong>Disclaimer:</strong> This application is provided "as is" for educational purposes. 
                The developers are not responsible for any copyright violations or legal issues arising from user uploads.
              </p>
            </div>

            {showFullTerms && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-600 dark:text-gray-300">
                <h4 className="font-semibold mb-2">Full Legal Terms:</h4>
                <p className="mb-2">
                  This StreamFlow application is a hackathon project created for educational and demonstration purposes. 
                  It is designed to showcase web development skills including React, TypeScript, FastAPI, and database management.
                </p>
                <p className="mb-2">
                  <strong>Copyright Notice:</strong> Users are strictly prohibited from uploading any copyrighted music 
                  without proper licensing or ownership. This includes but is not limited to commercial recordings, 
                  cover songs, and any music protected by copyright law.
                </p>
                <p className="mb-2">
                  <strong>Educational Use Only:</strong> This application is intended for learning and demonstration. 
                  It should not be used for commercial music streaming, distribution, or any commercial purposes.
                </p>
                <p className="mb-2">
                  <strong>User Responsibility:</strong> Users are solely responsible for ensuring they have the right 
                  to upload and stream any music files. The application developers assume no liability for copyright 
                  violations or legal issues arising from user uploads.
                </p>
                <p>
                  <strong>No Warranty:</strong> This application is provided without warranty. The developers make no 
                  guarantees about functionality, security, or legal compliance.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => setShowFullTerms(!showFullTerms)}
              className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {showFullTerms ? 'Hide Full Terms' : 'Show Full Terms'}
            </button>
            <button
              onClick={onDecline}
              className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              I Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 