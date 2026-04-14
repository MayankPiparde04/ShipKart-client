import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
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
    backgroundGradientFrom: "#dadada",
    backgroundGradientTo: "#dadada",
    color: (opacity = 1) => `rgba(7, 15, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-gray-950">
        <ActivityIndicator size="large" color="#070fff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <StatusBar style="auto" />

      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#111111" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 dark:text-white">
          Analytics Dashboard
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-6">
        {/* Overview Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <View className="w-[48%] bg-blue-50 dark:bg-gray-900 p-4 rounded-xl border border-blue-100 dark:border-gray-800">
            <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
              Total Packed
            </Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {overview?.totalPacked || 0}
            </Text>
          </View>
          <View className="w-[48%] bg-purple-50 dark:bg-gray-900 p-4 rounded-xl border border-purple-100 dark:border-gray-800">
            <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
              AI Predictions
            </Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {overview?.aiPredictions || 0}
            </Text>
          </View>
          <View className="w-[48%] bg-green-50 dark:bg-gray-900 p-4 rounded-xl border border-green-100 dark:border-gray-800">
            <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
              Items in Stock
            </Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {overview?.itemsInStock || 0}
            </Text>
          </View>
          <View className="w-[48%] bg-orange-50 dark:bg-gray-900 p-4 rounded-xl border border-orange-100 dark:border-gray-800">
            <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
              Boxes Available
            </Text>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {overview?.boxesInStock || 0}
            </Text>
          </View>
        </View>

        {/* Packing History Chart */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Packing Activity (7 Days)
          </Text>
          <LineChart
            data={{
              labels: history.map((d) => d.day),
              datasets: [
                {
                  data: history.map((d) => d.count),
                },
              ],
            }}
            width={Dimensions.get("window").width - 32} // from react-native
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1}
            chartConfig={{
              backgroundColor: "#dadada",
              backgroundGradientFrom: "#dadada",
              backgroundGradientTo: "#dadada",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(7, 15, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(17, 17, 17, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: "#007fff",
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>

        {/* Inventory Distribution (Pie Chart Mock) */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Inventory Breakdown
          </Text>
          <PieChart
            data={[
              {
                name: "Items",
                population: overview?.itemsInStock || 0,
                color: "#007fff",
                legendFontColor: "#111111",
                legendFontSize: 15,
              },
              {
                name: "Boxes",
                population: overview?.boxesInStock || 0,
                color: "#ff7700",
                legendFontColor: "#111111",
                legendFontSize: 15,
              },
            ]}
            width={Dimensions.get("window").width - 32}
            height={220}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
