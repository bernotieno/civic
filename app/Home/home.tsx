// // screens/home/HomeScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Home</Text>
      <Text>Welcome to the CivicAI Home Screen!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
});

export default HomeScreen;
