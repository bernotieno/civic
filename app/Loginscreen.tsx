//This is the login screen for the Civic AI app
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContex"; // Custom hook for auth context


export default function SignUp() {
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState(""); 
   const { login } = useAuth(); //  custom hook for auth context   

  const handleLogin = async () => {
    try {
      await login(idNumber, password);
      router.push("/OtpVerificationScreen"); // Navigate to home or dashboard      
    } catch (err: any) {
      console.log(err.response?.data || err.message);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Sign In to CivicAI</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Kenyan ID Number"
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/Registrationscreen")}>
          <Text style={styles.registerText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#2E86AB" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#2E86AB",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  registerText: { textAlign: "center", color: "#2E86AB", fontSize: 14 },
});
