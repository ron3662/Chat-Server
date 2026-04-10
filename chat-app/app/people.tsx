import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Modal,
} from "react-native";
import axios from "axios";
import { useUser } from "../context/UserContext";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useRouter } from "expo-router";

const SERVER_URL = "https://chat-server-jznv.onrender.com";
const { width, height } = Dimensions.get("window");

export default function People({ navigation }: any) {
  const { userId } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const router = useRouter();
  const DEFAULT_AVATAR =
    "https://ui-avatars.com/api/?name=User&background=E5E5EA&color=555";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        `${SERVER_URL}/users?userId=${userId}`
      );
      const filteredUsers = res.data.filter(
  (user: any) => user.id !== userId
);

setUsers(filteredUsers);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fdfbfb", "#ebedee"]}
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.title}>People</Text>

      <FlatList
        data={users}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <UserCard
            item={item}
            defaultAvatar={DEFAULT_AVATAR}
            onAvatarPress={() => {
              setSelectedUser(item);
              setShowProfile(true);
            }}
            onCardPress={() => {
              router.push({
              pathname: "/chat",
              params: { user: JSON.stringify(item) },
            });
            }}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      {/* 💎 THEMED POPUP */}
      <Modal
        visible={showProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfile(false)}
      >
        {/* 🌈 soft backdrop */}
        <Pressable
          style={styles.softBackdrop}
          onPress={() => setShowProfile(false)}
        >
          <BlurView
            intensity={20}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        {/* 💎 popup */}
        <View style={styles.popupContainer}>
          <BlurView intensity={40} tint="light" style={styles.popupCard}>
            <LinearGradient
              colors={[
                "rgba(255,255,255,0.6)",
                "rgba(255,255,255,0.2)",
              ]}
              style={StyleSheet.absoluteFill}
            />

            <LinearGradient
              colors={["#ff9a9e", "#fad0c4"]}
              style={styles.popupAvatarGlow}
            >
              <Image
                source={{
                  uri:
                    selectedUser?.avatar ||
                    DEFAULT_AVATAR,
                }}
                style={styles.popupAvatar}
              />
            </LinearGradient>

            <Text style={styles.popupUsername}>
              {selectedUser?.username}
            </Text>

            <Text style={styles.popupTagline}>
              {selectedUser?.tagline || "Hey there 👋"}
            </Text>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

/*  User Card */
function UserCard({
  item,
  defaultAvatar,
  onAvatarPress,
  onCardPress,
}: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.cardWrapper, animatedStyle]}>
      <BlurView intensity={40} tint="light" style={styles.card}>
        <View style={styles.glassOverlay} />

        {/* Avatar click */}
        <Pressable onPress={onAvatarPress}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#ff9a9e", "#fad0c4"]}
              style={styles.avatarGlow}
            >
              <Image
                source={{ uri: item.avatar || defaultAvatar }}
                style={styles.avatar}
              />
            </LinearGradient>
          </View>
        </Pressable>

        {/* Card click */}
        <Pressable
          style={{ flex: 1 }}
          onPress={onCardPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.tagline}>
            {item.tagline || "Hey there 👋"}
          </Text>
        </Pressable>
      </BlurView>
    </Animated.View>
  );
}

/* 🎨 Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 60,
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 20,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
  },

  cardWrapper: {
    marginBottom: 14,
    borderRadius: 24,
    overflow: "hidden",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 24,
  },

  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 24,
  },

  avatarContainer: {
    marginRight: 14,
  },

  avatarGlow: {
    padding: 2,
    borderRadius: 35,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  username: {
    fontSize: 18,
    fontWeight: "600",
  },

  tagline: {
    fontSize: 14,
    color: "#666",
  },

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
});