import { UserProvider } from "../context/UserContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <KeyboardProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          >
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