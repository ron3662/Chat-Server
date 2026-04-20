import { View, StyleSheet, Image, Text, TouchableOpacity, Animated } from "react-native";
import { Modal, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Video } from "expo-av";
import { useRef, useState } from "react";
import { ReactionKeyboard } from "./reaction-keyboard";

export default function MediaPreview({
  previewMessage,
  onClose,
  onReact,
}) {
  const [reactions, setReactions] = useState<string[]>(previewMessage?.reactions || []);
  const [showKeyboard, setShowKeyboard] = useState(false);

  // 🔥 animation values
  const burstAnim = useRef(new Animated.Value(0)).current;
  const burstOpacity = useRef(new Animated.Value(0)).current;
  const [burstEmoji, setBurstEmoji] = useState<string | null>(null);

  const previewType = previewMessage?.mediaType;
  const previewMedia = previewMessage?.mediaUrl || previewMessage?.media;
  const mediaPreviewUrl = previewMessage?.mediaPreviewUrl;
  const text = previewMessage?.text?.text || previewMessage?.text || "";

  const triggerBurst = (emoji: string) => {
    setBurstEmoji(emoji);
    burstAnim.setValue(0);
    burstOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(burstAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(burstOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBurstEmoji(null);
    });
  };

  const handleSelectReaction = (emoji: string) => {
    triggerBurst(emoji);
    if (!reactions.includes(emoji)) {
      const updatedReactions = [...reactions, emoji];
      setReactions(updatedReactions);
      onReact?.(updatedReactions);
    }
    setShowKeyboard(false);
  };

  const handleRemoveReaction = (emoji: string) => {
    const updatedReactions = reactions.filter((r) => r !== emoji);
    setReactions(updatedReactions);
    onReact?.(updatedReactions);
  };

  return (
    <Modal
      visible={!!previewMessage.media}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* 🔲 Blur Background */}
      <Pressable
        style={styles.previewBackdrop}
        onPress={() => {
          if (showKeyboard) {
            setShowKeyboard(false);
          } else {
            onClose();
          }
        }}
      >
        <BlurView intensity={90} tint="dark" style={{ flex: 1 }} />
      </Pressable>

      {/* 🧠 Main Container */}
      <View style={styles.previewContainer}>

        {/* 💥 Floating Emoji Burst */}
        {burstEmoji && (
          <Animated.Text
            style={[
              styles.burstEmoji,
              {
                opacity: burstOpacity,
                transform: [
                  {
                    translateY: burstAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -120],
                    }),
                  },
                  {
                    scale: burstAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.4, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {burstEmoji}
          </Animated.Text>
        )}

        {/* 📦 Content */}
        <View style={styles.contentWrapper}>
          {(previewType === "image" || previewType === "gif") && previewMedia && (
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
                style={{ width: "100%", height: "100%" }}
                useNativeControls
                resizeMode="contain"
                shouldPlay
              />
            </View>
          )}

          {previewType === "text" && text !== "" && (
            <View style={styles.textContentWrapper}>
              <Text style={styles.previewText}>{text}</Text>
            </View>
          )}
        </View>

        {/* 😊 Reactions Row with Add Button */}
        <View style={styles.reactionsRow}>
          {reactions.map((emoji, index) => (
            <TouchableOpacity
              key={index}
              onLongPress={() => handleRemoveReaction(emoji)}
              style={styles.reactionBubble}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            onPress={() => setShowKeyboard(true)}
            style={styles.addReactionButton}
          >
            <Text style={styles.addReactionText}>＋</Text>
          </TouchableOpacity>
        </View>

        {/* 🎹 Reaction Keyboard */}
        {showKeyboard && (
          <Pressable
            style={styles.keyboardBackdrop}
            onPress={() => setShowKeyboard(false)}
          >
            <View
              onStartShouldSetResponder={() => true}
              style={styles.keyboardContainer}
            >
              <ReactionKeyboard onSelect={handleSelectReaction} />
            </View>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },

  contentWrapper: {
    width: "90%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
  },

  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },

  previewVideoContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  previewText: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    padding: 20,
  },

  reactionContainer: {
    marginTop: 12,
    alignItems: "center",
  },

  reactionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 6,
  },

  reactionBubble: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  reactionEmoji: {
    fontSize: 20,
  },

  addReaction: {
    fontSize: 28,
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  addReactionButton: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  addReactionText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },

  keyboardBackdrop: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: "flex-end",
  },

  textContentWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  burstEmoji: {
    position: "absolute",
    fontSize: 48,
    top: "50%",
  },

  keyboardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
});