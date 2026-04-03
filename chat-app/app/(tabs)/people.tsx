import { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter, useSearchParams } from "expo-router";
import axios from "axios";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function People() {
  const { userId } = useSearchParams();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "online") setOnlineUsers(data.users.filter((id) => id !== userId));
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const goToChat = (selectedUserId: string) => {
    router.push({ pathname: `chat/${selectedUserId}`, params: { userId } });
  };

  return (
    <View style={{ flex:1, padding:10 }}>
      <Text style={{ fontSize:20, textAlign:'center', marginBottom:10 }}>Online Users</Text>
      <FlatList
        data={onlineUsers}
        keyExtractor={(item) => item.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => goToChat(item)}>
            <Text style={{ fontSize:18, padding:10 }}>{item}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}