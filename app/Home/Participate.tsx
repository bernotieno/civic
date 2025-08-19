// screens/participate/ParticipateScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ParticipateScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🤝 Participate</Text>
      <Text>Engage with ongoing discussions and activities here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
});

export default ParticipateScreen;
