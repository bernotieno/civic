/**
 * Custom Popup Hook
 * Provides convenient methods for showing different types of popups
 */

import { usePopup } from '../contexts/PopupContext';

export const useCustomPopup = () => {
  const { showAlert, showConfirm, showPrompt, closeAllPopups } = usePopup();

  // Success alert
  const showSuccess = (message: string, title?: string) => {
    showAlert(message, 'success', title || 'Success');
  };

  // Error alert
  const showError = (message: string, title?: string) => {
    showAlert(message, 'error', title || 'Error');
  };

  // Warning alert
  const showWarning = (message: string, title?: string) => {
    showAlert(message, 'warning', title || 'Warning');
  };

  // Info alert
  const showInfo = (message: string, title?: string) => {
    showAlert(message, 'info', title || 'Information');
  };

  // Confirmation dialog
  const confirmAction = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title?: string
  ) => {
    showConfirm(message, onConfirm, onCancel, title);
  };

  // Prompt dialog
  const promptUser = (
    message: string,
    onConfirm: (value: string) => void,
    onCancel?: () => void,
    title?: string,
    defaultValue?: string
  ) => {
    showPrompt(message, onConfirm, onCancel, title, defaultValue);
  };

  // Convenience method for delete confirmations
  const confirmDelete = (
    itemName: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showConfirm(
      `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      onConfirm,
      onCancel,
      'Confirm Deletion'
    );
  };

  // Convenience method for dangerous actions
  const confirmDangerousAction = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title?: string
  ) => {
    showConfirm(
      message,
      onConfirm,
      onCancel,
      title || 'Confirm Action'
    );
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    confirmAction,
    promptUser,
    confirmDelete,
    confirmDangerousAction,
    closeAllPopups
  };
};

export default useCustomPopup;
