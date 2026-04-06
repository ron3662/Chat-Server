import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");
const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function Home() {
  const router = useRouter();

  const {
    userId,
    username,
    password,
    avatar,
    tagline,
    saveUser,
    logout,
    loading,
  } = useUser();

  const [localUsername, setLocalUsername] = useState("");
  const [localpassword, setPassword] = useState("");
  const [localTagline, setLocalTagline] = useState(tagline || "");
  const [localAvatar, setLocalAvatar] = useState(avatar || "");
  const [focused, setFocused] = useState("");

  const DEFAULT_AVATAR =
    "https://ui-avatars.com/api/?name=User&background=E5E5EA&color=555";

  // Fade
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Parallax
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;

  // Heart header animation
  const heartScale = useRef(new Animated.Value(1)).current;
  const heartY = useRef(new Animated.Value(0)).current;

  // 💗 FLOATING HEARTS
  const hearts = Array.from({ length: 6 }).map(() => ({
    x: useRef(new Animated.Value(Math.random() * width)).current,
    y: useRef(new Animated.Value(height + Math.random() * 200)).current,
    scale: useRef(new Animated.Value(Math.random() * 0.5 + 0.5)).current,
    opacity: useRef(new Animated.Value(0.6)).current,
  }));

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Header heart animation
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(heartScale, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(heartScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(heartY, {
            toValue: -6,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(heartY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 💗 Floating hearts animation
    hearts.forEach((heart) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(heart.y, {
            toValue: -100,
            duration: 6000 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(heart.y, {
            toValue: height + 100,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Haptics
  const handlePress = async (action: () => void) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    action();
  };

  // Parallax
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        tiltX.setValue(g.dx / 20);
        tiltY.setValue(g.dy / 20);
      },
      onPanResponderRelease: () => {
        Animated.spring(tiltX, {
          toValue: 0,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }).start();
        Animated.spring(tiltY, {
          toValue: 0,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Image picker
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLocalAvatar(result.assets[0].uri);
    }
  };

  useEffect(() => {
    if (!loading && userId !== "") {
      setLocalUsername(username);
      setPassword(password);
      setLocalTagline(tagline);
      setLocalAvatar(avatar);
    }
  }, [userId, loading]);

  const register = async () => {
    try {
      const formData = new FormData();

      if (localAvatar) {
        formData.append("file", {
          uri: localAvatar,
          name: "avatar.jpg",
          type: "image/jpeg",
        } as any);
      }

      formData.append("username", localUsername);
      formData.append("password", localpassword);
      formData.append("tagline", localTagline);

      const res = await axios.post(`${SERVER_URL}/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await saveUser(res.data);
      Alert.alert("Registered successfully");
    } catch {
      Alert.alert("Registration failed");
    }
  };

  const enterApp = async () => {
    try {
      const formData = new FormData();

      if (localAvatar !== avatar) {
        formData.append("file", {
          uri: localAvatar,
          name: "avatar.jpg",
          type: "image/jpeg",
        } as any);
      }

      if (localTagline !== tagline) {
        formData.append("tagline", localTagline);
      }

      formData.append("username", localUsername);
      formData.append("password", localpassword);

      const res = await axios.post(`${SERVER_URL}/login`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await saveUser(res.data);
      router.replace("/people");
    } catch {
      Alert.alert("Enter failed");
    }
  };

  const AnimatedButton = ({ children, style, onPress }: any) => {
    const scale = useRef(new Animated.Value(1)).current;

    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          style={style}
          onPress={() => handlePress(onPress)}
          onPressIn={() =>
            Animated.spring(scale, {
              toValue: 0.94,
              tension: 120,
              friction: 4,
              useNativeDriver: true,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(scale, {
              toValue: 1,
              tension: 120,
              friction: 6,
              useNativeDriver: true,
            }).start()
          }
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={["#FDEBEB", "#E0C3FC"]}
      style={{ flex: 1 }}
    >
      {/* 💗 Floating hearts */}
      {hearts.map((h, i) => (
        <Animated.Text
          key={i}
          style={{
            position: "absolute",
            fontSize: 20 + Math.random() * 10,
            transform: [
              { translateX: h.x },
              { translateY: h.y },
              { scale: h.scale },
            ],
            opacity: h.opacity,
          }}
        >
          💗
        </Animated.Text>
      ))}

      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

        {/* 💘 HEADER CONTAINER */}
        <View style={styles.headerBox}>
          <Text style={styles.youText}>You</Text>

          <View style={styles.meRow}>
            <Animated.Text
              style={[
                styles.heart,
                {
                  transform: [
                    { scale: heartScale },
                    { translateY: heartY },
                  ],
                },
              ]}
            >
              ❤️
            </Animated.Text>

            <Text style={styles.meText}>Me</Text>
          </View>
        </View>

        {/* GLASS CARD */}
        <BlurView intensity={60} tint="light" style={styles.glassCard}>

          <TouchableOpacity onPress={pickImage}>
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                transform: [{ translateX: tiltX }, { translateY: tiltY }],
              }}
            >
              <Image
                source={{
                  uri: localAvatar || avatar || DEFAULT_AVATAR,
                }}
                style={styles.avatar}
              />
            </Animated.View>
            <Text style={styles.editText}>Edit Photo</Text>
          </TouchableOpacity>

          <TextInput
            placeholder="Your tagline..."
            value={localTagline}
            onChangeText={setLocalTagline}
            style={styles.input}
          />

          {userId === "" && (
            <>
              <TextInput
                placeholder="Username"
                value={localUsername}
                onChangeText={setLocalUsername}
                style={styles.input}
              />

              <TextInput
                placeholder="Password"
                secureTextEntry
                value={localpassword}
                onChangeText={setPassword}
                style={styles.input}
              />

              <AnimatedButton style={styles.button} onPress={enterApp}>
                <Text style={styles.buttonText}>Login</Text>
              </AnimatedButton>

              <AnimatedButton style={styles.button} onPress={register}>
                <Text style={styles.buttonText}>Register</Text>
              </AnimatedButton>
            </>
          )}

          {userId !== "" && (
            <>
              <Text style={styles.username}>{localUsername}</Text>

              <AnimatedButton style={styles.button} onPress={enterApp}>
                <Text style={styles.buttonText}>Enter</Text>
              </AnimatedButton>

              <AnimatedButton style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout</Text>
              </AnimatedButton>
            </>
          )}

        </BlurView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  headerBox: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 20,
  },

  youText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FF4E50",
  },

  meRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  meText: {
    fontSize: 48,
    fontWeight: "700",
    marginLeft: 8,
    color: "#FF4E50",
  },

  heart: {
    fontSize: 38,
  },

  glassCard: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 24,
    padding: 20,
  },

  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: "center",
  },

  editText: {
    textAlign: "center",
    color: "#007AFF",
    marginTop: 8,
  },

  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginVertical: 8,
  },

  button: {
    backgroundColor: "#FF4E50",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  logoutButton: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },

  logoutText: {
    color: "#FF3B30",
    fontWeight: "600",
  },

  username: {
    textAlign: "center",
    fontSize: 24,
    marginVertical: 10,
  },
});