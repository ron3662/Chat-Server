import { View, StyleSheet, Image, Text, TouchableOpacity } from "react-native";
export default function MessageBubble({
  isUserMessage,
  messageItem,
  onPressPreviewItem,
  onLongPressPreviewItem,
}) {
  const getFileIcon = (type) => {
    if (type === "pdf") return "📄";
    if (type === "doc" || type === "docx") return "📝";
    if (type === "xls" || type === "xlsx") return "📊";
    if (type === "zip") return "🗜️";
    return "📁";
  };

  return (
    <View style={[styles.msg, isUserMessage ? styles.right : styles.left]}>
      {messageItem.media &&
        messageItem.media.length > 0 &&
        messageItem.media.map((mediaItem, index) => {
          if (
            mediaItem.mediaType === "image" ||
            mediaItem.mediaType === "gif"
          ) {
            return (
              <View key={index}>
                <TouchableOpacity
                  onLongPress={() => {
                    console.log("Image long pressed");
                    onLongPressPreviewItem({type: mediaItem.mediaType, url: mediaItem.mediaUrl, reactions: mediaItem.reactions, mediaIndex: index});
                  }}
                  onPress={() => {
                    console.log("Image pressed");
                    onPressPreviewItem({type: mediaItem.mediaType, url: mediaItem.mediaUrl, reactions: mediaItem.reactions, mediaIndex: index});
                  }}
                >
                  <Image
                    source={{ uri: mediaItem.mediaUrl }}
                    style={styles.mediaImage}
                  />
                </TouchableOpacity>
                {mediaItem.reactions && mediaItem.reactions.length > 0 && (
                  <View style={styles.reactionsContainer}>
                    {mediaItem.reactions.map((reaction, idx) => (
                      <View key={idx} style={styles.reactionItem}>
                        <Text style={styles.reactionIcon}>{reaction}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          } else if (mediaItem.mediaType === "video") {
            return (
              <View key={index}>
                <TouchableOpacity
                  onLongPress={() => onLongPressPreviewItem({type: mediaItem.mediaType, url: mediaItem.mediaUrl, reactions: mediaItem.reactions, mediaIndex: index})}
                  onPress={() => onPressPreviewItem({type: mediaItem.mediaType, url: mediaItem.mediaUrl, reactions: mediaItem.reactions, mediaIndex: index})}
                >
                  <View style={styles.videoContainer}>
                    <Image
                      source={{
                        uri: mediaItem.mediaPreviewUrl || "",
                      }}
                      style={styles.mediaImage}
                    />
                    <Text style={styles.playIcon}>▶️</Text>
                  </View>
                </TouchableOpacity>
                {mediaItem.reactions && mediaItem.reactions.length > 0 && (
                  <View style={styles.reactionsContainer}>
                    {mediaItem.reactions.map((reaction, idx) => (
                      <View key={idx} style={styles.reactionItem}>
                        <Text style={styles.reactionIcon}>{reaction}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          } else if (mediaItem.mediaType === "file") {
            return (
              <View key={index}>
                <TouchableOpacity
                  style={styles.filePreviewContainer}
                  onLongPress={() => onLongPressPreviewItem({type: mediaItem.mediaType, url: mediaItem.mediaUrl, reactions: mediaItem.reactions, mediaIndex: index})}
                  onPress={() => onPressPreviewItem({type: mediaItem.mediaType, url: mediaItem.mediaUrl, reactions: mediaItem.reactions, mediaIndex: index})}
                >
                  <Text style={styles.fileIcon}>
                    {getFileIcon(mediaItem.mediaType)}
                  </Text>

                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.fileName}>
                      {mediaItem.mediaName || "File"}
                    </Text>

                    <Text style={styles.fileHint}>Tap to open</Text>
                  </View>
                </TouchableOpacity>
                {mediaItem.reactions && mediaItem.reactions.length > 0 && (
                  <View style={styles.reactionsContainer}>
                    {mediaItem.reactions.map((reaction, idx) => (
                      <View key={idx} style={styles.reactionItem}>
                        <Text style={styles.reactionIcon}>{reaction}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }
          return null;
        })}
      {messageItem.text?.text && (
        <TouchableOpacity  onLongPress={() => onLongPressPreviewItem({type: "text", url: messageItem.text?.text, reactions: messageItem.text.reactions, mediaIndex: -1})}>
          <Text style={{ color: isUserMessage ? "#fff" : "#000" }}>{messageItem.text?.text}</Text>
        </TouchableOpacity>
      )}
      {messageItem.text?.reactions && messageItem.text.reactions.length > 0 && (
        <View style={styles.reactionsContainer}>
          {messageItem.text.reactions.map((reaction, index) => (
            <View key={index} style={styles.reactionItem}>
              <Text style={styles.reactionIcon}>{reaction}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  msg: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    marginHorizontal: 12,
    maxWidth: "75%",
  },

  left: {
    backgroundColor: "#eee",
    alignSelf: "flex-start",
  },

  right: {
    backgroundColor: "#25D366",
    alignSelf: "flex-end",
  },

  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 6,
  },

  videoContainer: {
    position: "relative",
    width: 200,
    height: 200,
    marginBottom: 6,
  },

  playIcon: {
    position: "absolute",
    top: "40%",
    left: "40%",
    fontSize: 40,
  },

  filePreviewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 12,
    width: 220,
    gap: 10,
  },

  fileIcon: {
    fontSize: 28,
  },

  fileName: {
    fontWeight: "600",
    color: "#000",
  },

  fileHint: {
    fontSize: 12,
    color: "#666",
  },

  reactionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 4,
  },

  reactionItem: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  reactionIcon: {
    fontSize: 18,
  },
});
