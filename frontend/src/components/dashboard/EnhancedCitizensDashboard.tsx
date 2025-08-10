/**
 * Enhanced Citizens Dashboard with AI Integration
 * Hackathon-winning citizen experience with intelligent document discovery
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import DocumentChatWidget from '../ai-chat/DocumentChatWidget';
import { 
  Brain, 
  FileText, 
  TrendingUp, 
  MessageSquare, 
  Sparkles,
  BookOpen,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  BarChart3,
  Zap,
  Heart,
  Star
} from 'lucide-react';

interface SmartRecommendation {
  id: string;
  title: string;
  description: string;
  document_id: string;
  relevance_score: number;
  why_recommended: string;
  category: string;
}

interface CivicEducationTopic {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: string;
  completion_count: number;
}

const EnhancedCitizensDashboard: React.FC = () => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [smartRecommendations, setSmartRecommendations] = useState<SmartRecommendation[]>([]);
  const [civicTopics, setCivicTopics] = useState<CivicEducationTopic[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalQuestions: 0,
    documentsExplored: 0,
    learningStreak: 0,
    communityRank: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Load smart recommendations
    setSmartRecommendations([
      {
        id: '1',
        title: 'FY 2024-2025 County Budget',
        description: 'Learn about budget allocation for your area',
        document_id: 'budget-2024',
        relevance_score: 0.95,
        why_recommended: 'Based on your interest in infrastructure and recent questions about road projects',
        category: 'Budget'
      },
      {
        id: '2', 
        title: 'Water & Sanitation Strategic Plan',
        description: 'Understand water project timelines and implementation',
        document_id: 'water-plan-2024',
        relevance_score: 0.87,
        why_recommended: 'Many citizens in your area are asking about water projects',
        category: 'Infrastructure'
      }
    ]);

    // Load civic education topics
    setCivicTopics([
      {
        id: '1',
        title: 'Understanding Your County Budget',
        description: 'Learn how county budgets work and how they affect you',
        difficulty: 'beginner',
        estimated_time: '5 min',
        completion_count: 1247
      },
      {
        id: '2',
        title: 'Citizen Participation in Government',
        description: 'Discover ways to engage with your local government',
        difficulty: 'beginner', 
        estimated_time: '8 min',
        completion_count: 892
      }
    ]);

    // Load dashboard stats
    setDashboardStats({
      totalQuestions: 23,
      documentsExplored: 8,
      learningStreak: 5,
      communityRank: 156
    });
  };

  const openChatWithDocument = (documentId: string) => {
    setIsChatOpen(true);
    // The chat widget will handle document context
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Brain className="h-8 w-8 text-blue-600 mr-3" />
                Civic Education Portal
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.name}! Explore government documents with AI assistance.
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Learning Streak */}
              <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold">{dashboardStats.learningStreak} day streak!</span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <button
                onClick={() => setIsChatOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Brain className="h-5 w-5" />
                <span>Ask AI Assistant</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - 3/4 width */}
          <div className="lg:col-span-3 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Questions Asked</p>
                    <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalQuestions}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Documents Explored</p>
                    <p className="text-2xl font-bold text-green-600">{dashboardStats.documentsExplored}</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Learning Streak</p>
                    <p className="text-2xl font-bold text-orange-600">{dashboardStats.learningStreak} days</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Community Rank</p>
                    <p className="text-2xl font-bold text-purple-600">#{dashboardStats.communityRank}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">AI-Powered Recommendations</h2>
                    <p className="text-gray-600">Documents tailored to your interests and community needs</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {smartRecommendations.map((rec) => (
                  <div 
                    key={rec.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openChatWithDocument(rec.document_id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {rec.category}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">
                              {Math.round(rec.relevance_score * 100)}% match
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-2">{rec.description}</p>
                        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                          💡 {rec.why_recommended}
                        </p>
                      </div>
                      <div className="ml-4">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                          <Brain className="h-4 w-4" />
                          <span>Explore with AI</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Civic Education Topics */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-3 rounded-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Civic Education Topics</h2>
                  <p className="text-gray-600">Learn about government and civic participation</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {civicTopics.map((topic) => (
                  <div key={topic.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{topic.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        topic.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                        topic.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {topic.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3">{topic.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{topic.estimated_time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{topic.completion_count.toLocaleString()} completed</span>
                        </div>
                      </div>
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors">
                        Start Learning
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar - 1/4 width */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Brain className="h-5 w-5" />
                  <span>Ask AI Question</span>
                </button>
                
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Browse Documents</span>
                </button>
                
                <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Submit Feedback</span>
                </button>
              </div>
            </div>

            {/* Community Impact */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center space-x-2 mb-4">
                <Heart className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Community Impact</h3>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-700 mb-1">47</div>
                <p className="text-sm text-green-600">Issues resolved in your area this month</p>
              </div>
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm text-green-700">
                  Your questions help improve government services for everyone! 🎉
                </p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Asked about road construction budget</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Completed budget basics course</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Explored water project timeline</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Widget */}
      <DocumentChatWidget
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
        mode="citizen"
        position="bottom-right"
      />
    </div>
  );
};

export default EnhancedCitizensDashboard;