/**
 * Popup Container Component
 * Renders all active popups from the popup context
 */

import React from 'react';
import { usePopup } from '../../contexts/PopupContext';
import Popup from './Popup';

export const PopupContainer: React.FC = () => {
  const { popups, closePopup } = usePopup();

  if (popups.length === 0) {
    return null;
  }

  return (
    <>
      {popups.map((popup) => (
        <Popup
          key={popup.id}
          popup={popup}
          onClose={closePopup}
        />
      ))}
    </>
  );
};

export default PopupContainer;
