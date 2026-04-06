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
  Dimensions,
  Modal,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Constants from "expo-constants";

const SERVER_URL = "https://chat-server-jznv.onrender.com";
const { width, height } = Dimensions.get("window");
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
  // Popup state
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`)
      .then((res) => setMessages(res.data));

    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.from === selectedUserId) setMessages((prev) => [...prev, data]);
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!chatMessage.trim() || !wsRef.current) return;
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        from: userId,
        to: selectedUserId,
        text: chatMessage,
        time: new Date(),
      })
    );
    setMessages((prev) => [...prev, { from: userId, text: chatMessage, time: new Date() }]);
    setChatMessage("");
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 💕 Hearts */}
      <FloatingHearts />

      {/* 👤 Top user info */}
      <SafeAreaView style={{ zIndex: 1 }}>
        <Pressable onPress={() => setShowProfile(true)}>
          <BlurView
            intensity={40}
            tint="light"
            style={[styles.header, { paddingTop: Constants.statusBarHeight + 12 }]}
          >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#FF4E50" />
        </TouchableOpacity>
            <View style={styles.userInfo}>
              <LinearGradient colors={["#ff9a9e", "#fad0c4"]} style={styles.avatarGlow}>
                <Image
                  source={{ uri: parsedUser.avatar || DEFAULT_AVATAR }}
                  style={styles.avatar}
                />
              </LinearGradient>
              <Text style={styles.username}>{parsedUser.username}</Text>
            </View>
          </BlurView>
        </Pressable>
      </SafeAreaView>

      {/* 💬 Chat messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={[styles.msg, item.from === userId ? styles.right : styles.left]}>
            <Text style={{ color: item.from === userId ? "#fff" : "#000" }}>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* 📝 Chat input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={chatMessage}
          onChangeText={setChatMessage}
          placeholder="Type a message..."
        />
        <TouchableOpacity onPress={sendMessage}>
          <Ionicons name="send" size={28} color="#25D366" />
        </TouchableOpacity>
      </View>

      {/* 💎 Popup */}
      <Modal
        visible={showProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfile(false)}
      >
        <Pressable style={styles.softBackdrop} onPress={() => setShowProfile(false)}>
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        </Pressable>

        <View style={styles.popupContainer}>
          <BlurView intensity={40} tint="light" style={styles.popupCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.2)"]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient colors={["#ff9a9e", "#fad0c4"]} style={styles.popupAvatarGlow}>
              <Image
                source={{ uri: parsedUser.avatar || DEFAULT_AVATAR }}
                style={styles.popupAvatar}
              />
            </LinearGradient>
            <Text style={styles.popupUsername}>{parsedUser.username}</Text>
            <Text style={styles.popupTagline}>{parsedUser.tagline || "Hey there 👋"}</Text>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

/* 💕 Floating Hearts */
function FloatingHearts() {
  return (
    <View style={styles.heartsContainer} pointerEvents="none">
      {Array.from({ length: 8 }).map((_, i) => (
        <Heart key={i} />
      ))}
    </View>
  );
}

function Heart() {
  const translateY = useSharedValue(height + 50);
  const scale = useSharedValue(0.6 + Math.random());
  const opacity = useSharedValue(0.2 + Math.random() * 0.4);
  const left = Math.random() * width;

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-120, { duration: 7000 + Math.random() * 4000 }),
      -1,
      false
    );
    scale.value = withRepeat(withTiming(scale.value + 0.3, { duration: 1500 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.Text style={[style, styles.heart]}>💖</Animated.Text>;
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  userInfo: { flexDirection: "row", alignItems: "center", marginLeft: 12 },
  avatarGlow: { padding: 2, borderRadius: 35 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  username: { fontSize: 18, fontWeight: "600", marginLeft: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 0,
    backgroundColor: "#fdfbfb",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 25,
    backgroundColor: "#fff",
    color: "#000",
    marginRight: 8,
  },
  msg: { padding: 10, marginVertical: 5, borderRadius: 10, maxWidth: "70%" },
  left: { backgroundColor: "#eee", alignSelf: "flex-start" },
  right: { backgroundColor: "#25D366", alignSelf: "flex-end" },

  heartsContainer: { position: "absolute", width: "100%", height: "100%" },
  heart: { fontSize: 22 },

  softBackdrop: { flex: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  popupContainer: { position: "absolute", top: 0, bottom: 0, left: 0, right: 0, justifyContent: "center", alignItems: "center" },
  popupCard: {
    width: 280,
    padding: 24,
    borderRadius: 40,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(42, 33, 33, 0.8)",
    borderWidth: 2,
    borderColor: "rgba(35, 30, 30, 0.5)",
  },
  popupAvatarGlow: { padding: 3, borderRadius: 60, marginBottom: 12 },
  popupAvatar: { width: 160, height: 160, borderRadius: 55 },
  popupUsername: { fontSize: 22, fontWeight: "700", color: "#000" },
  popupTagline: { marginTop: 6, fontSize: 14, color: "#555", textAlign: "center" },
});