import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { useGIFs } from "@/services/gif-services";

export function EmojiKeyboard({
  onGifSelect,
  onEmojiSelect,
  onTenorGifSelect,
}) {
  const emojis = ["😀", "😂", "😍", "🔥", "👍", "🎉", "❤️", "😎", "🚀", "💯"];
  const gifs = ["🎊", "🎈", "🎁", "⭐", "✨", "🌟", "💫", "🌈", "🦋", "🌺"];

  const [gifQuery, setGifQuery] = useState("");
  const { gifResults, loadingGifs, fetchTrendingGIFs, fetchGifQuery } =
    useGIFs();

  //fetch trending gifs on mount
  useEffect(() => {
    fetchTrendingGIFs();
  }, []);

  useEffect(() => {
    if (gifQuery != "") fetchGifQuery(gifQuery);
  }, [gifQuery]);

  return (
    <ScrollView
      style={styles.emojiPickerContainer}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.emojiSection}>
        <Text style={styles.emojiSectionTitle}>Emojis</Text>
        <View style={styles.emojiGrid}>
          {emojis.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiButton}
              onPress={() => {
                onEmojiSelect(emoji);
              }}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.emojiSection}>
        <Text style={styles.emojiSectionTitle}>GIFs & Stickers</Text>
        <View style={styles.emojiGrid}>
          {gifs.map((gif) => (
            <TouchableOpacity
              key={gif}
              style={styles.emojiButton}
              onPress={() => {
                onGifSelect(gif);
              }}
            >
              <Text style={styles.emojiText}>{gif}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.emojiSection}>
        <Text style={styles.emojiSectionTitle}>
          {gifQuery ? "Search Results" : "Trending GIFs 🔥"}
        </Text>

        {/* 🔍 Search */}
        <TextInput
          placeholder="Search GIFs..."
          value={gifQuery}
          onChangeText={setGifQuery}
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            padding: 8,
            marginBottom: 10,
          }}
        />

        {/* ⏳ Loader */}
        {loadingGifs && <ActivityIndicator size="small" />}

        {/* 🎞️ GIF Grid */}
        <FlatList
          data={gifResults}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false} // IMPORTANT (parent ScrollView handles scroll)
          renderItem={({ item }) => {
            const gifUrl = item?.media?.[0]?.gif?.url;

            if (!gifUrl) return null;

            return (
              <TouchableOpacity
                style={{ flex: 1, margin: 4 }}
                onPress={() => {
                  onTenorGifSelect(gifUrl);
                }}
              >
                <Image
                  source={{ uri: gifUrl }}
                  style={{
                    width: "100%",
                    height: 120,
                    borderRadius: 10,
                  }}
                />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
 emojiPickerContainer: {
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 240,
  },

  emojiSection: {
    marginBottom: 12,
  },

  emojiSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#666",
  },

  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  emojiButton: {
    width: "22%",
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
  },

  emojiText: {
    fontSize: 24,
  },
});
