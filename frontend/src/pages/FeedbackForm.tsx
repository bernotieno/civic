import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Upload, MapPin, Tag, Save, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import Button from '../components/UI/Button';
import Card from '../components/UI/Card';
import FileUpload from '../components/Feedback/FileUpload';
import CategorySelector from '../components/Feedback/CategorySelector';
import LocationSelector from '../components/Feedback/LocationSelector';
import ProgressSteps from '../components/Feedback/ProgressSteps';

interface FormData {
  title: string;
  description: string;
  category: string;
  location: string;
  priority: 'low' | 'medium' | 'high';
  anonymous: boolean;
  files: File[];
}

const FeedbackForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    category: '',
    location: '',
    priority: 'medium',
    anonymous: false,
    files: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const steps = [
    { number: 1, title: 'Basic Information', description: 'Tell us about your feedback' },
    { number: 2, title: 'Details & Category', description: 'Provide more context' },
    { number: 3, title: 'Location & Priority', description: 'Help us route your feedback' },
    { number: 4, title: 'Attachments', description: 'Add supporting documents' },
    { number: 5, title: 'Review & Submit', description: 'Confirm your submission' }
  ];

  // Auto-save as draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.title || formData.description) {
        setIsDraft(true);
        // Save to localStorage or API
        localStorage.setItem('feedback-draft', JSON.stringify(formData));
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData]);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const saveDraft = async () => {
    setIsLoading(true);
    try {
      // Save draft to API
      addNotification({
        type: 'success',
        message: 'Draft saved successfully'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to save draft'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitFeedback = async () => {
    setIsLoading(true);
    try {
      // Submit to API
      const trackingId = 'FB' + Date.now();
      addNotification({
        type: 'success',
        message: 'Feedback submitted successfully!'
      });
      navigate(`/track/${trackingId}`);
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to submit feedback'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Brief summary of your feedback"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Describe your feedback in detail..."
                required
              />
              <div className="mt-2 text-sm text-gray-500 text-right">
                {formData.description.length}/1000 characters
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <CategorySelector
              selected={formData.category}
              onSelect={(category) => updateFormData('category', category)}
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => updateFormData('priority', priority)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors duration-200 ${
                      formData.priority === priority
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <LocationSelector
              selected={formData.location}
              onSelect={(location) => updateFormData('location', location)}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.anonymous}
                onChange={(e) => updateFormData('anonymous', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="anonymous" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Submit this feedback anonymously
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <FileUpload
              files={formData.files}
              onFilesChange={(files) => updateFormData('files', files)}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Review Your Feedback
              </h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Title:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.title}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Category:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Location:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.location}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Priority:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.priority}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Files:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{formData.files.length} attached</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Submit Feedback
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Help us improve government services by sharing your experience
            </p>
          </div>

          {/* Progress Steps */}
          <ProgressSteps steps={steps} currentStep={currentStep} />

          {/* Form */}
          <Card className="mt-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {steps[currentStep - 1].title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {steps[currentStep - 1].description}
              </p>
            </div>

            {renderStepContent()}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {isDraft && (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                    <Save className="w-4 h-4 mr-1" />
                    Draft saved
                  </span>
                )}
              </div>

              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <Button variant="outline" onClick={prevStep}>
                    Previous
                  </Button>
                )}

                <Button variant="ghost" onClick={saveDraft} loading={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>

                {currentStep < steps.length ? (
                  <Button onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={submitFeedback} loading={isLoading}>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;