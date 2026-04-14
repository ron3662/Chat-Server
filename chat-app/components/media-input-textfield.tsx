import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";

export function MediaInputTextField({
  chatMessage,
  onRemoveMedia,
  handleTyping,
  sendMessage,
}) {
  return (
    <View style={styles.inputContainer}>
      {/* 📂 Selected Files (WRAPS properly) */}
      {chatMessage.media.length > 0 && (
        <View style={styles.filesContainer}>
          {chatMessage.media.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              {file.mediaType === "image" || file.mediaType === "gif" ? (
                <Image
                  source={{ uri: file.mediaUrl }}
                  style={styles.fileImage}
                />
              ) : file.mediaType === "video" ? (
                <Image
                  source={{ uri: file.mediaPreviewUrl }}
                  style={styles.fileImage}
                />
              ) : (
                <View
                  style={[
                    styles.fileImage,
                    { justifyContent: "center", alignItems: "center" },
                  ]}
                >
                  <Text>📄</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  onRemoveMedia(index);
                }}
              >
                <Text style={{ fontSize: 14, color: "#fff" }}>❌</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* 📝 Text input ALWAYS at bottom */}
      <TextInput
        style={styles.chatInput}
        value={chatMessage.text || ""}
        onChangeText={handleTyping}
        placeholder="Type a message..."
        placeholderTextColor="#888"
        returnKeyType="send"
        onSubmitEditing={() => sendMessage()}
        multiline
        maxHeight={80}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  inputContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    justifyContent: "flex-end",
  },

  filesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },

  fileItem: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },

  fileImage: {
    width: "100%",
    height: "100%",
  },

  removeButton: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "rgba(255, 0, 0, 0.8)",
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },

  chatInput: {
    minHeight: 40,
    maxHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: "#fff",
    color: "#000",
  },
});
