import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Pressable,
  Modal,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const SERVER_URL = "https://chat-server-jznv.onrender.com";
const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=E5E5EA&color=555";

export default function ChatScreen() {
  const { user } = useLocalSearchParams();
  const parsedUser = JSON.parse(user);
  const { userId } = useUser();
  const selectedUserId = parsedUser.id;
  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Load messages
    axios.get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`)
      .then(res => setMessages(res.data));

    // WebSocket
    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.from === selectedUserId) setMessages(prev => [...prev, data]);
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!chatMessage.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({
      type: "message",
      from: userId,
      to: selectedUserId,
      text: chatMessage,
      time: new Date(),
    }));
    setMessages(prev => [...prev, { from: userId, text: chatMessage, time: new Date() }]);
    setChatMessage("");
  };

  // Scroll to bottom after messages load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    }
  }, [messages]);

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => showSub.remove();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fdfbfb" }}>
      {/* 👤 Top header */}
      <SafeAreaView style={{ zIndex: 1, backgroundColor: "#fdfbfb" }}>
        <Pressable onPress={() => setShowProfile(true)}>
          <BlurView intensity={40} tint="light" style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={28} color="#FF4E50" />
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <LinearGradient colors={["#ff9a9e","#fad0c4"]} style={styles.avatarGlow}>
                <Image source={{ uri: parsedUser.avatar || DEFAULT_AVATAR }} style={styles.avatar} />
              </LinearGradient>
              <Text style={styles.username}>{parsedUser.username}</Text>
            </View>
          </BlurView>
        </Pressable>
      </SafeAreaView>

      {/* 💬 Messages + Input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 80}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 12 }}
          renderItem={({ item }) => (
            <View style={[styles.msg, item.from === userId ? styles.right : styles.left]}>
              <Text style={{ color: item.from === userId ? "#fff" : "#000" }}>{item.text}</Text>
            </View>
          )}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* 📝 Chat input */}
        <SafeAreaView edges={["bottom"]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.chatInput}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Type a message..."
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* 💎 Popup */}
      <Modal visible={showProfile} transparent animationType="fade" onRequestClose={() => setShowProfile(false)}>
        <Pressable style={styles.softBackdrop} onPress={() => setShowProfile(false)}>
          <BlurView intensity={20} tint="light" style={{ flex: 1 }} />
        </Pressable>
        <View style={styles.popupContainer}>
          <BlurView intensity={40} tint="light" style={styles.popupCard}>
            <LinearGradient colors={["rgba(255,255,255,0.6)","rgba(255,255,255,0.2)"]} style={{ ...StyleSheet.absoluteFillObject }} />
            <LinearGradient colors={["#ff9a9e","#fad0c4"]} style={styles.popupAvatarGlow}>
              <Image source={{ uri: parsedUser.avatar || DEFAULT_AVATAR }} style={styles.popupAvatar} />
            </LinearGradient>
            <Text style={styles.popupUsername}>{parsedUser.username}</Text>
            <Text style={styles.popupTagline}>{parsedUser.tagline || "Hey there 👋"}</Text>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.08)" },
  userInfo: { flexDirection: "row", alignItems: "center", marginLeft: 12 },
  avatarGlow: { padding: 2, borderRadius: 35 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  username: { fontSize: 18, fontWeight: "600", marginLeft: 10 },
  msg: { padding: 10, marginVertical: 5, borderRadius: 10, maxWidth: "70%" },
  left: { backgroundColor: "#eee", alignSelf: "flex-start" },
  right: { backgroundColor: "#25D366", alignSelf: "flex-end" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fdfbfb",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#000",
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#25D366",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  softBackdrop: { flex: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  popupContainer: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, justifyContent: "center", alignItems: "center" },
  popupCard: { width: 280, padding: 24, borderRadius: 40, alignItems: "center", overflow: "hidden", backgroundColor: "rgba(42,33,33,0.8)", borderWidth: 2, borderColor: "rgba(35,30,30,0.5)" },
  popupAvatarGlow: { padding: 3, borderRadius: 60, marginBottom: 12 },
  popupAvatar: { width: 160, height: 160, borderRadius: 55 },
  popupUsername: { fontSize: 22, fontWeight: "700", color: "#000" },
  popupTagline: { marginTop: 6, fontSize: 14, color: "#555", textAlign: "center" },
});