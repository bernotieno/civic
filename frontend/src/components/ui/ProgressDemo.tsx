import React, { useState } from 'react';
import BillProcessingProgress from './BillProcessingProgress';

const ProgressDemo: React.FC = () => {
  const [showProgress, setShowProgress] = useState(false);
  const [demoId] = useState('demo-bill-id-12345');

  const handleStartDemo = () => {
    setShowProgress(true);
  };

  const handleComplete = (success: boolean, data?: any) => {
    console.log('Processing completed:', success, data);
    setShowProgress(false);
    alert('Processing completed successfully!');
  };

  const handleError = (error: string) => {
    console.error('Processing error:', error);
    setShowProgress(false);
    alert(`Processing failed: ${error}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Bill Processing Progress Demo</h2>
      <p className="text-gray-600 mb-6">
        This demo shows how the real-time progress tracker works when processing a bill document.
      </p>
      
      <button
        onClick={handleStartDemo}
        className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
        disabled={showProgress}
      >
        {showProgress ? 'Processing...' : 'Start Demo Processing'}
      </button>

      {showProgress && (
        <BillProcessingProgress
          billId={demoId}
          onComplete={handleComplete}
          onError={handleError}
        />
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Features Demonstrated:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Real-time progress updates via WebSocket</li>
          <li>Fallback to polling if WebSocket fails</li>
          <li>Visual progress bar with percentage</li>
          <li>Processing stage indicators</li>
          <li>Time remaining estimation</li>
          <li>Processing logs display</li>
          <li>Error handling and recovery</li>
          <li>Responsive design for mobile</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2 text-blue-800">Integration Notes:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
          <li>Component automatically connects to WebSocket for real-time updates</li>
          <li>Falls back to API polling if WebSocket connection fails</li>
          <li>Handles all processing stages from initialization to completion</li>
          <li>Provides callbacks for success and error handling</li>
          <li>Can be easily integrated into any bill creation/editing workflow</li>
        </ul>
      </div>
    </div>
  );
};

export default ProgressDemo;