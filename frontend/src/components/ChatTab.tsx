import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Lightbulb } from 'lucide-react';
import { ChatHistory, ChatMessage } from '../types';

interface ChatTabProps {
  billId: string;
  initialHistory: ChatHistory | null;
  onHistoryUpdate: (history: ChatHistory) => void;
}

interface ChatSuggestion {
  question: string;
  category: string;
  complexity: string;
  topic_area: string;
}

interface ChatResponse {
  success: boolean;
  response?: string;
  sources?: string[];
  confidence?: number;
  follow_up_questions?: string[];
  conversation_id?: string;
  disclaimer?: string;
  error?: string;
  message?: string;
  suggestions?: string[];
}

const ChatTab: React.FC<ChatTabProps> = ({ billId, initialHistory, onHistoryUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory?.messages || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => {
    // Generate or retrieve session ID for anonymous users
    const stored = localStorage.getItem(`chat_session_${billId}`);
    if (stored) return stored;
    const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(`chat_session_${billId}`, newId);
    return newId;
  });
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat suggestions on component mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/public/bills/${billId}/chat/suggestions/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: 'all',
            limit: 6
          })
        });

        if (response.ok) {
          const responseText = await response.text();
          if (responseText.trim()) {
            try {
              const data = JSON.parse(responseText);
              if (data.success) {
                setSuggestions(data.suggestions || []);
              }
            } catch (parseError) {
              console.error('Failed to parse suggestions response:', parseError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load chat suggestions:', error);
      }
    };

    if (messages.length === 0) {
      loadSuggestions();
    }
  }, [billId, messages.length]);

  const handleSubmit = async (questionText?: string) => {
    const question = (questionText || newQuestion).trim();
    if (!question || isLoading) return;

    setNewQuestion('');
    setIsLoading(true);
    setError(null);
    setShowSuggestions(false);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      question,
      response: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      console.log('Sending chat request:', { question, session_id: sessionId, billId });
      const response = await fetch(`http://127.0.0.1:8000/api/public/bills/${billId}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          session_id: sessionId,
          use_embeddings: true
        })
      });
      console.log('Chat response status:', response.status, response.statusText);

      if (!response.ok) {
        // Handle HTTP error status
        setMessages(prev => prev.slice(0, -1));
        setError(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      const responseText = await response.text();
      if (!responseText.trim()) {
        // Handle empty response
        setMessages(prev => prev.slice(0, -1));
        setError('Received empty response from server');
        return;
      }

      let data: ChatResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // Handle JSON parsing error
        setMessages(prev => prev.slice(0, -1));
        setError('Invalid response format from server');
        console.error('JSON parse error:', parseError, 'Response:', responseText.substring(0, 200));
        return;
      }

      if (data.success && data.response) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          question,
          response: data.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => {
          const updated = [...prev.slice(0, -1), aiMessage];
          onHistoryUpdate({ messages: updated });
          return updated;
        });

        // Set follow-up questions if provided
        if (data.follow_up_questions) {
          setFollowUpQuestions(data.follow_up_questions);
        }
      } else {
        // Handle API error
        setMessages(prev => prev.slice(0, -1));
        setError(data.message || data.error || 'Failed to get response');
      }
    } catch (error) {
      // Handle network error
      setMessages(prev => prev.slice(0, -1));
      setError('Network error. Please check your connection and try again.');
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit();
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion);
  };

  return (
    <div className="flex flex-col h-96">
      <h3 className="text-xl font-semibold mb-4">AI Chat Assistant</h3>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>Ask me anything about this bill!</p>
            <p className="text-sm mt-1">I can help explain complex legal language, summarize sections, or answer specific questions.</p>

            {/* Chat Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">Suggested Questions</span>
                </div>
                <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                  {suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.question)}
                      className="text-left p-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      disabled={isLoading}
                    >
                      {suggestion.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                {/* User Question */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-900">{message.question}</p>
                  </div>
                </div>

                {/* AI Response */}
                {message.response && (
                  <div className="flex items-start gap-3 ml-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-green-50 rounded-lg p-3 shadow-sm">
                      <div
                        className="text-gray-900 whitespace-pre-wrap bill-summary-content"
                        dangerouslySetInnerHTML={{ __html: message.response }}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex items-start gap-3 ml-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 bg-green-50 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-gray-600">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Follow-up Questions */}
      {followUpQuestions.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Follow-up Questions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {followUpQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(question)}
                className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                disabled={isLoading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleFormSubmit} className="flex gap-2">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Ask a question about this bill..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!newQuestion.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatTab;