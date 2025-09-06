/**
 * Popup Test Page
 * Test page to demonstrate all custom popup types
 */

import React from 'react';
import { useCustomPopup } from '../hooks/useCustomPopup';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PopupTestPage: React.FC = () => {
  const { 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    confirmAction, 
    promptUser, 
    confirmDelete,
    confirmDangerousAction 
  } = useCustomPopup();

  const handleSuccessTest = () => {
    showSuccess('This is a success message! Your action was completed successfully.');
  };

  const handleErrorTest = () => {
    showError('This is an error message! Something went wrong.');
  };

  const handleWarningTest = () => {
    showWarning('This is a warning message! Please be careful.');
  };

  const handleInfoTest = () => {
    showInfo('This is an info message! Here is some useful information.');
  };

  const handleConfirmTest = () => {
    confirmAction(
      'Are you sure you want to proceed with this action?',
      () => {
        showSuccess('You confirmed the action!');
      },
      () => {
        showInfo('You cancelled the action.');
      },
      'Confirm Action'
    );
  };

  const handlePromptTest = () => {
    promptUser(
      'Please enter your name:',
      (value) => {
        showSuccess(`Hello, ${value}! Nice to meet you.`);
      },
      () => {
        showInfo('You cancelled the prompt.');
      },
      'Enter Name',
      'John Doe'
    );
  };

  const handleDeleteTest = () => {
    confirmDelete(
      'Important Document.pdf',
      () => {
        showSuccess('Document deleted successfully!');
      },
      () => {
        showInfo('Delete cancelled.');
      }
    );
  };

  const handleDangerousActionTest = () => {
    confirmDangerousAction(
      'This action will permanently delete your account and all associated data. This cannot be undone.',
      () => {
        showError('Account deletion confirmed (this is just a test).');
      },
      () => {
        showInfo('Account deletion cancelled.');
      },
      'Delete Account'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Custom Popup System Test
          </h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <p className="text-gray-600 mb-6 text-center">
              Test all the different types of custom popups that replace the default JavaScript alerts.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Alert Types */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 mb-3">Alert Types</h3>
                
                <button
                  onClick={handleSuccessTest}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Success Alert
                </button>
                
                <button
                  onClick={handleErrorTest}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Error Alert
                </button>
                
                <button
                  onClick={handleWarningTest}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Warning Alert
                </button>
                
                <button
                  onClick={handleInfoTest}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Info Alert
                </button>
              </div>
              
              {/* Confirmation Types */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 mb-3">Confirmations</h3>
                
                <button
                  onClick={handleConfirmTest}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Basic Confirm
                </button>
                
                <button
                  onClick={handleDeleteTest}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Confirm
                </button>
                
                <button
                  onClick={handleDangerousActionTest}
                  className="w-full px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-900 transition-colors"
                >
                  Dangerous Action
                </button>
              </div>
              
              {/* Input Types */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 mb-3">Input</h3>
                
                <button
                  onClick={handlePromptTest}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Prompt Input
                </button>
              </div>
              
              {/* Features */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 mb-3">Features</h3>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Accessible
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Keyboard Navigation
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Focus Management
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    Animations
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Responsive
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> These custom popups replace all default JavaScript alert(), confirm(), and prompt() 
                  functions throughout the application. They provide better accessibility, styling, and user experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PopupTestPage;
