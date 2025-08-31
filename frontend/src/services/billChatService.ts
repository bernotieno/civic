/**
 * Bill-Specific AI Chat Service
 * Connects to backend API for real AI responses about bills
 */

interface BillChatRequest {
  billId: string;
  question: string;
  billTitle?: string;
  conversationContext?: any[];
  sessionId?: string;
}

interface BillChatResponse {
  id: string;
  response: string;
  timestamp: string;
  sources?: string[];
  confidence?: number;
  followUpQuestions?: string[];
  conversationId?: string;
}

interface ChatSuggestion {
  question: string;
  category: string;
  complexity: string;
  topic_area: string;
}

interface BillChatContext {
  title: string;
  sponsor: string;
  status: string;
  complexity_level: string;
  estimated_reading_time: number;
  key_sections: string[];
  chat_capabilities: {
    can_chat: boolean;
    supports_context: boolean;
    supports_followups: boolean;
    max_questions_per_session: number;
  };
}

class BillChatService {
  private baseUrl = 'http://127.0.0.1:8000/api';
  private sessionId: string | null = null;

  private generateSessionId(): string {
    if (!this.sessionId) {
      this.sessionId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    }
    return this.sessionId;
  }

  async sendMessage(request: BillChatRequest): Promise<BillChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/public/bills/${request.billId}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: request.question,
          conversation_context: request.conversationContext || [],
          session_id: request.sessionId || this.generateSessionId(),
          use_embeddings: true
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        // Handle specific error cases
        if (data.error === 'Chat is not available for this bill') {
          throw new Error('This bill has not been processed for AI chat yet. Please try reading the summary or document instead.');
        }
        throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
        response: data.response,
        timestamp: new Date().toISOString(),
        sources: data.sources || [],
        confidence: data.confidence || 0,
        followUpQuestions: data.follow_up_questions || [],
        conversationId: data.conversation_id
      };
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw new Error('Failed to send message. Please try again.');
    }
  }

  async getSuggestions(billId: string, category?: string, limit?: number): Promise<ChatSuggestion[]> {
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(
        `${this.baseUrl}/public/bills/${billId}/chat/suggestions/?${params}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: category || 'all',
            limit: limit || 6
          })
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get suggestions');
      }

      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting chat suggestions:', error);
      return [];
    }
  }

  async getBillContext(billId: string): Promise<BillChatContext | null> {
    try {
      const response = await fetch(`${this.baseUrl}/public/bills/${billId}/chat/context/`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to get bill context');
      }

      return data.bill_context;
    } catch (error) {
      console.error('Error getting bill context:', error);
      return null;
    }
  }

  async getChatHistory(billId: string, sessionId?: string, limit?: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('session_id', sessionId);
      if (limit) params.append('limit', limit.toString());

      const response = await fetch(
        `${this.baseUrl}/public/bills/${billId}/chat/history/?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        return [];
      }

      return data.conversation_history || [];
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }
}

export const billChatService = new BillChatService();
export type { BillChatRequest, BillChatResponse, ChatSuggestion, BillChatContext };