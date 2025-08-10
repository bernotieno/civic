import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, MessageCircle, Settings, Download, User, Send, Bot } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  category: string;
  description: string;
  views: number;
  uploadDate: string;
  size: string;
  isCurrentlyDiscussing?: boolean;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  confidence?: number;
}

interface ChatSession {
  title: string;
  messages: number;
  date: string;
  topic: string;
}

const CitizenDocumentPortal: React.FC = () => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSessions] = useState<ChatSession[]>([
    {
      title: 'Budget Allocation Questions',
      messages: 8,
      date: '8/15/2024',
      topic: 'How much budget is allocated for road construction?'
    },
    {
      title: 'Water Project Timeline',
      messages: 5,
      date: '8/14/2024',
      topic: 'When will the new boreholes be completed?'
    },
    {
      title: 'Citizen Participation Process',
      messages: 3,
      date: '8/13/2024',
      topic: 'How can I participate in budget planning?'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const documents: Document[] = [
    {
      id: '1',
      title: 'FY 2024-2025 County Budget',
      category: 'Finance',
      description: 'Complete budget allocation for Kisumu County including development and recurrent expenditure',
      views: 2847,
      uploadDate: '8/15/2024',
      size: '12.5 MB',
      isCurrentlyDiscussing: true
    },
    {
      id: '2',
      title: 'Water & Sanitation Strategic Plan 2024-2028',
      category: 'Water & Sanitation',
      description: '4-year strategic plan for improving water access and sanitation infrastructure',
      views: 1234,
      uploadDate: '8/9/2024',
      size: '8.3 MB'
    },
    {
      id: '3',
      title: 'Public Participation Framework',
      category: 'Governance',
      description: 'Guidelines for citizen engagement in county governance and decision-making',
      views: 892,
      uploadDate: '7/30/2024',
      size: '3.2 MB'
    }
  ];

  useEffect(() => {
    // Set default document and initial message
    const defaultDoc = documents.find(doc => doc.isCurrentlyDiscussing);
    if (defaultDoc) {
      setSelectedDocument(defaultDoc);
      setMessages([
        {
          id: '1',
          text: `Hello! I'm your AI assistant ready to help you understand the "${defaultDoc.title}". I can answer questions about budget allocations, project timelines, policies, and more. What would you like to know?`,
          sender: 'assistant',
          timestamp: new Date(),
          confidence: 92
        }
      ]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response based on the images
    setTimeout(() => {
      let response = '';
      if (inputMessage.toLowerCase().includes('budget planning') || inputMessage.toLowerCase().includes('participate')) {
        response = `Based on the government documents available for Kisumu County, I can help answer your budget-related question.

**Key Budget Information:**
The FY 2024-2025 budget allocates KES 12.5 billion for various county operations. Here's what I found relevant to your inquiry:

• **Development Budget**: KES 7.2 billion (57.6%)
• **Recurrent Expenditure**: KES 5.3 billion (42.4%)
• **Road Infrastructure**: KES 2.1 billion allocated specifically for road construction and maintenance

**Key Projects This Year:**
- Kisumu-Kakamega highway improvement (KES 850M)
- Rural road network expansion (KES 680M)
- Bridge construction and repair (KES 320M)

Would you like me to explain any specific aspect of the budget in more detail?`;
      } else {
        response = `I understand you're asking about ${selectedDocument?.title || 'city services'}. Let me search through the document for relevant information and provide you with accurate details.`;
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'assistant',
        timestamp: new Date(),
        confidence: Math.floor(Math.random() * 10) + 90
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document);
    setMessages([
      {
        id: Date.now().toString(),
        text: `I'm now ready to help you understand the "${document.title}". What would you like to know about this document?`,
        sender: 'assistant',
        timestamp: new Date(),
        confidence: 92
      }
    ]);
  };

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
          <div className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 rounded-lg">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Submit Feedback</span>
          </div>
          <div className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer">
            <FileText className="w-4 h-4" />
            <span className="text-sm">My Feedback</span>
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">3</span>
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
              <span>🏥 Healthcare</span>
            </div>
            <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
              <span>📚 Education</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded cursor-pointer">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Document List */}
        <div className="w-80 bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Government Documents</h2>
            <p className="text-sm text-gray-600">AI-Powered Government Information</p>
            
            <div className="mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-3">
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>All Documents</option>
                <option>Budget</option>
                <option>Water & Sanitation</option>
                <option>Governance</option>
              </select>
            </div>
          </div>

          <div className="p-4">
            <div className="text-sm text-gray-600 mb-3">Currently discussing this document</div>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedDocument?.id === doc.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleDocumentSelect(doc)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">{doc.title}</span>
                    </div>
                    {doc.isCurrentlyDiscussing && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">{doc.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{doc.category}</span>
                    <div className="flex items-center space-x-2">
                      <span>👁 {doc.views.toLocaleString()}</span>
                      <span>📅 {doc.uploadDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Document Assistant</h3>
                  <p className="text-sm text-gray-600">
                    {selectedDocument ? `Discussing: ${selectedDocument.title}` : 'Ask me anything about Kisumu County documents'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Settings className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {selectedDocument && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900 font-medium">{selectedDocument.title}</span>
                  <span className="text-blue-700">• {selectedDocument.category}</span>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender === 'assistant' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-75">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.confidence && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        Confidence: {message.confidence}%
                      </span>
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                  
                  {message.sender === 'assistant' && selectedDocument && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600 mb-2">Sources:</div>
                      <div className="flex items-center space-x-2 text-xs">
                        <FileText className="w-3 h-3" />
                        <span>{selectedDocument.title}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">95% match</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about budget allocations, policies, procedures, or any government document..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>🤖 Powered by AI</span>
            </div>
          </div>
        </div>

        {/* Chat History Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
          </div>
          <div className="p-4 space-y-4">
            {chatSessions.map((session, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                <h4 className="font-medium text-gray-900 text-sm mb-1">{session.title}</h4>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{session.topic}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{session.messages} messages</span>
                  <span>{session.date}</span>
                </div>
              </div>
            ))}
            
            <button className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDocumentPortal;