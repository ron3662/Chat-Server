import { View, StyleSheet, Image, Text, TouchableOpacity } from "react-native";
import { Modal, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { Video } from "expo-av";

export default function MediaPreview({ previewMedia, previewType, onClose }) {
  return (
    <Modal
      visible={!!previewMedia}
      transparent
      animationType="fade"
      onRequestClose={() => {
        onClose();
      }}
    >
      <Pressable
        style={styles.previewBackdrop}
        onPress={() => {
          onClose();
        }}
      >
        <BlurView intensity={90} tint="dark" style={{ flex: 1 }} />
      </Pressable>
      <View style={styles.previewContainer}>
        {(previewType === "image" || previewType === "gif") && previewMedia && (
          <Image
            source={{ uri: previewMedia }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}
        {previewType === "video" && previewMedia && (
          <View style={styles.previewVideoContainer}>
            <Video
              source={{ uri: previewMedia }}
              style={{ width: "90%", height: "80%" }}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          </View>
        )}
        <TouchableOpacity
          style={styles.closePreviewButton}
          onPress={() => {
            onClose();
          }}
        >
          <Text style={{ fontSize: 28, color: "#fff" }}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  previewBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  previewContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },

  previewImage: {
    width: "90%",
    height: "80%",
    borderRadius: 20,
  },

  previewVideoContainer: {
    width: "90%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  previewPlayButton: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  closePreviewButton: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});
