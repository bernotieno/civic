/**
 * AI Chat Service - Mock Implementation
 * Simulates AI responses for civic engagement questions
 */

interface ChatRequest {
  message: string;
  context?: string;
  user_id?: string;
  conversation_history?: any[];
}

interface ChatResponse {
  id: string;
  response: string;
  timestamp: string;
  type?: 'text' | 'suggestion' | 'error' | 'info';
  metadata?: {
    confidence?: number;
    sources?: string[];
    category?: string;
  };
}

class AIChatService {
  private responses: Record<string, string[]> = {
    // Feedback and Submission Help
    feedback: [
      "To submit effective feedback on bills and projects:\n\n1. **Be Specific**: Clearly state which section or aspect you're addressing\n2. **Provide Evidence**: Support your points with facts, examples, or personal experiences\n3. **Be Constructive**: Suggest alternatives or improvements, not just criticisms\n4. **Stay Relevant**: Focus on the bill's content and its potential impact\n5. **Use Clear Language**: Avoid jargon and write in simple, understandable terms\n\nWould you like help with a specific bill or project?",
      
      "Here are key tips for impactful civic feedback:\n\n• **Research First**: Read the full bill/project document\n• **Identify Impact**: Explain how it affects you or your community\n• **Be Respectful**: Maintain a professional, respectful tone\n• **Include Solutions**: Don't just point out problems - suggest fixes\n• **Follow Deadlines**: Submit before participation deadlines\n\nI can help you draft feedback for any specific legislation!"
    ],

    bills: [
      "Currently, several bills are open for public participation:\n\n📋 **Active Bills:**\n• Healthcare Amendment Bill 2024 - Deadline: March 30th\n• Education Funding Bill 2024 - Deadline: April 15th\n• Infrastructure Development Bill 2024 - Deadline: April 20th\n\n🔍 **How to Participate:**\n1. Visit the 'Parliamentary Bills' section\n2. Read the full bill document\n3. Submit your feedback before the deadline\n4. Track your submission status\n\nWhich bill would you like to learn more about?",
      
      "Bills vs Projects - Here's the difference:\n\n📜 **Bills (Proposed Laws):**\n• Require parliamentary approval\n• Become law when passed\n• Have formal public participation periods\n• Go through multiple readings\n\n🏗️ **Projects (Government Initiatives):**\n• Implementation of existing policies\n• Don't require new laws\n• May have community consultation\n• Focus on service delivery\n\nBoth are important for civic engagement!"
    ],

    process: [
      "The parliamentary process in Kenya works like this:\n\n📋 **Bill Journey:**\n1. **First Reading**: Bill introduced and published\n2. **Public Participation**: Citizens provide feedback (that's you!)\n3. **Committee Review**: Parliamentary committee examines bill + public input\n4. **Second Reading**: Parliament debates the bill\n5. **Committee of the Whole**: Detailed clause-by-clause review\n6. **Third Reading**: Final parliamentary vote\n7. **Presidential Assent**: President signs into law\n\n⏱️ **Your Impact**: Public feedback influences committee recommendations and parliamentary debates!",
      
      "After you submit feedback:\n\n✅ **Immediate**: You receive a tracking ID\n📧 **Within 48 hours**: Acknowledgment from relevant department\n📊 **Within 1 week**: Your feedback is categorized and forwarded to the appropriate parliamentary committee\n🏛️ **Committee Stage**: Your input is considered during committee deliberations\n📝 **Final Report**: Committee may reference public feedback in their recommendations\n\nYour voice matters in shaping Kenya's laws!"
    ],

    tracking: [
      "You can track your submissions in several ways:\n\n🔍 **Tracking Methods:**\n• Use your tracking ID in the 'Track Feedback' section\n• Check 'My Feedback' for all your submissions\n• Enable notifications for status updates\n• View response timeline in your dashboard\n\n📊 **Status Meanings:**\n• **Submitted**: Received and logged\n• **Under Review**: Being processed by relevant department\n• **Forwarded**: Sent to parliamentary committee\n• **Acknowledged**: Official response provided\n• **Resolved**: Action taken or bill passed/rejected\n\nNeed help finding a specific submission?"
    ],

    general: [
      "I'm here to help you engage effectively with Kenya's democratic processes! I can assist with:\n\n🏛️ **Parliamentary Engagement:**\n• Understanding bills and their implications\n• Crafting effective public participation submissions\n• Tracking your feedback and responses\n\n📚 **Civic Education:**\n• How parliament works\n• Your rights as a citizen\n• Government accountability mechanisms\n\n💡 **Practical Help:**\n• Writing tips for feedback\n• Deadline reminders\n• Status explanations\n\nWhat specific aspect of civic engagement would you like to explore?",
      
      "Great question! Here are some ways to stay engaged:\n\n📱 **Stay Informed:**\n• Follow parliamentary calendars\n• Subscribe to bill notifications\n• Join community civic groups\n\n🗣️ **Make Your Voice Heard:**\n• Participate in public forums\n• Submit feedback on legislation\n• Contact your representatives\n\n🤝 **Community Action:**\n• Organize local discussions\n• Share information with neighbors\n• Collaborate on community issues\n\nDemocracy works best when citizens are actively involved!"
    ]
  };

  private getRandomResponse(category: string): string {
    const categoryResponses = this.responses[category] || this.responses.general;
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }

  private categorizeMessage(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('feedback') || lowerMessage.includes('submit') || lowerMessage.includes('effective')) {
      return 'feedback';
    }
    if (lowerMessage.includes('bill') || lowerMessage.includes('legislation') || lowerMessage.includes('law')) {
      return 'bills';
    }
    if (lowerMessage.includes('process') || lowerMessage.includes('parliament') || lowerMessage.includes('how does')) {
      return 'process';
    }
    if (lowerMessage.includes('track') || lowerMessage.includes('status') || lowerMessage.includes('response')) {
      return 'tracking';
    }
    
    return 'general';
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const category = this.categorizeMessage(request.message);
    const response = this.getRandomResponse(category);

    return {
      id: Date.now().toString(),
      response,
      timestamp: new Date().toISOString(),
      type: 'text',
      metadata: {
        confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
        category,
        sources: ['Kenya Constitution', 'Parliamentary Standing Orders', 'Public Participation Guidelines']
      }
    };
  }

  // Quick suggestions based on common civic questions
  getQuickSuggestions(): string[] {
    return [
      "How do I submit effective feedback on a bill?",
      "What bills are currently open for public participation?",
      "How can I track my feedback status?",
      "What's the difference between bills and projects?",
      "How long does it take to get a response?",
      "How does the parliamentary process work?",
      "What happens after I submit feedback?",
      "How can I stay informed about new bills?",
      "Can I edit my feedback after submission?",
      "How do I know if my feedback was considered?"
    ];
  }
}

export const aiChatService = new AIChatService();