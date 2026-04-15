// app/_layout.tsx
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import "./global.css";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BoxProvider } from "@/contexts/BoxContext";
import { HistoryProvider } from "@/contexts/HistoryContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { OptimalProvider } from "@/contexts/OptimalContext";
import AppErrorBoundary from "@/components/ui/AppErrorBoundary";
import StartupSplash from "@/components/ui/StartupSplash";
import { SnackbarProvider, useSnackbar } from "@/components/ui/SnackbarProvider";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemeProvider, Theme } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

// Disable Reanimated strict mode warnings caused by NativeWind v4 internal style animations
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

const industrialTheme: Theme = {
  dark: true,
  colors: {
    primary: "#007FFF",
    background: "#001224",
    card: "#001933",
    text: "#E5F2FF",
    border: "#054161",
    notification: "#3399FF",
  },
  fonts: {
    regular: {
      fontFamily: "System",
      fontWeight: "400",
    },
    medium: {
      fontFamily: "System",
      fontWeight: "500",
    },
    bold: {
      fontFamily: "System",
      fontWeight: "700",
    },
    heavy: {
      fontFamily: "System",
      fontWeight: "800",
    },
  },
};

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const { showSnackbar } = useSnackbar();
  const segments = useSegments();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const previousConnectionRef = useRef<boolean | null>(null);

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

  // Check AsyncStorage for token at startup and redirect if missing
  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token && !isLoading && loaded) {
          // Token is missing, redirect to login
          router.replace("/login");
        }
      } catch (error) {
        console.error("Error checking auth token:", error);
      }
    };

    if (!isLoading && loaded) {
      checkAuthToken();
    }
  }, [isLoading, loaded]);

  useEffect(() => {
    const previous = previousConnectionRef.current;
    if (previous === false && isConnected === true) {
      showSnackbar("Back online", "success");
    } else if (isConnected === false) {
      showSnackbar("Offline - Reconnecting...", "info", 3200);
    }

    previousConnectionRef.current = isConnected;
  }, [isConnected, showSnackbar]);

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
      <View className="flex-1 items-center justify-center bg-navy-950 px-6">
        <Text className="mb-4 text-center text-3xl font-bold text-azure-50">
          🚫 No Internet Connection
        </Text>
        <Text className="text-center text-lg text-azure-200">
          Please check your connection and try again.
        </Text>
      </View>
    );
  }

  if (isLoading || isConnected === null) {
    return <StartupSplash statusText="Loading secure workspace" />;
  }

  return (
    <ThemeProvider value={industrialTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen
          name="activationpage"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <SnackbarProvider>
        <AuthProvider>
          <InventoryProvider>
            <BoxProvider>
              <HistoryProvider>
                <OptimalProvider>
                  <RootLayoutNav />
                </OptimalProvider>
              </HistoryProvider>
            </BoxProvider>
          </InventoryProvider>
        </AuthProvider>
      </SnackbarProvider>
    </AppErrorBoundary>
  );
}
