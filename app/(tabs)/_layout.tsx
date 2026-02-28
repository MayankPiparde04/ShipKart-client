import { useColorScheme } from "@/hooks/useColorScheme";
import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, Text, View } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const iconMap = {
    index: "home",
    inventory: "archive",
    gemini: "camera",
    analysis: "bar-chart",
    profile: "user",
  };

  return (
    <Tabs
      screenOptions={({ route }) => {
        const iconName = iconMap[route.name as keyof typeof iconMap];
        const isCenterButton = route.name === "gemini";

        return {
          headerShown: false,
          tabBarShowLabel: false,

          tabBarStyle: {
            position: "absolute",
            bottom: Platform.OS === "ios" ? 20 : 16,
            left: 16,
            right: 16,
            height: 64,
            borderRadius: 32,
            backgroundColor: isDark ? "#1e293b" : "#ffffff", // slate-800 or white
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            paddingHorizontal: 8,
          },

          tabBarIcon: ({ focused }) => {
            if (isCenterButton) {
              return (
                <View className="items-center justify-center w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/30 -mt-6 border-4 border-white dark:border-[#0f172a]">
                  <Feather name={iconName as any} size={24} color="white" />
                </View>
              );
            }

            return (
              <View
                className={`flex-col items-center justify-center rounded-2xl py-1 min-w-[64px] transition-colors duration-200 ${
                  focused
                    ? isDark
                      ? "bg-indigo-900/40"
                      : "bg-indigo-50"
                    : "bg-transparent"
                }`}
              >
                <Feather
                  name={iconName as any}
                  size={20}
                  color={
                    focused
                      ? isDark
                        ? "#818cf8" // indigo-400
                        : "#4f46e5" // indigo-600
                      : isDark
                        ? "#94a3b8" // slate-400
                        : "#64748b" // slate-500
                  }
                />
                {focused && (
                  <Text
                    className={`text-[10px] font-bold mt-0.5 ${
                      isDark ? "text-indigo-400" : "text-indigo-600"
                    }`}
                  >
                    {route.name.charAt(0).toUpperCase() + route.name.slice(1)}
                  </Text>
                )}
              </View>
            );
          },
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="inventory" options={{ title: "Inventory" }} />
      <Tabs.Screen
        name="gemini"
        options={{ title: "Scan", tabBarStyle: { display: "none" } }}
      />
      <Tabs.Screen name="analysis" options={{ title: "Analysis" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
