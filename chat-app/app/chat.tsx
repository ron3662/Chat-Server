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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import axios from "axios";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";
import { ScrollView } from "react-native";
import { Video } from "expo-av";
import * as VideoThumbnails from 'expo-video-thumbnails';

//Gif key
const TENOR_API_KEY = "LIVDSRZULELA"; // temp key
const TENOR_LIMIT = 5;

const SERVER_URL = "https://chat-server-jznv.onrender.com";
const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=E5E5EA&color=555";

export default function ChatScreen() {
  const { user } = useLocalSearchParams();
  const parsedUser = JSON.parse(user as string);
  const { userId } = useUser();
  const selectedUserId = parsedUser.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState({ from: "" , to: "", text: "", media : [], time: new Date() });
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "video" | "gif" | "pdf" | null>(
    null,
  );
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIndicatorRef = useRef<boolean>(false);

  const emojis = ["😀", "😂", "😍", "🔥", "👍", "🎉", "❤️", "😎", "🚀", "💯"];
  const gifs = ["🎊", "🎈", "🎁", "⭐", "✨", "🌟", "💫", "🌈", "🦋", "🌺"];

  const [gifResults, setGifResults] = useState<any[]>([]);
  const [gifQuery, setGifQuery] = useState("");
  const [loadingGifs, setLoadingGifs] = useState(false);
  
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

  //fetch trending gifs on mount
  useEffect(() => {
    if (showEmojiPicker) fetchTrendingGIFs();
  }, [showEmojiPicker]);

  useEffect(() => {
    if (gifQuery != "" && showEmojiPicker) fetchGifQuery(gifQuery);
  }, [gifQuery, showEmojiPicker]);

  const fetchTrendingGIFs = async () => {
    try {
      setLoadingGifs(true);
      const res = await axios.get(
        `https://g.tenor.com/v1/trending?key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}`,
      );

      console.log("TRENDING GIFS:", res.data.results);
      setGifResults(res.data.results);
    } catch (error) {
      console.log("Tenor error:", error);
    } finally {
      setLoadingGifs(false);
    }
  };

  const fetchGifQuery = async (query: string) => {
    try {
      setLoadingGifs(true);
      const res = await axios.get(
        `https://g.tenor.com/v1/search?key=${TENOR_API_KEY}&limit=${TENOR_LIMIT}&q=${query}`,
      );

      console.log("TRENDING GIFS:", res.data.results);
      setGifResults(res.data.results);
    } catch (error) {
      console.log("Tenor error:", error);
    } finally {
      setLoadingGifs(false);
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

    const finalMessage = {
      ...chatMessage,
      from: userId,
      to: selectedUserId,
      time: new Date(),
    };

    wsRef.current?.send(
      JSON.stringify({
        type: "message",
        ...finalMessage,
      })
    );

    setMessages(prev => [...prev, finalMessage]);

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

      for (const file of result.assets) 
      {
        const uri = file.uri;
        const name = file.name;
        const mimeType = file.mimeType;
        let mediaPreviewUrl = "";
        // 🔥 Detect file type
        let type = "file";

        if (mimeType?.startsWith("image/")) 
        {
          type = "image";
          if (mimeType === "image/gif") {
            type = "gif";
          }
        }
        else if (mimeType?.startsWith("video/")) 
        {
          type = "video";
          mediaPreviewUrl = await generateThumbnail(uri);
        }
        else if (mimeType === "application/pdf") type = "pdf";

        setChatMessage((prev) => ({
          ...prev,
          media: [...prev.media, { mediaType: type, mediaName: name, mediaPreviewUrl: mediaPreviewUrl || "", mediaUrl: uri || "" }],
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
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => setShowProfile(true)}
        >
          <LinearGradient
            colors={["#ff9a9e", "#fad0c4"]}
            style={styles.avatarGlow}
          >
            {!avatarError ? (
              <Image
                source={{ uri: parsedUser.avatar || DEFAULT_AVATAR }}
                style={styles.avatar}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor: "#FF4E50",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <Text
                  style={{ fontSize: 24, fontWeight: "700", color: "#fff" }}
                >
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
            <View
              style={[
                styles.msg,
                item.from === userId ? styles.right : styles.left,
              ]}
            >
              {item.media && item.media.length > 0 && item.media.map((mediaItem, index) => {
                if (mediaItem.mediaType === "image") {
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setPreviewMedia(mediaItem.mediaUrl);
                        setPreviewType("image");
                      }}
                    >
                      <Image
                        source={{ uri: mediaItem.mediaUrl }}
                        style={styles.mediaImage}
                      />
                    </TouchableOpacity>
                  );
                }
                else if (mediaItem.mediaType === "gif") {
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setPreviewMedia(mediaItem.mediaUrl);
                        setPreviewType("gif");
                      }}
                    >
                      <Image
                        source={{ uri: mediaItem.mediaUrl }}
                        style={styles.mediaImage}
                      />
                    </TouchableOpacity>
                  );
                }
                else if (mediaItem.mediaType === "video") {
                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setPreviewMedia(mediaItem.mediaUrl);
                        setPreviewType("video");
                      }}
                    >
                      <View style={styles.videoContainer}>
                        <Image
                          source={{
                            uri: mediaItem.mediaPreviewUrl || "",
                          }}
                          style={styles.mediaImage}
                        />
                        <Text style={styles.playIcon}>▶️</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }
                else if (mediaItem.mediaType === "pdf") {
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.pdfContainer}
                      onPress={() => {
                        setPreviewMedia(mediaItem.mediaUrl);
                        setPreviewType("pdf");
                      }}
                    >
                      <Text style={styles.pdfIcon}>📄</Text>
                    </TouchableOpacity>
                  );
                }
                return null;
              })}
              {item.text && (
                <Text style={{ color: item.from === userId ? "#fff" : "#000" }}>
                  {item.text}
                </Text>
              )}
            </View>
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
                    {file.mediaType === "image" || file.mediaType === "gif" ? (
                      <Image source={{ uri: file.mediaUrl }} style={styles.fileImage} />
                    ) : file.mediaType === "video" ? (
                      <Image source={{ uri: file.mediaPreviewUrl }} style={styles.fileImage} />
                    ) : (
                      <View style={[styles.fileImage, { justifyContent: "center", alignItems: "center" }]}>
                        <Text>📄</Text>
                      </View>
                    )}
                      {/* ❌ Remove button */}
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          setChatMessage(prev => ({
                            ...prev,
                            media: prev.media.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        <Text style={{ fontSize: 14, color: "#fff" }}>✕</Text>
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
                (isSending || (!chatMessage.text.trim() && chatMessage.media.length === 0))&& styles.disabledSendButton,
              ]}
              onPress={() => sendMessage()}
              disabled= {isSending ||(!chatMessage.text.trim() && chatMessage.media.length === 0)}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontSize: 24, color: "#fff" }}>✈️</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 😊 Emoji Picker */}
          {showEmojiPicker && (
            <ScrollView
              style={styles.emojiPickerContainer}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>Emojis</Text>
                <View style={styles.emojiGrid}>
                  {emojis.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.emojiButton}
                      onPress={() => {
                        setChatMessage({...chatMessage, text: chatMessage.text + emoji});
                        setShowEmojiPicker(false);
                      }}
                    >
                      <Text style={styles.emojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>GIFs & Stickers</Text>
                <View style={styles.emojiGrid}>
                  {gifs.map((gif) => (
                    <TouchableOpacity
                      key={gif}
                      style={styles.emojiButton}
                      onPress={() => {
                        setChatMessage({...chatMessage, text: chatMessage.text + gif});
                        setShowEmojiPicker(false);
                      }}
                    >
                      <Text style={styles.emojiText}>{gif}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.emojiSection}>
                <Text style={styles.emojiSectionTitle}>
                  {gifQuery ? "Search Results" : "Trending GIFs 🔥"}
                </Text>

                {/* 🔍 Search */}
                <TextInput
                  placeholder="Search GIFs..."
                  value={gifQuery}
                  onChangeText={setGifQuery}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    padding: 8,
                    marginBottom: 10,
                  }}
                />

                {/* ⏳ Loader */}
                {loadingGifs && <ActivityIndicator size="small" />}

                {/* 🎞️ GIF Grid */}
                <FlatList
                  data={gifResults}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false} // IMPORTANT (parent ScrollView handles scroll)
                  renderItem={({ item }) => {
                    const gifUrl = item?.media?.[0]?.gif?.url;

                    if (!gifUrl) return null;

                    return (
                      <TouchableOpacity
                        style={{ flex: 1, margin: 4 }}
                        onPress={() => {
                        setChatMessage(prev => ({
                          ...prev,
                          media: [
                            ...prev.media,
                            {
                              mediaType: "gif",
                              mediaName: item.title || "GIF",
                              mediaPreviewUrl: gifUrl,
                              mediaUrl: gifUrl,
                            },
                          ],
                        }));
                        setShowEmojiPicker(false);
                        }}
                      >
                        <Image
                          source={{ uri: gifUrl }}
                          style={{
                            width: "100%",
                            height: 120,
                            borderRadius: 10,
                          }}
                        />
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* 💎 Profile Modal */}
      <Modal
        visible={showProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfile(false)}
      >
        <Pressable
          style={styles.softBackdrop}
          onPress={() => setShowProfile(false)}
        >
          <BlurView intensity={20} tint="light" style={{ flex: 1 }} />
        </Pressable>
        <View style={styles.popupContainer}>
          <BlurView intensity={40} tint="light" style={styles.popupCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.2)"]}
              style={{ ...StyleSheet.absoluteFillObject }}
            />
            <LinearGradient
              colors={["#ff9a9e", "#fad0c4"]}
              style={styles.popupAvatarGlow}
            >
              {!avatarError ? (
                <Image
                  source={{ uri: parsedUser.avatar || DEFAULT_AVATAR }}
                  style={styles.popupAvatar}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <View
                  style={[
                    styles.popupAvatar,
                    {
                      backgroundColor: "#FF4E50",
                      justifyContent: "center",
                      alignItems: "center",
                    },
                  ]}
                >
                  <Text
                    style={{ fontSize: 60, fontWeight: "700", color: "#fff" }}
                  >
                    {parsedUser.username?.charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
              )}
            </LinearGradient>
            <Text style={styles.popupUsername}>{parsedUser.username}</Text>
            <Text style={styles.popupTagline}>
              {parsedUser.tagline || "Hey there 👋"}
            </Text>
          </BlurView>
        </View>
      </Modal>

      {/* 🖼️ Media Preview Modal */}
      <Modal
        visible={!!previewMedia}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPreviewMedia(null);
          setPreviewType(null);
        }}
      >
        <Pressable
          style={styles.previewBackdrop}
          onPress={() => {
            setPreviewMedia(null);
            setPreviewType(null);
          }}
        >
          <BlurView intensity={90} tint="dark" style={{ flex: 1 }} />
        </Pressable>
        <View style={styles.previewContainer}>
          {previewType === "image" && previewMedia && (
            <Image
              source={{ uri: previewMedia }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}

          {previewType === "gif" && previewMedia && (
            <Image
              source={{ uri: previewMedia }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}

          {previewType === "video" && previewMedia && (
            <View style={styles.previewVideoContainer}>
            <Video
                source={{ uri: previewMedia }}
                style={{ width: "90%", height: "80%" }}
                useNativeControls
                resizeMode="contain"
                shouldPlay
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.closePreviewButton}
            onPress={() => {
              setPreviewMedia(null);
              setPreviewType(null);
            }}
          >
            <Text style={{ fontSize: 28, color: "#fff" }}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  userInfo: { flexDirection: "row", alignItems: "center", marginLeft: 12 },
  avatarGlow: { padding: 2, borderRadius: 35 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  username: { fontSize: 18, fontWeight: "600", marginLeft: 10 },
  msg: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    marginHorizontal: 12,
    maxWidth: "75%",
  },
  left: { backgroundColor: "#eee", alignSelf: "flex-start" },
  right: { backgroundColor: "#25D366", alignSelf: "flex-end" },
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
  justifyContent: "flex-end", // 🔥 keeps input at bottom
},
filesContainer: {
  flexDirection: "row",
  flexWrap: "wrap",   // 🔥 enables wrapping
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
  backgroundColor: "#000",
  borderRadius: 10,
  width: 18,
  height: 18,
  justifyContent: "center",
  alignItems: "center",
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
  disabledSendButton: { backgroundColor: "#95D4A3", opacity: 0.5 },
  mediaImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 6 },
  videoContainer: {
    position: "relative",
    width: 200,
    height: 200,
    marginBottom: 6,
  },
  playIcon: { position: "absolute", top: "40%", left: "40%", fontSize: 40 },
  typingIndicator: {
    flexDirection: "row",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#999" },
  softBackdrop: { flex: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  popupContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  popupCard: {
    width: 280,
    padding: 24,
    borderRadius: 40,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(42,33,33,0.8)",
    borderWidth: 2,
    borderColor: "rgba(35,30,30,0.5)",
  },
  popupAvatarGlow: { padding: 3, borderRadius: 60, marginBottom: 12 },
  popupAvatar: { width: 160, height: 160, borderRadius: 55 },
  popupUsername: { fontSize: 22, fontWeight: "700", color: "#000" },
  popupTagline: {
    marginTop: 6,
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  emojiPickerContainer: {
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 240,
  },
  emojiSection: { marginBottom: 12 },
  emojiSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#666",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  emojiButton: {
    width: "22%",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },
  emojiText: { fontSize: 24 },
  previewBackdrop: { ...StyleSheet.absoluteFillObject },
  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  previewImage: { width: "90%", height: "80%", borderRadius: 20 },
  previewVideoContainer: {
    width: "90%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  previewPlayButton: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  closePreviewButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfContainer: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  padding: 10,
  borderRadius: 10,
  width: 200,
  gap: 10,
},

pdfIcon: {
  fontSize: 30,
},

pdfTitle: {
  fontWeight: "600",
  color: "#000",
},

pdfSubtitle: {
  fontSize: 12,
  color: "#666",
},
});
