import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useUser } from "../../context/UserContext";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function People() {
  const { userId, saveUser } = useUser();
  const navigation = useNavigation();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "online") 
      {

        setOnlineUsers(data.users.filter(u => u !== userId));
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 20, textAlign: "center", marginBottom: 10 }}>Online Users</Text>
      <FlatList
        data={onlineUsers}
        keyExtractor={(item, index) => item + index}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userItem}
            onPress={() => navigation.navigate("chat/[id]", { selectedUserId: item })}
          >
            <Text style={{ fontSize: 18 }}>{item} 🟢</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  userItem: { padding: 15, borderBottomWidth: 1, borderColor: "#ccc" },
});