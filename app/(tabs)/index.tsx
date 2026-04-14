import { useAuth } from "@/contexts/AuthContext";
import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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

  // Memoize chart data to prevent unnecessary recalculations
  const addItemData = useMemo(
    () =>
      Array.isArray(dailyData)
        ? dailyData.map((d) => ({
            label: (d.day || "-").slice(0, 3),
            count: Number(d.quantity) || 0,
          }))
        : [],
    [dailyData],
  );

  const sellItemData = useMemo(
    () =>
      Array.isArray(dailySold)
        ? dailySold.map((d) => ({
            label: (d.day || "-").slice(0, 3),
            count: Number(d.quantity) || 0,
          }))
        : [],
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
  const tabBarHeight = useBottomTabBarHeight();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth > 600 ? screenWidth - 132 : screenWidth - 88;

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
      backgroundGradientFrom: "#001933",
      backgroundGradientTo: "#001933",
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(0, 127, 255, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(153, 204, 255, ${opacity})`,
      style: {
        borderRadius: 24,
      },
      propsForBackgroundLines: {
        stroke: "rgba(5, 65, 97, 0.35)",
        strokeWidth: 1,
        strokeDasharray: "4",
      },
      propsForLabels: {
        fontSize: 12,
        fontWeight: "600",
      },
      barPercentage: 0.5,
      fillShadowGradient: "#007FFF",
      fillShadowGradientOpacity: 0.8,
    }),
    [],
  );

  const chartStyle = {
    marginVertical: 8,
    borderRadius: 24,
  };

  const addMax = useMemo(
    () => Math.max(0, ...addItemData.map((entry) => entry.count)),
    [addItemData],
  );
  const soldMax = useMemo(
    () => Math.max(0, ...sellItemData.map((entry) => entry.count)),
    [sellItemData],
  );

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" translucent />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header Section */}
        <View
          className="z-10 rounded-b-[40px] border-b border-navy-800/30 bg-navy-900 px-6 pb-6 pt-12"
          style={{ paddingTop: Math.max(insets.top + 16, 48) }}
        >
          <View className="flex-row justify-between items-center mb-6">
            <View>
              <Text className="mb-1 text-sm font-medium uppercase tracking-wider text-azure-200">
                Dashboard
              </Text>
              <Text className="text-3xl font-extrabold tracking-tight text-azure-50">
                Hello, {user?.name?.split(" ")[0] || "User"}
              </Text>
            </View>
            <TouchableOpacity
              className="h-12 w-12 items-center justify-center rounded-full border border-navy-800/40 bg-navy-950"
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Ionicons name="person" size={20} color="#99CCFF" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-between items-center space-x-4">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-3xl border border-navy-800/30 bg-navy-950 p-4"
              onPress={() => router.push("/(tabs)/analysis")}
            >
              <View className="mr-3 rounded-2xl bg-azure-500/15 p-2">
                <Package color="#007FFF" size={24} strokeWidth={1.5} />
              </View>
              <Text className="text-base font-bold text-azure-50">
                Quick Pack
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-3xl border border-navy-800/30 bg-navy-950 p-4"
              onPress={() => router.push("/(tabs)/gemini")}
            >
              <View className="mr-3 rounded-2xl bg-azure-500/15 p-2">
                <BoxIcon color="#007FFF" size={24} strokeWidth={1.5} />
              </View>
              <Text className="text-base font-bold text-azure-50">
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
            paddingBottom: tabBarHeight + 24,
          }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#007FFF"
              className="mt-10"
            />
          ) : (
            <View className="space-y-6">
              {/* KPIs Section */}
              <View>
                <Text className="mb-4 text-xl font-bold tracking-tight text-azure-50">
                  Overview
                </Text>
                <View className="flex-row justify-between gap-x-3">
                  <TouchableOpacity
                    className="flex-1 items-center rounded-[24px] border border-navy-800/30 bg-navy-900 p-4"
                    onPress={() => router.push("/(tabs)/inventory")}
                  >
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-azure-500/15">
                      <Package color="#007FFF" size={24} strokeWidth={1.5} />
                    </View>
                    <Text className="mb-0.5 text-2xl font-extrabold text-azure-50">
                      {items.length}
                    </Text>
                    <Text className="text-xs font-semibold text-azure-200">
                      Items
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 items-center rounded-[24px] border border-navy-800/30 bg-navy-900 p-4"
                    onPress={() => router.push("/(tabs)/inventory")}
                  >
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-azure-500/15">
                      <BoxIcon color="#007FFF" size={24} strokeWidth={1.5} />
                    </View>
                    <Text className="mb-0.5 text-2xl font-extrabold text-azure-50">
                      {boxes.length}
                    </Text>
                    <Text className="text-xs font-semibold text-azure-200">
                      Boxes
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 items-center rounded-[24px] border border-navy-800/30 bg-navy-900 p-4"
                    onPress={() => router.push("/(tabs)/analysis")}
                  >
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-[#00F6FF]/10">
                      <TrendingUp color="#00F6FF" size={24} strokeWidth={1.5} />
                    </View>
                    <Text className="mb-0.5 text-2xl font-extrabold text-azure-50">
                      {totalQuantity}
                    </Text>
                    <Text className="text-center text-xs font-semibold text-azure-200">
                      Units Stock
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>



              {/* Add Item Graph */}
              <View>
                <Text className="mb-4 px-1 text-xl font-bold tracking-tight text-azure-50">
                  Items Added
                </Text>
                <View
                  className="items-center justify-center overflow-hidden rounded-card border border-navy-800/30 bg-navy-900 p-4"
                  style={{ aspectRatio: 16 / 9 }}
                >
                  {addItemData.length > 0 ? (
                    <BarChart
                      data={formatChartData(addItemData)}
                      width={chartWidth}
                      height={190}
                      yAxisLabel=""
                      yAxisSuffix=""
                      fromZero={true}
                      segments={Math.max(4, Math.min(10, addMax || 4))}
                      chartConfig={chartConfig}
                      style={chartStyle}
                      withInnerLines={false}
                      showValuesOnTopOfBars={true}
                      withHorizontalLabels={true}
                      withVerticalLabels={true}
                    />
                  ) : (
                    <Text className="text-azure-200">No add-item logs yet</Text>
                  )}
                </View>
              </View>

              {/* Sell Item Graph */}
              <View>
                <Text className="mb-4 px-1 text-xl font-bold tracking-tight text-azure-50">
                  Items Sold
                </Text>
                <View
                  className="items-center justify-center overflow-hidden rounded-card border border-navy-800/30 bg-navy-900 p-4"
                  style={{ aspectRatio: 16 / 9 }}
                >
                  {sellItemData.length > 0 ? (
                    <BarChart
                      data={formatChartData(sellItemData)}
                      width={chartWidth}
                      height={190}
                      yAxisLabel=""
                      yAxisSuffix=""
                      fromZero={true}
                      segments={Math.max(4, Math.min(10, soldMax || 4))}
                      chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(0, 246, 255, ${opacity})`,
                        fillShadowGradient: "#00F6FF",
                      }}
                      style={chartStyle}
                      withInnerLines={false}
                      showValuesOnTopOfBars={true}
                      withHorizontalLabels={true}
                      withVerticalLabels={true}
                    />
                  ) : (
                    <Text className="text-azure-200">No sold-item logs yet</Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
