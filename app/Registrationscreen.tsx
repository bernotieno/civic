import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface RegisterForm {
  name: string;
  idNumber: string;
  email: string;
  phone: string;
  county: string;
  constituency: string;
  ward: string;
  password: string;
  confirmPassword: string;
}

type FormField = keyof RegisterForm;
type FormErrors = Partial<Record<keyof RegisterForm, string>>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState<RegisterForm>({
    name: "",
    idNumber: "",
    email: "",
    phone: "",
    county: "",
    constituency: "",
    ward: "",
    password: "",
    confirmPassword: ""
  });

  // Mock data for dropdowns - In real app, fetch from API
  const kenyaLocations = {
    counties: [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Machakos', 'Meru', 'Thika', 'Malindi', 'Kitale'
    ],
    constituencies: {
      'Nairobi': ['Westlands', 'Dagoretti North', 'Langata', 'Kibra', 'Roysambu', 'Kasarani'],
      'Mombasa': ['Changamwe', 'Jomba', 'Kisauni', 'Nyali', 'Likoni', 'Mvita'],
      // Add more as needed
    },
    wards: {
      'Westlands': ['Kitisuru', 'Parklands/Highridge', 'Karura', 'Kangemi', 'Mountain View'],
      'Langata': ['Karen', 'Nairobi West', 'Mugumo-ini', 'South C', 'Nyayo Highrise'],
      // Add more as needed
    }
  };

  const handleInputChange = (field: FormField, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // ID Number validation
    if (!form.idNumber.trim()) {
      newErrors.idNumber = 'ID Number is required';
    } else if (form.idNumber.length < 8) {
      newErrors.idNumber = 'ID Number must be at least 8 digits';
    } else if (!/^\d+$/.test(form.idNumber)) {
      newErrors.idNumber = 'ID Number must contain only numbers';
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+254|0)[17]\d{8}$/.test(form.phone)) {
      newErrors.phone = 'Please enter a valid Kenyan phone number';
    }

    // Location validation
    if (!form.county.trim()) {
      newErrors.county = 'County is required';
    }
    if (!form.constituency.trim()) {
      newErrors.constituency = 'Constituency is required';
    }
    if (!form.ward.trim()) {
      newErrors.ward = 'Ward is required';
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again.');
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      /*
      const response = await fetch('YOUR_API_ENDPOINT/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          idNumber: form.idNumber,
          email: form.email,
          phoneNumber: form.phone,
          county: form.county,
          constituency: form.constituency,
          ward: form.ward,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, navigate to OTP verification
        router.push(`/otp-verification?email=${form.email}&phone=${form.phone}&verificationType=registration`);
      } else {
        Alert.alert('Registration Failed', data.message || 'Something went wrong');
      }
      */

      // Mock registration logic 
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

      Alert.alert(
        'Registration Successful',
        'Please verify your email and phone number to complete registration.',
        [
          {
            text: 'Continue',
            onPress: () => {
              router.push(`/OtpVerificationScreen?email=${form.email}&phone=${form.phone}&verificationType=registration`);
            }
          }
        ]
      );

    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    field: FormField,
    placeholder: string,
    keyboardType: any = 'default',
    isPassword?: boolean
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{placeholder}</Text>
      <View style={isPassword ? styles.passwordContainer : undefined}>
        <TextInput
          style={[
            isPassword ? styles.passwordInput : styles.input,
            errors[field] && styles.inputError
          ]}
          placeholder={`Enter your ${placeholder.toLowerCase()}`}
          placeholderTextColor="#718096"
          value={form[field]}
          onChangeText={(text) => handleInputChange(field, text)}
          keyboardType={keyboardType}
          secureTextEntry={isPassword && (field === 'password' ? !showPassword : !showConfirmPassword)}
          autoCapitalize={field === 'email' ? 'none' : 'words'}
          autoCorrect={false}
        />
        {isPassword && (
          <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => {
                if (field === "password") {
                  setShowPassword(!showPassword);
                } else {
                  setShowConfirmPassword(!showConfirmPassword);
                }
              }}
            >
              <Ionicons
                name={
                  (field === "password" ? showPassword : showConfirmPassword)
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={24}
                color="gray"
              />
        </TouchableOpacity>
        )}
      </View>
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
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
            <Text style={styles.title}>Join CivicAI</Text>
            <Text style={styles.subtitle}>Register to participate in Kenya's democratic process</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            {renderInput('name', 'Full Name')}
            {renderInput('idNumber', 'National ID Number', 'numeric')}
            {renderInput('email', 'Email Address', 'email-address')}
            {renderInput('phone', 'Phone Number', 'phone-pad')}

            <Text style={styles.sectionTitle}>Location Details</Text>
            
            {renderInput('county', 'County')}
            {renderInput('constituency', 'Constituency')}
            {renderInput('ward', 'Ward')}

            <Text style={styles.sectionTitle}>Security</Text>
            
            {renderInput('password', 'Password', 'default', true)}
            {renderInput('confirmPassword', 'Confirm Password', 'default', true)}

            {/* Terms and Privacy */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By registering, you agree to our{' '}
                <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'Terms will be displayed here')}>
                  <Text style={styles.termsLink}>Terms of Service</Text>
                </TouchableOpacity>
                {' '}and{' '}
                <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be displayed here')}>
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </Text>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/LoginScreen')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Mock Data Helper */}
          <View style={styles.mockHelper}>
            <Text style={styles.mockHelperTitle}>Quick Fill (Demo):</Text>
            <TouchableOpacity
              style={styles.mockButton}
              onPress={() => {
                setForm({
                  name: "John Doe",
                  idNumber: "12345678",
                  email: "john.doe@example.com",
                  phone: "+254712345678",
                  county: "Nairobi",
                  constituency: "Westlands",
                  ward: "Kitisuru",
                  password: "Password123",
                  confirmPassword: "Password123"
                });
              }}
            >
              <Text style={styles.mockButtonText}>Fill Demo Data</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#135D66",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#4a5568",
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#135D66",
    marginBottom: 15,
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#135D66",
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: "#2d3748",
  },
  inputError: {
    borderColor: "#e53e3e",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    color: "#2d3748",
  },
  eyeButton: {
    position: "absolute",
    right: 15,
    top: 14,
    padding: 5,
  },
  eyeText: {
    fontSize: 18,
  },
  errorText: {
    color: "#e53e3e",
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
  termsContainer: {
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 14,
    color: "#4a5568",
    lineHeight: 20,
    textAlign: "center",
  },
  termsLink: {
    color: "#135D66",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  registerButton: {
    backgroundColor: "#135D66",
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#135D66",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loginText: {
    fontSize: 16,
    color: "#4a5568",
  },
  loginLink: {
    fontSize: 16,
    color: "#135D66",
    fontWeight: "600",
  },
  mockHelper: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },
  mockHelperTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#135D66",
    marginBottom: 10,
  },
  mockButton: {
    backgroundColor: "#135D66",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  mockButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});