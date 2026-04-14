import { Feather } from "@expo/vector-icons";
import { History } from "lucide-react-native";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

const iconMap = {
  index: "home",
  inventory: "archive",
  gemini: "camera",
  analysis: "bar-chart",
  history: "clock",
  profile: "user",
};

function createRouteTabIcon(
  iconName: string,
  isCenterButton: boolean,
  isHistoryRoute: boolean,
) {
  const TabBarIcon = ({ focused }: { focused: boolean }) => {
    const iconColor = focused ? "#EAF4FF" : "#99CCFF";
    const iconSize = isCenterButton ? 24 : 20;

    return (
      <View className={`${isCenterButton ? "-mt-7" : "mt-0"} items-center`}>
        <View
          className={`items-center justify-center rounded-full ${isCenterButton ? "h-16 w-16 border border-[#054161] bg-[#007FFF] shadow-azure-glow" : "h-11 w-11 bg-transparent"}`}
          style={isCenterButton ? { shadowColor: "#007FFF", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } } : undefined}
        >
          {isHistoryRoute ? (
            <History size={iconSize} color={isCenterButton ? "#EAF4FF" : iconColor} strokeWidth={2} />
          ) : (
            <Feather name={iconName as any} size={iconSize} color={isCenterButton ? "#EAF4FF" : iconColor} />
          )}
        </View>
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
          tabBarShowLabel: true,

          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: Platform.OS === "ios" ? 92 : 84,
            backgroundColor: "#001933",
            borderTopWidth: 1,
            borderWidth: 1,
            borderColor: "rgba(5, 65, 97, 0.3)",
            borderBottomWidth: 0,
            elevation: 0,
            paddingBottom: Platform.OS === "ios" ? 18 : 12,
            paddingTop: 8,
            paddingHorizontal: 12,
          },

          tabBarItemStyle: {
            paddingTop: 6,
          },

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "700",
            marginBottom: Platform.OS === "ios" ? 0 : 2,
          },

          tabBarActiveTintColor: "#EAF4FF",
          tabBarInactiveTintColor: "#99CCFF",
          tabBarIcon: createRouteTabIcon(
            iconName,
            isCenterButton,
            route.name === "history",
          ),
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="inventory" options={{ title: "Inventory" }} />
      <Tabs.Screen
        name="gemini"
        options={{
          title: "Scan",
          tabBarStyle: { display: "none" },
        }}
      />
      <Tabs.Screen name="analysis" options={{ title: "Analysis" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
