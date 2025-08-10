/**
 * AI Document Chat Widget
 * Intelligent conversational interface for civic education
 * Works across both citizen and admin dashboards
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Minimize2, 
  Maximize2, 
  X, 
  FileText, 
  Brain,
  Sparkles,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Share2,
  BookOpen,
  Zap
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Types for chat functionality
interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: DocumentSource[];
  suggestions?: string[];
  confidence?: number;
  processing?: boolean;
}

interface DocumentSource {
  id: string;
  title: string;
  category: string;
  department: string;
  excerpt: string;
  relevance_score: number;
  page?: number;
}

interface ChatSession {
  id: string;
  title: string;
  county: string;
  document_context?: string;
  created_at: Date;
  message_count: number;
}

interface DocumentChatWidgetProps {
  isOpen?: boolean;
  onToggle?: () => void;
  initialDocument?: string;
  mode?: 'citizen' | 'admin';
  position?: 'bottom-right' | 'sidebar' | 'fullscreen';
}

const DocumentChatWidget: React.FC<DocumentChatWidgetProps> = ({
  isOpen = false,
  onToggle,
  initialDocument,
  mode = 'citizen',
  position = 'bottom-right'
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<DocumentSource[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(initialDocument || null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session
  useEffect(() => {
    if (isOpen && !currentSession) {
      initializeChatSession();
    }
  }, [isOpen]);

  // Load available documents
  useEffect(() => {
    if (isOpen) {
      loadAvailableDocuments();
    }
  }, [isOpen]);

  const initializeChatSession = async () => {
    try {
      const response = await fetch('/api/documents/chat/start/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          county_id: user?.accessible_counties?.[0]?.id,
          document_context: selectedDocument
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentSession({
          id: data.session_id,
          title: 'Document Q&A Session',
          county: user?.county_name || 'Kenya',
          created_at: new Date(),
          message_count: 0
        });

        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'assistant',
          content: getWelcomeMessage(),
          timestamp: new Date(),
          suggestions: getInitialSuggestions()
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
    }
  };

  const loadAvailableDocuments = async () => {
    try {
      const response = await fetch('/api/documents/public/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAvailableDocuments(data.results.slice(0, 10)); // Top 10 documents
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const getWelcomeMessage = () => {
    if (mode === 'admin') {
      return `👋 Hello! I'm your AI assistant for ${user?.county_name} County documents. I can help you understand citizen questions, generate responses, and analyze document engagement. What would you like to know?`;
    }
    
    return `👋 Welcome! I'm your AI assistant for understanding ${user?.county_name} County government documents. I can help you learn about budgets, policies, procedures, and more. What would you like to know?`;
  };

  const getInitialSuggestions = () => {
    if (mode === 'admin') {
      return [
        "What are citizens asking about most?",
        "Help me respond to budget questions",
        "Show me document engagement analytics",
        "Generate FAQ from recent questions"
      ];
    }

    return [
      "How much budget is allocated for road construction?",
      "What are the water project timelines?", 
      "How can I participate in budget planning?",
      "What services are available in my ward?"
    ];
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Add processing message
    const processingMessage: ChatMessage = {
      id: 'processing',
      type: 'assistant',
      content: 'Analyzing your question and searching relevant documents...',
      timestamp: new Date(),
      processing: true
    };
    setMessages(prev => [...prev, processingMessage]);

    try {
      const response = await fetch('/api/documents/chat/question/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          question: userMessage.content,
          session_id: currentSession?.id,
          county_id: user?.accessible_counties?.[0]?.id,
          document_context: selectedDocument
        })
      });

      const data = await response.json();
      
      // Remove processing message
      setMessages(prev => prev.filter(msg => msg.id !== 'processing'));

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.message,
          timestamp: new Date(),
          sources: data.sources || [],
          suggestions: data.suggestions || [],
          confidence: data.confidence_score
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove processing message and add error message
      setMessages(prev => prev.filter(msg => msg.id !== 'processing'));
      
      const errorMessage: ChatMessage = {
        id: 'error',
        type: 'system',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could add toast notification here
  };

  const provideFeedback = async (messageId: string, helpful: boolean) => {
    try {
      await fetch('/api/documents/chat/feedback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          message_id: messageId,
          rating: helpful ? 'helpful' : 'not_helpful'
        })
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50`}
        aria-label="Open AI Document Assistant"
      >
        <div className="relative">
          <Brain className="h-6 w-6" />
          <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
        </div>
      </button>
    );
  }

  const containerClasses = position === 'fullscreen' 
    ? 'fixed inset-0 z-50 bg-white'
    : position === 'sidebar'
    ? 'h-full w-full bg-white border-l border-gray-200'
    : `fixed ${position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'} w-96 h-[32rem] bg-white rounded-lg shadow-2xl border border-gray-200 z-50`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Document Assistant</h3>
            <p className="text-xs opacity-90">
              {mode === 'admin' ? 'Admin Support' : 'Civic Education'} • {user?.county_name}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {position !== 'sidebar' && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white/20 rounded"
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
          )}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-white/20 rounded"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Quick Document Selector */}
          {availableDocuments.length > 0 && (
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Quick Document Access</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {availableDocuments.slice(0, 3).map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc.id)}
                    className={`px-2 py-1 text-xs rounded-md transition-colors ${
                      selectedDocument === doc.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {doc.title.slice(0, 25)}...
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 140px)' }}>
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  {/* Message Bubble */}
                  <div className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : message.type === 'system'
                      ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                      : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    {message.processing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span className="text-sm">{message.content}</span>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    )}

                    {/* Confidence Score */}
                    {message.confidence && (
                      <div className="mt-2 flex items-center space-x-1">
                        <Zap className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          Confidence: {Math.round(message.confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-500">Sources:</p>
                      {message.sources.map((source, index) => (
                        <div key={index} className="text-xs bg-blue-50 border border-blue-200 rounded p-2">
                          <div className="font-medium text-blue-900">{source.title}</div>
                          <div className="text-blue-700">{source.department} • {source.category}</div>
                          <div className="text-blue-600 mt-1">{source.excerpt}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs font-medium text-gray-500">Related questions:</p>
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs bg-white border border-gray-200 rounded-full px-2 py-1 hover:bg-gray-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Actions */}
                  {message.type === 'assistant' && !message.processing && (
                    <div className="mt-2 flex items-center space-x-2">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        aria-label="Copy message"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => provideFeedback(message.id, true)}
                        className="p-1 text-gray-400 hover:text-green-600 rounded"
                        aria-label="Helpful"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => provideFeedback(message.id, false)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        aria-label="Not helpful"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className={`mt-1 text-xs text-gray-400 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about budget allocations, policies, procedures, or any government document..."
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Status */}
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>
                {isLoading ? 'AI is thinking...' : `${messages.filter(m => m.type !== 'system').length} messages`}
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Real-time responses</span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DocumentChatWidget;