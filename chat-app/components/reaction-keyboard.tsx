import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

const reactions = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

export function ReactionKeyboard({ visible, position, onClose, onSelect }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1.2, { damping: 8 });
      opacity.value = withTiming(1);
    } else {
      scale.value = withTiming(0);
      opacity.value = withTiming(0);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      
      {/* 🔥 Blur Background */}
      <BlurView intensity={50} style={StyleSheet.absoluteFill}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
      </BlurView>

      {/* 💬 Reaction Bar */}
      <Animated.View
        style={[
          styles.reactionBar,
          {
            top: position.y - 60,
            left: position.x,
          },
          animatedStyle,
        ]}
      >
        {reactions.map((emoji, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  reactionBar: {
    position: "absolute",
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 30,
    elevation: 10,
  },
  emoji: {
    fontSize: 24,
    marginHorizontal: 6,
  },
});