import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SkeletonCard from "../ui/SkeletonCard";
import { useSnackbar } from "../ui/SnackbarProvider";
import { apiService } from "@/services/api";
import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";

interface PackingAnalysisResultProps {
  loading: boolean;
  error: string | null;
  result: any;
  selectedItem: any;
  clearResult: () => void;
  setTab: (tab: 0 | 1 | 2) => void;
  setSelectedItem: (item: any) => void;
  setQuantity: (qty: string) => void;
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
}: Readonly<PackingAnalysisResultProps>) {
  const { showSnackbar } = useSnackbar();
  const { fetchItems } = useInventory();
  const { fetchBoxes } = useBoxes();
  const [removedCartonKeys, setRemovedCartonKeys] = useState<string[]>([]);

  const cartonEntries = useMemo(
    () =>
      (result?.packingResults || []).map((carton: any, index: number) => ({
        carton,
        key: `${carton?.cartonDetails?.id ?? carton?.cartonId ?? carton?.orientation ?? "carton"}-${index}`,
      })),
    [result],
  );

  const visibleCartons = useMemo(
    () =>
      cartonEntries.filter((entry: { key: string; carton: any }) =>
        !removedCartonKeys.includes(entry.key),
      ),
    [cartonEntries, removedCartonKeys],
  );

  const requestedQty =
    result?.productInfo?.requestedQuantity ||
    result?.summary?.totalItemsRequested ||
    0;

  const packedQty = visibleCartons.reduce(
    (sum: number, entry: any) => sum + (entry.carton?.itemsPacked || 0),
    0,
  );

  const cartonsUsed = visibleCartons.length;

  const visibleVolumeEfficiencyValue = visibleCartons.reduce(
    (sum: number, entry: any) => {
      const cartonVolume = Number(entry.carton?.cartonDetails?.volume || 0);
      const wasteSpace = Number(entry.carton?.packingMetrics?.wasteSpace || 0);
      const packedVolume = Math.max(cartonVolume - wasteSpace, 0);
      return sum + (cartonVolume > 0 ? (packedVolume / cartonVolume) * 100 : 0);
    },
    0,
  );

  const visibleAverageEfficiency =
    cartonsUsed > 0 ? visibleVolumeEfficiencyValue / cartonsUsed : 0;

  const visiblePackingSuccess =
    requestedQty > 0 ? Math.min((packedQty / requestedQty) * 100, 100) : 0;

  const visibleTotalCost = visibleCartons.reduce(
    (sum: number, entry: any) => sum + Number(entry.carton?.cost?.total || 0),
    0,
  );

  const volumeEfficiencyValue = Number(visibleAverageEfficiency || 0);
  const efficiencyDisplay = Math.min(volumeEfficiencyValue, 100).toFixed(1);
  let efficiencyClassName = "text-azure-50";
  if (volumeEfficiencyValue > 90) {
    efficiencyClassName = "text-[#00F6FF]";
  } else if (volumeEfficiencyValue < 50) {
    efficiencyClassName = "text-amber-400";
  }

  const getOrientationLabel = (orientation?: string | null) => {
    if (orientation === "H×L×B") return "Standing Upright";
    if (orientation === "L×B×H" || orientation === "L×W×H") {
      return "Flat on Base";
    }
    return "Side Laying";
  };

  const visibleCartonTypeBreakdown = useMemo(() => {
    const grouped = new Map<
      string,
      {
        cartonType: string;
        count: number;
        totalItems: number;
        totalCost: number;
        avgEfficiency: number;
      }
    >();

    visibleCartons.forEach((entry: any) => {
      const carton = entry.carton;
      const cartonType =
        carton?.cartonDetails?.name || carton?.cartonType || "Carton";
      const key = carton?.cartonDetails?.id || cartonType;
      const previous = grouped.get(key) || {
        cartonType,
        count: 0,
        totalItems: 0,
        totalCost: 0,
        avgEfficiency: 0,
      };

      const cartonVolume = Number(carton?.cartonDetails?.volume || 0);
      const wasteSpace = Number(carton?.packingMetrics?.wasteSpace || 0);
      const packedVolume = Math.max(cartonVolume - wasteSpace, 0);
      const efficiency = cartonVolume > 0 ? (packedVolume / cartonVolume) * 100 : 0;

      grouped.set(key, {
        ...previous,
        count: previous.count + 1,
        totalItems: previous.totalItems + Number(carton?.itemsPacked || 0),
        totalCost: previous.totalCost + Number(carton?.cost?.total || 0),
        avgEfficiency: previous.avgEfficiency + efficiency,
      });
    });

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      avgEfficiency: item.count > 0 ? item.avgEfficiency / item.count : 0,
    }));
  }, [visibleCartons]);

  const buildCartonsUsedPayload = () =>
    visibleCartons.map((entry: any) => ({
      cartonId: entry.carton?.cartonDetails?.id ?? entry.carton?.cartonId,
      cartonName:
        entry.carton?.cartonDetails?.name ?? entry.carton?.cartonName ??
        "Carton",
      itemsPacked: entry.carton?.itemsPacked || 0,
      orientation: entry.carton?.orientation || null,
      dimensionsUsed: entry.carton?.orientationDetails?.dimensionsUsed
        ? {
            length: entry.carton.orientationDetails.dimensionsUsed.length ?? null,
            breadth:
              entry.carton.orientationDetails.dimensionsUsed.breadth ?? null,
            height: entry.carton.orientationDetails.dimensionsUsed.height ?? null,
          }
        : null,
    }));

  const handleRemoveCarton = (cartonKey: string) => {
    setRemovedCartonKeys((currentKeys) => [...currentKeys, cartonKey]);
    showSnackbar("Box removed from packing preview", "info");
  };

  const handlePackItem = () => {
    Alert.alert(
      "Confirm Packing",
      `Pack ${packedQty} items and update inventory?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pack Item",
          onPress: async () => {
            try {
              const cartonsUsed = buildCartonsUsedPayload();

              const response = await apiService.packInventory({
                productId: selectedItem?._id,
                packedQty,
                cartonsUsed,
              });

              if (!response.success) {
                throw new Error(response.message || "Failed to pack items");
              }

              showSnackbar(
                response.message || `${packedQty} Items packed and inventory updated.`,
                "success",
              );
              await Promise.all([fetchItems(), fetchBoxes()]);
              clearResult();
              setTab(0);
              setSelectedItem(null);
              setQuantity("1");
              router.push("/(tabs)/inventory");
            } catch (error: any) {
              showSnackbar(error.message || "Failed to pack inventory", "error");
              Alert.alert("Error", error.message || "Failed to pack inventory");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="py-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (error) {
    return (
      <View className="mb-6 rounded-card border border-navy-800/30 bg-navy-900 p-6">
        <Text className="mb-2 text-lg font-bold text-azure-50">
          Calculation Error
        </Text>
        <Text className="text-azure-200">{error}</Text>
      </View>
    );
  }

  if (!result) return null;

  return (
    <View style={{ flex: 1 }}>
      <Text className="mb-4 text-3xl font-bold text-azure-50">
        Packing Analysis
      </Text>
      <ScrollView className="flex-1 mb-4" showsVerticalScrollIndicator={false}>
        {/* Summary Cards */}
        <View className="flex-row flex-wrap gap-3 mb-4">
          <View className="min-w-[140px] flex-1 rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="text-2xl font-bold text-azure-50">
              {cartonsUsed}
            </Text>
            <Text className="text-sm text-azure-200">
              Cartons Used
            </Text>
          </View>
          <View className="min-w-[140px] flex-1 rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="text-2xl font-bold text-[#00F6FF]">
              {visiblePackingSuccess.toFixed(1)}%
            </Text>
            <Text className="text-sm text-azure-200">
              Packing Success
            </Text>
          </View>
        </View>

        <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5">
          <Text className="mb-3 text-xl font-bold text-azure-50">
            Cost Analysis
          </Text>
          <View className="flex-row justify-between">
            <Text className="text-azure-200">Estimated Cost</Text>
            <Text className="font-bold text-[#00F6FF]">₹{visibleTotalCost.toFixed(2)}</Text>
          </View>
        </View>

        {/* Product Info */}
        <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5">
          <Text className="mb-3 text-xl font-bold text-azure-50">
            Product Information
          </Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-azure-200">
                Product Name
              </Text>
              <Text
                className="flex-1 text-right font-medium text-azure-50"
                numberOfLines={1}
              >
                {result.productInfo?.name || selectedItem?.productName || "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">
                Dimensions
              </Text>
              <Text className="font-medium text-azure-50">
                {result.productInfo?.dimensions || "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Weight</Text>
              <Text className="font-medium text-azure-50">
                {result.productInfo?.weight || 0}g
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">
                Packing Orientation
              </Text>
              <Text className="font-medium text-[#00F6FF]">
                {getOrientationLabel(result.packingResults?.[0]?.orientation)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">
                Can Rotate
              </Text>
              <Text
                className={`${result.productInfo?.canRotate ? "text-[#00F6FF]" : "text-azure-200"} font-medium`}
              >
                {result.productInfo?.canRotate ? "Yes" : "No"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">
                Fragile Item
              </Text>
              <Text
                className={`${result.productInfo?.isFragile ? "text-azure-200" : "text-[#00F6FF]"} font-medium`}
              >
                {result.productInfo?.isFragile ? "Yes" : "No"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">
                Requested Qty
              </Text>
              <Text className="font-medium text-azure-50">
                {result.productInfo?.requestedQuantity ||
                  result.summary?.totalItemsRequested ||
                  0}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">
                Packed Qty
              </Text>
              <Text className="font-bold text-azure-50">
                {packedQty}
              </Text>
            </View>
          </View>
        </View>

        {/* Packing Efficiency */}
        <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5">
          <Text className="mb-3 text-xl font-bold text-azure-50">
            Efficiency Analysis
          </Text>
          <View className="space-y-3">
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-azure-200">
                  Volume Efficiency
                </Text>
                <Text className={`font-medium ${efficiencyClassName}`}>
                  {efficiencyDisplay}%
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(5, 65, 97, 0.35)",
                  height: 8,
                  borderRadius: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#007FFF",
                    height: 8,
                    borderRadius: 4,
                    width: `${Math.min(result.summary?.overallVolumeEfficiency * 100 || 0, 100)}%`,
                  }}
                />
              </View>
            </View>
            <View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-azure-200">
                  Packing Quality Score
                </Text>
                <Text className="font-medium text-azure-50">
                  {result.analytics?.packingQuality?.overallScore * 100 || 0}
                  /100
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(5, 65, 97, 0.35)",
                  height: 8,
                  borderRadius: 4,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#00F6FF",
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
        {visibleCartonTypeBreakdown.map(
          (carton: any, index: number) => (
            <View
              key={`${carton?.cartonType ?? "carton"}-${index}`}
              className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5"
            >
              <Text className="mb-3 text-xl font-bold text-azure-50">
                Carton Details #{index + 1}
              </Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-azure-200">
                    Carton Type
                  </Text>
                  <Text className="font-medium text-azure-50">
                    {carton.cartonType}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-azure-200">
                    Count
                  </Text>
                  <Text className="font-medium text-azure-50">
                    {carton.count}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-azure-200">
                    Items per Carton
                  </Text>
                  <Text className="font-medium text-azure-50">
                    {Math.floor(carton.totalItems / carton.count)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-azure-200">
                    Efficiency
                  </Text>
                  <Text className="font-medium text-azure-50">
                    {Math.min(carton.avgEfficiency, 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          ),
        )}

        {/* Individual Carton Details */}
        {visibleCartons.length > 0 && (
          <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5">
            <Text className="mb-3 text-xl font-bold text-azure-50">
              Packing Orientation & Layout
            </Text>
            {visibleCartons.map(
              (
                entry: { key: string; carton: any },
                index: number,
              ) => {
                const carton = entry.carton;

                return (
                <View
                  key={entry.key}
                  className="mb-4"
                >
                  <Text className="mb-2 font-bold text-azure-50">
                    Carton #{index + 1}
                  </Text>
                  <View className="space-y-1">
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-azure-200">
                        Items Packed
                      </Text>
                      <Text className="text-sm font-medium text-azure-50">
                        {carton.itemsPacked}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-azure-200">
                        Selected Orientation
                      </Text>
                      <Text className="text-sm font-bold text-[#00F6FF]">
                        {getOrientationLabel(carton.orientation)}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-sm text-azure-200">
                        Dimensions Used
                      </Text>
                      <Text className="text-sm font-medium text-azure-50">
                        {carton.orientationDetails?.dimensionsUsed
                          ? `${carton.orientationDetails.dimensionsUsed.length}×${carton.orientationDetails.dimensionsUsed.breadth}×${carton.orientationDetails.dimensionsUsed.height}`
                          : "N/A"}
                      </Text>
                    </View>
                    {carton?.packingMetrics?.constraintMessages?.length > 0 &&
                      Number(carton?.efficiency?.volumeEfficiency || 0) < 85 && (
                        <View className="mt-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                          <Text className="mb-1 text-xs font-semibold text-amber-300">
                            Constraint Notes
                          </Text>
                          {carton.packingMetrics.constraintMessages.map(
                            (reason: string, reasonIndex: number) => (
                              <Text
                                key={`${entry.key}-reason-${reasonIndex}`}
                                className="text-xs text-amber-200"
                              >
                                • {reason}
                              </Text>
                            ),
                          )}
                        </View>
                      )}
                    <TouchableOpacity
                      className="mt-3 flex-row items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2"
                      onPress={() => handleRemoveCarton(entry.key)}
                    >
                      <Text className="text-sm font-semibold text-red-400">
                        Remove Box
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {index < 2 && (
                    <View className="mt-3 h-px border-t border-navy-800/30 bg-navy-800/30" />
                  )}
                </View>
              );
              },
            )}
            {visibleCartons.length > 3 && (
              <Text className="text-center text-sm text-azure-200">
                +{visibleCartons.length - 3} more cartons with similar
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
              backgroundColor: "#001933",
              paddingVertical: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "rgba(5, 65, 97, 0.3)",
            }}
            onPress={() => {
              clearResult();
              setTab(0);
              setSelectedItem(null);
              setQuantity("1");
            }}
          >
            <Text className="text-center text-lg font-bold text-azure-50">
              Start Over
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 justify-center rounded-2xl border border-azure-400/45 bg-azure-500"
              onPress={handlePackItem}
          >
            <Text className="text-white font-bold text-center text-lg">
              Pack Item
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
