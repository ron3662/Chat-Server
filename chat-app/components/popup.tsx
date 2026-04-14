import {
  Modal,
  Pressable,
  View,
  StyleSheet,
  Image,
  Text,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect } from "react";

export default function ProfileViewPopup({
  show,
  onClose,
  userName,
  avatar,
  tagline,
}) {
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [avatar]);

  return (
    <Modal
      visible={show}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.softBackdrop} onPress={onClose}>
        <BlurView intensity={20} tint="light" style={{ flex: 1 }} />
      </Pressable>

      <View style={styles.popupContainer}>
        <BlurView intensity={40} tint="light" style={styles.popupCard}>
          <LinearGradient
            colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.2)"]}
            style={StyleSheet.absoluteFillObject}
          />

          <LinearGradient
            colors={["#ff9a9e", "#fad0c4"]}
            style={styles.popupAvatarGlow}
          >
            {avatar && !avatarError ? (
              <Image
                source={{ uri: avatar }}
                style={styles.popupAvatar}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={styles.fallbackAvatar}>
                <Text style={styles.fallbackText}>
                  {userName?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
          </LinearGradient>

          <Text style={styles.popupUsername}>{userName}</Text>
          <Text style={styles.popupTagline}>{tagline || "Hey there 👋"}</Text>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /* 💎 Popup */
  softBackdrop: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },

  popupContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  popupCard: {
    width: 280,
    padding: 24,
    borderRadius: 40,
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(42, 33, 33, 0.8)",
    borderWidth: 2,
    borderColor: "rgba(35, 30, 30, 0.5)", // 👈 soft dark border
  },

  popupAvatarGlow: {
    padding: 3,
    borderRadius: 60,
    marginBottom: 12,
  },

  popupAvatar: {
    width: 160,
    height: 160,
    borderRadius: 55,
  },

  popupUsername: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
  },

  popupTagline: {
    marginTop: 6,
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
  fallbackAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#FF4E50",
    justifyContent: "center",
    alignItems: "center",
  },
  fallbackText: {
    fontSize: 60,
    color: "#fff",
    fontWeight: "700",
  },
});
