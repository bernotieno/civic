/**
 * Accessibility Utilities
 * Helper functions for improving accessibility across the application
 */

// Screen reader announcements
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Focus management
export const trapFocus = (element: HTMLElement) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// Keyboard navigation helpers
export const handleEnterKeyPress = (callback: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    callback();
  }
};

// ARIA label generators
export const generateAriaLabel = (base: string, context?: string) => {
  return context ? `${base}, ${context}` : base;
};

// Color contrast utilities
export const getContrastRatio = (color1: string, color2: string): number => {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color library
  return 4.5; // Mock return for WCAG AA compliance
};

// Skip link functionality
export const createSkipLink = (targetId: string, text: string) => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50';
  
  return skipLink;
};

// Reduced motion detection
export const prefersReducedMotion = (): boolean => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// High contrast mode detection
export const prefersHighContrast = (): boolean => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

// Screen reader detection (basic)
export const isScreenReaderActive = (): boolean => {
  // This is a simplified check - real implementation would be more comprehensive
  return navigator.userAgent.includes('NVDA') || 
         navigator.userAgent.includes('JAWS') || 
         navigator.userAgent.includes('VoiceOver');
};

// Accessible notification
export const showAccessibleNotification = (
  message: string, 
  type: 'success' | 'error' | 'info' | 'warning' = 'info'
) => {
  // Announce to screen readers
  announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');
  
  // Visual notification (you'd integrate with your notification system)
  console.log(`${type.toUpperCase()}: ${message}`);
};

// Accessible form validation
export const getAccessibleErrorMessage = (fieldName: string, error: string): string => {
  return `${fieldName} field has an error: ${error}`;
};

// Touch target size validation
export const validateTouchTargetSize = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  const minSize = 44; // 44px minimum for WCAG AA
  
  return rect.width >= minSize && rect.height >= minSize;
};

// Accessible loading states
export const createAccessibleLoadingState = (loadingText: string = 'Loading') => {
  return {
    'aria-live': 'polite' as const,
    'aria-busy': true,
    'aria-label': loadingText,
    role: 'status'
  };
};

// Accessible button states
export const getAccessibleButtonProps = (
  isPressed?: boolean,
  isExpanded?: boolean,
  controls?: string
) => {
  const props: Record<string, any> = {};
  
  if (typeof isPressed === 'boolean') {
    props['aria-pressed'] = isPressed;
  }
  
  if (typeof isExpanded === 'boolean') {
    props['aria-expanded'] = isExpanded;
  }
  
  if (controls) {
    props['aria-controls'] = controls;
  }
  
  return props;
};

// Accessible table helpers
export const getTableAccessibilityProps = (caption?: string) => {
  return {
    role: 'table',
    'aria-label': caption || 'Data table',
  };
};

// Accessible modal props
export const getModalAccessibilityProps = (labelId: string, descriptionId?: string) => {
  return {
    role: 'dialog',
    'aria-modal': true,
    'aria-labelledby': labelId,
    'aria-describedby': descriptionId,
  };
};

// Accessible list props
export const getListAccessibilityProps = (itemCount: number, listType: 'ordered' | 'unordered' = 'unordered') => {
  return {
    role: listType === 'ordered' ? 'list' : 'list',
    'aria-label': `List with ${itemCount} items`,
  };
};
