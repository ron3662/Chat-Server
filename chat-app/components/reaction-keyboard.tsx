import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

const reactions = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

export function ReactionKeyboard({ onSelect }) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 10, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {reactions.map((emoji, index) => (
        <ReactionItem key={index} emoji={emoji} onSelect={onSelect} />
      ))}
    </Animated.View>
  );
}

function ReactionItem({ emoji, onSelect }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // 🔥 small tap bounce
    scale.value = withSpring(1.4, {}, () => {
      scale.value = withSpring(1);
    });

    onSelect(emoji);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Animated.Text style={[styles.emoji, animatedStyle]}>
        {emoji}
      </Animated.Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,

    // ✨ glass effect - frosted glass
    backgroundColor: "rgba(255,255,255,0.1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",

    // shadow (android + ios)
    elevation: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
  },

  emoji: {
    fontSize: 32,
    paddingHorizontal: 4,
  },
});