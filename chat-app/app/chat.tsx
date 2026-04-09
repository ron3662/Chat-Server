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
  Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { EmojiPicker } from "emoji-mart-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { KeyboardAwareView } from "react-native-keyboard-controller";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function ChatScreen() {
  const { user } = useLocalSearchParams();
  const parsedUser = JSON.parse(user);
  const { userId } = useUser();
  const selectedUserId = parsedUser.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [inputHeight, setInputHeight] = useState(40);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    axios.get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`)
      .then(res => setMessages(res.data));

    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");

    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "seen") {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === data.messageId ? { ...msg, status: "seen" } : msg
          )
        );
      }

      if (data.from === selectedUserId) {
        setMessages(prev => [...prev, { ...data, status: "delivered" }]);
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

    wsRef.current?.send(JSON.stringify({
      type: "message",
      ...newMsg,
      to: selectedUserId,
    }));

    setMessages(prev => [...prev, newMsg]);
    setChatMessage("");
  };

  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages, showEmojiPicker, showAttachments]);

  const toggleEmojiPicker = () => {
    setShowAttachments(false);
    if (showEmojiPicker) setShowEmojiPicker(false);
    else {
      Keyboard.dismiss();
      setShowEmojiPicker(true);
    }
  };

  const toggleAttachments = () => {
    setShowEmojiPicker(false);
    Keyboard.dismiss();
    setShowAttachments(prev => !prev);
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync();
    if (!res.canceled) console.log(res.assets[0]);
  };

  const takePhoto = async () => {
    const res = await ImagePicker.launchCameraAsync();
    if (!res.canceled) console.log(res.assets[0]);
  };

  const pickFile = async () => {
    const res = await DocumentPicker.getDocumentAsync({});
    console.log(res);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAwareView style={{ flex: 1 }}>
        
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
            renderItem={({ item }) => (
              <View style={[styles.msg, item.from === userId ? styles.right : styles.left]}>
                
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ color: item.from === userId ? "#fff" : "#000" }}>
                    {item.text}
                  </Text>

                  {item.from === userId && (
                    <Ionicons
                      name={
                        item.status === "seen"
                          ? "checkmark-done"
                          : item.status === "delivered"
                          ? "checkmark-done-outline"
                          : "checkmark"
                      }
                      size={14}
                      color={item.status === "seen" ? "#4FC3F7" : "#fff"}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>

              </View>
            )}
          />

          {/* INPUT BAR */}
          <View style={[styles.inputWrapper, { paddingBottom: insets.bottom || 8 }]}>
            
            <TouchableOpacity onPress={toggleAttachments}>
              <Ionicons name="add" size={26} />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleEmojiPicker}>
              <Ionicons name={showEmojiPicker ? "keyboard" : "happy-outline"} size={24} />
            </TouchableOpacity>

            <TextInput
              style={[styles.chatInput, { height: Math.min(100, inputHeight) }]}
              value={chatMessage}
              onChangeText={setChatMessage}
              multiline
              onFocus={() => {
                setShowEmojiPicker(false);
                setShowAttachments(false);
              }}
              onContentSizeChange={(e) =>
                setInputHeight(e.nativeEvent.contentSize.height)
              }
            />

            {chatMessage.trim() ? (
              <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                <Ionicons name="send" color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.sendButton}>
                <Ionicons name="mic" color="#fff" />
              </View>
            )}
          </View>

          {/* EMOJI */}
          {showEmojiPicker && (
            <View style={{ height: 300 }}>
              <EmojiPicker
                onEmojiSelected={(e) =>
                  setChatMessage(prev => prev + e.native)
                }
              />
            </View>
          )}

          {/* ATTACHMENTS */}
          {showAttachments && (
            <View style={styles.attachmentContainer}>
              <TouchableOpacity onPress={pickImage}>
                <Ionicons name="image" size={28} />
                <Text>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={takePhoto}>
                <Ionicons name="camera" size={28} />
                <Text>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={pickFile}>
                <Ionicons name="document" size={28} />
                <Text>File</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </KeyboardAwareView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", padding: 12, alignItems: "center" },
  username: { fontSize: 18, marginLeft: 10 },

  msg: { padding: 10, margin: 5, borderRadius: 10, maxWidth: "70%" },
  left: { backgroundColor: "#eee", alignSelf: "flex-start" },
  right: { backgroundColor: "#25D366", alignSelf: "flex-end" },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 8,
    borderTopWidth: 1,
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

  attachmentContainer: {
    height: 120,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
});