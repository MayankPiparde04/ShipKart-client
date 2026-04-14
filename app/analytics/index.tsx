import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, PieChart } from "react-native-chart-kit";

// Direct axios import
import api from "@/services/api";

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 72, 220);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [overviewRes, historyRes] = await Promise.all([
        api.get("/analytics/overview"),
        api.get("/analytics/packing-history"),
      ]);

      if (overviewRes.data.success) setOverview(overviewRes.data.data);
      if (historyRes.data.success) setHistory(historyRes.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: "#001933",
    backgroundGradientTo: "#001933",
    color: (opacity = 1) => `rgba(0, 127, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  const hasHistoryData = history.some((d) => (d.count ?? 0) > 0);
  const hasInventoryData =
    (overview?.itemsInStock ?? 0) > 0 || (overview?.boxesInStock ?? 0) > 0;

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-navy-950">
        <ActivityIndicator size="large" color="#007FFF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" />

      {/* Header */}
      <View className="flex-row items-center border-b border-navy-800/30 px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#99CCFF" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-azure-50">
          Analytics Dashboard
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Overview Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="w-[48%] rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="mb-1 text-xs text-azure-200">
              Total Packed
            </Text>
            <Text className="text-2xl font-bold text-azure-50">
              {overview?.totalPacked || 0}
            </Text>
          </View>
          <View className="w-[48%] rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="mb-1 text-xs text-azure-200">
              AI Predictions
            </Text>
            <Text className="text-2xl font-bold text-azure-50">
              {overview?.aiPredictions || 0}
            </Text>
          </View>
          <View className="w-[48%] rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="mb-1 text-xs text-azure-200">
              Items in Stock
            </Text>
            <Text className="text-2xl font-bold text-azure-50">
              {overview?.itemsInStock || 0}
            </Text>
          </View>
          <View className="w-[48%] rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="mb-1 text-xs text-azure-200">
              Boxes Available
            </Text>
            <Text className="text-2xl font-bold text-azure-50">
              {overview?.boxesInStock || 0}
            </Text>
          </View>
        </View>

        {/* Packing History Chart */}
        <View className="mb-6">
          <Text className="mb-4 text-lg font-bold text-azure-50">
            Packing Activity (7 Days)
          </Text>
          {hasHistoryData ? (
            <View
              className="items-center justify-center rounded-card border border-navy-800/30 bg-navy-900 p-4"
              style={{ aspectRatio: 16 / 9 }}
            >
              <LineChart
                data={{
                  labels: history.map((d) => d.day),
                  datasets: [
                    {
                      data: history.map((d) => d.count),
                    },
                  ],
                }}
                width={chartWidth}
                height={190}
                yAxisLabel=""
                yAxisSuffix=""
                yAxisInterval={1}
                chartConfig={{
                  backgroundColor: "#001933",
                  backgroundGradientFrom: "#001933",
                  backgroundGradientTo: "#001933",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 127, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(153, 204, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#00F6FF",
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
              />
            </View>
          ) : (
            <View className="items-center justify-center rounded-card border border-navy-800/30 bg-navy-900 py-10">
              <Text className="text-azure-200">No data for this period</Text>
            </View>
          )}
        </View>

        {/* Inventory Distribution (Pie Chart Mock) */}
        <View className="mb-8">
          <Text className="mb-4 text-lg font-bold text-azure-50">
            Inventory Breakdown
          </Text>
          {hasInventoryData ? (
            <View
              className="items-center justify-center rounded-card border border-navy-800/30 bg-navy-900 p-4"
              style={{ aspectRatio: 16 / 9 }}
            >
              <PieChart
                data={[
                  {
                    name: "Items",
                    population: overview?.itemsInStock || 0,
                    color: "#007FFF",
                    legendFontColor: "#E5F2FF",
                    legendFontSize: 15,
                  },
                  {
                    name: "Boxes",
                    population: overview?.boxesInStock || 0,
                    color: "#00F6FF",
                    legendFontColor: "#99CCFF",
                    legendFontSize: 15,
                  },
                ]}
                width={chartWidth}
                height={190}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
              />
            </View>
          ) : (
            <View className="items-center justify-center rounded-card border border-navy-800/30 bg-navy-900 py-10">
              <Text className="text-azure-200">No data for this period</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
