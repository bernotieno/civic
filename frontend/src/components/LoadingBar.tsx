import React from 'react';

interface LoadingBarProps {
  progress: number;
  message?: string;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ progress, message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
        <div className="text-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <h3 className="text-lg font-medium text-gray-900">Uploading Bill</h3>
          {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="text-center mt-2">
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingBar;