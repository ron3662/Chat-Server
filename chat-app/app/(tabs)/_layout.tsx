import { Tabs } from "expo-router";
import { useUser } from "../../context/UserContext";

export default function TabsLayout() {
  const { userId } = useUser();
  if (!userId) return null; // wait until logged in
  return (
    <Tabs>
      <Tabs.Screen name="people" options={{ title: "People", headerShown: false }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", headerShown: false }} />
    </Tabs>
  );
}