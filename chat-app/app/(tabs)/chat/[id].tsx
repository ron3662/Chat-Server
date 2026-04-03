import { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useSearchParams } from "expo-router";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const SERVER_URL = "https://chat-server-jznv.onrender.com";

export default function ChatScreen() {
  const { userId, id: selectedUserId } = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    axios.get(`${SERVER_URL}/messages/${userId}/${selectedUserId}`).then(res => setMessages(res.data));
    const ws = new WebSocket("wss://chat-server-jznv.onrender.com");
    ws.onopen = () => ws.send(JSON.stringify({ type: "auth", userId }));
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.from === selectedUserId) setMessages(prev => [...prev, data]);
    };
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (!chatMessage.trim() || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type:"message", from:userId, to:selectedUserId, text:chatMessage, time:new Date() }));
    setMessages(prev => [...prev, { from:userId, text:chatMessage, time:new Date() }]);
    setChatMessage("");
  };

  return (
    <View style={{ flex:1, padding:10 }}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_,i)=>i.toString()}
        renderItem={({item})=>(
          <View style={[styles.msg, item.from===userId?styles.right:styles.left]}>
            <Text style={{color:item.from===userId?'#fff':'#000'}}>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated:true })}
      />
      <View style={{ flexDirection:'row', alignItems:'center' }}>
        <TextInput style={{ flex:1,borderWidth:1,padding:10,borderRadius:25 }} value={chatMessage} onChangeText={setChatMessage} />
        <TouchableOpacity onPress={sendMessage}><Ionicons name="send" size={28} color="#25D366"/></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  msg:{ padding:10, marginVertical:5, borderRadius:10, maxWidth:'70%' },
  left:{ backgroundColor:'#eee', alignSelf:'flex-start' },
  right:{ backgroundColor:'#25D366', alignSelf:'flex-end' },
});