// app/_layout.tsx
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import "./global.css";

// Disable Reanimated strict mode warnings caused by NativeWind v4 internal style animations
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BoxProvider } from "@/contexts/BoxContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { OptimalProvider } from "@/contexts/OptimalContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import NetInfo from "@react-native-community/netinfo";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Check internet connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && loaded && isConnected) {
      const inAuthGroup = segments[0] === "(tabs)";

      if (user && !inAuthGroup) {
        router.replace("/(tabs)");
      } else if (!user && inAuthGroup) {
        router.replace("/login");
      }
    }
  }, [user, isLoading, loaded, segments, isConnected]);

  if (!loaded) return null;

  if (isConnected === false) {
    return (
      <View className="flex-1 justify-center items-center bg-white/70 dark:bg-gray-950 px-6">
        <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-4 text-center">
          🚫 No Internet Connection
        </Text>
        <Text className="text-lg text-gray-600 dark:text-gray-300 text-center">
          Please check your connection and try again.
        </Text>
      </View>
    );
  }

  if (isLoading || isConnected === null) {
    return (
      <View className="flex-1 justify-center items-center bg-white/70 dark:bg-gray-950">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen
            name="activationpage"
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="+not-found" />
        </Stack>
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <BoxProvider>
          <OptimalProvider>
            <RootLayoutNav />
          </OptimalProvider>
        </BoxProvider>
      </InventoryProvider>
    </AuthProvider>
  );
}
