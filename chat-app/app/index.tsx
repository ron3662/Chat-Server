import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from "react-native";
import axios from "axios";
import { useRouter } from "expo-router";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const login = async () => {
    try {
      const res = await axios.post(`${SERVER_URL}/login`, { username, password });
      router.replace({ pathname: "(tabs)/people", params: { userId: res.data.userId } });
    } catch {
      Alert.alert("Login failed");
    }
  };

  const register = async () => {
    try {
      await axios.post(`${SERVER_URL}/register`, { username, password });
      Alert.alert("Registered successfully");
    } catch {
      Alert.alert("Registration failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat App</Text>
      <TextInput placeholder="Username" style={styles.input} value={username} onChangeText={setUsername} />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={styles.button} onPress={register}><Text style={styles.buttonText}>Register</Text></TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={login}><Text style={styles.buttonText}>Login</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:20 },
  title: { fontSize:24, textAlign:'center', marginBottom:20 },
  input: { borderWidth:1, padding:10, borderRadius:5, marginBottom:10 },
  button: { backgroundColor:'#25D366', padding:12, borderRadius:8, marginVertical:5, alignItems:'center' },
  buttonText: { color:'#fff', fontWeight:'bold' },
});