//This is the registration screen for the Civic AI app

import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from "react-native"
import {router} from "expo-router"
import { useAuth } from "@/context/AuthContex"; // Custom hook for auth context

export default function Register() {
  const [name, setName] = useState("")
  const [idNumber, setIdNumber] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [county, setCounty] = useState("")
  const [constituency, setConstituency] = useState("")
  const [ward, setWard] = useState("")
  const [password, setPassword] = useState("")
  const { register } = useAuth(); // Custom hook for auth context

  const handleRegister =async () => {
    try {
      await register(email, password);
      router.push("/Loginscreen") // Adjust the route as needed
      
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "Something went wrong");
    }
  };
  
  return(
     <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Register for CivicAI</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Kenyan ID Number"
          value={idNumber}
          onChangeText={setIdNumber}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="County"
          value={county}
          onChangeText={setCounty}
        />


        <TextInput
          style={styles.input}
          placeholder="Constituency"
          value={constituency}
          onChangeText={setConstituency}
        />

        <TextInput
          style={styles.input}
          placeholder="Ward"
          value={ward}
          onChangeText={setWard}
        />

        <TextInput
          style={styles.input}
          placeholder="Password "
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.loginText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )

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
  loginText: { textAlign: "center", color: "#2E86AB", fontSize: 14 },
});
