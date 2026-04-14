import { useAuth } from "@/contexts/AuthContext";
import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BoxIcon, Package, TrendingUp } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BarChart } from "react-native-chart-kit";

export default function Home() {
  const { user } = useAuth();
  const { items, dailyData, dailySold } = useInventory();
  const { boxes } = useBoxes();
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Memoize chart data to prevent unnecessary recalculations
  const addItemData = useMemo(
    () =>
      Array.isArray(dailyData) && dailyData.length === 7
        ? dailyData.map((d) => ({
            label: d.day.slice(0, 3),
            count: d.quantity,
          }))
        : [
            { label: "Mon", count: 0 },
            { label: "Tue", count: 0 },
            { label: "Wed", count: 0 },
            { label: "Thu", count: 0 },
            { label: "Fri", count: 0 },
            { label: "Sat", count: 0 },
            { label: "Sun", count: 0 },
          ],
    [dailyData],
  );

  const sellItemData = useMemo(
    () =>
      Array.isArray(dailySold) && dailySold.length === 7
        ? dailySold.map((d) => ({
            label: d.day.slice(0, 3),
            count: d.quantity,
          }))
        : [
            { label: "Mon", count: 0 },
            { label: "Tue", count: 0 },
            { label: "Wed", count: 0 },
            { label: "Thu", count: 0 },
            { label: "Fri", count: 0 },
            { label: "Sat", count: 0 },
            { label: "Sun", count: 0 },
          ],
    [dailySold],
  );

  useEffect(() => {
    setLoading(false);
  }, []);

  const totalQuantity = useMemo(
    () =>
      Array.isArray(items)
        ? items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0,
    [items],
  );

  const insets = useSafeAreaInsets();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth > 600 ? screenWidth - 96 : screenWidth - 48; // adapt for tablet vs mobile

  const formatChartData = useMemo(
    () => (data: any[]) => ({
      labels: Array.isArray(data) ? data.map((d) => d.label) : [],
      datasets: [{ data: Array.isArray(data) ? data.map((d) => d.count) : [] }],
    }),
    [],
  );

  // Chart configuration memoized to prevent re-renders
  const chartConfig = useMemo(
    () => ({
      backgroundColor: "transparent",
      backgroundGradientFrom: isDark ? "#1e293b" : "#ffffff", // slate-800 or white
      backgroundGradientTo: isDark ? "#1e293b" : "#ffffff",
      decimalPlaces: 0,
      color: (opacity = 1) =>
        isDark
          ? `rgba(129, 140, 248, ${opacity})`
          : `rgba(79, 70, 229, ${opacity})`, // indigo-400 or indigo-600
      labelColor: (opacity = 1) =>
        isDark
          ? `rgba(248, 250, 252, ${opacity})`
          : `rgba(15, 23, 42, ${opacity})`, // slate-50 or slate-900
      style: {
        borderRadius: 24,
      },
      propsForBackgroundLines: {
        stroke: isDark ? "#334155" : "#f1f5f9", // slate-700 or slate-100
        strokeWidth: 1,
        strokeDasharray: "4",
      },
      propsForLabels: {
        fontSize: 12,
        fontWeight: "600",
      },
      barPercentage: 0.5,
      fillShadowGradient: isDark ? "#6366f1" : "#4f46e5", // indigo-500 or indigo-600
      fillShadowGradientOpacity: 0.8,
    }),
    [isDark],
  );

  const chartStyle = {
    marginVertical: 8,
    borderRadius: 24,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-[#0f172a]">
      <StatusBar style={isDark ? "light" : "dark"} translucent />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header Section */}
        <View
          className="px-6 pb-6 pt-12 bg-indigo-600 dark:bg-[#1e293b] rounded-b-[40px] shadow-lg shadow-indigo-500/20 z-10"
          style={{ paddingTop: Math.max(insets.top + 16, 48) }}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="text-indigo-100 dark:text-slate-400 text-sm font-medium tracking-wider uppercase mb-1">
                Dashboard
              </Text>
              <Text className="text-white text-3xl font-extrabold tracking-tight">
                Hello, {user?.name?.split(" ")[0] || "User"}
              </Text>
            </View>
            <TouchableOpacity
              className="w-12 h-12 bg-white/20 dark:bg-slate-800 rounded-full items-center justify-center backdrop-blur-md"
              onPress={() => router.push("/profile")}
            >
              <Ionicons name="person" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-between items-center space-x-4">
            <TouchableOpacity
              className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-3xl flex-row items-center justify-center shadow-lg shadow-black/5"
              onPress={() => router.push("/quick-pack")}
            >
              <View className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-2xl mr-3">
                <Package color={isDark ? "#818cf8" : "#4f46e5"} size={24} />
              </View>
              <Text className="text-slate-900 dark:text-white font-bold text-base">
                Quick Pack
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-3xl flex-row items-center justify-center shadow-lg shadow-black/5"
              onPress={() => router.push("/(tabs)/gemini")}
            >
              <View className="bg-violet-100 dark:bg-violet-900/50 p-2 rounded-2xl mr-3">
                <BoxIcon color={isDark ? "#a78bfa" : "#7c3aed"} size={24} />
              </View>
              <Text className="text-slate-900 dark:text-white font-bold text-base">
                Scan Item
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          className="flex-1 px-6 -mt-6"
          contentContainerStyle={{
            paddingTop: 48,
            paddingBottom: 100, // accommodate bottom tab
          }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator
              size="large"
              color={isDark ? "#818cf8" : "#4f46e5"}
              className="mt-10"
            />
          ) : (
            <View className="space-y-8">
              {/* KPIs Section */}
              <View>
                <Text className="text-slate-900 dark:text-white text-xl font-bold mb-4 tracking-tight">
                  Overview
                </Text>
                <View className="flex-row justify-between gap-x-3">
                  <TouchableOpacity
                    className="flex-1 bg-white dark:bg-[#1e293b] p-4 rounded-[24px] items-center shadow-sm border border-slate-100 dark:border-slate-800"
                    onPress={() => router.push("/inventory")}
                  >
                    <View className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-full items-center justify-center mb-2">
                      <Package
                        color={isDark ? "#60a5fa" : "#2563eb"}
                        size={24}
                      />
                    </View>
                    <Text className="text-slate-900 dark:text-white text-2xl font-extrabold mb-0.5">
                      {items.length}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      Items
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-white dark:bg-[#1e293b] p-4 rounded-[24px] items-center shadow-sm border border-slate-100 dark:border-slate-800"
                    onPress={() => router.push("/inventory")}
                  >
                    <View className="bg-emerald-50 dark:bg-emerald-900/20 w-12 h-12 rounded-full items-center justify-center mb-2">
                      <BoxIcon
                        color={isDark ? "#34d399" : "#059669"}
                        size={24}
                      />
                    </View>
                    <Text className="text-slate-900 dark:text-white text-2xl font-extrabold mb-0.5">
                      {boxes.length}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      Boxes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-white dark:bg-[#1e293b] p-4 rounded-[24px] items-center shadow-sm border border-slate-100 dark:border-slate-800"
                    onPress={() => router.push("/analysis")}
                  >
                    <View className="bg-amber-50 dark:bg-amber-900/20 w-12 h-12 rounded-full items-center justify-center mb-2">
                      <TrendingUp
                        color={isDark ? "#fbbf24" : "#d97706"}
                        size={24}
                      />
                    </View>
                    <Text className="text-slate-900 dark:text-white text-2xl font-extrabold mb-0.5">
                      {totalQuantity}
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold text-center">
                      Units Stock
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>



              {/* Add Item Graph */}
              <View>
                <Text className="text-slate-900 dark:text-white text-xl font-bold mb-4 tracking-tight px-1">
                  Items Added
                </Text>
                <View className="bg-white dark:bg-[#1e293b] p-4 md:p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 justify-center items-center overflow-hidden">
                  <BarChart
                    data={formatChartData(addItemData)}
                    width={chartWidth}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero={true}
                    chartConfig={chartConfig}
                    style={chartStyle}
                    withInnerLines={false}
                    showValuesOnTopOfBars={true}
                    withHorizontalLabels={true}
                    withVerticalLabels={true}
                  />
                </View>
              </View>

              {/* Sell Item Graph */}
              <View>
                <Text className="text-slate-900 dark:text-white text-xl font-bold mb-4 tracking-tight px-1">
                  Items Sold
                </Text>
                <View className="bg-white dark:bg-[#1e293b] p-4 md:p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 justify-center items-center overflow-hidden">
                  <BarChart
                    data={formatChartData(sellItemData)}
                    width={chartWidth}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero={true}
                    chartConfig={{
                      ...chartConfig,
                      color: (opacity = 1) =>
                        isDark
                          ? `rgba(52, 211, 153, ${opacity})`
                          : `rgba(5, 150, 105, ${opacity})`, // emerald-400 or emerald-600
                      fillShadowGradient: isDark ? "#10b981" : "#059669",
                    }}
                    style={chartStyle}
                    withInnerLines={false}
                    showValuesOnTopOfBars={true}
                    withHorizontalLabels={true}
                    withVerticalLabels={true}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
