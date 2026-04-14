import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export default function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ opacity }}
      className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 p-4"
    >
      <View className="mb-3 h-4 w-3/5 rounded bg-navy-800/50" />
      <View className="mb-2 h-3 w-2/5 rounded bg-navy-800/45" />
      <View className="h-3 w-4/5 rounded bg-navy-800/45" />
    </Animated.View>
  );
}
