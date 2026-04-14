import { View, StyleSheet, Image, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

export default function UserProfileWidget({
  onpress,
  avatar,
  userName,
  tagline,
}) {
  const [avatarError, setAvatarError] = useState(false);
  return (
    <TouchableOpacity style={styles.userInfo} onPress={onpress}>
      <LinearGradient colors={["#ff9a9e", "#fad0c4"]} style={styles.avatarGlow}>
        {avatar && !avatarError ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
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
      <View style={styles.textContainer}>
        <Text style={styles.username}>{userName}</Text>
        <Text style={styles.tagline}>{tagline || ""}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },

  avatarGlow: {
    padding: 2,
    borderRadius: 35,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  username: {
    fontSize: 18,
    fontWeight: "600",
  },

  tagline: {
    fontSize: 14,
    color: "#555",
  },

  fallbackAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FF4E50",
    justifyContent: "center",
    alignItems: "center",
  },

  fallbackText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  textContainer: {
    marginLeft: 10,
  },
});
