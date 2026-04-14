import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PackingAnalysisResultProps {
  loading: boolean;
  error: string | null;
  result: any;
  selectedItem: any;
  clearResult: () => void;
  setTab: (tab: 0 | 1 | 2) => void;
  setSelectedItem: (item: any) => void;
  setQuantity: (qty: string) => void;
  removeBoxItem: (data: any) => Promise<void>;
  isDark: boolean;
}

export default function PackingAnalysisResult({
  loading,
  error,
  result,
  selectedItem,
  clearResult,
  setTab,
  setSelectedItem,
  setQuantity,
  removeBoxItem,
  isDark,
}: PackingAnalysisResultProps) {
  if (loading) {
    return (
      <View className="items-center py-8">
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="text-gray-500 dark:text-gray-400 mt-4 text-lg">
          Calculating optimal packing...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-red-100 dark:bg-red-900/30 rounded-2xl p-6 mb-6">
        <Text className="text-red-800 dark:text-red-400 font-bold text-lg mb-2">
          Calculation Error
        </Text>
        <Text className="text-red-800 dark:text-red-400">{error}</Text>
      </View>
    );
  }

  if (!result) return null;

  return (
    <View style={{ flex: 1 }}>
      <Text className="text-3xl font-bold text-gray-950 dark:text-gray-100/70 mb-4">
        Packing Analysis
      </Text>
      <ScrollView className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View className="flex-row flex-wrap gap-3 mb-4">
          <View className="bg-gray-100/40 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex-1 min-w-[140px]">
            <Text className="text-green-600 dark:text-green-400 text-2xl font-bold">
              {result.summary?.totalCartonsUsed ||
                result.packingResults?.length ||
                0}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">
              Cartons Used
            </Text>
          </View>
          <View className="bg-gray-100/40 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex-1 min-w-[140px]">
            <Text className="text-violet-600 dark:text-violet-400 text-2xl font-bold">
              {result.summary?.packingRate || 100}%
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">
              Packing Success
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View className="bg-gray-100/40 dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 mb-4">
          <Text className="text-gray-900 dark:text-gray-100 text-xl font-bold mb-3">
            Product Information
          </Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400">
                Product Name
              </Text>
              <Text
                className="text-gray-900 dark:text-gray-100 font-medium flex-1 text-right"
                numberOfLines={1}
              >
                {result.productInfo?.name || selectedItem?.productName || "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400">
                Dimensions
              </Text>
              <Text className="text-gray-900 dark:text-gray-100 font-medium">
                {result.productInfo?.dimensions || "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400">Weight</Text>
              <Text className="text-gray-900 dark:text-gray-100 font-medium">
                {result.productInfo?.weight || 0}g
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400">
                Packing Orientation
              </Text>
              <Text className="text-green-600 dark:text-green-400 font-medium">
                {result.packingResults?.[0]?.orientation || "L×B×H"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400">
                Can Rotate
              </Text>
              <Text
                className={`${result.productInfo?.canRotate ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} font-medium`}
              >
                {result.productInfo?.canRotate ? "Yes" : "No"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400">
                Fragile Item
              </Text>
              <Text
                className={`${result.productInfo?.isFragile ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"} font-medium`}
              >
                {result.productInfo?.isFragile ? "Yes" : "No"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400">
                Requested Qty
              </Text>
              <Text className="text-gray-900 dark:text-gray-100 font-medium">
                {result.productInfo?.requestedQuantity ||
                  result.summary?.totalItemsRequested ||
                  0}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400">
                Packed Qty
              </Text>
              <Text className="text-green-600 dark:text-green-400 font-bold">
                {result.summary?.totalItemsPacked || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Packing Efficiency */}
        <View className="bg-gray-100/40 dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 mb-4">
          <Text className="text-gray-900 dark:text-gray-100 text-xl font-bold mb-3">
            Efficiency Analysis
          </Text>
          <View className="space-y-3">
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-500 dark:text-gray-400">
                  Volume Efficiency
                </Text>
                <Text className="text-gray-900 dark:text-gray-100 font-medium">
                  {result.summary?.overallVolumeEfficiency * 100 || 0}%
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: isDark ? "#374151" : "#e5e7eb",
                  height: 8,
                  borderRadius: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#8b5cf6",
                    height: 8,
                    borderRadius: 4,
                    width: `${Math.min(result.summary?.overallVolumeEfficiency * 100 || 0, 100)}%`,
                  }}
                />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-500 dark:text-gray-400">
                  Packing Quality Score
                </Text>
                <Text className="text-gray-900 dark:text-gray-100 font-medium">
                  {result.analytics?.packingQuality?.overallScore * 100 || 0}
                  /100
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: isDark ? "#374151" : "#e5e7eb",
                  height: 8,
                  borderRadius: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#16a34a",
                    height: 8,
                    borderRadius: 4,
                    width: `${Math.min(result.analytics?.packingQuality?.overallScore * 100 || 0, 100)}%`,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Carton Breakdown */}
        {result.summary?.cartonTypeBreakdown?.map(
          (carton: any, index: number) => (
            <View
              key={index}
              className="bg-gray-100/40 dark:bg-gray-900 p-5 rounded-2xl border-gray-200 dark:border-gray-700 border mb-4"
            >
              <Text className="text-gray-900 dark:text-gray-100 text-xl font-bold mb-3">
                Carton Details #{index + 1}
              </Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 dark:text-gray-400">
                    Carton Type
                  </Text>
                  <Text className="text-gray-900 dark:text-gray-100 font-medium">
                    {carton.cartonType}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 dark:text-gray-400">
                    Count
                  </Text>
                  <Text className="text-gray-900 dark:text-gray-100 font-medium">
                    {carton.count}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 dark:text-gray-400">
                    Items per Carton
                  </Text>
                  <Text className="text-gray-900 dark:text-gray-100 font-medium">
                    {Math.floor(carton.totalItems / carton.count)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-500 dark:text-gray-400">
                    Efficiency
                  </Text>
                  <Text className="text-gray-900 dark:text-gray-100 font-medium">
                    {carton.avgEfficiency * 100}%
                  </Text>
                </View>
              </View>
            </View>
          ),
        )}

        {/* Individual Carton Details */}
        {result.packingResults && result.packingResults.length > 0 && (
          <View className="bg-gray-100/40 dark:bg-gray-900 p-5 rounded-2xl border-gray-200 dark:border-gray-700 border mb-4">
            <Text className="text-gray-900 dark:text-gray-100 text-xl font-bold mb-3">
              Packing Orientation & Layout
            </Text>
            {result.packingResults
              .slice(0, 3)
              .map((carton: any, index: number) => (
                <View key={index} className="mb-4">
                  <Text className="text-gray-700 dark:text-gray-300 font-bold mb-2">
                    Carton #{index + 1}
                  </Text>
                  <View className="space-y-1">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        Items Packed
                      </Text>
                      <Text className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                        {carton.itemsPacked}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        Selected Orientation
                      </Text>
                      <Text className="text-green-600 dark:text-green-400 text-sm font-bold">
                        {carton.orientation}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        Dimensions Used
                      </Text>
                      <Text className="text-gray-900 dark:text-gray-100 text-sm font-medium">
                        {carton.orientationDetails?.dimensionsUsed
                          ? `${carton.orientationDetails.dimensionsUsed.length}×${carton.orientationDetails.dimensionsUsed.breadth}×${carton.orientationDetails.dimensionsUsed.height}`
                          : "N/A"}
                      </Text>
                    </View>
                    {/* ... Rest of details ... */}
                  </View>
                  {index < 2 && (
                    <View className="h-px bg-gray-200 dark:bg-gray-700 border-t mt-3" />
                  )}
                </View>
              ))}
            {result.packingResults.length > 3 && (
              <Text className="text-gray-500 dark:text-gray-400 text-sm text-center">
                +{result.packingResults.length - 3} more cartons with similar
                configuration
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row space-x-4 gap-2">
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: isDark ? "#374151" : "#e5e7eb",
              paddingVertical: 16,
              borderRadius: 16,
            }}
            onPress={() => {
              clearResult();
              setTab(0);
              setSelectedItem(null);
              setQuantity("1");
            }}
          >
            <Text className="text-gray-900 dark:text-gray-100 font-bold text-center text-lg">
              Start Over
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-green-600 dark:bg-green-500 justify-center rounded-2xl"
            onPress={() => {
              Alert.alert(
                "Confirm Packing",
                `Pack ${result.productInfo?.requestedQuantity || result.summary?.totalItemsRequested} items in ${result.summary?.totalCartonsUsed || result.packingResults?.length} cartons?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Confirm",
                    onPress: async () => {
                      try {
                        const firstCarton = result.packingResults?.[0];
                        if (firstCarton && selectedItem) {
                          await removeBoxItem({
                            boxId: firstCarton.cartonDetails.id,
                            itemId: selectedItem._id,
                            boxQuantity:
                              result.summary?.totalCartonsUsed ||
                              result.packingResults?.length ||
                              1,
                            itemQuantity:
                              result.productInfo?.requestedQuantity ||
                              result.summary?.totalItemsRequested ||
                              0,
                          });
                        }
                        Alert.alert(
                          "Success",
                          "Packing plan confirmed and inventory updated!",
                          [
                            {
                              text: "OK",
                              onPress: () => {
                                clearResult();
                                setTab(0);
                                setSelectedItem(null);
                                setQuantity("1");
                                router.push("/(tabs)" as any);
                              },
                            },
                          ],
                        );
                      } catch (error: any) {
                        Alert.alert(
                          "Error",
                          error.message || "Failed to update inventory",
                        );
                      }
                    },
                  },
                ],
              );
            }}
          >
            <Text className="text-white font-bold text-center text-lg">
              Pack Items
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
