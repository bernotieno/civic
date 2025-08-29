import React, { useEffect } from 'react';

interface CustomAlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  isOpen: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  type,
  title,
  message,
  isOpen,
  onClose,
  autoClose = true,
  duration = 3000
}) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, duration, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`max-w-md w-full mx-4 p-4 rounded-lg border ${getTypeStyles()} shadow-lg`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-xl">{getIcon()}</span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">{title}</h3>
            {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-lg hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;