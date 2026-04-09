import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function ChatScreen() {
  const { user } = useLocalSearchParams();
  const parsedUser = JSON.parse(user);
  const { userId } = useUser();
  const selectedUserId = parsedUser.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [inputHeight, setInputHeight] = useState(40);

  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
const insets = useSafeAreaInsets();
useEffect(() => {
  const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
    setKeyboardHeight(e.endCoordinates.height);
  });

  const hideSub = Keyboard.addListener("keyboardDidHide", () => {
    setKeyboardHeight(0);
  });

  return () => {
    showSub.remove();
    hideSub.remove();
  };
}, []);

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`)
      .then((res) => setMessages(res.data));

    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");

    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "seen") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId ? { ...msg, status: "seen" } : msg
          )
        );
      }

      if (data.from === selectedUserId) {
        setMessages((prev) => [...prev, { ...data, status: "delivered" }]);
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!chatMessage.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      from: userId,
      text: chatMessage,
      status: "sent",
    };

    wsRef.current?.send(
      JSON.stringify({
        type: "message",
        ...newMsg,
        to: selectedUserId,
      })
    );

    setMessages((prev) => [...prev, newMsg]);
    setChatMessage("");
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} />
          </TouchableOpacity>
          <Text style={styles.username}>{parsedUser.username}</Text>
        </View>

        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 60 }} 
            renderItem={({ item }) => (
              <View
                style={[
                  styles.msg,
                  item.from === userId ? styles.right : styles.left,
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      color: item.from === userId ? "#fff" : "#000",
                    }}
                  >
                    {item.text}
                  </Text>

                  {item.from === userId && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color="#fff"
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
              </View>
            )}
          />

          {/* INPUT BAR */}
<View
  style={[
    styles.inputWrapper,
    {
      position: "absolute",
      bottom: keyboardHeight,
      left: 0,
      right: 0,
    },
  ]}
>
            <TextInput
              style={[
                styles.chatInput,
                { height: Math.min(100, inputHeight) },
              ]}
              value={chatMessage}
              onChangeText={setChatMessage}
              multiline
              onContentSizeChange={(e) =>
                setInputHeight(e.nativeEvent.contentSize.height)
              }
            />

            <TouchableOpacity
              onPress={sendMessage}
              style={styles.sendButton}
            >
              <Ionicons name="send" color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
  },
  username: { fontSize: 18, marginLeft: 10 },

  msg: {
    padding: 10,
    margin: 5,
    borderRadius: 10,
    maxWidth: "70%",
  },
  left: { backgroundColor: "#eee", alignSelf: "flex-start" },
  right: { backgroundColor: "#25D366", alignSelf: "flex-end" },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderTopWidth: 1,
    backgroundColor: "#fff",
  },

  chatInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 6,
  },

  sendButton: {
    backgroundColor: "#25D366",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});