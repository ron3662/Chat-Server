import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function Home() {
  const router = useRouter();

  const {
    userId,
    username,
    avatar,
    tagline,
    saveUser,
    logout,
  } = useUser();

  const isLoggedIn = !!userId;

  const [localUsername, setLocalUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localTagline, setLocalTagline] = useState(tagline || "");
  const [localAvatar, setLocalAvatar] = useState(avatar || "");

  // 📸 pick image
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ FIXED
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLocalAvatar(result.assets[0].uri);
    }
  };

  // 🆕 REGISTER
  const register = async () => {
    try {
      const formData = new FormData();

      formData.append("file", {
        uri: localAvatar || "",
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("username", localUsername);
      formData.append("password", password);
      formData.append("tagline", localTagline);

      const res = await axios.post(`${SERVER_URL}/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await saveUser(res.data);

      Alert.alert("Registered successfully");
    } catch (err) {
      console.log(err);
      Alert.alert("Registration failed");
    }
  };

  // 🚀 ENTER APP
  const enter = async () => {
    try {
      const formData = new FormData();

      formData.append("file", {
        uri: localAvatar || "",
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("username", localUsername);
      formData.append("password", password);
      formData.append("tagline", localTagline);
      
      const res = await axios.post(`${SERVER_URL}/login`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await saveUser(res.data);

      router.replace("/people");
    } catch {
      Alert.alert("Enter failed");
    }
  };

  return (
    <View style={styles.container}>
      {/* 🖼 Avatar */}
      <TouchableOpacity onPress={pickImage}>
        <Image
          source={{
            uri:
              localAvatar ||
              "https://via.placeholder.com/150",
          }}
          style={styles.avatar}
        />
      </TouchableOpacity>

      {/* ✍️ Tagline */}
      <TextInput
        placeholder="Your tagline..."
        value={localTagline}
        onChangeText={setLocalTagline}
        style={styles.input}
      />

      {/* 🆕 FIRST TIME USER */}
      {!isLoggedIn && (
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
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity style={styles.button} onPress={register}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </>
      )}

      {/* 🔁 RETURNING USER */}
      {isLoggedIn && (
        <>
          <Text style={styles.username}>{username}</Text>

          <TouchableOpacity style={styles.button} onPress={enter}>
            <Text style={styles.buttonText}>Enter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: "red" }]}
            onPress={logout}
          >
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#25D366",
    padding: 12,
    width: "100%",
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  username: {
    fontSize: 18,
    marginVertical: 10,
  },
});