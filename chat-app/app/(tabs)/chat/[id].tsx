import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, Image } from "react-native";
import { useSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function ChatScreen() {
  const { userId, id: selectedUserId } = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.text) setMessages(prev => [...prev, data]);
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;
    wsRef.current?.send(JSON.stringify({ type: "message", from: userId, to: selectedUserId, text: chatMessage, time: new Date() }));
    setMessages(prev => [...prev, { text: chatMessage, from: userId, time: new Date() }]);
    setChatMessage("");
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All });
    if (!result.cancelled) {
      wsRef.current?.send(JSON.stringify({ type: "message", from: userId, to: selectedUserId, media: result.uri, type: "image", time: new Date() }));
      setMessages(prev => [...prev, { media: result.uri, type: "image", from: userId, time: new Date() }]);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[styles.messageContainer, item.from === userId ? styles.right : styles.left]}>
            {item.text && <Text style={styles.text}>{item.text}</Text>}
            {item.media && <Image source={{ uri: item.media }} style={{ width: 150, height: 150, borderRadius: 10 }} />}
          </View>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput style={styles.inputBox} placeholder="Type a message" value={chatMessage} onChangeText={setChatMessage} />
        <TouchableOpacity onPress={pickImage}><Text style={styles.sendBtn}>📎</Text></TouchableOpacity>
        <TouchableOpacity onPress={sendMessage}><Text style={styles.sendBtn}>➡️</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messageContainer: { margin: 5, padding: 10, borderRadius: 10, maxWidth: "70%" },
  left: { backgroundColor: "#fff", alignSelf: "flex-start" },
  right: { backgroundColor: "#25D366", alignSelf: "flex-end" },
  text: { color: "#000" },
  inputContainer: { flexDirection: "row", padding: 5, alignItems: "center" },
  inputBox: { flex: 1, borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, marginRight: 5 },
  sendBtn: { fontSize: 24, marginHorizontal: 5 }
});