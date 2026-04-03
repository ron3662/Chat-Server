import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Image
} from "react-native";
import { useSearchParams } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function ChatScreen() {
  const { id: selectedUserId, userId } = useSearchParams(); // from router params
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch previous messages
  useEffect(() => {
    axios.get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`)
      .then(res => setMessages(res.data))
      .catch(console.log);
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");

    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "typing" && data.from === selectedUserId) setTyping(true);
      else if (data.text || data.media) setMessages(prev => [...prev, data]);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!chatMessage.trim() || !wsRef.current) return;

    const msg = {
      type: "message",
      from: userId,
      to: selectedUserId,
      text: chatMessage,
      time: new Date(),
    };

    wsRef.current.send(JSON.stringify(msg));
    setMessages(prev => [...prev, msg]);
    setChatMessage("");
  };

  const handleTyping = (text: string) => {
    setChatMessage(text);
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "typing", from: userId, to: selectedUserId }));
    }
  };

  // Pick image/video
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.7,
    });

    if (!result.canceled && wsRef.current) {
      const msg = {
        type: "message",
        from: userId,
        to: selectedUserId,
        media: result.assets[0].uri,
        time: new Date(),
      };
      wsRef.current.send(JSON.stringify(msg));
      setMessages(prev => [...prev, msg]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#ECE5DD" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, i) => i.toString()}
        contentContainerStyle={{ padding: 10 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.from === userId;
          return (
            <View style={[styles.messageContainer, isMe ? styles.messageRight : styles.messageLeft]}>
              {item.text && <Text style={styles.messageText}>{item.text}</Text>}
              {item.media && (
                <Image source={{ uri: item.media }} style={{ width: 200, height: 200, borderRadius: 10 }} />
              )}
              <Text style={styles.timeText}>
                {new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          );
        }}
      />
      {typing && <Text style={{ marginLeft: 10, color: "#555" }}>Typing...</Text>}

      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickMedia} style={styles.mediaButton}>
          <Ionicons name="image-outline" size={24} color="#25D366" />
        </TouchableOpacity>
        <TextInput
          style={styles.inputBox}
          placeholder="Type a message"
          placeholderTextColor="#888"
          value={chatMessage}
          onChangeText={handleTyping}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messageContainer: { maxWidth: "70%", padding: 10, marginVertical: 5, borderRadius: 10 },
  messageLeft: { backgroundColor: "#fff", alignSelf: "flex-start", borderTopLeftRadius: 0 },
  messageRight: { backgroundColor: "#25D366", alignSelf: "flex-end", borderTopRightRadius: 0 },
  messageText: { fontSize: 16, color: "#000" },
  timeText: { fontSize: 10, color: "#555", textAlign: "right", marginTop: 2 },
  inputContainer: { flexDirection: "row", padding: 5, backgroundColor: "#fff", alignItems: "center" },
  inputBox: { flex: 1, backgroundColor: "#f0f0f0", borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16, marginRight: 5 },
  sendButton: { backgroundColor: "#25D366", width: 45, height: 45, borderRadius: 25, justifyContent: "center", alignItems: "center" },
  mediaButton: { justifyContent: "center", alignItems: "center", marginRight: 5 },
});