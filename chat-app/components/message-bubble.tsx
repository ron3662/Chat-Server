import { View, StyleSheet, Image, Text, TouchableOpacity } from "react-native";
import { useRef } from "react";
export default function MessageBubble({
  isUserMessage,
  text,
  media,
  handleFilePreview,
  onLongPress,
}) {
  const bubbleRef = useRef<View>(null);

  const getFileIcon = (type) => {
    if (type === "pdf") return "📄";
    if (type === "doc" || type === "docx") return "📝";
    if (type === "xls" || type === "xlsx") return "📊";
    if (type === "zip") return "🗜️";
    return "📁";
  };

  const handleLongPress = () => {
    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onLongPress?.({ x, y });
    });
  };

  return (
    <View style={[styles.msg, isUserMessage ? styles.right : styles.left]}>
      {media &&
        media.length > 0 &&
        media.map((mediaItem, index) => {
          if (
            mediaItem.mediaType === "image" ||
            mediaItem.mediaType === "gif"
          ) {
            return (
              <TouchableOpacity
                key={index}
                ref={bubbleRef}
                onLongPress={handleLongPress}
                onPress={() => {
                  handleFilePreview(mediaItem.mediaType, mediaItem.mediaUrl);
                }}
              >
                <Image
                  source={{ uri: mediaItem.mediaUrl }}
                  style={styles.mediaImage}
                />
              </TouchableOpacity>
            );
          } else if (mediaItem.mediaType === "video") {
            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  handleFilePreview(mediaItem.mediaType, mediaItem.mediaUrl);
                }}
                ref={bubbleRef}
                onLongPress={handleLongPress}
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
            );
          } else if (mediaItem.mediaType === "file") {
            return (
              <TouchableOpacity
                style={styles.filePreviewContainer}
                onPress={() =>
                  handleFilePreview(mediaItem.mediaType, mediaItem.mediaUrl)
                }
                ref={bubbleRef}
                onLongPress={handleLongPress}
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
            );
          }
          return null;
        })}
      {text && (
        <Text style={{ color: isUserMessage ? "#fff" : "#000" }}>{text}</Text>
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
});
