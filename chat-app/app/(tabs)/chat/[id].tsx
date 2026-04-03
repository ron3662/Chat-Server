import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const SERVER_URL = 'https://chat-server-jznv.onrender.com';

export default function ChatScreen() {
  const { id: selectedUserId, userId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    axios.get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`).then(res => setMessages(res.data));

    const ws = new WebSocket('wss://chat-server-jznv.onrender.com');
    ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', userId }));
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.text) setMessages(prev => [...prev, data]);
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!chatMessage.trim() || !wsRef.current) return;
    const msg = { type: 'message', from: userId, to: selectedUserId, text: chatMessage, time: new Date() };
    wsRef.current.send(JSON.stringify(msg));
    setMessages(prev => [...prev, msg]);
    setChatMessage('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#ECE5DD' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item, i) => i.toString()}
        contentContainerStyle={{ padding: 10 }}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.from === userId;
          return (
            <View style={[styles.messageContainer, isMe ? styles.messageRight : styles.messageLeft]}>
              <Text style={styles.messageText}>{item.text}</Text>
              <Text style={styles.timeText}>{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          );
        }}
      />
      <View style={styles.inputContainer}>
        <TextInput placeholder="Type a message" value={chatMessage} onChangeText={setChatMessage} style={styles.inputBox} />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messageContainer: { maxWidth: '70%', padding: 10, marginVertical: 5, borderRadius: 10 },
  messageLeft: { backgroundColor: '#fff', alignSelf: 'flex-start', borderTopLeftRadius: 0 },
  messageRight: { backgroundColor: '#25D366', alignSelf: 'flex-end', borderTopRightRadius: 0 },
  messageText: { fontSize: 16, color: '#000' },
  timeText: { fontSize: 10, color: '#555', textAlign: 'right', marginTop: 2 },
  inputContainer: { flexDirection: 'row', padding: 5, backgroundColor: '#fff', alignItems: 'center' },
  inputBox: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16, marginRight: 5 },
  sendButton: { backgroundColor: '#25D366', width: 60, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});