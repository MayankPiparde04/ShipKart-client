import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function WelcomeScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (!isLoading && !user) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, user, fadeAnim, slideAnim]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-[#0f172a]">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // If user is authenticated, RootLayout gracefully redirects to dashboard.
  if (user) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-[#0f172a]">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#0f172a]">
      <StatusBar style={isDark ? "light" : "dark"} translucent />

      <View className="flex-1 justify-center items-center px-8 relative">
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Logo Hexagon / Hero Graphic */}
          <View className="w-32 h-32 bg-indigo-600 dark:bg-indigo-500 rounded-[36px] items-center justify-center mb-10 shadow-2xl shadow-indigo-600/40 rotate-[10deg]">
            <View className="rotate-[-10deg]">
              <FontAwesome5 name="shipping-fast" size={56} color="white" />
            </View>
          </View>

          {/* Typography */}
          <Text className="text-5xl font-extrabold text-gray-900 dark:text-white mb-4 text-center tracking-tight">
            ShipWise
          </Text>
          <Text className="text-lg text-gray-500 dark:text-gray-400 text-center font-medium leading-relaxed max-w-[280px] mb-16">
            Max volume. Min waste.{"\n"}The smarter way to pack and ship.
          </Text>

          {/* Action Button */}
          <TouchableOpacity
            className="w-full bg-indigo-600 dark:bg-indigo-500 py-5 rounded-[24px] shadow-xl shadow-indigo-600/30 flex-row justify-center items-center active:bg-indigo-700"
            onPress={() => router.replace("/login")}
          >
            <Text className="text-white text-xl font-bold tracking-wide mr-3">
              Get Started
            </Text>
            <FontAwesome5 name="arrow-right" size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
