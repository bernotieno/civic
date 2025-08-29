import { useState, useCallback } from 'react';

interface AlertState {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  isOpen: boolean;
}

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    type: 'info',
    title: '',
    message: '',
    isOpen: false
  });

  const showAlert = useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message?: string
  ) => {
    setAlert({
      type,
      title,
      message,
      isOpen: true
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showAlert('success', title, message);
  }, [showAlert]);

  const showError = useCallback((title: string, message?: string) => {
    showAlert('error', title, message);
  }, [showAlert]);

  const showWarning = useCallback((title: string, message?: string) => {
    showAlert('warning', title, message);
  }, [showAlert]);

  const showInfo = useCallback((title: string, message?: string) => {
    showAlert('info', title, message);
  }, [showAlert]);

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};