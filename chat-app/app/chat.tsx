import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import { BlurView } from "expo-blur";
import ProfileViewPopup from "../components/popup";
import MessageBubble from "../components/message-bubble";
import MediaPreview from "../components/media-preview";
import UserProfileWidget from "@/components/user-profile-widget";
import { EmojiKeyboard } from "@/components/emoji-keyboard";
import { fileServices } from "@/services/file-services";
import { MediaInputTextField } from "@/components/media-input-textfield";
import { useMessagingService } from "@/services/messaging-service";
import { ReactionKeyboard } from "../components/reaction-keyboard";
import { useReactionKeyboard } from "@/hooks/use-reaction-keyboard";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=User&background=E5E5EA&color=555";

export default function ChatScreen() {
  const { user } = useLocalSearchParams();
  const parsedUser = JSON.parse(user as string);
  const { userId } = useUser();
  const selectedUserId = parsedUser.id;

  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<
    "image" | "video" | "gif" | "file" | null
  >(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { pickUniversalMedia } = fileServices();
  const {
    init,
    sendMessage,
    handleTyping,
    chatMessage,
    setChatMessage,
    messages,
    isSending,
  } = useMessagingService();

  const { visible, activeMessageId, position, open, close } =
    useReactionKeyboard();
  useEffect(() => {
    if (!userId || !selectedUserId) return;
    init(
      userId,
      selectedUserId,
      () => {
        setOtherUserTyping(true);
      },
      () => {
        setOtherUserTyping(false);
      },
    );
  }, [userId, selectedUserId]);

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

  // Scroll to bottom on new messages or keyboard events
  useEffect(() => {
    if (messages?.length > 0 || otherUserTyping) {
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

  const onMessageLongPress = (id: number, pos: { x: number; y: number }) => {
    open(id?.toString(), pos);
  };
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
          data={Array.isArray(messages) ? messages : []}
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
              onLongPress={(pos) => onMessageLongPress(item.id, pos)}
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
        <ReactionKeyboard
          visible={visible}
          position={position}
          onClose={close}
          onSelect={(reaction) => {
            console.log("Selected:", reaction, activeMessageId);
          }}
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
              onPress={async () => {
                const selectedMedia = await pickUniversalMedia();
                if (selectedMedia) {
                  setChatMessage((prev) => ({
                    ...prev,
                    media: [...prev.media, ...selectedMedia],
                  }));
                }
              }}
            >
              <Text style={{ fontSize: 20 }}>📎</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Text style={{ fontSize: 20 }}>😊</Text>
            </TouchableOpacity>
            <MediaInputTextField
              chatMessage={chatMessage}
              onRemoveMedia={(index) => {
                setChatMessage((prev) => ({
                  ...prev,
                  media: prev.media.filter((_, i) => i !== index),
                }));
              }}
              handleTyping={handleTyping}
              sendMessage={sendMessage}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (isSending ||
                  (!chatMessage?.text?.trim() &&
                    chatMessage?.media?.length === 0)) &&
                  styles.disabledSendButton,
              ]}
              onPress={() => sendMessage()}
              disabled={
                isSending ||
                (!chatMessage?.text.trim() && chatMessage?.media?.length === 0)
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
