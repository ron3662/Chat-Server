import { UserProvider } from "../context/UserContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <UserProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {/* 🏠 Main (Login/Profile) */}
        <Stack.Screen name="index" />

        {/* 👥 People */}
        <Stack.Screen name="people" />

        {/* 💬 Chat */}
        <Stack.Screen name="chat" />
      </Stack>

      <StatusBar style="auto" />
    </UserProvider>
  );
}