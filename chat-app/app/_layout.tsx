// app/_layout.tsx
import { UserProvider } from "../context/UserContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useUser } from "../context/UserContext";
import { View, ActivityIndicator } from "react-native"; // ✅ ADD THIS
export default function RootLayout() {
  const { userId, loading } = useUser();

  
  return (
    <UserProvider>
<Stack screenOptions={{ headerShown: false }}>
      {!userId ? (
        <Stack.Screen name="index" />
      ) : (
        <Stack.Screen name="(tabs)" />
      )}
    </Stack>
      <StatusBar style="auto" />
    </UserProvider>
  );
}