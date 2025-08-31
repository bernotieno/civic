import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, Lightbulb } from 'lucide-react';
import { ChatHistory, ChatMessage } from '../types';
import { billChatService, type ChatSuggestion } from '../services/billChatService';

interface ChatTabProps {
  billId: string;
  initialHistory: ChatHistory | null;
  onHistoryUpdate: (history: ChatHistory) => void;
}

interface ExtendedChatMessage extends ChatMessage {
  sources?: string[];
  confidence?: number;
  isError?: boolean;
}

const ChatTab: React.FC<ChatTabProps> = ({ billId, initialHistory, onHistoryUpdate }) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>(initialHistory?.messages || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial suggestions and check if chat is available
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const context = await billChatService.getBillContext(billId);
        if (context && !context.chat_capabilities.can_chat) {
          setError('This bill has not been processed for AI chat yet. Please try reading the summary or document instead.');
          return;
        }
        
        const initialSuggestions = await billChatService.getSuggestions(billId, 'basic', 4);
        setSuggestions(initialSuggestions);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
        setError('Chat is not available for this bill at the moment.');
      }
    };
    
    if (messages.length === 0) {
      loadSuggestions();
    }
  }, [billId, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isLoading) return;

    const question = newQuestion.trim();
    setNewQuestion('');
    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ExtendedChatMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      question,
      response: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const data = await billChatService.sendMessage({
        billId,
        question,
        conversationContext: messages.slice(-5), // Last 5 messages for context
        sessionId: conversationId || undefined
      });

      const aiMessage: ExtendedChatMessage = {
        id: data.id,
        question,
        response: data.response,
        timestamp: data.timestamp,
        sources: data.sources,
        confidence: data.confidence
      };

      setMessages(prev => {
        const updated = [...prev.slice(0, -1), aiMessage];
        onHistoryUpdate({ messages: updated });
        return updated;
      });

      // Update conversation ID and suggestions
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      if (data.followUpQuestions && data.followUpQuestions.length > 0) {
        const followUpSuggestions = data.followUpQuestions.map(q => ({
          question: q,
          category: 'followup',
          complexity: 'basic',
          topic_area: 'contextual'
        }));
        setSuggestions(followUpSuggestions);
      }
    } catch (error) {
      // Handle error - remove user message and show error message
      setMessages(prev => prev.slice(0, -1));
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      
      // Add error message to chat
      const errorChatMessage: ExtendedChatMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        question,
        response: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNewQuestion(suggestion);
  };

  return (
    <div className="flex flex-col h-96">
      <h3 className="text-xl font-semibold mb-4">AI Chat Assistant</h3>
      
      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {error ? (
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-orange-400 mb-2" />
                <p className="text-orange-600 font-medium">Chat Not Available</p>
                <p className="text-sm mt-1 text-gray-600">{error}</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>You can still:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Read the bill summary in the "AI Summary" tab</li>
                    <li>• Download the full bill document</li>
                    <li>• Submit feedback about this bill</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <Bot className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p>Ask me anything about this bill!</p>
                <p className="text-sm mt-1">I can help explain complex legal language, summarize sections, or answer specific questions.</p>
                
                {/* Initial Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-gray-600">Try asking:</span>
                    </div>
                    <div className="space-y-2">
                      {suggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion.question)}
                          className="block w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          {suggestion.question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.isError ? 'bg-red-500' : 'bg-green-500'
                    }`}>
                      {message.isError ? (
                        <AlertCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 rounded-lg p-3 shadow-sm ${
                      message.isError ? 'bg-red-50 border border-red-200' : 'bg-green-50'
                    }`}>
                      <p className={`whitespace-pre-wrap ${
                        message.isError ? 'text-red-800' : 'text-gray-900'
                      }`}>{message.response}</p>
                      
                      {/* Sources */}
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <p className="text-xs text-gray-600 mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, index) => (
                              <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Confidence Score */}
                      {message.confidence && message.confidence > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <p className="text-xs text-gray-600">
                            Confidence: {Math.round(message.confidence * 100)}%
                          </p>
                        </div>
                      )}
                      
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
            
            {/* Follow-up Suggestions */}
            {suggestions.length > 0 && messages.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Follow-up questions:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.question)}
                      className="text-xs bg-white text-blue-700 px-2 py-1 rounded border border-blue-300 hover:bg-blue-100 transition-colors"
                    >
                      {suggestion.question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      {!error && (
        <form onSubmit={handleSubmit} className="flex gap-2">
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
      )}
    </div>
  );
};

export default ChatTab;