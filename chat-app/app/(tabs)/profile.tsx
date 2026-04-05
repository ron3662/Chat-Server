// app/(tabs)/profile.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useUser } from "../../context/UserContext";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import axios from "axios";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function Profile() {
  const router = useRouter();
  const { userId, username, setUsername, avatar, setAvatar, tagline, setTagline, saveUser, logout } = useUser();

// ✅ PICK IMAGE (FIXED)
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ✅ FIX (no more error)
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

    // ✅ UPLOAD IMAGE TO SERVER
  const uploadImage = async (uri: string) => {
    try {
      const formData = new FormData();

      formData.append("file", {
        uri,
        name: "avatar.jpg",
        type: "image/jpeg",
      } as any);

      const res = await axios.post(`${SERVER_URL}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAvatar(res.data.url);
    } catch (err) {
      console.log(err);
      Alert.alert("Upload failed");
    }
  };

  const saveProfile = async () => {
    try {
      await axios.post(`${SERVER_URL}/updateProfile`, { userId, username, avatar, tagline });
      await saveUser({ userId, username, avatar, tagline });
      Alert.alert("Profile updated");
    } catch (e) {
      Alert.alert("Failed to update profile");
    }
  };

  const setLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatar || "https://i.pravatar.cc/150" }} style={styles.avatar} />
      <TouchableOpacity onPress={pickImage}><Text style={{ color: "#25D366" }}>Change Avatar</Text></TouchableOpacity>

      <Text>Display Name</Text>
      <TextInput style={styles.input} value={username} onChangeText={setUsername} />

      <Text>Tagline</Text>
      <TextInput style={styles.input} value={tagline} onChangeText={setTagline} />

      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "red" }]} onPress={setLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 5 },
  button: { backgroundColor: "#25D366", padding: 12, borderRadius: 8, marginVertical: 5, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
});