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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FeedbackType = 'general' | 'support' | 'oppose' | 'amendment';

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [selectedType, setSelectedType] = useState<FeedbackType>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    { id: 'general' as FeedbackType, label: 'General Feedback', icon: '💭' },
    { id: 'support' as FeedbackType, label: 'Support Bill', icon: '👍' },
    { id: 'oppose' as FeedbackType, label: 'Oppose Bill', icon: '👎' },
    { id: 'amendment' as FeedbackType, label: 'Suggest Amendment', icon: '✏️' },
  ];

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      Alert.alert('Error', 'Please enter your feedback before submitting.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Success!', 
        `Your feedback has been submitted ${isAnonymous ? 'anonymously' : 'with your details'}.`,
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
            <View style={styles.typeGrid}>
              {feedbackTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    selectedType === type.id && styles.typeButtonSelected
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Text style={styles.typeIcon}>{type.icon}</Text>
                  <Text style={[
                    styles.typeLabel,
                    selectedType === type.id && styles.typeLabelSelected
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Feedback Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>Your Feedback</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={8}
              placeholder="Share your thoughts on this bill. Your input helps shape Kenya's legislative process..."
              placeholderTextColor="#718096"
              value={feedbackText}
              onChangeText={setFeedbackText}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {feedbackText.length}/1000 characters
            </Text>
          </View>

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
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>

          {/* Guidelines */}
          <View style={styles.guidelines}>
            <Text style={styles.guidelinesTitle}>Feedback Guidelines</Text>
            <Text style={styles.guidelinesText}>
              • Be respectful and constructive in your feedback{'\n'}
              • Focus on specific aspects of the legislation{'\n'}
              • Provide clear reasoning for your position{'\n'}
              • Suggest concrete improvements when possible
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
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  typeButton: {
    backgroundColor: "#fff",
    width: (SCREEN_WIDTH - 60) / 2,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonSelected: {
    borderColor: "#135D66",
    backgroundColor: "#E3FEF7",
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
    textAlign: "center",
  },
  typeLabelSelected: {
    color: "#135D66",
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
    minHeight: 150,
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