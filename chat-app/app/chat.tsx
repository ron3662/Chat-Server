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
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

const SERVER_URL = "https://chat-server-jznv.onrender.com";
const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=E5E5EA&color=555";

export default function ChatScreen() {
  const { user } = useLocalSearchParams();
  const parsedUser = JSON.parse(user as string);
  const { userId } = useUser();
  const selectedUserId = parsedUser.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  // Load messages and setup WebSocket
  useEffect(() => {
    axios.get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`)
      .then(res => {
        setMessages(res.data);
      })
      .catch(err => console.warn("Error loading messages:", err));

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
    
    const newMsg = { from: userId, text: chatMessage, time: new Date() };
    wsRef.current.send(JSON.stringify({
      type: "message",
      from: userId,
      to: selectedUserId,
      text: chatMessage,
      time: new Date(),
    }));
    setMessages(prev => [...prev, newMsg]);
    setChatMessage("");
  };



  // Scroll to bottom on new messages or keyboard events
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={{ flex: 1, backgroundColor: "#fdfbfb" }}>
      {/* 👤 Header */}
      <BlurView intensity={40} tint="light" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 28, color: "#FF4E50" }}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfo} onPress={() => setShowProfile(true)}>
          <LinearGradient colors={["#ff9a9e","#fad0c4"]} style={styles.avatarGlow}>
            {!avatarError ? (
              <Image 
                source={{ uri: parsedUser.avatar || DEFAULT_AVATAR }} 
                style={styles.avatar}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#FF4E50", justifyContent: "center", alignItems: "center" }]}>
                <Text style={{ fontSize: 24, fontWeight: "700", color: "#fff" }}>
                  {parsedUser.username?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
          </LinearGradient>
          <Text style={styles.username}>{parsedUser.username}</Text>
        </TouchableOpacity>
      </BlurView>

      {/* 💬 Chat */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -50 : -50}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 20 }}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          renderItem={({ item }) => (
            <View style={[styles.msg, item.from === userId ? styles.right : styles.left]}>
              <Text style={{ color: item.from === userId ? "#fff" : "#000" }}>{item.text}</Text>
            </View>
          )}
        />

        {/* 📝 Input */}
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#fdfbfb" }}>
          <View style={[styles.inputWrapper, { backgroundColor: "#fdfbfb", marginTop: isKeyboardVisible ? -8 : 8 }]}>
            <TextInput
              style={styles.chatInput}
              value={chatMessage}
              onChangeText={setChatMessage}
              placeholder="Type a message..."
              placeholderTextColor="#888"
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={sendMessage}
            >
              <Text style={{ fontSize: 24, color: "#fff" }}>✈️</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/*  Profile Modal */}
      <Modal
        visible={showProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfile(false)}
      >
        <Pressable style={styles.softBackdrop} onPress={() => setShowProfile(false)}>
          <BlurView intensity={20} tint="light" style={{ flex: 1 }} />
        </Pressable>
        <View style={styles.popupContainer}>
          <BlurView intensity={40} tint="light" style={styles.popupCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.2)"]}
              style={{ ...StyleSheet.absoluteFillObject }}
            />
            <LinearGradient colors={["#ff9a9e","#fad0c4"]} style={styles.popupAvatarGlow}>
              {!avatarError ? (
                <Image 
                  source={{ uri: parsedUser.avatar || DEFAULT_AVATAR }} 
                  style={styles.popupAvatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <View style={[styles.popupAvatar, { backgroundColor: "#FF4E50", justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ fontSize: 60, fontWeight: "700", color: "#fff" }}>
                    {parsedUser.username?.charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
              )}
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
  inputWrapper: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fdfbfb", borderTopWidth: 1, borderTopColor: "#ddd" },
  chatInput: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: "#ccc", color: "#000", marginRight: 8, fontSize: 16 },
  sendButton: { backgroundColor: "#25D366", width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  disabledButton: { backgroundColor: "#95D4A3", opacity: 0.6 },
  softBackdrop: { flex: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  popupContainer: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, justifyContent: "center", alignItems: "center", paddingTop: Platform.OS === "ios" ? 0 : 0 },
  popupCard: { width: 280, padding: 24, borderRadius: 40, alignItems: "center", overflow: "hidden", backgroundColor: "rgba(42,33,33,0.8)", borderWidth: 2, borderColor: "rgba(35,30,30,0.5)" },
  popupAvatarGlow: { padding: 3, borderRadius: 60, marginBottom: 12 },
  popupAvatar: { width: 160, height: 160, borderRadius: 55 },
  popupUsername: { fontSize: 22, fontWeight: "700", color: "#000" },
  popupTagline: { marginTop: 6, fontSize: 14, color: "#555", textAlign: "center" },

});