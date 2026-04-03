import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const SERVER_URL = 'https://chat-server-jznv.onrender.com';

export default function People() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    axios.get(`${SERVER_URL}/online-users`).then(res => {
      setOnlineUsers(res.data.filter(u => u._id !== userId));
    });

    const ws = new WebSocket('wss://chat-server-jznv.onrender.com');
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', userId }));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'online') setOnlineUsers(data.users.filter(u => u._id !== userId));
    };

    return () => ws.close();
  }, []);

  return (
    <View style={{ flex: 1, paddingTop: 20 }}>
      <FlatList
        data={onlineUsers}
        keyExtractor={item => item._id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => router.push(`/chat/${item._id}?userId=${userId}`)}>
            <Image source={{ uri: item.avatar || 'https://i.pravatar.cc/150?u=' + item._id }} style={styles.avatar} />
            <Text style={{ fontSize: 18 }}>{item.username} 🟢</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  userItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#ccc' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
});