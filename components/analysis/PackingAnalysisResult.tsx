import { useBoxes } from "@/contexts/BoxContext";
import { useHistory } from "@/contexts/HistoryContext";
import { useInventory } from "@/contexts/InventoryContext";
import { apiService } from "@/services/api";
import { formatCurrencyInr } from "@/utils/currency";
import { generateAndSharePackingSlip } from "@/utils/packingSlip";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import SkeletonCard from "../ui/SkeletonCard";
import { useSnackbar } from "../ui/SnackbarProvider";

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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toFixed2(value: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "0.00";
  return numeric.toFixed(2);
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
  const { fetchTransactions } = useHistory();

  const [isCartonModalVisible, setIsCartonModalVisible] = useState(false);
  const [isSlipModalVisible, setIsSlipModalVisible] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const cartonEntries = useMemo(
    () =>
      (result?.packingResults || []).map((carton: any, index: number) => ({
        carton,
        key: `${carton?.cartonDetails?.id ?? carton?.cartonId ?? "carton"}-${index}`,
      })),
    [result],
  );

  const visibleCartons = cartonEntries;
  const previewCartons = useMemo(() => visibleCartons.slice(0, 3), [visibleCartons]);

  const requestedQty =
    result?.productInfo?.requestedQuantity ||
    result?.summary?.totalItemsRequested ||
    0;

  const packedQty = visibleCartons.reduce(
    (sum: number, entry: any) => sum + (entry.carton?.itemsPacked || 0),
    0,
  );

  const cartonsUsed = visibleCartons.length;
  const visiblePackingSuccess =
    requestedQty > 0 ? clamp((packedQty / requestedQty) * 100, 0, 100) : 0;
  const qualityScore = clamp(
    Number(result?.analytics?.packingQuality?.overallScore || 0),
    0,
    100,
  );

  const overallVolumeEfficiency = clamp(
    Number(result?.summary?.overallVolumeEfficiency || 0),
    0,
    100,
  );
  const efficiencyDisplay = toFixed2(overallVolumeEfficiency);

  let efficiencyClassName = "text-azure-50";
  if (overallVolumeEfficiency > 90) {
    efficiencyClassName = "text-[#00F6FF]";
  } else if (overallVolumeEfficiency < 50) {
    efficiencyClassName = "text-amber-400";
  }

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

  const productWeightGrams = Number(result?.productInfo?.weight || selectedItem?.weight || 0);
  const totalWeightKg = (packedQty * productWeightGrams) / 1000;
  const serverEstimated = result?.summary?.estimatedCost;
  const estimatedBreakdown = {
    cartonBaseCost: Number(
      serverEstimated?.breakdown?.cartonBaseCost ??
        visibleCartons.reduce(
          (sum: number, entry: any) =>
            sum + Number(entry.carton?.cartonDetails?.cost || 0),
          0,
        ),
    ),
    shippingRatePerKg: Number(serverEstimated?.breakdown?.shippingRatePerKg ?? 18),
    shippingCostByWeight: Number(
      serverEstimated?.breakdown?.shippingCostByWeight ?? totalWeightKg * 18,
    ),
    fragileHandlingFee: Number(
      serverEstimated?.breakdown?.fragileHandlingFee ??
        (result?.productInfo?.isFragile ? 35 : 0),
    ),
  };

  const estimatedCost = Number(
    serverEstimated?.total ??
      estimatedBreakdown.cartonBaseCost +
        estimatedBreakdown.shippingCostByWeight +
        estimatedBreakdown.fragileHandlingFee,
  );

  const smallerBoxSuggestion = useMemo(
    () =>
      (result?.analytics?.recommendations || []).find((text: string) =>
        text.toLowerCase().includes("smaller box"),
      ),
    [result],
  );

  const getOrientationLabel = (orientation?: string | null) => {
    if (orientation === "H×L×B") return "Standing Upright";
    if (orientation === "L×B×H" || orientation === "L×W×H") {
      return "Flat on Base";
    }
    return "Side Laying";
  };

  const buildCartonsUsedPayload = () =>
    visibleCartons.map((entry: any) => ({
      cartonId: entry.carton?.cartonDetails?.id ?? entry.carton?.cartonId,
      cartonName:
        entry.carton?.cartonDetails?.name ?? entry.carton?.cartonName ?? "Carton",
      itemsPacked: entry.carton?.itemsPacked || 0,
      orientation: entry.carton?.orientation || null,
      dimensionsUsed: entry.carton?.orientationDetails?.dimensionsUsed
        ? {
            length: entry.carton.orientationDetails.dimensionsUsed.length ?? null,
            breadth: entry.carton.orientationDetails.dimensionsUsed.breadth ?? null,
            height: entry.carton.orientationDetails.dimensionsUsed.height ?? null,
          }
        : null,
    }));

  const showCostBreakdown = () => {
    Alert.alert(
      "Estimated Cost Breakdown",
      `Carton Base Cost: ${formatCurrencyInr(estimatedBreakdown.cartonBaseCost)}\nShipping (Rate x Total Weight): ${formatCurrencyInr(estimatedBreakdown.shippingCostByWeight)}\nRate: ${formatCurrencyInr(estimatedBreakdown.shippingRatePerKg)} per kg\nFragile Handling Fee: ${formatCurrencyInr(estimatedBreakdown.fragileHandlingFee)}\n\nEstimated Cost: ${formatCurrencyInr(estimatedCost)}`,
      [{ text: "OK" }],
    );
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const cartons = visibleCartons.map((entry: any) => entry.carton);
      const fileUri = await generateAndSharePackingSlip({
        productName: result.productInfo?.name || selectedItem?.productName,
        productDimensions: result.productInfo?.dimensions,
        isFragile: result.productInfo?.isFragile,
        preferredOrientation: result.packingResults?.[0]?.orientation,
        packedQty,
        cartons,
        productWeightGrams,
        shippingRatePerKg: estimatedBreakdown.shippingRatePerKg,
        fragileHandlingFee: estimatedBreakdown.fragileHandlingFee,
        cartonBaseCost: estimatedBreakdown.cartonBaseCost,
      });

      Alert.alert("PDF Created", `Packing slip saved at:\n${fileUri}`);

      showSnackbar("Packing slip generated successfully", "success");
      setIsSlipModalVisible(false);
    } catch (pdfError: any) {
      showSnackbar(pdfError?.message || "Failed to generate PDF", "error");
      Alert.alert("Export Error", pdfError?.message || "Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePackItem = () => {
    Alert.alert("Confirm Packing", `Pack ${packedQty} items and update inventory?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pack Item",
        onPress: async () => {
          try {
            const cartonsUsedPayload = buildCartonsUsedPayload();

            const response = await apiService.packInventory({
              productId: selectedItem?._id,
              packedQty,
              cartonsUsed: cartonsUsedPayload,
              packingMetadata: {
                productInfo: {
                  name: result?.productInfo?.name || selectedItem?.productName,
                  dimensions: result?.productInfo?.dimensions || "N/A",
                  isFragile: !!result?.productInfo?.isFragile,
                  weight: Number(productWeightGrams || 0),
                  requestedQuantity: Number(requestedQty || packedQty),
                },
                summary: {
                  estimatedCost: {
                    total: Number(estimatedCost || 0),
                    breakdown: {
                      cartonBaseCost: Number(estimatedBreakdown.cartonBaseCost || 0),
                      shippingRatePerKg: Number(estimatedBreakdown.shippingRatePerKg || 0),
                      shippingCostByWeight: Number(estimatedBreakdown.shippingCostByWeight || 0),
                      fragileHandlingFee: Number(estimatedBreakdown.fragileHandlingFee || 0),
                    },
                  },
                  totalItemsRequested: Number(requestedQty || packedQty),
                },
                packingResults: cartonsUsedPayload.map((carton: any) => ({
                  cartonId: carton.cartonId,
                  cartonName: carton.cartonName,
                  itemsPacked: carton.itemsPacked,
                  orientation: carton.orientation,
                  orientationDetails: carton.dimensionsUsed
                    ? {
                        dimensionsUsed: carton.dimensionsUsed,
                      }
                    : undefined,
                })),
              },
            });

            if (!response.success) {
              throw new Error(response.message || "Failed to pack items");
            }

            showSnackbar(
              response.message || `${packedQty} items packed and inventory updated.`,
              "success",
            );
            await Promise.all([fetchItems(), fetchBoxes(), fetchTransactions()]);
            clearResult();
            setTab(0);
            setSelectedItem(null);
            setQuantity("1");
            router.push("/(tabs)/inventory");
          } catch (packError: any) {
            const failureMessage =
              packError?.message ||
              "Packing solution not found. Verify box availability and item sizes.";
            showSnackbar(
              "Packing solution not found. Verify box availability and item sizes.",
              "error",
            );
            Alert.alert("Error", failureMessage);
          }
        },
      },
    ]);
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
        <Text className="mb-2 text-lg font-bold text-azure-50">Calculation Error</Text>
        <Text className="text-azure-200">{error}</Text>
      </View>
    );
  }

  if (!result) return null;

  return (
    <View style={{ flex: 1 }}>
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-3xl font-bold text-azure-50">Packing Analysis</Text>
        <TouchableOpacity
          className="h-11 w-11 items-center justify-center rounded-full border border-navy-800/40 bg-navy-900"
          onPress={() => setIsSlipModalVisible(true)}
        >
          <Ionicons name="print-outline" size={20} color="#99CCFF" />
        </TouchableOpacity>
      </View>

      <ScrollView className="mb-4 flex-1" showsVerticalScrollIndicator={false}>
        <View className="mb-4 flex-row flex-wrap gap-3">
          <View className="min-w-[140px] flex-1 rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="text-2xl font-bold text-azure-50">{cartonsUsed}</Text>
            <Text className="text-sm text-azure-200">Cartons Used</Text>
          </View>
          <View className="min-w-[140px] flex-1 rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="text-2xl font-bold text-[#00F6FF]">{toFixed2(visiblePackingSuccess)}%</Text>
            <Text className="text-sm text-azure-200">Packing Success</Text>
          </View>
        </View>

        <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5">
          <Text className="mb-3 text-xl font-bold text-azure-50">Cost Analysis</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <Text className="text-azure-200">Estimated Cost</Text>
              <TouchableOpacity onPress={showCostBreakdown}>
                <Ionicons name="information-circle-outline" size={16} color="#99CCFF" />
              </TouchableOpacity>
            </View>
            <Text className="font-bold text-[#00F6FF]">{formatCurrencyInr(estimatedCost)}</Text>
          </View>
        </View>

        <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5">
          <Text className="mb-3 text-xl font-bold text-azure-50">Product Information</Text>
          <View className="space-y-2">
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Product Name</Text>
              <Text className="flex-1 text-right font-medium text-azure-50" numberOfLines={1}>
                {result.productInfo?.name || selectedItem?.productName || "N/A"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Dimensions</Text>
              <Text className="font-medium text-azure-50">{result.productInfo?.dimensions || "N/A"}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Weight</Text>
              <Text className="font-medium text-azure-50">{toFixed2(productWeightGrams)}g</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Packing Orientation</Text>
              <Text className="font-medium text-[#00F6FF]">
                {getOrientationLabel(result.packingResults?.[0]?.orientation)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Can Rotate</Text>
              <Text className={`${result.productInfo?.canRotate ? "text-[#00F6FF]" : "text-azure-200"} font-medium`}>
                {result.productInfo?.canRotate ? "Yes" : "No"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Fragile Item</Text>
              <Text className={`${result.productInfo?.isFragile ? "text-amber-300" : "text-[#00F6FF]"} font-medium`}>
                {result.productInfo?.isFragile ? "Yes" : "No"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Requested Qty</Text>
              <Text className="font-medium text-azure-50">{requestedQty}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-azure-200">Packed Qty</Text>
              <Text className="font-bold text-azure-50">{packedQty}</Text>
            </View>
          </View>
        </View>

        <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5">
          <Text className="mb-3 text-xl font-bold text-azure-50">Efficiency Analysis</Text>
          <View className="space-y-3">
            <View>
              <View className="mb-1 flex-row justify-between">
                <Text className="text-azure-200">Volume Efficiency</Text>
                <Text className={`font-medium ${efficiencyClassName}`}>{efficiencyDisplay}%</Text>
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
                    width: `${overallVolumeEfficiency}%`,
                  }}
                />
              </View>
            </View>

            <View>
              <View className="mb-1 flex-row justify-between">
                <Text className="text-azure-200">Packing Quality Score</Text>
                <Text className="font-medium text-azure-50">{toFixed2(qualityScore)}/100</Text>
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
                    width: `${qualityScore}%`,
                  }}
                />
              </View>
            </View>
          </View>
          {smallerBoxSuggestion ? (
            <View className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
              <Text className="text-xs font-semibold text-amber-200">{smallerBoxSuggestion}</Text>
            </View>
          ) : null}
        </View>

        {visibleCartonTypeBreakdown.map((carton: any, index: number) => (
          <View
            key={`${carton?.cartonType ?? "carton"}-${index}`}
            className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5"
          >
            <Text className="mb-3 text-xl font-bold text-azure-50">Carton Details #{index + 1}</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-azure-200">Carton Type</Text>
                <Text className="font-medium text-azure-50">{carton.cartonType}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-azure-200">Count</Text>
                <Text className="font-medium text-azure-50">{carton.count}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-azure-200">Items per Carton</Text>
                <Text className="font-medium text-azure-50">{Math.floor(carton.totalItems / carton.count)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-azure-200">Efficiency</Text>
                <Text className="font-medium text-azure-50">{toFixed2(clamp(carton.avgEfficiency, 0, 100))}%</Text>
              </View>
            </View>
          </View>
        ))}

        {visibleCartons.length > 0 && (
          <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5">
            <Text className="mb-3 text-xl font-bold text-azure-50">Packing Layout Grid</Text>
            <View className="flex-row flex-wrap justify-between">
              {previewCartons.map((entry: { key: string; carton: any }, index: number) => {
                const carton = entry.carton;
                return (
                  <View
                    key={entry.key}
                    className="mb-3 rounded-xl border border-navy-800/30 bg-navy-950 p-3"
                    style={{ width: "31.5%" }}
                  >
                    <Text className="text-xs font-semibold text-azure-200">Carton #{index + 1}</Text>
                    <Text className="mt-1 text-sm font-bold text-azure-50" numberOfLines={1}>
                      {carton.cartonDetails?.name || "Carton"}
                    </Text>
                    <Text className="mt-1 text-xs text-azure-200">Items: {carton.itemsPacked}</Text>
                    <Text className="text-xs text-[#00F6FF]" numberOfLines={2}>
                      {getOrientationLabel(carton.orientation)}
                    </Text>
                  </View>
                );
              })}
            </View>
            {visibleCartons.length > 3 ? (
              <TouchableOpacity className="mt-1" onPress={() => setIsCartonModalVisible(true)}>
                <Text className="text-center text-sm font-semibold text-[#00F6FF]">
                  See More ({visibleCartons.length - 3} more cartons)
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        <View className="flex-row gap-2 space-x-4">
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
            <Text className="text-center text-lg font-bold text-azure-50">Start Over</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 justify-center rounded-2xl border border-azure-400/45 bg-azure-500"
            onPress={handlePackItem}
          >
            <Text className="text-center text-lg font-bold text-white">Pack Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={isCartonModalVisible} animationType="slide" transparent>
        <View className="flex-1 items-center justify-end bg-black/55 px-4 py-6">
          <View className="max-h-[82%] w-full rounded-3xl border border-navy-800/40 bg-navy-900 p-5">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-azure-50">All Cartons</Text>
              <TouchableOpacity onPress={() => setIsCartonModalVisible(false)}>
                <Ionicons name="close" size={22} color="#99CCFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap justify-between">
                {visibleCartons.map((entry: { key: string; carton: any }, index: number) => {
                  const carton = entry.carton;
                  return (
                    <View
                      key={`${entry.key}-modal`}
                      className="mb-3 rounded-xl border border-navy-800/30 bg-navy-950 p-3"
                      style={{ width: "31.5%" }}
                    >
                      <Text className="text-xs font-semibold text-azure-200">Carton #{index + 1}</Text>
                      <Text className="mt-1 text-sm font-bold text-azure-50" numberOfLines={1}>
                        {carton.cartonDetails?.name || "Carton"}
                      </Text>
                      <Text className="mt-1 text-xs text-azure-200">Items: {carton.itemsPacked}</Text>
                      <Text className="text-xs text-[#00F6FF]" numberOfLines={2}>
                        {getOrientationLabel(carton.orientation)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isSlipModalVisible} animationType="fade" transparent>
        <View className="flex-1 items-center justify-center bg-black/55 px-5">
          <View className="w-full rounded-3xl border border-navy-800/40 bg-navy-900 p-6">
            <Text className="text-center text-xl font-bold text-azure-50">Generate Packing Slip</Text>
            <Text className="mt-2 text-center text-sm text-azure-200">
              Export the manager view packing invoice as a PDF file.
            </Text>

            <TouchableOpacity
              className="mt-5 items-center rounded-2xl border border-azure-400/45 bg-azure-500 px-4 py-3"
              onPress={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              <Text className="text-base font-bold text-white">
                {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-3 items-center rounded-2xl border border-navy-700 px-4 py-3"
              onPress={() => setIsSlipModalVisible(false)}
              disabled={isGeneratingPdf}
            >
              <Text className="font-semibold text-azure-200">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
