// screens/notifications/NotificationsScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const NotificationsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Notifications</Text>
      <Text>You will see all your alerts and updates here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
});

export default NotificationsScreen;
