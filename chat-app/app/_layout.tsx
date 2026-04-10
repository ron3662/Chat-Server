import { UserProvider } from "../context/UserContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View, ActivityIndicator } from "react-native";
import React from "react";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
  });

  // Fallback: show app after 3 seconds even if fonts not loaded
  const [forceShow, setForceShow] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log("⚠️ Font loading timeout - showing app anyway");
      setForceShow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded && !forceShow) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF4E50" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <KeyboardProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="people" />
            <Stack.Screen name="chat" />
          </Stack>
          <StatusBar style="auto" />
        </KeyboardProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}