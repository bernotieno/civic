//This is the registration screen for the Civic AI app

import React, { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from "react-native"
import {router} from "expo-router"
import { Alert } from "react-native";


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
   // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

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


  const handleInputChange = (field: FormField, value: string) => {
  setForm(prev => ({
    ...prev,
    [field]: value
  }));

  if (errors[field]) {
    setErrors(prev => ({
      ...prev,
      [field]: undefined
    }));
  }
};


   // Validation function
  const validateForm = () => {
    const newErrors: FormErrors = {}; // 👈 now newErrors knows "name" is valid

    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!form.name) {
  newErrors.name = "Full name is required";
}

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Main register function
  const handleRegister = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Your API call here
      const response = await fetch('https://your-api.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          idNumber: form.idNumber,
          phoneNumber: form.phone,
          county: form.county,
          constituency: form.constituency,
          ward: form.ward,

        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        Alert.alert('Success', 'Registration successful!');
        // Navigate to login or home screen
        router.push("/AuthScreen");
      } else {
        // Handle API errors
        Alert.alert('Error', data.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return(
     <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Register for CivicAI</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={form.name}
          onChangeText={(text) => handleInputChange('name', text)}

        />

        <TextInput
          style={styles.input}
          placeholder="Kenyan ID Number"
          value={form.idNumber}
          onChangeText={(text) => handleInputChange('idNumber', text)}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={(text) => handleInputChange('email', text)}
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Enter Phone Number"
          value={form.phone}
          onChangeText={( text) => handleInputChange('phone', text)}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="County"
          value={form.county}
          onChangeText={(text) => handleInputChange('county', text)}
        />


        <TextInput
          style={styles.input}
          placeholder="Constituency"
          value={form.constituency}
          onChangeText={(text) => handleInputChange('constituency', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Ward"
          value={form.ward}
          onChangeText={(text) => handleInputChange('ward', text)}
        />

        <TextInput
          style={styles.input}
          placeholder="Password "
          value={form.password}
          onChangeText={(text) => handleInputChange('password', text)}
          secureTextEntry
        />
        
      <TextInput
          style={styles.input}
          placeholder=" Confirm Password "
          onChangeText={(text) => handleInputChange('confirmPassword', text)}
          value={form.confirmPassword}  
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
