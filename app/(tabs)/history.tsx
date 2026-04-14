import SkeletonCard from "@/components/ui/SkeletonCard";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { ShipmentTransaction, useHistory } from "@/contexts/HistoryContext";
import { formatCurrencyInr } from "@/utils/currency";
import { generateAndSharePackingSlip } from "@/utils/packingSlip";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Download, Trash2 } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatTransactionTime(rawDate?: string) {
  const date = rawDate ? new Date(rawDate) : new Date();
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function TransactionCard({
  item,
  onDownloadPress,
  onDeletePress,
}: Readonly<{
  item: ShipmentTransaction;
  onDownloadPress: (item: ShipmentTransaction) => void;
  onDeletePress: (item: ShipmentTransaction) => void;
}>) {
  const cartonsCount = item.cartonsUsed?.length || 0;
  const displayTime = formatTransactionTime(
    item.createdAt || item.timestamp || item.packedAt,
  );
  const estimatedCost =
    item.metadata?.summary?.estimatedCost?.total ||
    item.metadata?.summary?.estimatedCost?.breakdown?.cartonBaseCost ||
    null;

  return (
    <View className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 p-4">
      <View className="mb-3 flex-row items-start justify-between gap-3">
        <TouchableOpacity
          className="h-11 w-11 items-center justify-center rounded-xl border border-azure-500/35 bg-navy-900"
          onPress={() => onDownloadPress(item)}
          hitSlop={6}
        >
          <Download size={18} color="#007FFF" strokeWidth={2} />
        </TouchableOpacity>

        <View className="flex-1 pr-2">
          <Text className="text-xs font-semibold uppercase tracking-[1px] text-azure-200">
            Transaction ID
          </Text>
          <Text className="mt-1 text-sm font-bold text-azure-50">
            {item._id}
          </Text>
          <Text className="mt-1 text-xs font-medium text-azure-200">{displayTime}</Text>
        </View>
        <TouchableOpacity
          className="h-11 w-11 items-center justify-center rounded-xl border border-[#FF6F61]/35 bg-navy-900"
          onPress={() => onDeletePress(item)}
          hitSlop={6}
        >
          <Trash2 size={18} color="#FF6F61" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-azure-200">Product</Text>
          <Text className="flex-1 pl-3 text-right font-semibold text-azure-50">
            {item.productName || "Unknown Product"}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-azure-200">Total Packed</Text>
          <Text className="font-semibold text-azure-50">{item.packedQty || 0}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-azure-200">Cartons Used</Text>
          <Text className="font-semibold text-azure-50">{cartonsCount}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-azure-200">Estimated Cost</Text>
          <Text className="font-semibold text-azure-50">
            {estimatedCost === null ? "N/A" : formatCurrencyInr(estimatedCost)}
          </Text>
        </View>
      </View>

    </View>
  );
}

export default function HistoryScreen() {
  const { transactions, isLoading, fetchTransactions, deleteTransaction } = useHistory();
  const tabBarHeight = useBottomTabBarHeight();
  const { showSnackbar } = useSnackbar();
  const [selectedTransaction, setSelectedTransaction] = useState<ShipmentTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions]),
  );

  const emptyComponent = useMemo(
    () => (
      <View className="items-center py-14">
        <Text className="text-lg font-semibold text-azure-50">No transactions yet</Text>
        <Text className="mt-2 text-center text-azure-200">
          Pack an item to start building your order history.
        </Text>
      </View>
    ),
    [],
  );

  const handleConfirmDelete = async () => {
    if (!selectedTransaction) return;

    setIsDeleting(true);
    try {
      await deleteTransaction(selectedTransaction._id);
      showSnackbar("History record removed from view", "success");
      setSelectedTransaction(null);
    } catch (error: any) {
      Alert.alert("Delete failed", error.message || "Failed to delete history record");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = async (transaction: ShipmentTransaction) => {
    const metadata = transaction.metadata || transaction.packed_details || {};
    const metadataPackingResults = Array.isArray((metadata as any)?.packingResults)
      ? (metadata as any).packingResults
      : [];

    const cartons = metadataPackingResults.length
      ? metadataPackingResults.map((carton: any) => ({
          cartonId: carton.cartonId,
          cartonName: carton.cartonName,
          cartonDetails: {
            id: carton.cartonId,
            name: carton.cartonName,
          },
          itemsPacked: Number(carton.itemsPacked || 0),
          orientation: carton.orientation || null,
          orientationDetails:
            carton.orientationDetails?.dimensionsUsed || carton.dimensionsUsed
              ? {
                  dimensionsUsed:
                    carton.orientationDetails?.dimensionsUsed || carton.dimensionsUsed,
                }
              : undefined,
        }))
      : (transaction.cartonsUsed || []).map((carton) => ({
          cartonId: carton.cartonId,
          cartonName: carton.cartonName,
          cartonDetails: {
            id: carton.cartonId,
            name: carton.cartonName,
          },
          itemsPacked: Number(carton.itemsPacked || 0),
          orientation: carton.orientation || null,
          orientationDetails: carton.dimensionsUsed
            ? {
                dimensionsUsed: carton.dimensionsUsed,
              }
            : undefined,
        }));

    if (!cartons.length) {
      Alert.alert("Missing Data", "No packing details found for this history record.");
      return;
    }

    try {
      setIsGeneratingPdf(true);
      showSnackbar("Generating PDF...", "info", 1800);

      const productInfo = (metadata as any)?.productInfo || {};
      const estimatedCostBreakdown = (metadata as any)?.summary?.estimatedCost?.breakdown || {};

      await generateAndSharePackingSlip({
        generatedAt: transaction.packedAt ? new Date(transaction.packedAt) : new Date(),
        productName: productInfo?.name || transaction.productName,
        productDimensions: productInfo?.dimensions || "N/A",
        isFragile: !!productInfo?.isFragile,
        preferredOrientation: cartons[0]?.orientation || null,
        packedQty: Number(transaction.packedQty || 0),
        cartons,
        productWeightGrams: Number(productInfo?.weight || 0),
        shippingRatePerKg: Number(estimatedCostBreakdown?.shippingRatePerKg || 18),
        fragileHandlingFee: Number(estimatedCostBreakdown?.fragileHandlingFee || 0),
        cartonBaseCost: Number(estimatedCostBreakdown?.cartonBaseCost || 0),
      });

      showSnackbar("Packing slip generated successfully", "success");
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to generate PDF", "error");
      Alert.alert("Export Error", error?.message || "Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" translucent />
      <View className="flex-1 px-6 pt-4" style={{ paddingBottom: tabBarHeight + 8 }}>
        <Text className="text-3xl font-bold text-azure-50">Order History</Text>
        <Text className="mt-1 text-azure-200">
          Track every successful inventory packing transaction
        </Text>

        {isLoading ? (
          <View className="mt-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <FlatList
            className="mt-4"
            data={transactions}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TransactionCard
                item={item}
                onDownloadPress={handleDownloadPdf}
                onDeletePress={setSelectedTransaction}
              />
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={emptyComponent}
          />
        )}
      </View>

      <Modal visible={!!selectedTransaction} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View className="w-full rounded-3xl border border-navy-800/40 bg-navy-900 p-6">
            <View className="mb-3 flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-[#D58F3C]/15">
                <Ionicons name="warning-outline" size={20} color="#F3A6A6" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-azure-50">Confirm Delete</Text>
                <Text className="text-sm text-azure-200">
                  Remove this log from your history view only.
                </Text>
              </View>
            </View>

            <Text className="mb-5 text-sm leading-5 text-azure-200">
              This action will not restore inventory stock or alter packed shipments. It only hides the record from your timeline.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-2xl border border-navy-800/40 bg-navy-950 px-4 py-3"
                onPress={() => setSelectedTransaction(null)}
                disabled={isDeleting}
              >
                <Text className="text-center font-semibold text-azure-200">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-2xl border border-[#D58F3C]/20 bg-[#D58F3C]/12 px-4 py-3"
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                <Text className="text-center font-bold text-[#F3A6A6]">
                  {isDeleting ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isGeneratingPdf} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View className="w-full max-w-[300px] rounded-3xl border border-navy-800/40 bg-navy-900 p-6">
            <ActivityIndicator size="large" color="#007FFF" />
            <Text className="mt-4 text-center text-base font-semibold text-azure-50">
              Generating PDF...
            </Text>
            <Text className="mt-1 text-center text-sm text-azure-200">
              Building your official packing slip.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
