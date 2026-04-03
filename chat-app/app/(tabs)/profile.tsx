import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSearchParams, useRouter } from "expo-router";

export default function ProfileTab() {
  const { userId } = useSearchParams();
  const router = useRouter();
  const [avatar, setAvatar] = useState("https://i.pravatar.cc/150?u=dummy");
  const [displayName, setDisplayName] = useState("Your Name");
  const [tagline, setTagline] = useState("Hello!");

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.cancelled) setAvatar(result.uri);
  };

  const logout = () => router.replace("/");

  return (
    <View style={{ flex: 1, alignItems: "center", padding: 20 }}>
      <TouchableOpacity onPress={pickImage}>
        <Image source={{ uri: avatar }} style={{ width: 120, height: 120, borderRadius: 60 }} />
      </TouchableOpacity>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Display Name" />
      <TextInput style={styles.input} value={tagline} onChangeText={setTagline} placeholder="Tagline" />
      <TouchableOpacity style={styles.button} onPress={logout}><Text style={styles.buttonText}>Logout</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input: { width: "100%", borderWidth: 1, padding: 10, borderRadius: 8, marginVertical: 10 },
  button: { backgroundColor: "#25D366", padding: 12, borderRadius: 8, marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});