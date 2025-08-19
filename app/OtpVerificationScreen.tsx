// This is the OTP Verification screen for the Civic AI app
// It allows users to enter a one-time password (OTP) for verification after registration or login

import React, { useState } from "react"
import { router} from "expo-router";
import { useAuth } from "@/context/AuthContex"; // Custom hook for auth context
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const OtpVerificationScreen = () => {

const [otp, setOtp] = useState("");  
const { verify } = useAuth(); // Custom hook for auth context
const phone = route.params?.email; // pass from login

const handleVerifyOtp = async () => {
    try {
      await verify(phone, otp);
      router.push("/Home/home"); // Navigate to main app screen
      
    } catch (err: any) {
      console.error(err.response?.data || err.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        We’ve sent a 6-digit verification code to your phone/email.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => alert("Resend OTP")}>
        <Text style={styles.resend}>Resend OTP</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    width: "80%",
    height: 55,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 25,
  },
  button: {
    width: "80%",
    backgroundColor: "#4F46E5",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resend: {
    color: "#4F46E5",
    fontSize: 14,
    marginTop: 10,
  },
});

export default OtpVerificationScreen;
