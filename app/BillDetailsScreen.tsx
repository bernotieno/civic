import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type BillData = {
  id: string;
  name: string;
  fullText: string;
  summary: string;
  status: string;
  dateIntroduced: string;
  sponsor: string;
};

export default function BillDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [activeTab, setActiveTab] = useState<'details' | 'summary' | 'chat'>('details');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm CivicAI. I can help you understand this bill better. What would you like to know?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Sample bill data - in real app, this would come from an API
  const getBillData = (billId: string | string[]): BillData => {
    const bills: { [key: string]: BillData } = {
      '1': {
        id: '1',
        name: 'Healthcare Access Bill 2024',
        status: 'Under Review',
        dateIntroduced: 'March 15, 2024',
        sponsor: 'Hon. Dr. Sarah Wanjiku',
        fullText: `HEALTHCARE ACCESS BILL 2024

ARRANGEMENT OF CLAUSES

PART I—PRELIMINARY
1. Short title and commencement
2. Interpretation
3. Application

PART II—UNIVERSAL HEALTHCARE COVERAGE
4. Right to healthcare
5. Healthcare services covered
6. Funding mechanisms
7. Implementation timeline

PART III—HEALTHCARE INFRASTRUCTURE
8. Public healthcare facilities
9. Private sector participation
10. Medical equipment and supplies
11. Healthcare workforce development

PART IV—QUALITY AND STANDARDS
12. Healthcare quality standards
13. Medical practitioners licensing
14. Patient rights and responsibilities
15. Complaints and redress mechanisms

PART V—ADMINISTRATION
16. National Health Insurance Fund reforms
17. County government responsibilities
18. Inter-governmental coordination
19. Monitoring and evaluation

PART VI—MISCELLANEOUS
20. Regulations
21. Transitional provisions
22. Repeal and savings

DETAILED PROVISIONS:

Section 4: Right to Healthcare
(1) Every Kenyan citizen shall have the right to access quality and affordable healthcare services.
(2) The State shall progressively realize this right through appropriate legislative, policy, and budgetary measures.
(3) No person shall be denied emergency medical treatment on grounds of inability to pay.

Section 5: Healthcare Services Covered
The following healthcare services shall be covered under this Act:
(a) Primary healthcare services including preventive care, maternal and child health, immunization, and treatment of common ailments;
(b) Secondary healthcare services including specialist consultations, diagnostic services, and inpatient care;
(c) Tertiary healthcare services including specialized treatment, surgery, and critical care;
(d) Emergency medical services;
(e) Mental health services;
(f) Palliative and end-of-life care.

Section 6: Funding Mechanisms
(1) Healthcare services under this Act shall be funded through:
(a) Government budgetary allocations;
(b) National Health Insurance Fund contributions;
(c) County government allocations;
(d) Development partner support;
(e) Private sector contributions.

(2) The National Treasury shall ensure adequate funding for the implementation of this Act.`,
        summary: `The Healthcare Access Bill 2024 aims to establish universal healthcare coverage for all Kenyan citizens. 

Key provisions include:
• **Right to Healthcare**: Establishes healthcare as a fundamental right for all citizens, with emergency care guaranteed regardless of ability to pay.

• **Comprehensive Coverage**: Covers primary care (preventive, maternal/child health), secondary care (specialists, diagnostics), tertiary care (specialized treatment), emergency services, mental health, and palliative care.

• **Funding Structure**: Combines government budget allocations, National Health Insurance Fund contributions, county funding, development partner support, and private sector participation.

• **Quality Standards**: Sets healthcare quality standards, licensing requirements for practitioners, and establishes patient rights with complaint mechanisms.

• **Implementation**: Reforms the National Health Insurance Fund, defines county responsibilities, and creates coordination mechanisms between different government levels.

**Timeline**: Progressive implementation with immediate effect for emergency care provisions.

**Impact**: This bill would significantly expand healthcare access, particularly benefiting low-income Kenyans who currently face barriers to quality healthcare services.`
      },
      '2': {
        id: '2',
        name: 'Education Reform Act 2024',
        status: 'Committee Stage',
        dateIntroduced: 'February 28, 2024',
        sponsor: 'Hon. Prof. James Kimani',
        fullText: `EDUCATION REFORM ACT 2024

PART I—PRELIMINARY
1. Short title and commencement
2. Interpretation

PART II—CURRICULUM REFORM
3. Competency-based curriculum
4. Technical and vocational education
5. Digital literacy requirements

PART III—TEACHER DEVELOPMENT
6. Teacher training standards
7. Continuous professional development
8. Teacher compensation framework

PART IV—EDUCATION FINANCING
9. Free basic education
10. Higher education funding
11. Education levy

This Act seeks to reform Kenya's education system to align with global standards and prepare students for the modern economy through enhanced technical skills, digital literacy, and competency-based learning approaches.`,
        summary: `The Education Reform Act 2024 modernizes Kenya's education system with focus on skills and competency development.

Key highlights:
• **Curriculum Overhaul**: Implements competency-based curriculum emphasizing practical skills over theoretical knowledge
• **Technical Education**: Strengthens vocational and technical training programs
• **Digital Integration**: Mandates digital literacy across all education levels
• **Teacher Development**: Establishes new training standards and continuous professional development requirements
• **Funding Reforms**: Restructures education financing including free basic education and higher education support`
      },
      '3': {
        id: '3',
        name: 'Environmental Protection Bill 2024',
        status: 'First Reading',
        dateIntroduced: 'April 10, 2024',
        sponsor: 'Hon. Dr. Grace Mutua',
        fullText: `ENVIRONMENTAL PROTECTION BILL 2024

This comprehensive bill addresses climate change, pollution control, and biodiversity conservation through strengthened environmental regulations, carbon emission targets, and ecosystem restoration programs.`,
        summary: `The Environmental Protection Bill 2024 strengthens Kenya's environmental laws to address climate change and protect natural resources.

Main provisions:
• **Climate Action**: Sets binding carbon emission reduction targets
• **Pollution Control**: Enhanced penalties for environmental violations
• **Biodiversity Protection**: Establishes new conservation areas and protection measures
• **Green Economy**: Incentives for renewable energy and sustainable practices
• **Community Participation**: Empowers local communities in environmental management`
      },
      '4': {
        id: '4',
        name: 'Digital Economy Act 2024',
        status: 'Public Participation',
        dateIntroduced: 'January 20, 2024',
        sponsor: 'Hon. Dr. Peter Ochieng',
        fullText: `DIGITAL ECONOMY ACT 2024

This Act establishes the legal framework for Kenya's digital transformation including data protection, cybersecurity, digital financial services, and e-commerce regulations.`,
        summary: `The Digital Economy Act 2024 creates a comprehensive framework for Kenya's digital transformation.

Core elements:
• **Data Protection**: Strengthens personal data privacy rights and regulations
• **Cybersecurity**: Establishes national cybersecurity framework and incident response
• **Digital Services**: Regulates e-commerce, digital payments, and online platforms
• **Digital Rights**: Protects citizens' digital rights and access to internet services
• **Innovation Support**: Creates regulatory sandboxes for fintech and digital innovation`
      }
    };
    
    return bills[billId as string] || bills['1'];
  };

  const billData = getBillData(id);

  // Enhanced keyboard handling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Auto scroll to bottom when keyboard shows
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Auto-scroll to bottom immediately after adding user message
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText, billData),
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      
      // Auto-scroll to bottom after AI response
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500);
  };

  const generateAIResponse = (question: string, bill: BillData): string => {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('summary') || lowerQuestion.includes('what is')) {
      return `This bill focuses on ${bill.name.toLowerCase()}. Here's a quick overview: ${bill.summary.split('\n')[0]}. Would you like me to explain any specific section?`;
    }
    
    if (lowerQuestion.includes('cost') || lowerQuestion.includes('funding')) {
      return `The funding mechanisms for this bill include government allocations, insurance contributions, and private sector participation. The exact costs will depend on implementation phases. Would you like details about specific funding sources?`;
    }
    
    if (lowerQuestion.includes('timeline') || lowerQuestion.includes('when')) {
      return `This bill was introduced on ${bill.dateIntroduced} and is currently at ${bill.status} stage. Implementation would be progressive, with emergency provisions taking effect immediately upon passage.`;
    }
    
    if (lowerQuestion.includes('impact') || lowerQuestion.includes('affect')) {
      return `This bill would significantly impact Kenyan citizens by improving access to services and establishing new rights and protections. The changes would be implemented gradually to ensure smooth transition.`;
    }
    
    return `That's a great question about the ${bill.name}. Based on the bill's provisions, this legislation aims to improve services and protect citizen rights. Could you be more specific about which aspect you'd like me to explain?`;
  };

  const renderChat = () => (
    <View style={styles.chatContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        >
          {messages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageBubble, 
                message.sender === 'user' ? styles.userMessage : styles.aiMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender === 'user' ? styles.userMessageText : styles.aiMessageText
              ]}>
                {message.text}
              </Text>
            </View>
          ))}
          
          {isTyping && (
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <Text style={styles.typingText}>CivicAI is typing...</Text>
            </View>
          )}
          
          {/* Add some bottom padding when keyboard is visible */}
          <View style={{ height: Platform.OS === 'android' ? keyboardHeight * 0.1 : 0 }} />
        </ScrollView>
        
        <View style={[
          styles.inputContainer,
          Platform.OS === 'android' && keyboardHeight > 0 && {
            marginBottom: Math.max(0, keyboardHeight * 0.05)
          }
        ]}>
          <TextInput
            style={styles.chatInput}
            placeholder="Ask CivicAI about this bill..."
            placeholderTextColor="#718096"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            textAlignVertical="top"
            onFocus={() => {
              // Scroll to bottom when input is focused
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 200);
            }}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Original Bill Text</Text>
            <View style={styles.billTextContainer}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.billText}>{billData.fullText}</Text>
              </ScrollView>
            </View>
          </View>
        );
        
      case 'summary':
        return (
          <View style={styles.contentSection}>
            <View style={styles.summaryHeader}>
              <Text style={styles.sectionTitle}>CivicAI Summary</Text>
              <View style={styles.aiTag}>
                <Text style={styles.aiTagText}>🤖 AI Generated</Text>
              </View>
            </View>
            <View style={styles.summaryContainer}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.summaryText}>{billData.summary}</Text>
              </ScrollView>
            </View>
          </View>
        );
        
      case 'chat':
        return renderChat();
        
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#135D66" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.billInfo}>
          <Text style={styles.billTitle}>{billData.name}</Text>
          <View style={styles.billMeta}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{billData.status}</Text>
            </View>
            <Text style={styles.sponsorText}>Sponsored by {billData.sponsor}</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'details', label: 'Original Bill', icon: '📄' },
          { key: 'summary', label: 'AI Summary', icon: '🤖' },
          { key: 'chat', label: 'Ask CivicAI', icon: '💬' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Submit Feedback Button - Only show when not in chat tab or when keyboard is hidden */}
      {(activeTab !== 'chat' || keyboardHeight === 0) && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.feedbackButton}
            onPress={() => router.push(`/FeedBackScreen?billId=${billData.id}`)}
          >
            <Text style={styles.feedbackButtonText}>Submit Feedback on This Bill</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3FEF7",
  },
  header: {
    backgroundColor: "#135D66",
    paddingHorizontal: 20,
    marginTop: 30,
    paddingVertical: 20,
    paddingBottom: 25,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: "#E3FEF7",
    fontSize: 16,
    fontWeight: "600",
  },
  billInfo: {
    marginBottom: 10,
  },
  billTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E3FEF7",
    marginBottom: 10,
    lineHeight: 30,
  },
  billMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusBadge: {
    backgroundColor: "#E3FEF7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 5,
  },
  statusText: {
    color: "#135D66",
    fontSize: 12,
    fontWeight: "600",
  },
  sponsorText: {
    color: "#E3FEF7",
    fontSize: 14,
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    padding: 5,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#135D66",
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#718096",
    textAlign: "center",
  },
  activeTabText: {
    color: "#E3FEF7",
  },
  content: {
    flex: 1,
    margin: 20,
    marginTop: 15,
  },
  contentSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#135D66",
    marginBottom: 15,
  },
  billTextContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  billText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#2d3748",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  aiTag: {
    backgroundColor: "#135D66",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  aiTagText: {
    color: "#E3FEF7",
    fontSize: 10,
    fontWeight: "600",
  },
  summaryContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 26,
    color: "#2d3748",
  },
  chatContainer: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  messagesContent: {
    padding: 15,
    paddingBottom: 20,
    flexGrow: 1,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: "#135D66",
    alignSelf: "flex-end",
    borderBottomRightRadius: 5,
  },
  aiMessage: {
    backgroundColor: "#f7fafc",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  aiMessageText: {
    color: "#2d3748",
  },
  typingText: {
    color: "#718096",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 10,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    minHeight: 60,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    minHeight: 40,
    fontSize: 14,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#135D66",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  bottomContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 35,
  },
  feedbackButton: {
    backgroundColor: "#135D66",
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#135D66",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  feedbackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});