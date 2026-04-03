import { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const SERVER_URL = 'https://chat-server-jznv.onrender.com';

export default function Profile() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('https://i.pravatar.cc/150');
  const [tagline, setTagline] = useState('');

  useEffect(() => {
    axios.get(`${SERVER_URL}/user/${userId}`).then(res => {
      setUsername(res.data.username);
      setAvatar(res.data.avatar || avatar);
      setTagline(res.data.tagline || '');
    });
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.cancelled) setAvatar(result.uri);
  };

  const saveProfile = async () => {
    try {
      await axios.post(`${SERVER_URL}/user/${userId}/update`, { username, avatar, tagline });
      Alert.alert('Profile updated');
    } catch {
      Alert.alert('Update failed');
    }
  };

  const logout = () => router.replace('/');

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TouchableOpacity onPress={pickImage}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <Text style={{ textAlign: 'center' }}>Change Photo</Text>
      </TouchableOpacity>

      <Text>Display Name</Text>
      <TextInput value={username} onChangeText={setUsername} style={styles.input} />

      <Text>Tagline</Text>
      <TextInput value={tagline} onChangeText={setTagline} style={styles.input} />

      <TouchableOpacity onPress={saveProfile} style={styles.button}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
      <TouchableOpacity onPress={logout} style={[styles.button, { backgroundColor: '#f44336' }]}><Text style={styles.buttonText}>Logout</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 5, borderRadius: 8 },
  button: { backgroundColor: '#25D366', padding: 12, borderRadius: 8, marginVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});