import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";
import { useUser } from "../context/UserContext";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function Login() {
  const router = useRouter();
  const { setUserId, setUsername, setAvatar, setTagline } = useUser();
  const [usernameInput, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await axios.post(`${SERVER_URL}/login`, { username: usernameInput, password });
      setUserId(res.data.userId);
      setUsername(res.data.username);
      setAvatar(res.data.avatar || "https://i.pravatar.cc/150");
      setTagline(res.data.tagline || "");
      router.replace("(tabs)/people");
    } catch (e) {
      Alert.alert("Login failed");
    }
  };

  const register = async () => {
    try {
      await axios.post(`${SERVER_URL}/register`, { username: usernameInput, password });
      Alert.alert("Registered successfully");
    } catch (e) {
      Alert.alert("Registration failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat App</Text>
      <TextInput placeholder="Username" style={styles.input} value={usernameInput} onChangeText={setUsernameInput} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.button} onPress={register}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 10, padding: 10, borderRadius: 5 },
  button: { backgroundColor: "#25D366", padding: 12, borderRadius: 8, marginVertical: 5, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});