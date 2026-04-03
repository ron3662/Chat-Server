import React from "react";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="people" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}