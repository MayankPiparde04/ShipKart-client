import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";
import { apiService } from "@/services/api";
import { triggerSuccessHaptic } from "@/utils/haptics";
import { generateAndSharePackingSlip } from "@/utils/packingSlip";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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

function getCartonId(carton: any) {
  return (
    carton?.cartonDetails?.id ||
    carton?.cartonId ||
    carton?.boxId ||
    carton?.carton?._id ||
    ""
  );
}

function toPositiveNumber(value: any) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function resolveOrientationDimensions(orientation: any) {
  if (Array.isArray(orientation?.dims) && orientation.dims.length >= 3) {
    return {
      length: toPositiveNumber(orientation.dims[0]),
      width: toPositiveNumber(orientation.dims[1]),
      height: toPositiveNumber(orientation.dims[2]),
    };
  }

  return {
    length: 0,
    width: 0,
    height: 0,
  };
}

function getCartonDimensions(carton: any, masterBox?: any) {
  const direct = carton?.cartonDetails?.dimensions || carton?.box?.dimensions;
  const cartonEntity = carton?.carton;
  const length =
    toPositiveNumber(carton?.boxLength) ||
    toPositiveNumber(direct?.length) ||
    toPositiveNumber(carton?.cartonDetails?.length) ||
    toPositiveNumber(carton?.cartonDetails?.boxLength) ||
    toPositiveNumber(cartonEntity?.length) ||
    toPositiveNumber(cartonEntity?.boxLength) ||
    toPositiveNumber(carton?.length) ||
    toPositiveNumber(masterBox?.length);
  const width =
    toPositiveNumber(carton?.boxWidth) ||
    toPositiveNumber(direct?.width) ||
    toPositiveNumber(direct?.breadth) ||
    toPositiveNumber(carton?.cartonDetails?.width) ||
    toPositiveNumber(carton?.cartonDetails?.breadth) ||
    toPositiveNumber(cartonEntity?.width) ||
    toPositiveNumber(cartonEntity?.breadth) ||
    toPositiveNumber(carton?.width) ||
    toPositiveNumber(carton?.breadth) ||
    toPositiveNumber(masterBox?.breadth);
  const height =
    toPositiveNumber(carton?.boxHeight) ||
    toPositiveNumber(direct?.height) ||
    toPositiveNumber(carton?.cartonDetails?.height) ||
    toPositiveNumber(cartonEntity?.height) ||
    toPositiveNumber(carton?.height) ||
    toPositiveNumber(masterBox?.height);

  return {
    length,
    width,
    height,
  };
}

function getCartonVolumeCm3(carton: any, masterBox?: any) {
  const explicitVolume =
    toPositiveNumber(carton?.boxVolume) ||
    toPositiveNumber(carton?.cartonDetails?.volume) ||
    toPositiveNumber(carton?.carton?.volume);
  if (explicitVolume > 0) return explicitVolume;

  const dimensions = getCartonDimensions(carton, masterBox);
  return Math.max(dimensions.length * dimensions.width * dimensions.height, 0);
}

function getCartonName(carton: any, masterBox?: any) {
  return (
    carton?.boxName ||
    carton?.carton?.name ||
    carton?.cartonDetails?.name ||
    carton?.cartonName ||
    carton?.cartonType ||
    masterBox?.box_name ||
    "Box"
  );
}

