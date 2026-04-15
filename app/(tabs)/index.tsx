import { useAuth } from "@/contexts/AuthContext";
import { useBoxes } from "@/contexts/BoxContext";
import { useHistory } from "@/contexts/HistoryContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { BoxIcon, Package, TrendingUp } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
  const { items, dailyData, dailySold, fetchItems } = useInventory();
  const { boxes, fetchBoxes } = useBoxes();
  const { transactions, fetchTransactions } = useHistory();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulse]);

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

  const addItemLabels = useMemo(
    () => addItemData.map((entry, index) => (index % 2 === 0 ? entry.label : "")),
    [addItemData],
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

  const sellItemLabels = useMemo(
    () => sellItemData.map((entry, index) => (index % 2 === 0 ? entry.label : "")),
    [sellItemData],
  );

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions(100);
  }, [fetchTransactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchItems(), fetchBoxes(), fetchTransactions(100)]);
    } finally {
      setRefreshing(false);
    }
  };

  const lowStockBox = useMemo(
    () => boxes.find((box) => Number(box.quantity) > 0 && Number(box.quantity) < 10),
    [boxes],
  );

  const hotItem = useMemo(() => {
    if (!transactions.length) return null;

    const frequency = new Map<string, number>();
    transactions.forEach((transaction) => {
      const name = transaction.productName?.trim();
      if (!name) return;
      frequency.set(name, (frequency.get(name) || 0) + Number(transaction.packedQty || 1));
    });

    let bestName: string | null = null;
    let bestCount = 0;
    frequency.forEach((count, name) => {
      if (count > bestCount) {
        bestName = name;
        bestCount = count;
      }
    });

    if (!bestName) return null;
    return { name: bestName, packedCount: bestCount };
  }, [transactions]);

  const insightMessage = useMemo(() => {
    if (lowStockBox) {
      return `Critical: Order more ${lowStockBox.box_name} soon!`;
    }

    if (hotItem) {
      return `Hot Item: ${hotItem.name} is being packed frequently.`;
    }

    return "Inventory is stable. Keep scanning to unlock deeper movement insights.";
  }, [lowStockBox, hotItem]);

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
  const chartWidth = screenWidth - 48;

  const getFivePartScale = (maxValue: number) => {
    if (!Number.isFinite(maxValue) || maxValue <= 0) {
      return { step: 20, roundedMax: 100 };
    }

    let step;
    if (maxValue <= 100) {
      step = 20;
    } else if (maxValue <= 500) {
      step = 100;
    } else if (maxValue <= 1000) {
      step = 200;
    } else if (maxValue <= 2500) {
      step = 500;
    } else if (maxValue <= 5000) {
      step = 1000;
    } else {
      step = 2000;
    }

    const roundedMax = Math.ceil(maxValue / step) * step;
    return { step, roundedMax };
  };

  const addChartScale = useMemo(() => {
    const max = Math.max(0, ...addItemData.map((entry) => entry.count));
    return getFivePartScale(max);
  }, [addItemData]);

  const sellChartScale = useMemo(() => {
    const max = Math.max(0, ...sellItemData.map((entry) => entry.count));
    return getFivePartScale(max);
  }, [sellItemData]);

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
      barPercentage: 0.72,
      fillShadowGradient: "#007FFF",
      fillShadowGradientOpacity: 0.8,
      formatYLabel: (value: string | number) => String(Math.round(Number(value) || 0)),
    }),
    [],
  );

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" translucent />
      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <Image
          source={require("../../assets/images/Shipwise_logo_t.png")}
          resizeMode="contain"
          style={{ width: "72%", height: "72%", opacity: 0.05 }}
        />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header Section */}
        <View
          className="z-10 rounded-b-[40px] border-b border-navy-800/30 bg-navy-900 px-6 pb-5 pt-8"
          style={{ paddingTop: Math.max(insets.top + 8, 34) }}
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
          className="flex-1 px-6 -mt-4"
          contentContainerStyle={{
            paddingTop: 24,
            paddingBottom: tabBarHeight + 24,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007FFF"
              colors={['#007FFF']}
              progressBackgroundColor="#001933"
            />
          }
        >
          {loading ? (
            <View className="space-y-6">
              <View className="rounded-card border border-navy-800/30 bg-navy-900 p-5">
                <View className="mb-3 h-5 w-32 rounded bg-navy-800/60" />
                <View className="h-4 w-4/5 rounded bg-navy-800/50" />
              </View>
              <View className="flex-row justify-between gap-x-3">
                {[0, 1, 2].map((entry) => (
                  <View key={`dashboard-skeleton-${entry}`} className="h-28 flex-1 rounded-[24px] border border-navy-800/30 bg-navy-900" />
                ))}
              </View>
              <View className="h-56 rounded-card border border-navy-800/30 bg-navy-900" />
              <View className="h-56 rounded-card border border-navy-800/30 bg-navy-900" />
            </View>
          ) : (
            <View className="space-y-6">
              <Animated.View
                className={`rounded-card border p-4 ${lowStockBox ? "border-amber-400/40 bg-amber-500/10" : "border-azure-400/25 bg-azure-500/10"}`}
                style={lowStockBox ? { opacity: pulse } : undefined}
              >
                <Text className="text-xs font-bold uppercase tracking-[1.4px] text-azure-200">
                  Smart Insight
                </Text>
                <Text className="mt-2 text-base font-semibold text-azure-50">
                  {insightMessage}
                </Text>
              </Animated.View>

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
                  className="w-full overflow-hidden rounded-card border border-navy-800/30 bg-navy-900"
                  style={{ aspectRatio: 16 / 9 }}
                >
                  {addItemData.length > 0 ? (
                    <BarChart
                      data={{
                        labels: addItemLabels,
                        datasets: [{ data: addItemData.map((d) => d.count) }],
                      }}
                      width={chartWidth}
                      height={190}
                      yAxisLabel=""
                      yAxisSuffix=""
                      fromZero={true}
                      fromNumber={addChartScale.roundedMax}
                      segments={5}
                      chartConfig={chartConfig}
                      style={{ marginVertical: 0 }}
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
                  className="w-full overflow-hidden rounded-card border border-navy-800/30 bg-navy-900"
                  style={{ aspectRatio: 16 / 9 }}
                >
                  {sellItemData.length > 0 ? (
                    <BarChart
                      data={{
                        labels: sellItemLabels,
                        datasets: [{ data: sellItemData.map((d) => d.count) }],
                      }}
                      width={chartWidth}
                      height={190}
                      yAxisLabel=""
                      yAxisSuffix=""
                      fromZero={true}
                      fromNumber={sellChartScale.roundedMax}
                      segments={5}
                      chartConfig={{
                        ...chartConfig,
                        color: (opacity = 1) => `rgba(0, 246, 255, ${opacity})`,
                        fillShadowGradient: "#00F6FF",
                      }}
                      style={{ marginVertical: 0 }}
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
