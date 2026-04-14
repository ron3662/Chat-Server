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
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import * as VideoThumbnails from "expo-video-thumbnails";
import ProfileViewPopup from "../components/popup";
import MessageBubble from "../components/message-bubble";
import MediaPreview from "../components/media-preview";
import UserProfileWidget from "@/components/user-profile-widget";
import {EmojiKeyboard} from "@/components/emoji-keyboard";

const SERVER_URL = "https://chat-server-jznv.onrender.com";
const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=E5E5EA&color=555";

export default function ChatScreen() {
  const { user } = useLocalSearchParams();
  const parsedUser = JSON.parse(user as string);
  const { userId } = useUser();
  const selectedUserId = parsedUser.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState({
    from: "",
    to: "",
    text: "",
    media: [],
    time: new Date(),
  });
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<
    "image" | "video" | "gif" | "file" | null
  >(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIndicatorRef = useRef<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const generateThumbnail = async (uri) => {
    try {
      const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(uri, {
        time: 1000,
      });

      return thumb; // ✅ return instead of state
    } catch (e) {
      console.warn("Thumbnail error:", e);
      return null;
    }
  };

  // Load messages and setup WebSocket
  useEffect(() => {
    axios
      .get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`)
      .then((res) => {
        setMessages(res.data);
      })
      .catch((err) => console.warn("Error loading messages:", err));

    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.from === selectedUserId) {
        if (data.type === "typing") {
          setOtherUserTyping(true);
          setTimeout(() => setOtherUserTyping(false), 2000);
        } else {
          setMessages((prev) => [...prev, data]);
        }
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [userId, selectedUserId]);

  const sendMessage = async () => {
    try {
      if (!chatMessage.text.trim() && chatMessage.media.length === 0) return;

      setIsSending(true);

      //upload to cloudinary and get URLs for media items
      const mediaWithUrls = await Promise.all(
        chatMessage.media.map(async (mediaItem) => {
          if (mediaItem.mediaUrl.startsWith("http")) {
            return mediaItem; // already has URL (e.g., GIFs)
          } else {
            const uploadedUrl = await uploadToCloudinary(mediaItem.mediaUrl);
            const mediaPreviewUrl =
              mediaItem.mediaType === "video" && mediaItem.mediaPreviewUrl
                ? await uploadToCloudinary(mediaItem.mediaPreviewUrl)
                : "";
            return {
              ...mediaItem,
              mediaUrl: uploadedUrl,
              mediaPreviewUrl: mediaPreviewUrl,
            };
          }
        }),
      );

      const finalMessage = {
        ...chatMessage,
        from: userId,
        to: selectedUserId,
        media: mediaWithUrls,
        time: new Date(),
      };

      wsRef.current?.send(
        JSON.stringify({
          type: "message",
          ...finalMessage,
        }),
      );

      setMessages((prev) => [...prev, finalMessage]);

      setChatMessage({
        from: userId,
        to: selectedUserId,
        text: "",
        media: [],
        time: new Date(),
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFilePreview = (mediaType: string, mediaUrl: string) => {
    if (mediaType === "image" || mediaType === "gif") {
      setPreviewType(mediaType);
      setPreviewMedia(mediaUrl);
    } else if (mediaType === "video") {
      setPreviewType("video");
      setPreviewMedia(mediaUrl);
    } else {
      // For other files, we can either show a generic preview or attempt to open with Linking
      Linking.canOpenURL(mediaUrl).then((supported) => {
        if (supported) {
          Linking.openURL(mediaUrl);
        } else {
          setPreviewType("file");
        }
      });
    }
  };
  const handleTyping = (text: string) => {
    setChatMessage((prev) => ({ ...prev, text }));

    if (!typingIndicatorRef.current && wsRef.current) {
      typingIndicatorRef.current = true;
      wsRef.current?.send(
        JSON.stringify({
          type: "typing",
          from: userId,
          to: selectedUserId,
        }),
      );
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      typingIndicatorRef.current = false;
    }, 2000);
  };

  const pickUniversalMedia = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled) return;

      for (const file of result.assets) {
        const uri = file.uri;
        const name = file.name;
        const mimeType = file.mimeType;
        let mediaPreviewUrl = "";
        // 🔥 Detect file type
        let type = "file";

        if (mimeType?.startsWith("image/")) {
          type = "image";
          if (mimeType === "image/gif") {
            type = "gif";
          }
        } else if (mimeType?.startsWith("video/")) {
          type = "video";
          mediaPreviewUrl = await generateThumbnail(uri);
        }

        setChatMessage((prev) => ({
          ...prev,
          media: [
            ...prev.media,
            {
              mediaType: type,
              mediaName: name,
              mediaPreviewUrl: mediaPreviewUrl || "",
              mediaUrl: uri || "",
            },
          ],
        }));
      }
    } catch (error) {
      console.error("Media pick failed:", error);
    }
  };

  // Scroll to bottom on new messages or keyboard events
  useEffect(() => {
    if (messages.length > 0 || otherUserTyping) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        50,
      );
    }
  }, [messages, otherUserTyping]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setIsKeyboardVisible(true);
      flatListRef.current?.scrollToEnd({ animated: true });
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setIsKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: "#fdfbfb" }}
    >
      {/* 👤 Header */}
      <BlurView intensity={40} tint="light" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 28, color: "#FF4E50" }}>←</Text>
        </TouchableOpacity>
        <UserProfileWidget
          onpress={() => setShowProfile(true)}
          avatar={parsedUser.avatar}
          userName={parsedUser.username}
          tagline={parsedUser.tagline}
        />
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
            <MessageBubble
              isUserMessage={item.from === userId}
              text={item.text}
              media={item.media}
              handleFilePreview={handleFilePreview}
            />
          )}
          ListFooterComponent={
            otherUserTyping ? (
              <View style={[styles.msg, styles.left]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            ) : null
          }
        />

        {/* 📝 Input */}
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#fdfbfb" }}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: "#fdfbfb",
                marginTop: isKeyboardVisible ? -8 : 8,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={() => pickUniversalMedia()}
            >
              <Text style={{ fontSize: 20 }}>📎</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Text style={{ fontSize: 20 }}>😊</Text>
            </TouchableOpacity>
            <View style={styles.inputContainer}>
              {/* 📂 Selected Files (WRAPS properly) */}
              {chatMessage.media.length > 0 && (
                <View style={styles.filesContainer}>
                  {chatMessage.media.map((file, index) => (
                    <View key={index} style={styles.fileItem}>
                      {file.mediaType === "image" ||
                      file.mediaType === "gif" ? (
                        <Image
                          source={{ uri: file.mediaUrl }}
                          style={styles.fileImage}
                        />
                      ) : file.mediaType === "video" ? (
                        <Image
                          source={{ uri: file.mediaPreviewUrl }}
                          style={styles.fileImage}
                        />
                      ) : (
                        <View
                          style={[
                            styles.fileImage,
                            { justifyContent: "center", alignItems: "center" },
                          ]}
                        >
                          <Text>📄</Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          setChatMessage((prev) => ({
                            ...prev,
                            media: prev.media.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        <Text style={{ fontSize: 14, color: "#fff" }}>❌</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* 📝 Text input ALWAYS at bottom */}
              <TextInput
                style={styles.chatInput}
                value={chatMessage.text || ""}
                onChangeText={handleTyping}
                placeholder="Type a message..."
                placeholderTextColor="#888"
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
                multiline
                maxHeight={80}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                (isSending ||
                  (!chatMessage.text.trim() &&
                    chatMessage.media.length === 0)) &&
                  styles.disabledSendButton,
              ]}
              onPress={() => sendMessage()}
              disabled={
                isSending ||
                (!chatMessage.text.trim() && chatMessage.media.length === 0)
              }
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontSize: 24, color: "#fff" }}>✈️</Text>
              )}
            </TouchableOpacity>
          </View>

          {showEmojiPicker && (
            <EmojiKeyboard
              onEmojiSelect={(emoji) => {
                setChatMessage((prev) => ({
                  ...prev,
                  text: prev.text + emoji,
                }));
                setShowEmojiPicker(false);
              }}
              onGifSelect={(gif) => {
                setChatMessage((prev) => ({
                  ...prev,
                    text: prev.text + gif,
                }));
                setShowEmojiPicker(false);
              }}
              onTenorGifSelect={(gif) => {
                setChatMessage((prev) => ({
                  ...prev,
                  media: [
                    ...prev.media,
                    { mediaType: "gif", mediaUrl: gif, mediaName: "GIF" },
                  ],
                }));
                setShowEmojiPicker(false);  
              }}
            />  
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>

      <ProfileViewPopup
        show={showProfile}
        onClose={() => setShowProfile(false)}
        userName={parsedUser.username}
        avatar={parsedUser.avatar || DEFAULT_AVATAR}
        tagline={parsedUser.tagline || "Hey there 👋"}
      />

      <MediaPreview
        previewMedia={previewMedia}
        previewType={previewType}
        onClose={() => {
          setPreviewMedia(null);
          setPreviewType(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fdfbfb",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    gap: 8,
  },

  attachmentButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },

  inputContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    justifyContent: "flex-end",
  },

  filesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },

  fileItem: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },

  fileImage: {
    width: "100%",
    height: "100%",
  },

  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },

  chatInput: {
    minHeight: 40,
    maxHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#fff",
    color: "#000",
  },

  sendButton: {
    backgroundColor: "#25D366",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  disabledSendButton: {
    backgroundColor: "#95D4A3",
    opacity: 0.5,
  },

  typingIndicator: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#999",
  },
});
