import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Dimensions
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email, phone, verificationType } = useLocalSearchParams();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  // Mock OTP for demo purposes
  const mockOTP = '123456';

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      /*
      const response = await fetch('YOUR_API_ENDPOINT/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otp: otpString,
          email: email,
          phone: phone,
          verificationType: verificationType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Verification Successful',
          'Your account has been verified successfully!',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate based on verification type
                if (verificationType === 'registration') {
                  router.push('/login');
                } else {
                  router.push('/home');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', data.message || 'Invalid OTP');
      }
      */

      // Mock verification logic - Remove this when implementing real API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      if (otpString === mockOTP) {
        Alert.alert(
          'Verification Successful',
          `Your ${verificationType === 'email' ? 'email' : 'phone number'} has been verified successfully!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                if (verificationType === 'registration') {
                  router.push('/LoginScreen');
                } else {
                  router.push('/(tabs)');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Verification Failed', 'Invalid OTP. Please try again.');
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }

    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setCanResend(false);
    setTimer(60);

    try {
      // Replace with actual API call
      /*
      const response = await fetch('YOUR_API_ENDPOINT/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          phone: phone,
          verificationType: verificationType
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('OTP Sent', 'A new OTP has been sent to your registered contact.');
      } else {
        Alert.alert('Error', data.message || 'Failed to resend OTP');
      }
      */

      // Mock resend logic - Remove this when implementing real API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      Alert.alert('OTP Sent', `A new OTP has been sent to your ${verificationType === 'email' ? 'email' : 'phone number'}.`);
      
      // Clear current OTP
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } catch (error) {
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      setCanResend(true);
      setTimer(0);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getContactDisplay = () => {
    if (verificationType === 'email' || !phone) {
      return email;
    }
    const phoneStr = phone.toString();
    return phoneStr.replace(/(\d{3})(\d{3})(\d{4})/, '***-***-$3');
  };

  const getVerificationMethod = () => {
    return verificationType === 'email' ? 'email' : 'SMS';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#E3FEF7" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Verify Your Account</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit verification code via {getVerificationMethod()} to:
          </Text>
          <Text style={styles.contactText}>{getContactDisplay()}</Text>
        </View>

        {/* OTP Input Section */}
        <View style={styles.otpSection}>
          <Text style={styles.otpLabel}>Enter Verification Code</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) {
                    inputRefs.current[index] = ref;
                  }
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>

          {/* Mock OTP Helper */}
          <View style={styles.mockHelper}>
            <Text style={styles.mockHelperText}>Demo OTP: {mockOTP}</Text>
          </View>
        </View>

        {/* Timer and Resend Section */}
        <View style={styles.timerSection}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in {formatTimer(timer)}
            </Text>
          ) : (
            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleResendOTP}
              disabled={isLoading}
            >
              <Text style={styles.resendButtonText}>
                {isLoading ? 'Sending...' : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerifyOTP}
          disabled={isLoading || otp.join('').length !== 6}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpText}>Didn't receive the code?</Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                'Need Help?',
                'If you\'re having trouble receiving the OTP, please:\n\n• Check your spam/junk folder (for email)\n• Ensure you have network coverage (for SMS)\n• Contact support if the issue persists'
              );
            }}
          >
            <Text style={styles.helpLink}>Get Help</Text>
          </TouchableOpacity>
        </View>

        {/* Change Contact Option */}
        <TouchableOpacity
          style={styles.changeContactButton}
          onPress={() => {
            Alert.alert(
              'Change Contact',
              'To change your email or phone number, please go back to the registration form.',
              [
                {
                  text: 'Go Back',
                  onPress: () => router.back()
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                }
              ]
            );
          }}
        >
          <Text style={styles.changeContactText}>Wrong email or phone number?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3FEF7",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: "#135D66",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#135D66",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#4a5568",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 16,
    color: "#135D66",
    fontWeight: "600",
    textAlign: "center",
  },
  otpSection: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  otpLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#135D66",
    marginBottom: 20,
    textAlign: "center",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  otpInput: {
    width: (SCREEN_WIDTH - 120) / 6,
    height: 55,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3748",
    backgroundColor: "#f8f9fa",
  },
  otpInputFilled: {
    borderColor: "#135D66",
    backgroundColor: "#E3FEF7",
  },
  mockHelper: {
    backgroundColor: "#f0f8ff",
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#135D66",
  },
  mockHelperText: {
    fontSize: 12,
    color: "#4a5568",
    textAlign: "center",
    fontFamily: 'monospace',
  },
  timerSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  timerText: {
    fontSize: 16,
    color: "#718096",
  },
  resendButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resendButtonText: {
    fontSize: 16,
    color: "#135D66",
    fontWeight: "600",
  },
  verifyButton: {
    backgroundColor: "#135D66",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 30,
    shadowColor: "#135D66",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  helpSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  helpText: {
    fontSize: 14,
    color: "#718096",
    marginBottom: 5,
  },
  helpLink: {
    fontSize: 14,
    color: "#135D66",
    fontWeight: "600",
  },
  changeContactButton: {
    alignItems: "center",
    paddingVertical: 10,
  },
  changeContactText: {
    fontSize: 14,
    color: "#718096",
    textDecorationLine: "underline",
  },
});