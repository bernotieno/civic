import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { ChatHistory, ChatMessage } from '../types';

interface ChatTabProps {
  billId: string;
  initialHistory: ChatHistory | null;
  onHistoryUpdate: (history: ChatHistory) => void;
}

const ChatTab: React.FC<ChatTabProps> = ({ billId, initialHistory, onHistoryUpdate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialHistory?.messages || []);
  const [newQuestion, setNewQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || isLoading) return;

    const question = newQuestion.trim();
    setNewQuestion('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      question,
      response: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Use bill-specific chat service
      const { billChatService } = await import('../services/billChatService');
      
      const data = await billChatService.sendMessage({
        billId,
        question,
        billTitle: 'Current Bill' // This would come from props in real implementation
      });

      const aiMessage: ChatMessage = {
        id: data.id,
        question,
        response: data.response,
        timestamp: data.timestamp
      };

      setMessages(prev => {
        const updated = [...prev.slice(0, -1), aiMessage];
        onHistoryUpdate({ messages: updated });
        return updated;
      });
    } catch (error) {
      // Handle error - remove user message and show error
      setMessages(prev => prev.slice(0, -1));
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96">
      <h3 className="text-xl font-semibold mb-4">AI Chat Assistant</h3>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="mx-auto h-12 w-12 text-gray-400 mb-2" />
            <p>Ask me anything about this bill!</p>
            <p className="text-sm mt-1">I can help explain complex legal language, summarize sections, or answer specific questions.</p>
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
                      <p className="text-gray-900 whitespace-pre-wrap">{message.response}</p>
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

      {/* Input Form */}
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
    </div>
  );
};

export default ChatTab;