function getUsedDimensions(carton: any, fullDimensions: { length: number; width: number; height: number }, productDimensions?: { length: number; breadth: number; height: number }) {
  const fromOrientation = carton?.orientationDetails?.dimensionsUsed;
  if (fromOrientation) {
    return {
      length: toPositiveNumber(fromOrientation.length),
      width: toPositiveNumber(fromOrientation.width ?? fromOrientation.breadth),
      height: toPositiveNumber(fromOrientation.height),
    };
  }

  const packedItems = Array.isArray(carton?.layout?.packedItems) ? carton.layout.packedItems : [];
  if (packedItems.length > 0) {
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    for (const packed of packedItems) {
      const position = packed?.position || {};
      const dimensions = packed?.dimensions || {};
      maxLength = Math.max(maxLength, Number(position.x || 0) + Number(dimensions.length || 0));
      maxWidth = Math.max(
        maxWidth,
        Number(position.y || 0) + Number(dimensions.width ?? dimensions.breadth ?? 0),
      );
      maxHeight = Math.max(maxHeight, Number(position.z || 0) + Number(dimensions.height || 0));
    }

    if (maxLength > 0 && maxWidth > 0 && maxHeight > 0) {
      return {
        length: maxLength,
        width: maxWidth,
        height: maxHeight,
      };
    }
  }

  const arrangement = carton?.layout?.arrangement;
  const orientationDimensions = resolveOrientationDimensions(carton?.orientation);
  if (arrangement && (orientationDimensions.length > 0 || productDimensions)) {
    const baseLength = orientationDimensions.length || toPositiveNumber(productDimensions?.length);
    const baseWidth = orientationDimensions.width || toPositiveNumber(productDimensions?.breadth);
    const baseHeight = orientationDimensions.height || toPositiveNumber(productDimensions?.height);

    const arrangedLength = toPositiveNumber(arrangement?.lengthwise) * baseLength;
    const arrangedWidth = toPositiveNumber(arrangement?.breadthwise) * baseWidth;
    const arrangedHeight = toPositiveNumber(arrangement?.layers) * baseHeight;

    if (arrangedLength > 0 && arrangedWidth > 0 && arrangedHeight > 0) {
      return {
        length: arrangedLength,
        width: arrangedWidth,
        height: arrangedHeight,
      };
    }
  }

  return {
    length: fullDimensions.length,
    width: fullDimensions.width,
    height: fullDimensions.height,
  };
}

