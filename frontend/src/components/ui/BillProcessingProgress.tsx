import React, { useState, useEffect, useRef } from 'react';
import '../../styles/progress.css';

interface ProcessingStage {
  name: string;
  display: string;
  icon: string;
}

interface BillProcessingProgressProps {
  billId: string;
  onComplete: (success: boolean, data?: any) => void;
  onError: (error: string) => void;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  { name: 'initializing', display: 'Starting bulletproof processing...', icon: '🚀' },
  { name: 'extracting', display: 'Extracting text from PDF...', icon: '📄' },
  { name: 'analyzing', display: 'Analyzing document structure...', icon: '🔍' },
  { name: 'chunking', display: 'Creating chunks for search...', icon: '✂️' },
  { name: 'grouping', display: 'Grouping content intelligently...', icon: '📚' },
  { name: 'processing', display: 'Processing with AI...', icon: '🤖' },
  { name: 'combining', display: 'Combining summaries...', icon: '🔗' },
  { name: 'saving', display: 'Saving results...', icon: '💾' },
  { name: 'embeddings', display: 'Generating embeddings...', icon: '🧠' },
  { name: 'completed', display: 'All processing completed!', icon: '✅' }
];

const BillProcessingProgress: React.FC<BillProcessingProgressProps> = ({
  billId,
  onComplete,
  onError
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('initializing');
  const [message, setMessage] = useState('Starting processing...');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection for real-time updates
  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/bills/${billId}/progress/`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected for bill progress');

      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'progress_update') {
            setProgress(data.progress || 0);
            setCurrentStage(data.stage || 'processing');
            setMessage(data.message || 'Processing...');
            setTimeRemaining(data.time_remaining);

          } else if (data.type === 'processing_complete') {
            setProgress(100);
            setCurrentStage('completed');
            setMessage('Processing completed successfully!');
            setIsComplete(true);

            onComplete(true, data);
          } else if (data.type === 'processing_failed') {
            setHasError(true);
            setMessage(data.message || 'Processing failed');

            onError(data.message || 'Processing failed');
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);

        startPolling();
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        if (!isComplete && !hasError) {

          setTimeout(connectWebSocket, 2000);
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      startPolling();
    }
  };

  // Polling fallback for progress updates
  const startPolling = () => {
    if (intervalRef.current) return;
    
    intervalRef.current = setInterval(async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`http://127.0.0.1:8000/api/admin/bills/${billId}/status/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            // Handle both direct status and nested status formats
            const status = data.status || data.progress || data.data || data;
            setProgress(status.progress || 0);
            setCurrentStage(status.stage || 'processing');
            setMessage(status.message || 'Processing...');
            setTimeRemaining(status.time_remaining);
            
            if (status.processing_status === 'completed' || status.progress >= 100) {
              setProgress(100);
              setCurrentStage('completed');
              setMessage('Processing completed successfully!');
              setIsComplete(true);
              onComplete(true, status);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            } else if (status.processing_status === 'failed') {
              setHasError(true);
              setMessage(status.message || 'Processing failed');
              onError(status.message || 'Processing failed');
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 2000);
  };

  useEffect(() => {
    // Try WebSocket first, fallback to polling
    connectWebSocket();
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [billId]);

  const getCurrentStageInfo = () => {
    return PROCESSING_STAGES.find(stage => stage.name === currentStage) || 
           PROCESSING_STAGES[0];
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const stageInfo = getCurrentStageInfo();

  return (
    <div className="progress-container">
      <div className="progress-modal">
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Bill Document
          </h3>
          <p className="text-gray-600">
            Please wait while we process your bill document with AI...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {stageInfo.icon} {stageInfo.display}
            </span>
            <span className="text-sm text-gray-500">
              {progress}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-bar-fill ${
                hasError ? 'error' : 
                isComplete ? 'complete' : ''
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Current Status */}
        <div className={`status-card ${
          hasError ? 'error' : isComplete ? 'success' : ''
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Current Status
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {message}
              </p>
            </div>
            {timeRemaining && !isComplete && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Estimated time remaining</p>
                <p className="text-sm font-medium text-gray-700">
                  {formatTimeRemaining(timeRemaining)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Processing Stages */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Processing Stages</p>
          <div className="space-y-2">
            {PROCESSING_STAGES.map((stage, index) => {
              const isCurrentStage = stage.name === currentStage;
              const isCompleted = PROCESSING_STAGES.findIndex(s => s.name === currentStage) > index;
              
              return (
                <div 
                  key={stage.name}
                  className={`stage-item ${
                    isCurrentStage ? 'current' :
                    isCompleted ? 'completed' : 'pending'
                  }`}
                >
                  <span className="stage-icon">{stage.icon}</span>
                  <span className={`stage-text ${
                    isCurrentStage ? 'current' :
                    isCompleted ? 'completed' : 'pending'
                  }`}>
                    {stage.display}
                  </span>
                  {isCompleted && (
                    <span className="ml-auto text-green-500">✓</span>
                  )}
                  {isCurrentStage && (
                    <div className="ml-auto">
                      <div className="spinner"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>



        {/* Error State */}
        {hasError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 text-lg mr-2">⚠️</span>
              <div>
                <p className="text-sm font-medium text-red-800">Processing Failed</p>
                <p className="text-sm text-red-600 mt-1">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Completion State */}
        {isComplete && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-green-500 text-lg mr-2">🎉</span>
              <div>
                <p className="text-sm font-medium text-green-800">Processing Complete!</p>
                <p className="text-sm text-green-600 mt-1">
                  Your bill has been successfully processed and is ready for public engagement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>This process typically takes 2-5 minutes depending on document size.</p>
          <p className="mt-1">You can safely close this window - processing will continue in the background.</p>
        </div>
      </div>
    </div>
  );
};

export default BillProcessingProgress;