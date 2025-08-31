import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as DocumentPicker from 'expo-document-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FeedbackType = 'general' | 'support' | 'clause_specific';

type ClauseVote = {
  clauseId: string;
  vote: 'support' | 'oppose' | 'neutral';
  comment?: string;
};

type AttachedFile = {
  uri: string;
  name: string;
  type: string;
  size: number;
};

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedType, setSelectedType] = useState<FeedbackType>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clauseVotes, setClauseVotes] = useState<ClauseVote[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Sample bill clauses - in a real app, these would come from an API
  const billClauses = [
    {
      id: '1',
      title: 'Universal Coverage',
      content: 'All Kenyan citizens shall have access to basic healthcare services regardless of their economic status.',
    },
    {
      id: '2', 
      title: 'Funding Mechanism',
      content: 'Healthcare funding shall be derived from a combination of government allocation, insurance premiums, and international partnerships.',
    },
    {
      id: '3',
      title: 'Service Standards',
      content: 'Healthcare facilities must maintain minimum standards as defined by the Ministry of Health regulations.',
    },
    {
      id: '4',
      title: 'Implementation Timeline',
      content: 'This Act shall be implemented in phases over a period of 5 years starting from the date of assent.',
    }
  ];

  const feedbackTypes = [
    { id: 'general' as FeedbackType, label: 'General Feedback', icon: '💭', description: 'Overall thoughts on the bill' },
    { id: 'support' as FeedbackType, label: 'Support Bill', icon: '👍', description: 'Express support for the entire bill' },
    { id: 'clause_specific' as FeedbackType, label: 'Vote on Clauses', icon: '📋', description: 'Support or oppose specific clauses' },
  ];

  const handleClauseVote = (clauseId: string, vote: 'support' | 'oppose' | 'neutral', comment?: string) => {
    setClauseVotes(prev => {
      const existing = prev.find(v => v.clauseId === clauseId);
      if (existing) {
        return prev.map(v => 
          v.clauseId === clauseId 
            ? { ...v, vote, comment: comment || v.comment }
            : v
        );
      } else {
        return [...prev, { clauseId, vote, comment }];
      }
    });
  };

  const getClauseVote = (clauseId: string): ClauseVote | undefined => {
    return clauseVotes.find(v => v.clauseId === clauseId);
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['*/*'], // Accept all file types
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles: AttachedFile[] = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name || 'Unknown file',
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));

        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (selectedType === 'general' && !feedbackText.trim() && attachedFiles.length === 0) {
      Alert.alert('Error', 'Please enter your feedback or attach a file before submitting.');
      return;
    }

    if (selectedType === 'clause_specific' && clauseVotes.length === 0) {
      Alert.alert('Error', 'Please vote on at least one clause before submitting.');
      return;
    }

    if (selectedType === 'support' && !feedbackText.trim()) {
      Alert.alert('Error', 'Please explain why you support this bill.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Success!', 
        `Your ${selectedType === 'clause_specific' ? 'clause votes' : 'feedback'} has been submitted ${isAnonymous ? 'anonymously' : 'with your details'}.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    }, 2000);
  };

  const getBillName = (userId: string | string[]) => {
    const bills = {
      '1': 'Healthcare Access Bill 2024',
      '2': 'Education Reform Act 2024',
      '3': 'Environmental Protection Bill 2024',
      '4': 'Digital Economy Act 2024',
    };
    return bills[userId as keyof typeof bills] || 'Legislative Bill';
  };

  const renderClauseVoting = () => (
    <View style={styles.clausesContainer}>
      <Text style={styles.sectionTitle}>Bill Clauses</Text>
      <Text style={styles.clausesSubtitle}>
        Vote on individual clauses. You can support some while opposing others.
      </Text>
      
      {billClauses.map((clause) => {
        const currentVote = getClauseVote(clause.id);
        
        return (
          <View key={clause.id} style={styles.clauseCard}>
            <Text style={styles.clauseTitle}>{clause.title}</Text>
            <Text style={styles.clauseContent}>{clause.content}</Text>
            
            <View style={styles.voteButtons}>
              {(['support', 'neutral', 'oppose'] as const).map((vote) => (
                <TouchableOpacity
                  key={vote}
                  style={[
                    styles.voteButton,
                    currentVote?.vote === vote && styles.voteButtonSelected,
                    vote === 'support' && styles.supportButton,
                    vote === 'oppose' && styles.opposeButton,
                    vote === 'neutral' && styles.neutralButton,
                  ]}
                  onPress={() => handleClauseVote(clause.id, vote)}
                >
                  <Text style={[
                    styles.voteButtonText,
                    currentVote?.vote === vote && styles.voteButtonTextSelected
                  ]}>
                    {vote === 'support' ? '👍 Support' : 
                     vote === 'oppose' ? '👎 Oppose' : 
                     '😐 Neutral'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {currentVote && (
              <TextInput
                style={styles.clauseCommentInput}
                placeholder={`Why do you ${currentVote.vote} this clause? (optional)`}
                placeholderTextColor="#718096"
                value={currentVote.comment || ''}
                onChangeText={(text) => handleClauseVote(clause.id, currentVote.vote, text)}
                multiline
              />
            )}
          </View>
        );
      })}
    </View>
  );

  const renderFileUpload = () => (
    <View style={styles.fileUploadContainer}>
      <View style={styles.fileUploadHeader}>
        <Text style={styles.sectionTitle}>Attachments (Optional)</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleFileUpload}>
          <Text style={styles.uploadButtonText}>📎 Attach Files</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.fileUploadDescription}>
        Upload documents, PDFs, images, or other files to support your feedback.
        Accepted formats: PDF, DOC, DOCX, TXT, JPG, PNG, etc.
      </Text>

      {attachedFiles.length > 0 && (
        <View style={styles.attachedFiles}>
          {attachedFiles.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => removeFile(index)}
              >
                <Text style={styles.removeFileText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3FEF7" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Submit Feedback</Text>
            <Text style={styles.billName}>{getBillName(id)}</Text>
          </View>

          {/* Anonymous Checkbox */}
          <View style={styles.anonymousContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
                {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxLabel}>Submit anonymously</Text>
                <Text style={styles.checkboxSubtext}>
                  {isAnonymous 
                    ? 'Your identity will be hidden from this feedback'
                    : 'Your feedback will include your user details'
                  }
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Feedback Type Selection */}
          <View style={styles.typeContainer}>
            <Text style={styles.sectionTitle}>Feedback Type</Text>
            <View style={styles.typeList}>
              {feedbackTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    selectedType === type.id && styles.typeCardSelected
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <View style={styles.typeCardContent}>
                    <Text style={styles.typeIcon}>{type.icon}</Text>
                    <View style={styles.typeTextContainer}>
                      <Text style={[
                        styles.typeLabel,
                        selectedType === type.id && styles.typeLabelSelected
                      ]}>
                        {type.label}
                      </Text>
                      <Text style={styles.typeDescription}>{type.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Clause-specific voting */}
          {selectedType === 'clause_specific' && renderClauseVoting()}

          {/* Feedback Input (for general and support) */}
          {(selectedType === 'general' || selectedType === 'support') && (
            <View style={styles.inputContainer}>
              <Text style={styles.sectionTitle}>
                {selectedType === 'support' ? 'Why do you support this bill?' : 'Your Feedback'}
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={6}
                placeholder={
                  selectedType === 'support' 
                    ? "Explain why you support this bill and its potential benefits..."
                    : "Share your thoughts on this bill. Your input helps shape Kenya's legislative process..."
                }
                placeholderTextColor="#718096"
                value={feedbackText}
                onChangeText={setFeedbackText}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {feedbackText.length}/2000 characters
              </Text>
            </View>
          )}

          {/* File Upload Section */}
          {renderFileUpload()}

          {/* User Info Preview (when not anonymous) */}
          {!isAnonymous && (
            <View style={styles.userPreview}>
              <Text style={styles.previewTitle}>Submitting as:</Text>
              <View style={styles.userInfo}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>U</Text>
                </View>
                <View>
                  <Text style={styles.userName}>Your Name</Text>
                  <Text style={styles.userEmail}>your.email@example.com</Text>
                </View>
              </View>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 
               selectedType === 'clause_specific' ? 'Submit Votes' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Feedback Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be respectful and constructive in your feedback{'\n'}
              • For clause voting: Consider each clause independently{'\n'}
              • Provide clear reasoning for your position{'\n'}
              • Use file attachments for detailed proposals or supporting documents{'\n'}
              • Focus on specific aspects of the legislation
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3FEF7",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: "#135D66",
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginTop: 40,
    paddingTop: 20,
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    color: "#E3FEF7",
    fontSize: 26,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#E3FEF7",
    marginBottom: 8,
  },
  billName: {
    fontSize: 16,
    color: "#E3FEF7",
    opacity: 0.9,
  },
  anonymousContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    padding: 20,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#135D66",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#135D66",
  },
  checkmark: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#135D66",
    marginBottom: 4,
  },
  checkboxSubtext: {
    fontSize: 14,
    color: "#718096",
    lineHeight: 20,
  },
  typeContainer: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#135D66",
    marginBottom: 15,
  },
  typeList: {
    gap: 15,
  },
  typeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  typeCardSelected: {
    borderColor: "#135D66",
    backgroundColor: "#E3FEF7",
  },
  typeCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 4,
  },
  typeLabelSelected: {
    color: "#135D66",
  },
  typeDescription: {
    fontSize: 14,
    color: "#718096",
    lineHeight: 18,
  },
  clausesContainer: {
    margin: 20,
    marginTop: 0,
  },
  clausesSubtitle: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 20,
    lineHeight: 20,
  },
  clauseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  clauseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#135D66",
    marginBottom: 8,
  },
  clauseContent: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
    marginBottom: 15,
  },
  voteButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  voteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: "center",
  },
  supportButton: {
    borderColor: "#48BB78",
    backgroundColor: "#F0FFF4",
  },
  opposeButton: {
    borderColor: "#F56565",
    backgroundColor: "#FFF5F5",
  },
  neutralButton: {
    borderColor: "#A0AEC0",
    backgroundColor: "#F7FAFC",
  },
  voteButtonSelected: {
    borderWidth: 2,
  },
  voteButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4a5568",
  },
  voteButtonTextSelected: {
    color: "#2D3748",
  },
  clauseCommentInput: {
    backgroundColor: "#F7FAFC",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    textAlignVertical: "top",
    minHeight: 60,
  },
  inputContainer: {
    margin: 20,
    marginTop: 0,
  },
  textInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  characterCount: {
    textAlign: "right",
    marginTop: 8,
    fontSize: 12,
    color: "#718096",
  },
  fileUploadContainer: {
    margin: 20,
    marginTop: 0,
  },
  fileUploadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: "#135D66",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  fileUploadDescription: {
    fontSize: 12,
    color: "#718096",
    lineHeight: 18,
    marginBottom: 15,
  },
  attachedFiles: {
    gap: 10,
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    shadowColor: "#135D66",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: "#718096",
  },
  removeFileButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FED7D7",
    justifyContent: "center",
    alignItems: "center",
  },
  removeFileText: {
    color: "#E53E3E",
    fontSize: 12,
    fontWeight: "700",
  },
  userPreview: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#135D66",
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#135D66",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  userAvatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#718096",
  },
  submitButton: {
    backgroundColor: "#135D66",
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#135D66",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  guidelines: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 12,
    padding: 20,
  },
  guidelinesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#135D66",
    marginBottom: 10,
  },
  guidelinesText: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
  },
});