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
} from "react-native";
import axios from "axios";
import { useUser } from "../../context/UserContext";
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

const SERVER_URL = "https://chat-server-jznv.onrender.com";
const { width, height } = Dimensions.get("window");

export default function People() {
  const { userId } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setUsers(res.data);
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
      {/* 🌈 Background */}
      <LinearGradient
        colors={["#fdfbfb", "#ebedee"]}
        style={StyleSheet.absoluteFill}
      />

      {/* 💕 Floating Hearts */}
      <FloatingHearts />

      <Text style={styles.title}>People</Text>

      <FlatList
        data={users}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }) => (
          <UserCard item={item} defaultAvatar={DEFAULT_AVATAR} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

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
      withTiming(-120, {
        duration: 7000 + Math.random() * 4000,
      }),
      -1,
      false
    );

    scale.value = withRepeat(
      withTiming(scale.value + 0.3, { duration: 1500 }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute",
    left,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[style, styles.heart]}>
      💖
    </Animated.Text>
  );
}

function UserCard({ item, defaultAvatar }: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 250,
      mass: 0.5,
    });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 180,
    });
  };

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <BlurView intensity={40} tint="light" style={styles.card}>
          
          {/* 🔥 DARK GLASS OVERLAY */}
          <View style={styles.glassOverlay} />

          {/* 🌈 Avatar Glow */}
          <LinearGradient
            colors={["#ff9a9e", "#fad0c4"]}
            style={styles.avatarGlow}
          >
            <Image
              source={{ uri: item.avatar || defaultAvatar }}
              style={styles.avatar}
            />
          </LinearGradient>

          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.tagline}>
              {item.tagline || "Hey there 👋"}
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

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
    color: "#000",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
  },

  /* 💕 Hearts */
  heartsContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  heart: {
    fontSize: 22,
  },

  /* 🧊 Card */
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

  /* 🔥 DARK GLASS EFFECT */
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)", // 👈 perfect balance
    borderRadius: 24,
  },

  /* 🌈 Avatar */
  avatarGlow: {
    padding: 2,
    borderRadius: 35,
    marginRight: 14,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },

  username: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },

  tagline: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});