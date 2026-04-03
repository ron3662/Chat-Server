import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function TabsLayout() {
  return (
    <>
      <Tabs>
        <Tabs.Screen name="people" options={{ title: "People" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
      <StatusBar style="auto" />
    </>
  );
}