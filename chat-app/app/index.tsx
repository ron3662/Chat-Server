import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

const SERVER_URL = 'https://chat-server-jznv.onrender.com';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const res = await axios.post(`${SERVER_URL}/login`, { username, password });
      router.replace('(tabs)/people', { userId: res.data.userId, username });
    } catch {
      Alert.alert('Login failed');
    }
  };

  const register = async () => {
    try {
      await axios.post(`${SERVER_URL}/register`, { username, password });
      Alert.alert('Registered successfully');
    } catch {
      Alert.alert('Registration failed');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat App</Text>
      <TextInput placeholder="Username" value={username} onChangeText={setUsername} style={styles.input} />
      <TextInput placeholder="Password" value={password} secureTextEntry onChangeText={setPassword} style={styles.input} />
      <TouchableOpacity onPress={register} style={styles.button}><Text style={styles.buttonText}>Register</Text></TouchableOpacity>
      <TouchableOpacity onPress={login} style={styles.button}><Text style={styles.buttonText}>Login</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 10, borderRadius: 8 },
  button: { backgroundColor: '#25D366', padding: 12, borderRadius: 8, marginVertical: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});