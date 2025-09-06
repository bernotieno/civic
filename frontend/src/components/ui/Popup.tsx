/**
 * Custom Popup Component
 * Replaces default JavaScript alerts, confirms, and prompts
 */

import React, { useEffect, useRef } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info, 
  HelpCircle, 
  X 
} from 'lucide-react';
import { PopupConfig, PopupType } from '../../contexts/PopupContext';
import { trapFocus } from '../../utils/accessibility';

interface PopupProps {
  popup: PopupConfig;
  onClose: (id: string) => void;
}

const getPopupIcon = (type: PopupType) => {
  const iconProps = { className: "h-6 w-6" };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="h-6 w-6 text-green-600" />;
    case 'error':
      return <XCircle {...iconProps} className="h-6 w-6 text-red-600" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="h-6 w-6 text-yellow-600" />;
    case 'info':
      return <Info {...iconProps} className="h-6 w-6 text-blue-600" />;
    case 'confirm':
      return <HelpCircle {...iconProps} className="h-6 w-6 text-orange-600" />;
    case 'prompt':
      return <HelpCircle {...iconProps} className="h-6 w-6 text-purple-600" />;
    default:
      return <Info {...iconProps} className="h-6 w-6 text-gray-600" />;
  }
};

const getPopupColors = (type: PopupType) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        title: 'text-green-900',
        message: 'text-green-800'
      };
    case 'error':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        title: 'text-red-900',
        message: 'text-red-800'
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        title: 'text-yellow-900',
        message: 'text-yellow-800'
      };
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        title: 'text-blue-900',
        message: 'text-blue-800'
      };
    case 'confirm':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        title: 'text-orange-900',
        message: 'text-orange-800'
      };
    case 'prompt':
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        title: 'text-purple-900',
        message: 'text-purple-800'
      };
    default:
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        title: 'text-gray-900',
        message: 'text-gray-800'
      };
  }
};

const getButtonVariant = (variant: string = 'primary') => {
  switch (variant) {
    case 'primary':
      return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
    case 'secondary':
      return 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500';
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500';
    default:
      return 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500';
  }
};

export const Popup: React.FC<PopupProps> = ({ popup, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const colors = getPopupColors(popup.type);

  useEffect(() => {
    if (popupRef.current) {
      const cleanup = trapFocus(popupRef.current);
      
      // Focus the first focusable element
      const firstButton = popupRef.current.querySelector('button');
      const firstInput = popupRef.current.querySelector('input');
      
      if (popup.type === 'prompt' && firstInput) {
        firstInput.focus();
      } else if (firstButton) {
        firstButton.focus();
      }

      return cleanup;
    }
  }, [popup.type]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !popup.persistent) {
      onClose(popup.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !popup.persistent) {
      onClose(popup.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={popup.title ? `popup-title-${popup.id}` : undefined}
      aria-describedby={`popup-message-${popup.id}`}
    >
      <div
        ref={popupRef}
        className={`
          relative w-full max-w-md mx-auto bg-white rounded-lg shadow-xl border-2 
          ${colors.bg} ${colors.border}
          transform transition-all duration-200 ease-out
          animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2
        `}
      >
        {/* Close button */}
        {popup.showCloseButton && !popup.persistent && (
          <button
            onClick={() => onClose(popup.id)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            aria-label="Close popup"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start space-x-3 mb-4">
            <div className="flex-shrink-0">
              {getPopupIcon(popup.type)}
            </div>
            <div className="flex-1 min-w-0">
              {popup.title && (
                <h3 
                  id={`popup-title-${popup.id}`}
                  className={`text-lg font-semibold ${colors.title} mb-1`}
                >
                  {popup.title}
                </h3>
              )}
              <p 
                id={`popup-message-${popup.id}`}
                className={`text-sm ${colors.message} leading-relaxed`}
              >
                {popup.message}
              </p>
            </div>
          </div>

          {/* Prompt input */}
          {popup.type === 'prompt' && (
            <div className="mb-4">
              <input
                ref={inputRef}
                type="text"
                value={popup.promptValue || ''}
                onChange={(e) => popup.onPromptChange?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your response..."
                aria-label="Input field"
              />
            </div>
          )}

          {/* Actions */}
          {popup.actions && popup.actions.length > 0 && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
              {popup.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={`
                    px-4 py-2 rounded-md text-sm font-medium transition-colors
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${getButtonVariant(action.variant)}
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Popup;
