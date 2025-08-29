/**
 * Bill-Specific AI Chat Service
 * Provides AI responses specific to individual bills
 */

interface BillChatRequest {
  billId: string;
  question: string;
  billTitle?: string;
  billContent?: string;
}

interface BillChatResponse {
  id: string;
  response: string;
  timestamp: string;
}

class BillChatService {
  private billResponses: Record<string, string[]> = {
    // General bill analysis responses
    general: [
      "I can help you understand this bill better. I can explain specific sections, summarize key points, clarify legal language, or discuss potential impacts. What would you like to know?",
      
      "This bill contains several important provisions. I can break down any section you're interested in, explain the implications, or help you understand how it might affect different groups. What specific aspect would you like me to explain?",
      
      "I'm here to help you navigate this legislation. I can explain complex legal terms, summarize sections, discuss the bill's objectives, or help you understand the legislative process. What questions do you have?"
    ],

    // Responses about bill structure and content
    structure: [
      "This bill is structured in several parts:\n\n📋 **Preamble**: Sets out the purpose and justification\n📝 **Main Provisions**: The core legal changes\n⚖️ **Implementation**: How the law will be enforced\n📅 **Commencement**: When it takes effect\n\nWhich section would you like me to explain in detail?",
      
      "The bill follows standard legislative format:\n\n• **Title and Number**: Official identification\n• **Objectives**: What the bill aims to achieve\n• **Definitions**: Key terms used throughout\n• **Substantive Provisions**: The actual legal changes\n• **Penalties**: Consequences for non-compliance\n• **Transitional Provisions**: How to move from old to new law\n\nWhat specific part interests you most?"
    ],

    // Responses about bill impact and implications
    impact: [
      "This bill could have several impacts:\n\n👥 **Citizens**: Changes to rights, obligations, or services\n🏛️ **Government**: New powers, responsibilities, or procedures\n💼 **Businesses**: Compliance requirements or opportunities\n🌍 **Society**: Broader social or economic effects\n\nWhich group's impact would you like me to analyze?",
      
      "The potential effects of this bill include:\n\n✅ **Positive Impacts**: Benefits and improvements\n⚠️ **Challenges**: Potential difficulties or costs\n🔄 **Changes**: What will be different\n📊 **Implementation**: How changes will happen\n\nWhat aspect of the impact concerns you most?"
    ],

    // Responses about legal language and interpretation
    legal: [
      "Legal language can be complex. I can help by:\n\n📖 **Plain English**: Translating legal terms\n🔍 **Context**: Explaining what provisions mean in practice\n📋 **Examples**: Showing how the law would apply\n⚖️ **Precedents**: Relating to existing laws\n\nWhich legal concept would you like me to clarify?",
      
      "I can break down the legal language in this bill:\n\n• **'Shall'** = Mandatory requirement\n• **'May'** = Optional or discretionary\n• **'Notwithstanding'** = Despite other laws\n• **'Subject to'** = With certain conditions\n\nWhich specific clause or term needs explanation?"
    ]
  };

  private categorizeQuestion(question: string): string {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('structure') || lowerQuestion.includes('section') || lowerQuestion.includes('part')) {
      return 'structure';
    }
    if (lowerQuestion.includes('impact') || lowerQuestion.includes('effect') || lowerQuestion.includes('affect')) {
      return 'impact';
    }
    if (lowerQuestion.includes('mean') || lowerQuestion.includes('legal') || lowerQuestion.includes('define')) {
      return 'legal';
    }
    
    return 'general';
  }

  private getRandomResponse(category: string): string {
    const categoryResponses = this.billResponses[category] || this.billResponses.general;
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }

  async sendMessage(request: BillChatRequest): Promise<BillChatResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    const category = this.categorizeQuestion(request.question);
    let response = this.getRandomResponse(category);

    // Add bill-specific context to the response
    if (request.billTitle) {
      response = `Regarding "${request.billTitle}":\n\n${response}`;
    }

    return {
      id: Date.now().toString(),
      response,
      timestamp: new Date().toISOString()
    };
  }
}

export const billChatService = new BillChatService();