import React, { useState } from "react";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";

export default function LogoutScreen() {
  const [loading, setLoading] = useState(false);
    const router = useRouter();
  const handleLogout = async () => {
    setLoading(true);

    // 👉 Here is where you'll call your backend API for logout
    // Example:
    // await fetch("https://your-api/logout", { method: "POST", headers: { Authorization: token } });

    // 🔹 Simulation / Mock logout
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Logged Out", "You have been successfully logged out!");
     router.push("/LoginScreen");
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Are you sure you want to logout?</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Logout</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cancelButton]}
        onPress={() => Alert.alert("Cancelled", "You stayed logged in!")}
      >
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E3FEF7", // background color
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 30,
    color: "#135D66",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#135D66", // button color
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
    width: "80%",
  },
  cancelButton: {
    backgroundColor: "#888", // grey cancel
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
