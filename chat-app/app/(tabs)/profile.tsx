import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter, useSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function Profile() {
  const { userId } = useSearchParams();
  const router = useRouter();
  const [avatar, setAvatar] = useState("");
  const [username, setUsername] = useState("");
  const [tagline, setTagline] = useState("");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType.Images });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const logout = () => router.replace("/");

  return (
    <View style={{ flex:1, padding:20 }}>
      <TouchableOpacity onPress={pickImage}>
        <Image source={{ uri: avatar || "https://i.pravatar.cc/150" }} style={{ width:100, height:100, borderRadius:50, alignSelf:'center' }} />
      </TouchableOpacity>
      <TextInput placeholder="Display Name" style={styles.input} value={username} onChangeText={setUsername} />
      <TextInput placeholder="Tagline" style={styles.input} value={tagline} onChangeText={setTagline} />
      <TouchableOpacity style={styles.button} onPress={logout}><Text style={{color:'#fff'}}>Logout</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input:{ borderWidth:1, padding:10, borderRadius:5, marginVertical:10 },
  button:{ backgroundColor:'#25D366', padding:12, borderRadius:8, alignItems:'center', marginTop:20 },
});