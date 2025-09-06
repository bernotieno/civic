/**
 * Popup Context
 * Global context for managing custom popups (alerts, confirmations, prompts)
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type PopupType = 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'prompt';

export interface PopupAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface PopupConfig {
  id: string;
  type: PopupType;
  title?: string;
  message: string;
  actions?: PopupAction[];
  autoClose?: boolean;
  autoCloseDelay?: number;
  onClose?: () => void;
  showCloseButton?: boolean;
  persistent?: boolean;
  promptValue?: string;
  onPromptChange?: (value: string) => void;
}

interface PopupContextType {
  popups: PopupConfig[];
  showAlert: (message: string, type?: PopupType, title?: string, options?: Partial<PopupConfig>) => void;
  showConfirm: (message: string, onConfirm: () => void, onCancel?: () => void, title?: string) => void;
  showPrompt: (message: string, onConfirm: (value: string) => void, onCancel?: () => void, title?: string, defaultValue?: string) => void;
  closePopup: (id: string) => void;
  closeAllPopups: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

interface PopupProviderProps {
  children: ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [popups, setPopups] = useState<PopupConfig[]>([]);

  const generateId = useCallback(() => {
    return `popup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const closePopup = useCallback((id: string) => {
    setPopups(prev => {
      const popup = prev.find(p => p.id === id);
      if (popup?.onClose) {
        popup.onClose();
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  const closeAllPopups = useCallback(() => {
    setPopups(prev => {
      prev.forEach(popup => {
        if (popup.onClose) {
          popup.onClose();
        }
      });
      return [];
    });
  }, []);

  const showAlert = useCallback((
    message: string,
    type: PopupType = 'info',
    title?: string,
    options: Partial<PopupConfig> = {}
  ) => {
    const id = generateId();
    
    const popup: PopupConfig = {
      id,
      type,
      title,
      message,
      autoClose: type === 'success' ? true : false,
      autoCloseDelay: 5000,
      showCloseButton: true,
      actions: [
        {
          label: 'OK',
          onClick: () => closePopup(id),
          variant: 'primary'
        }
      ],
      ...options
    };

    setPopups(prev => [...prev, popup]);

    // Auto close if enabled
    if (popup.autoClose && popup.autoCloseDelay) {
      setTimeout(() => {
        closePopup(id);
      }, popup.autoCloseDelay);
    }
  }, [generateId, closePopup]);

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title?: string
  ) => {
    const id = generateId();
    
    const popup: PopupConfig = {
      id,
      type: 'confirm',
      title: title || 'Confirm Action',
      message,
      persistent: true,
      showCloseButton: false,
      actions: [
        {
          label: 'Cancel',
          onClick: () => {
            if (onCancel) onCancel();
            closePopup(id);
          },
          variant: 'secondary'
        },
        {
          label: 'Confirm',
          onClick: () => {
            onConfirm();
            closePopup(id);
          },
          variant: 'primary'
        }
      ]
    };

    setPopups(prev => [...prev, popup]);
  }, [generateId, closePopup]);

  const showPrompt = useCallback((
    message: string,
    onConfirm: (value: string) => void,
    onCancel?: () => void,
    title?: string,
    defaultValue: string = ''
  ) => {
    const id = generateId();
    let promptValue = defaultValue;
    
    const popup: PopupConfig = {
      id,
      type: 'prompt',
      title: title || 'Input Required',
      message,
      persistent: true,
      showCloseButton: false,
      promptValue,
      onPromptChange: (value: string) => {
        promptValue = value;
        setPopups(prev => prev.map(p => 
          p.id === id ? { ...p, promptValue: value } : p
        ));
      },
      actions: [
        {
          label: 'Cancel',
          onClick: () => {
            if (onCancel) onCancel();
            closePopup(id);
          },
          variant: 'secondary'
        },
        {
          label: 'OK',
          onClick: () => {
            onConfirm(promptValue);
            closePopup(id);
          },
          variant: 'primary'
        }
      ]
    };

    setPopups(prev => [...prev, popup]);
  }, [generateId, closePopup]);

  const value: PopupContextType = {
    popups,
    showAlert,
    showConfirm,
    showPrompt,
    closePopup,
    closeAllPopups
  };

  return (
    <PopupContext.Provider value={value}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopup = (): PopupContextType => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

export default PopupContext;
