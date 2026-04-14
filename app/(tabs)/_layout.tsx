import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

const iconMap = {
  index: "home",
  inventory: "archive",
  gemini: "camera",
  analysis: "bar-chart",
  profile: "user",
};

function createTabBarIcon(
  iconName: string,
  isCenterButton: boolean,
) {
  const TabBarIcon = ({ focused }: { focused: boolean }) => {
    const iconColor = focused ? "#EAF4FF" : "#99CCFF";
    const iconSize = isCenterButton ? 22 : 20;

    return (
      <View
        className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 ${
          focused ? "bg-azure-500" : "bg-transparent"
        }`}
      >
        <Feather name={iconName as any} size={iconSize} color={iconColor} />
      </View>
    );
  };

  TabBarIcon.displayName = `TabBarIcon(${iconName})`;
  return TabBarIcon;
}

export default function TabLayout() {
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
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === "ios" ? 82 : 72,
            backgroundColor: "#001933",
            borderTopWidth: 1,
            borderWidth: 1,
            borderColor: "rgba(5, 65, 97, 0.3)",
            borderBottomWidth: 0,
            elevation: 0,
            paddingBottom: Platform.OS === "ios" ? 16 : 10,
            paddingTop: 10,
            paddingHorizontal: 12,
          },

          tabBarIcon: createTabBarIcon(iconName, isCenterButton),
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
