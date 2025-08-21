// screens/projects/ProjectsScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ProjectsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📂 Projects</Text>
      <Text>Browse and explore all public projects here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
});

export default ProjectsScreen;
