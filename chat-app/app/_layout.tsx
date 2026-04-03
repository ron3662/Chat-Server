import { UserProvider } from "../context/UserContext";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

export default function RootLayout({ children }) {
  const colorScheme = useColorScheme();
  return (
    <UserProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {children}
        <StatusBar style="auto" />
      </ThemeProvider>
    </UserProvider>
  );
}