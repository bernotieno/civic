import React, { useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Upload, Eye, MessageCircle, Clock, User, Settings, Bell, TrendingUp, Brain, CheckCircle, AlertCircle, Search, Filter, Edit, Share2 } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  category: string;
  status: 'published' | 'under review' | 'processing';
  aiStatus: 'Processed' | 'Processing';
  engagement: number;
  downloads: number;
  queries: number;
  department: string;
  uploadDate: string;
  size: string;
  version: string;
}

const GovernmentDocumentPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');

  const documents: Document[] = [
    {
      id: '1',
      title: 'FY 2024-2025 County Budget',
      category: 'Budget',
      status: 'published',
      aiStatus: 'Processed',
      engagement: 2847,
      downloads: 456,
      queries: 89,
      department: 'Finance',
      uploadDate: '8/10/2024',
      size: '12.5 MB',
      version: 'v1.2'
    },
    {
      id: '2',
      title: 'Water & Sanitation Strategic Plan 2024-2028',
      category: 'Strategic Plan',
      status: 'published',
      aiStatus: 'Processed',
      engagement: 1234,
      downloads: 234,
      queries: 45,
      department: 'Water & Sanitation',
      uploadDate: '8/8/2024',
      size: '8.3 MB',
      version: 'v1.0'
    },
    {
      id: '3',
      title: 'Q2 2024 Financial Performance Report',
      category: 'Financial Report',
      status: 'under review',
      aiStatus: 'Processing',
      engagement: 0,
      downloads: 0,
      queries: 0,
      department: 'Finance',
      uploadDate: '8/5/2024',
      size: '5.7 MB',
      version: 'v1.0'
    },
    {
      id: '4',
      title: 'Public Participation Framework',
      category: 'Policy',
      status: 'published',
      aiStatus: 'Processed',
      engagement: 892,
      downloads: 167,
      queries: 23,
      department: 'Governance',
      uploadDate: '7/28/2024',
      size: '3.2 MB',
      version: 'v2.1'
    }
  ];

  const mostAskedQuestions = [
    {
      question: 'How much is allocated for road construction?',
      count: 23,
      document: 'Budget 2024-2025'
    },
    {
      question: 'What are the water project timelines?',
      count: 18,
      document: 'Water Strategic Plan'
    },
    {
      question: 'How can citizens participate in budget planning?',
      count: 15,
      document: 'Participation Framework'
    }
  ];

  const aiRecommendations = [
    {
      type: 'Create FAQ document',
      description: 'Generate FAQ based on citizen questions about budget allocation',
      status: 'suggestion'
    },
    {
      type: 'Improve document summaries',
      description: 'Add executive summaries to complex policy documents',
      status: 'in-progress'
    },
    {
      type: 'Enhance citizen engagement',
      description: 'Water strategic plan receives high interest - consider town halls',
      status: 'completed'
    }
  ];

  const engagementData = [
    { name: 'Sun', views: 520, downloads: 180, queries: 45 },
    { name: 'Mon', views: 380, downloads: 120, queries: 35 },
    { name: 'Tue', views: 290, downloads: 90, queries: 25 },
    { name: 'Wed', views: 450, downloads: 140, queries: 55 },
    { name: 'Thu', views: 520, downloads: 165, queries: 48 },
    { name: 'Fri', views: 380, downloads: 110, queries: 32 },
    { name: 'Sat', views: 320, downloads: 85, queries: 28 }
  ];

  const categoryData = [
    { name: 'Budget', value: 1, color: '#ef4444' },
    { name: 'Strategic Plan', value: 1, color: '#f59e0b' },
    { name: 'Financial Report', value: 1, color: '#10b981' },
    { name: 'Policy', value: 1, color: '#3b82f6' }
  ];

  const mostEngagedDocuments = [
    {
      rank: 1,
      title: 'FY 2024-2025 County Budget',
      category: 'Finance',
      totalEngagements: 3392,
      views: 2847,
      downloads: 456,
      queries: 89
    },
    {
      rank: 2,
      title: 'Water & Sanitation Strategic Plan 2024-2028',
      category: 'Water & Sanitation',
      totalEngagements: 1513,
      views: 1234,
      downloads: 234,
      queries: 45
    },
    {
      rank: 3,
      title: 'Public Participation Framework',
      category: 'Governance',
      totalEngagements: 1082,
      views: 892,
      downloads: 167,
      queries: 23
    },
    {
      rank: 4,
      title: 'Q2 2024 Financial Performance Report',
      category: 'Finance',
      totalEngagements: 0,
      views: 0,
      downloads: 0,
      queries: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-700 bg-green-100';
      case 'under review':
        return 'text-yellow-700 bg-yellow-100';
      case 'processing':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getAIStatusColor = (status: string) => {
    switch (status) {
      case 'Processed':
        return 'text-green-700 bg-green-100';
      case 'Processing':
        return 'text-blue-700 bg-blue-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'Create FAQ document':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'Improve document summaries':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Enhance citizen engagement':
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Brain className="w-4 h-4 text-blue-600" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
              <p className="text-sm text-green-600">+3 this week</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">15,642</p>
              <p className="text-sm text-green-600">+12% this month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Eye className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">AI Queries</p>
              <p className="text-2xl font-bold text-gray-900">287</p>
              <p className="text-sm text-gray-600">Citizens asking questions</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">2.3 hours</p>
              <p className="text-sm text-gray-600">AI document analysis</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documents by Category */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents by Category</h3>
          <div className="flex items-center justify-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name }) => name}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Trends */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="views" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="downloads" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Area type="monotone" dataKey="queries" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-6 mt-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>views</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>downloads</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>queries</span>
            </div>
          </div>
        </div>
      </div>

      {/* Most Engaged Documents */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Most Engaged Documents</h3>
        </div>
        <div className="p-6 space-y-4">
          {mostEngagedDocuments.map((doc) => (
            <div key={doc.rank} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                  {doc.rank}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{doc.title}</h4>
                  <p className="text-sm text-gray-600">{doc.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{doc.totalEngagements.toLocaleString()} total engagements</p>
                <p className="text-sm text-gray-600">
                  {doc.views} views • {doc.downloads} downloads • {doc.queries} AI queries
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDocumentManagement = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Document Management</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Upload className="w-4 h-4" />
          <span>Upload New Document</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option>All Categories</option>
          <option>Budget</option>
          <option>Strategic Plan</option>
          <option>Policy</option>
          <option>Financial Report</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option>All Status</option>
          <option>Published</option>
          <option>Under Review</option>
          <option>Processing</option>
        </select>
        <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option>Sort by Date</option>
          <option>Sort by Engagement</option>
          <option>Sort by Views</option>
        </select>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        <div className="text-sm text-gray-500">{doc.size} • {doc.version}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${doc.aiStatus === 'Processed' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAIStatusColor(doc.aiStatus)}`}>
                        {doc.aiStatus}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {doc.engagement.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        ⬇ {doc.downloads}
                      </span>
                      <span className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {doc.queries} queries
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.uploadDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAIInsights = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">AI-Powered Insights</h2>
      
      {/* Most Asked Questions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Asked Questions</h3>
        <div className="space-y-4">
          {mostAskedQuestions.map((item, index) => (
            <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">{item.question}</h4>
                <p className="text-sm text-gray-600">Asked {item.count} times about {item.document}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Recommendations</h3>
        <div className="space-y-4">
          {aiRecommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {getRecommendationIcon(rec.type)}
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-gray-900">{rec.type}</h4>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
              <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                rec.status === 'completed' ? 'bg-green-100 text-green-800' :
                rec.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {rec.status.replace('-', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Government Document Portal</h1>
                <p className="text-sm text-gray-600">Kisumu County</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-800 font-medium text-sm">Dr</span>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-gray-900">Dr. Sarah Otieno</div>
                  <div className="text-gray-500">County Secretary</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'document-management', label: 'Document Management', icon: FileText },
              { id: 'analytics', label: 'Analytics & Reports', icon: BarChart },
              { id: 'ai-insights', label: 'AI Insights', icon: Brain }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'document-management' && renderDocumentManagement()}
        {activeTab === 'analytics' && renderOverview()}
        {activeTab === 'ai-insights' && renderAIInsights()}
      </div>
    </div>
  );
};

export default GovernmentDocumentPortal;