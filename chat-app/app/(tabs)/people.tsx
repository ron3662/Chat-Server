import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useSearchParams, useRouter } from "expo-router";

export default function PeopleTab() {
  const { userId } = useSearchParams();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "online") setOnlineUsers(data.users.filter(u => u !== userId));
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 20, textAlign: "center" }}>Online Users</Text>
      <FlatList
        data={onlineUsers}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => router.push(`/chat/${item}?userId=${userId}`)}>
            <Image source={{ uri: `https://i.pravatar.cc/150?u=${item}` }} style={styles.avatar} />
            <Text style={{ fontSize: 18 }}>User {item} 🟢</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  userItem: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 1, borderColor: "#ccc" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
});