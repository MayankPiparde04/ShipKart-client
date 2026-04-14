import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SnackbarType = "info" | "success" | "error";

interface SnackbarMessage {
  text: string;
  type: SnackbarType;
}

interface SnackbarContextValue {
  showSnackbar: (text: string, type?: SnackbarType, durationMs?: number) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const stylesByType: Record<SnackbarType, string> = {
  info: "border-[#007FFF]/45 bg-[#001933]",
  success: "border-[#007FFF]/55 bg-[#001933]",
  error: "border-[#FFB347]/55 bg-[#2A1E08]",
};

const textByType: Record<SnackbarType, string> = {
  info: "text-white",
  success: "text-white",
  error: "text-[#FFB347]",
};

export function SnackbarProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [message, setMessage] = useState<SnackbarMessage | null>(null);
  const slideY = useRef(new Animated.Value(80)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSnackbar = useCallback(
    (text: string, type: SnackbarType = "info", durationMs = 2600) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      setMessage({ text, type });
      Animated.timing(slideY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();

      hideTimeoutRef.current = setTimeout(() => {
        Animated.timing(slideY, {
          toValue: 80,
          duration: 160,
          useNativeDriver: true,
        }).start(() => {
          setMessage(null);
        });
      }, durationMs);
    },
    [slideY],
  );

  const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

  return (
    <SnackbarContext.Provider value={value}>
      <View className="flex-1">
        {children}
        {message && (
          <SafeAreaView pointerEvents="box-none" className="absolute bottom-0 left-0 right-0 z-[200] px-4 pb-4">
            <Animated.View
              style={{ transform: [{ translateY: slideY }] }}
              className={`rounded-card border px-4 py-3 shadow-azure-glow ${stylesByType[message.type]}`}
            >
              <Text className={`text-center text-sm font-medium ${textByType[message.type]}`}>
                {message.text}
              </Text>
            </Animated.View>
          </SafeAreaView>
        )}
      </View>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within SnackbarProvider");
  }

  return context;
}