function getDimensionsUsedLabel(
  carton: any,
  fullDimensions: { length: number; width: number; height: number },
  productDimensions?: { length: number; breadth: number; height: number },
) {
  const used = getUsedDimensions(carton, fullDimensions, productDimensions);

  if (used.length <= 0 || used.width <= 0 || used.height <= 0) {
    console.warn("[PackingAnalysis] Missing dimensionsUsed in packing result", {
      cartonId: getCartonId(carton),
      cartonName: carton?.boxName || carton?.cartonName || carton?.cartonDetails?.name,
    });
  }

  return `${toFixed2(used.length)} x ${toFixed2(used.width)} x ${toFixed2(used.height)} used of ${toFixed2(fullDimensions.length)} x ${toFixed2(fullDimensions.width)} x ${toFixed2(fullDimensions.height)} cm`;
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
  const { boxes, fetchBoxes } = useBoxes();

  const [isCartonModalVisible, setIsCartonModalVisible] = useState(false);
  const [isSlipModalVisible, setIsSlipModalVisible] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const boxLookupById = useMemo(
    () =>
      new Map(
        (boxes || []).map((box: any) => [String(box?._id || ""), box]),
      ),
    [boxes],
  );

  const boxLookupByName = useMemo(
    () =>
      new Map(
        (boxes || []).map((box: any) => [String(box?.box_name || "").toLowerCase(), box]),
      ),
    [boxes],
  );

  const productDimensionsFallback = useMemo(
    () => ({
      length: Number(selectedItem?.dimensions?.length || 0),
      breadth: Number(selectedItem?.dimensions?.breadth || 0),
      height: Number(selectedItem?.dimensions?.height || 0),
    }),
    [selectedItem],
  );

  const resolveMasterBox = useCallback((carton: any) => {
    const byId = boxLookupById.get(String(getCartonId(carton) || ""));
    if (byId) return byId;
    const byName = boxLookupByName.get(
      String(
        carton?.boxName ||
          carton?.cartonDetails?.name ||
          carton?.cartonName ||
          carton?.carton?.name ||
          "",
      ).toLowerCase(),
    );
    return byName;
  }, [boxLookupById, boxLookupByName]);

  const cartonEntries = useMemo(
    () =>
      (result?.packingResults || []).map((carton: any, index: number) => ({
        carton,
        key: `${getCartonId(carton) || "box"}-${index}`,
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

  const productWeightGrams = Number(result?.productInfo?.weight || selectedItem?.weight || 0);

  const visibleCartonTypeBreakdown = useMemo(() => {
    const grouped = new Map<
      string,
      {
        key: string;
        cartonType: string;
        dimensionsLabel: string;
        volumeCm3: number;
        count: number;
        totalItems: number;
        totalWeightKg: number;
        totalCost: number;
      }
    >();

    visibleCartons.forEach((entry: any) => {
      const carton = entry.carton;
      const masterBox = resolveMasterBox(carton);
      const cartonType = getCartonName(carton, masterBox);
      const dimensions = getCartonDimensions(carton, masterBox);
      const volumeCm3 = getCartonVolumeCm3(carton, masterBox);
      const dimensionsLabel = `${toFixed2(dimensions.length)} x ${toFixed2(dimensions.width)} x ${toFixed2(dimensions.height)} cm`;
      const key = getCartonId(carton) || cartonType;
      const previous = grouped.get(key) || {
        key,
        cartonType,
        dimensionsLabel,
        volumeCm3,
        count: 0,
        totalItems: 0,
        totalWeightKg: 0,
        totalCost: 0,
      };

      const packedItems = Number(carton?.itemsPacked || 0);
      const cartonWeightKg = (productWeightGrams * packedItems) / 1000;

      grouped.set(key, {
        ...previous,
        count: previous.count + 1,
        totalItems: previous.totalItems + packedItems,
        totalWeightKg: previous.totalWeightKg + cartonWeightKg,
        totalCost: previous.totalCost + Number(carton?.cost?.total || 0),
      });
    });

    return Array.from(grouped.values());
  }, [productWeightGrams, visibleCartons, resolveMasterBox]);

  const optimizationTip = useMemo(
    () =>
      result?.analytics?.optimizationTip ||
      (result?.analytics?.recommendations || []).find((text: string) =>
        text.startsWith("Optimization Tip:"),
      ) ||
      null,
    [result],
  );

  const getOrientationLabel = (orientation?: any) => {
    if (typeof orientation === "object" && orientation?.name) {
      return String(orientation.name);
    }
    if (orientation === "H×L×B") return "Standing Upright";
    if (orientation === "L×B×H" || orientation === "L×W×H") {
      return "Flat on Base";
    }
    return "Side Laying";
  };

  const buildCartonsUsedPayload = () =>
    visibleCartons.map((entry: any) => ({
      cartonId: getCartonId(entry.carton),
      cartonName: getCartonName(entry.carton, resolveMasterBox(entry.carton)),
      itemsPacked: entry.carton?.itemsPacked || 0,
      orientation: entry.carton?.orientation || null,
      dimensionsUsed: (() => {
        const fullDimensions = getCartonDimensions(entry.carton, resolveMasterBox(entry.carton));
        const used = getUsedDimensions(entry.carton, fullDimensions, productDimensionsFallback);
        return {
          length: used.length || null,
          breadth: used.width || null,
          height: used.height || null,
        };
      })(),
    }));

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      showSnackbar("Generating Packing Slip...", "info", 1800);
      const cartons = visibleCartons.map((entry: any) => entry.carton);
      const saveResult = await generateAndSharePackingSlip({
        productName: result.productInfo?.name || selectedItem?.productName,
        productDimensions: result.productInfo?.dimensions,
        isFragile: result.productInfo?.isFragile,
        preferredOrientation: result.packingResults?.[0]?.orientation,
        packedQty,
        cartons,
        productWeightGrams,
      });

      Alert.alert(
        "PDF Created",
        `Invoice exported successfully.\n${saveResult.fileName}`,
      );

      showSnackbar("Invoice exported successfully.", "success");
      setIsSlipModalVisible(false);
    } catch (pdfError: any) {
      const message = pdfError?.message || "Failed to generate PDF";
      showSnackbar(message, "error");
      Alert.alert("Export Error", message);
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
                  dimensions:
                    result?.productInfo?.dimensions ||
                    `${toFixed2(productDimensionsFallback.length)} x ${toFixed2(productDimensionsFallback.breadth)} x ${toFixed2(productDimensionsFallback.height)} cm`,
                  isFragile: !!result?.productInfo?.isFragile,
                  weight: Number(productWeightGrams || 0),
                  requestedQuantity: Number(requestedQty || packedQty),
                },
                summary: {
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

            showSnackbar(response.message || `${packedQty} items packed and inventory updated.`, "success");
            await triggerSuccessHaptic();
            await Promise.all([fetchItems(), fetchBoxes()]);
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

        {optimizationTip ? (
          <View className="mb-4 rounded-card border border-azure-400/35 bg-azure-500/10 px-4 py-3">
            <Text className="text-sm font-semibold text-azure-50">{optimizationTip}</Text>
          </View>
        ) : null}

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

        {visibleCartonTypeBreakdown.map((carton: any, index: number) => (
          <View
            key={`${carton?.key ?? carton?.cartonType ?? "carton"}-${index}`}
            className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-5"
          >
            <Text className="mb-3 text-xl font-bold text-azure-50">
              {carton.cartonType} ({carton.count} carton{carton.count > 1 ? "s" : ""})
            </Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-azure-200">Name</Text>
                <Text className="font-medium text-azure-50">{carton.cartonType}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-azure-200">Dimensions</Text>
                <Text className="font-medium text-azure-50">{carton.dimensionsLabel}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-azure-200">Volume</Text>
                <Text className="font-medium text-azure-50">{toFixed2(carton.volumeCm3)} cm³</Text>
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
                <Text className="text-azure-200">Total Weight</Text>
                <Text className="font-medium text-azure-50">{toFixed2(carton.totalWeightKg)} kg</Text>
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
                const masterBox = resolveMasterBox(carton);
                const fullDimensions = getCartonDimensions(carton, masterBox);
                const cartonName = getCartonName(carton, masterBox);
                const cartonWeightKg =
                  (productWeightGrams * Number(carton?.itemsPacked || 0)) / 1000;
                return (
                  <View
                    key={entry.key}
                    className="mb-3 rounded-xl border border-navy-800/30 bg-navy-950 p-3"
                    style={{ width: "31.5%" }}
                  >
                    <View className="flex-row items-center justify-between gap-2">
                      <Text className="flex-1 text-xs font-semibold text-azure-200" numberOfLines={1}>
                        {cartonName} (#{index + 1})
                      </Text>
                    </View>
                    <Text className="mt-1 text-sm font-bold text-azure-50" numberOfLines={1}>
                      {getOrientationLabel(carton.orientation)}
                    </Text>
                    <Text className="mt-1 text-xs text-azure-200">Items: {carton.itemsPacked}</Text>
                    <Text className="text-xs text-azure-200">Weight: {toFixed2(cartonWeightKg)} kg</Text>
                    <Text className="text-xs text-[#00F6FF]" numberOfLines={2}>
                      Dimensions Used: {getDimensionsUsedLabel(carton, fullDimensions, productDimensionsFallback)}
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
                  const masterBox = resolveMasterBox(carton);
                  const fullDimensions = getCartonDimensions(carton, masterBox);
                  const cartonName = getCartonName(carton, masterBox);
                  const cartonWeightKg =
                    (productWeightGrams * Number(carton?.itemsPacked || 0)) / 1000;
                  return (
                    <View
                      key={`${entry.key}-modal`}
                      className="mb-3 rounded-xl border border-navy-800/30 bg-navy-950 p-3"
                      style={{ width: "31.5%" }}
                    >
                      <View className="flex-row items-center justify-between gap-2">
                        <Text className="flex-1 text-xs font-semibold text-azure-200" numberOfLines={1}>
                          {cartonName} (#{index + 1})
                        </Text>
                      </View>
                      <Text className="mt-1 text-sm font-bold text-azure-50" numberOfLines={1}>
                        {getOrientationLabel(carton.orientation)}
                      </Text>
                      <Text className="mt-1 text-xs text-azure-200">Items: {carton.itemsPacked}</Text>
                      <Text className="text-xs text-azure-200">Weight: {toFixed2(cartonWeightKg)} kg</Text>
                      <Text className="text-xs text-azure-200" numberOfLines={2}>
                        Dimensions Used: {getDimensionsUsedLabel(carton, fullDimensions, productDimensionsFallback)}
                      </Text>
                      <Text className="text-xs text-[#00F6FF]" numberOfLines={2}>
                        Orientation: {getOrientationLabel(carton.orientation)}
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
