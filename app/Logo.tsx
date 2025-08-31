import React from "react";
import { Image, StyleSheet, View } from "react-native";

type LogoProps = {
  size?: number; // allow resizing (default 100)
};

const Logo: React.FC<LogoProps> = ({ size = 100 }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/icon.png")} // update path if needed
        style={{ width: size, height: size, resizeMode: "contain" }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Logo;
