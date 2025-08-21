import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{idNumber?: string; password?: string}>({});

  // Mock user data - Replace with actual API call
  const mockUsers = [
    {
      id: '1',
      idNumber: '12345678',
      password: 'password123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+254712345678'
    },
    {
      id: '2',
      idNumber: '87654321',
      password: 'mypassword',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+254787654321'
    }
  ];

  const validateForm = () => {
    const newErrors: {idNumber?: string; password?: string} = {};

    // ID Number validation
    if (!idNumber.trim()) {
      newErrors.idNumber = 'ID Number is required';
    } else if (idNumber.length < 8) {
      newErrors.idNumber = 'ID Number must be at least 8 digits';
    } else if (!/^\d+$/.test(idNumber)) {
      newErrors.idNumber = 'ID Number must contain only numbers';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      /*
      const response = await fetch('YOUR_API_ENDPOINT/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idNumber,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user token/session
        // await AsyncStorage.setItem('userToken', data.token);
        // await AsyncStorage.setItem('userId', data.user.id);
        
        router.push('/home');
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
      */

      // Mock login logic - Remove this when implementing real API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      const user = mockUsers.find(u => u.idNumber === idNumber && u.password === password);
      
      if (user) {
        Alert.alert(
          'Login Successful',
          `Welcome back, ${user.name}!`,
          [
            {
              text: 'Continue',
              onPress: () => router.push('/(tabs)')
            }
          ]
        );
      } else {
        Alert.alert('Login Failed', 'Invalid ID Number or Password');
      }

    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality will be implemented with backend integration.',
      [
        {
          text: 'OK',
          onPress: () => {
            // TODO: Navigate to forgot password screen
            // router.push('/forgot-password');
          }
        }
      ]
    );
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your civic engagement</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* ID Number Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>ID Number</Text>
              <TextInput
                style={[styles.input, errors.idNumber && styles.inputError]}
                placeholder="Enter your National ID Number"
                placeholderTextColor="#718096"
                value={idNumber}
                onChangeText={(text) => {
                  setIdNumber(text);
                  if (errors.idNumber) {
                    setErrors(prev => ({...prev, idNumber: undefined}));
                  }
                }}
                keyboardType="numeric"
                maxLength={8}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.idNumber && (
                <Text style={styles.errorText}>{errors.idNumber}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  placeholderTextColor="#718096"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({...prev, password: undefined}));
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Mock Credentials Helper */}
            <View style={styles.mockCredentials}>
              <Text style={styles.mockTitle}>Demo Credentials:</Text>
              <Text style={styles.mockText}>ID: 12345678, Password: password123</Text>
              <Text style={styles.mockText}>ID: 87654321, Password: mypassword</Text>
            </View>
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/Registrationscreen')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Options */}
          <View style={styles.additionalOptions}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                // TODO: Implement guest access
                Alert.alert('Guest Access', 'Guest access functionality will be implemented');
              }}
            >
              <Text style={styles.optionButtonText}>Continue as Guest</Text>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    marginTop: 20,
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
    marginBottom: 30,
    shadowColor: "#135D66",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 5,
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
  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginBottom: 25,
  },
  forgotPasswordText: {
    color: "#135D66",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  mockCredentials: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#135D66",
  },
  mockTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#135D66",
    marginBottom: 5,
  },
  mockText: {
    fontSize: 12,
    color: "#4a5568",
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  signUpText: {
    fontSize: 16,
    color: "#4a5568",
  },
  signUpLink: {
    fontSize: 16,
    color: "#135D66",
    fontWeight: "600",
  },
  additionalOptions: {
    alignItems: "center",
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  optionButtonText: {
    color: "#718096",
    fontSize: 14,
    fontWeight: "500",
  },
});