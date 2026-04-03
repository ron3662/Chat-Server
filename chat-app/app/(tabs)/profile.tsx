import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert } from "react-native";
import { useSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function Profile() {
  const { userId } = useSearchParams();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const [tagline, setTagline] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const saveProfile = async () => {
    try {
      await axios.post(`${SERVER_URL}/profile`, { userId, username, avatar, tagline });
      Alert.alert("Profile saved!");
    } catch { Alert.alert("Failed"); }
  };

  const logout = () => router.replace("/(tabs)/index");

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        <Image source={{ uri: avatar || "https://i.pravatar.cc/150?u=" + userId }} style={styles.avatar} />
      </TouchableOpacity>
      <TextInput style={styles.input} placeholder="Display Name" value={username} onChangeText={setUsername} />
      <TextInput style={styles.input} placeholder="Tagline" value={tagline} onChangeText={setTagline} />
      <TouchableOpacity style={styles.button} onPress={saveProfile}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={logout}><Text style={styles.buttonText}>Logout</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:20, backgroundColor:"#fff", alignItems:"center" },
  input: { borderWidth:1, padding:10, borderRadius:5, marginVertical:5, width:"100%" },
  button: { backgroundColor:"#25D366", padding:12, borderRadius:8, marginVertical:5, width:"100%", alignItems:"center" },
  buttonText: { color:"#fff", fontWeight:"bold" },
  avatar: { width:100, height:100, borderRadius:50, marginBottom:15 },
});