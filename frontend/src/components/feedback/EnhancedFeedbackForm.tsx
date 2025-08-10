import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Clock, MapPin, User, MessageCircle, FileText, Settings } from 'lucide-react';

interface FeedbackFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  county: string;
  subCounty: string;
  ward: string;
  village: string;
}

interface LocationOption {
  value: string;
  label: string;
}

const EnhancedFeedbackForm: React.FC = () => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    title: '',
    description: '',
    category: '',
    priority: 'Medium Priority',
    county: 'Kisumu',
    subCounty: '',
    ward: '',
    village: ''
  });

  const [submissionsRemaining] = useState(10);
  const [expectedResponse, setExpectedResponse] = useState('1-3 days');

  const categories = [
    { value: '', label: 'Select a category' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'public-safety', label: 'Public Safety' },
    { value: 'environment', label: 'Environment' },
    { value: 'governance', label: 'Governance' },
    { value: 'transport', label: 'Transportation' },
    { value: 'water-sanitation', label: 'Water & Sanitation' }
  ];

  const priorities = [
    { value: 'Low Priority', label: 'Low Priority' },
    { value: 'Medium Priority', label: 'Medium Priority' },
    { value: 'High Priority', label: 'High Priority' },
    { value: 'Urgent', label: 'Urgent' }
  ];

  const subCounties: LocationOption[] = [
    { value: '', label: 'Select Sub-County' },
    { value: 'kisumu-central', label: 'Kisumu Central' },
    { value: 'kisumu-east', label: 'Kisumu East' },
    { value: 'kisumu-west', label: 'Kisumu West' },
    { value: 'muhoroni', label: 'Muhoroni' },
    { value: 'nyando', label: 'Nyando' },
    { value: 'nyakach', label: 'Nyakach' },
    { value: 'seme', label: 'Seme' }
  ];

  const wards: LocationOption[] = [
    { value: '', label: 'Select Ward' },
    { value: 'market-milimani', label: 'Market Milimani' },
    { value: 'kondele', label: 'Kondele' },
    { value: 'nyalenda-b', label: 'Nyalenda B' },
    { value: 'kolwa-central', label: 'Kolwa Central' },
    { value: 'kolwa-east', label: 'Kolwa East' },
    { value: 'manyatta-b', label: 'Manyatta B' },
    { value: 'kaloleni-shaurimoyo', label: 'Kaloleni/Shaurimoyo' },
    { value: 'railways', label: 'Railways' }
  ];

  const villages: LocationOption[] = [
    { value: '', label: 'Select Village' },
    { value: 'kibuye', label: 'Kibuye' },
    { value: 'dunga', label: 'Dunga' },
    { value: 'bandani', label: 'Bandani' },
    { value: 'migosi', label: 'Migosi' },
    { value: 'mamboleo', label: 'Mamboleo' },
    { value: 'lolwe', label: 'Lolwe' },
    { value: 'nyamasaria', label: 'Nyamasaria' },
    { value: 'otonglo', label: 'Otonglo' }
  ];

  useEffect(() => {
    // Update expected response time based on priority
    switch (formData.priority) {
      case 'Urgent':
        setExpectedResponse('Within 24 hours');
        break;
      case 'High Priority':
        setExpectedResponse('1-2 days');
        break;
      case 'Medium Priority':
        setExpectedResponse('1-3 days');
        break;
      case 'Low Priority':
        setExpectedResponse('3-7 days');
        break;
      default:
        setExpectedResponse('1-3 days');
    }
  }, [formData.priority]);

  const handleInputChange = (field: keyof FeedbackFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting feedback:', formData);
    // Handle form submission
  };

  const getCharacterCount = (text: string) => text.length;
  const getTitleCharacterCount = () => getCharacterCount(formData.title);
  const getDescriptionCharacterCount = () => getCharacterCount(formData.description);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CA</span>
            </div>
            <span className="font-semibold text-gray-900">CivicAI</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-800 font-medium">B</span>
            </div>
            <div>
              <div className="font-medium text-gray-900">Benard Opiyo</div>
              <div className="text-gray-500">Kisumu County</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Dashboard</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Submit Feedback</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <FileText className="w-4 h-4" />
            <span className="text-sm">My Feedback</span>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">3</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Track Feedback</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <FileText className="w-4 h-4" />
            <span className="text-sm">Public Updates</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">QUICK ACTIONS</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <User className="w-4 h-4" />
              <span>Anonymous Feedback</span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <AlertCircle className="w-4 h-4" />
              <span>Emergency Report</span>
            </div>
          </div>
        </div>

        {/* Popular Categories */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">POPULAR CATEGORIES</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <span>🏗️ Infrastructure</span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <span>❤️ Healthcare</span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <span>📚 Education</span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <span>🚔 Public Safety</span>
            </div>
          </div>
        </div>

        {/* Transparency Portal */}
        <div className="p-4">
          <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
            <span className="text-sm">🔍 Transparency Portal</span>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </div>
          <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
            <span className="text-sm">❓ Help & Support</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-blue-600 mb-4 cursor-pointer hover:text-blue-700">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">← Back to Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Feedback</h1>
          <p className="text-gray-600">
            Share your concerns with Kisumu County Government. Your feedback will be routed to the appropriate department for review.
          </p>
          
          {/* Submissions remaining indicator */}
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-700">{submissionsRemaining} submissions remaining today</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief description of your issue (10-200 characters)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500">{getTitleCharacterCount()}/200</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Provide detailed information about your issue (minimum 50 characters)"
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              minLength={50}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500">{getDescriptionCharacterCount()} characters</span>
            </div>
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
              
              {/* Expected Response Time */}
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 text-sm text-yellow-800">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">Expected Response: {expectedResponse}</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  Standard issues requiring timely attention
                </p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Location Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* County */}
              <div>
                <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-2">
                  County <span className="text-red-500">*</span>
                </label>
                <select
                  id="county"
                  value={formData.county}
                  onChange={(e) => handleInputChange('county', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Kisumu">Kisumu</option>
                </select>
              </div>

              {/* Sub-County */}
              <div>
                <label htmlFor="subCounty" className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-County
                </label>
                <select
                  id="subCounty"
                  value={formData.subCounty}
                  onChange={(e) => handleInputChange('subCounty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {subCounties.map((subCounty) => (
                    <option key={subCounty.value} value={subCounty.value}>
                      {subCounty.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ward */}
              <div>
                <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-2">
                  Ward
                </label>
                <select
                  id="ward"
                  value={formData.ward}
                  onChange={(e) => handleInputChange('ward', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {wards.map((ward) => (
                    <option key={ward.value} value={ward.value}>
                      {ward.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Village */}
              <div>
                <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-2">
                  Village
                </label>
                <select
                  id="village"
                  value={formData.village}
                  onChange={(e) => handleInputChange('village', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {villages.map((village) => (
                    <option key={village.value} value={village.value}>
                      {village.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Auto-publish Option */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="autoPublish"
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label htmlFor="autoPublish" className="text-sm font-medium text-gray-700">
                Auto-publish after AI processing (if public)
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Your feedback will be automatically made public after AI review if marked as public content
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload & Process
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedFeedbackForm;