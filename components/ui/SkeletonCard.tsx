import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

export default function SkeletonCard() {
  const shimmerX = useRef(new Animated.Value(-220)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 220,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => {
      loop.stop();
      shimmerX.setValue(-220);
    };
  }, [shimmerX]);

  return (
    <View className="mb-3 overflow-hidden rounded-card border border-navy-800/30 bg-navy-900 p-4">
      <Animated.View
        pointerEvents="none"
        style={{ transform: [{ translateX: shimmerX }] }}
        className="absolute inset-y-0 w-24 bg-azure-400/10"
      />
      <View className="mb-3 h-4 w-3/5 rounded bg-navy-800/50" />
      <View className="mb-2 h-3 w-2/5 rounded bg-navy-800/45" />
      <View className="h-3 w-4/5 rounded bg-navy-800/45" />
    </View>
  );
}
