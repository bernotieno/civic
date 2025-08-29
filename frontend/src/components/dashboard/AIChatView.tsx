/**
 * AI Chat View Component for Citizen Dashboard
 * Full-screen AI chat interface for comprehensive civic assistance
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ArrowLeft, RefreshCw, Download, Copy, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  type?: 'text' | 'suggestion' | 'error' | 'info';
  metadata?: {
    confidence?: number;
    sources?: string[];
    category?: string;
  };
}

interface AIChatViewProps {
  onBack: () => void;
}

const AIChatView: React.FC<AIChatViewProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with comprehensive welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: `Welcome to your AI Civic Assistant, ${user?.name || 'Citizen'}! 🏛️

I'm here to help you navigate Kenya's civic processes and make your voice heard effectively. Here's what I can assist you with:

**📋 Feedback & Submissions**
• Crafting effective feedback on bills and projects
• Understanding submission requirements and deadlines
• Tracking your feedback status and responses

**📖 Bills & Legislation**
• Explaining complex legal language in simple terms
• Summarizing key points of proposed bills
• Identifying how legislation might affect you

**🏛️ Civic Processes**
• Understanding parliamentary procedures
• Learning about public participation opportunities
• Navigating government departments and services

**📊 Your Engagement**
• Reviewing your submission history
• Getting personalized recommendations
• Understanding response timelines

**🤝 Community Impact**
• Learning about local government initiatives
• Understanding how citizen feedback creates change
• Connecting with broader civic movements

Feel free to ask me anything! I'm trained on Kenya's civic processes and I'm here to empower your participation in democracy.`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'info'
      };
      setMessages([welcomeMessage]);
    }
  }, [user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Use mock service for now - will be replaced with actual API later
      const { aiChatService } = await import('../../services/aiChatService');
      
      const data = await aiChatService.sendMessage({
        message: userMessage.content,
        context: 'citizen_dashboard_full',
        user_id: user?.id?.toString(),
        conversation_history: messages.slice(-5) // Send last 5 messages for context
      });

      const aiMessage: ChatMessage = {
        id: data.id,
        content: data.response,
        sender: 'ai',
        timestamp: data.timestamp,
        type: data.type || 'text',
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'I\'m experiencing technical difficulties right now. Please try again in a moment, or contact support if the issue persists.',
        sender: 'ai',
        timestamp: new Date().toISOString(),
        type: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      setMessages([]);
      // Re-initialize with welcome message
      setTimeout(() => {
        const welcomeMessage: ChatMessage = {
          id: 'welcome-new',
          content: `Chat cleared! How can I help you today with your civic engagement?`,
          sender: 'ai',
          timestamp: new Date().toISOString(),
          type: 'info'
        };
        setMessages([welcomeMessage]);
      }, 100);
    }
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleExportChat = () => {
    const chatHistory = messages.map(msg => ({
      timestamp: new Date(msg.timestamp).toLocaleString(),
      sender: msg.sender === 'user' ? 'You' : 'AI Assistant',
      message: msg.content
    }));

    const exportData = {
      exported_at: new Date().toISOString(),
      user: user?.name || 'Anonymous',
      chat_history: chatHistory
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civic-ai-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [quickSuggestions, setQuickSuggestions] = useState([
    {
      category: "Getting Started",
      questions: [
        "How do I submit effective feedback on a bill?",
        "What's the difference between bills and projects?",
        "How can I track my submissions?"
      ]
    },
    {
      category: "Current Opportunities",
      questions: [
        "What bills are open for public participation?",
        "Are there any urgent civic issues I should know about?",
        "How can I get involved in my local community?"
      ]
    },
    {
      category: "Understanding Process",
      questions: [
        "How does the parliamentary process work?",
        "What happens after I submit feedback?",
        "How long does it take to get a government response?"
      ]
    }
  ]);

  // Load dynamic suggestions from service
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const { aiChatService } = await import('../../services/aiChatService');
        const suggestions = aiChatService.getQuickSuggestions();
        
        // Group suggestions into categories
        const categorizedSuggestions = [
          {
            category: "Getting Started",
            questions: suggestions.slice(0, 3)
          },
          {
            category: "Current Opportunities", 
            questions: suggestions.slice(3, 6)
          },
          {
            category: "Understanding Process",
            questions: suggestions.slice(6, 9)
          }
        ];
        
        setQuickSuggestions(categorizedSuggestions);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };
    
    loadSuggestions();
  }, []);

  const handleQuickSuggestion = (question: string) => {
    setNewMessage(question);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">AI Civic Assistant</h1>
              <p className="text-sm text-gray-500">Your personal guide to civic engagement</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportChat}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Export chat history"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleClearChat}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear chat"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Chat Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-600">Ask me anything about civic engagement, bills, or government processes.</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-4 ${
                      message.sender === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-blue-500' 
                        : message.type === 'error' 
                          ? 'bg-red-500' 
                          : message.type === 'info'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div className={`flex-1 max-w-[80%] ${
                      message.sender === 'user' ? 'text-right' : ''
                    }`}>
                      <div className={`rounded-xl p-4 ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : message.type === 'error'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : message.type === 'info'
                              ? 'bg-green-50 text-green-800 border border-green-200'
                              : 'bg-gray-50 text-gray-900 border border-gray-200'
                      }`}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                        
                        {/* Metadata */}
                        {message.metadata && (
                          <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
                            {message.metadata.confidence && (
                              <div className="mb-2">
                                <span className="font-medium">Confidence: </span>
                                <span>{Math.round(message.metadata.confidence * 100)}%</span>
                              </div>
                            )}
                            {message.metadata.sources && message.metadata.sources.length > 0 && (
                              <div>
                                <span className="font-medium">Sources: </span>
                                <span>{message.metadata.sources.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(message.timestamp).toLocaleString()}
                        </p>
                        {message.sender === 'ai' && (
                          <button
                            onClick={() => handleCopyMessage(message.id, message.content)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Copy message"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span className="text-gray-600">AI is analyzing your question...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Form */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask me anything about civic engagement, bills, or government processes..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Quick Suggestions Sidebar */}
        {messages.length <= 1 && (
          <div className="w-80 border-l border-gray-200 p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Questions</h3>
            <div className="space-y-6">
              {quickSuggestions.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{category.category}</h4>
                  <div className="space-y-2">
                    {category.questions.map((question, questionIndex) => (
                      <button
                        key={questionIndex}
                        onClick={() => handleQuickSuggestion(question)}
                        className="w-full text-left p-3 text-sm bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatView;