import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function ChatList() {
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
    <View style={{ flex: 1, paddingTop: 50 }}>
      <Text style={{ fontSize: 20, textAlign: "center", marginBottom: 10 }}>Online Users</Text>
      <FlatList
        data={onlineUsers}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => router.push({ pathname: `chat/${item}`, params: { userId } })}>
            <Image source={{ uri: `https://i.pravatar.cc/150?u=${item}` }} style={styles.avatar} />
            <Text style={{ fontSize: 18 }}>{item}</Text>
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