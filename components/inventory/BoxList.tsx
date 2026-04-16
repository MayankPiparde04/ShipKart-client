import React, { memo } from "react";
import {
  FlatList,
  Image,
  RefreshControl,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Package, PackagePlus, Pencil, Trash2 } from "lucide-react-native";
import SkeletonCard from "../ui/SkeletonCard";

interface Box {
  _id: string;
  box_name: string;
  length: number;
  breadth: number;
  height: number;
  quantity: number;
  max_weight: number;
}

interface BoxListProps {
  boxes: Box[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onBoxPress: (box: Box) => void;
  onDeletePress: (box: Box) => void;
  onAddPress: () => void;
  emptyMessage?: string;
  bottomInset?: number;
}

const BoxListItem = memo(function BoxListItem({
  item,
  onPress,
  onDelete,
}: {
  item: Box;
  onPress: () => void;
  onDelete: () => void;
}) {
  const quantity = Number(item.quantity);
  const isOutOfStock = quantity === 0;
  const isLowStock = quantity > 0 && quantity < 50;
  let stockColorClass = "text-azure-50";
  if (isOutOfStock) {
    stockColorClass = "text-[#EF4444]";
  } else if (isLowStock) {
    stockColorClass = "text-[#F59E0B]";
  }

  return (
    <TouchableOpacity
      className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 px-3 py-3"
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-lg border border-navy-800/40 bg-[#001933]">
          <Package size={24} strokeWidth={1.5} color="#99CCFF" />
        </View>

        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-base font-bold text-azure-50" numberOfLines={1}>
              {item.box_name}
            </Text>
            <View className="rounded-full border border-azure-400/35 bg-azure-500/10 px-2 py-1">
              <Text className="text-[11px] font-semibold text-azure-200">Box</Text>
            </View>
          </View>

          <View className="self-start rounded-md border border-[#054161]/55 bg-[#001933] px-2 py-1">
            <Text className="text-[11px] text-azure-200">
              {item.length}x{item.breadth}x{item.height} cm
            </Text>
          </View>

          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Text className="text-[11px] uppercase tracking-[0.8px] text-azure-200">
                Count
              </Text>
              <Text className={`text-sm font-bold ${stockColorClass}`}>{item.quantity}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-[11px] uppercase tracking-[0.8px] text-azure-200">
                Weight
              </Text>
              <Text className="text-sm font-semibold text-azure-50">{item.max_weight} kg</Text>
            </View>
          </View>
        </View>

        <View className="ml-1 items-end gap-2 self-stretch justify-between">
          <View className="flex-row gap-2">
            <Pressable
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.box_name}`}
              style={({ pressed }) => ({
                height: 34,
                width: 34,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "rgba(0, 127, 255, 0.16)" : "transparent",
                borderWidth: 1,
                borderColor: "rgba(5, 65, 97, 0.35)",
              })}
            >
              <Pencil size={15} strokeWidth={1.7} color="#99CCFF" />
            </Pressable>

            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.box_name}`}
              style={({ pressed }) => ({
                height: 34,
                width: 34,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "rgba(239, 68, 68, 0.16)" : "transparent",
                borderWidth: 1,
                borderColor: pressed ? "rgba(239, 68, 68, 0.35)" : "rgba(5, 65, 97, 0.35)",
              })}
            >
              <Trash2 size={15} strokeWidth={1.7} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function BoxList({
  boxes,
  isLoading,
  isRefreshing,
  onRefresh,
  onBoxPress,
  onDeletePress,
  onAddPress,
  emptyMessage = "No boxes available yet.",
  bottomInset = 0,
}: Readonly<BoxListProps>) {
  const safeBoxes = Array.isArray(boxes) ? boxes : [];

  if (isLoading) {
    return (
      <View className="flex-1 px-4 pt-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <FlatList
        data={safeBoxes}
        keyExtractor={(box) => box._id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={60}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 120 }}
        renderItem={({ item }) => (
          <BoxListItem
            item={item}
            onPress={() => onBoxPress(item)}
            onDelete={() => onDeletePress(item)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Image
              source={require("../../assets/images/Shipwise_logo_t.png")}
              style={{ width: 170, height: 78, opacity: 0.18 }}
              resizeMode="contain"
            />
            <Package size={46} strokeWidth={1.5} color="#99CCFF" />
            <Text className="mt-4 text-lg font-semibold text-azure-50">Empty Warehouse</Text>
            <Text className="mt-1 text-center text-azure-200">{emptyMessage}</Text>
            <TouchableOpacity
              onPress={onAddPress}
              className="mt-4 flex-row items-center rounded-full border border-azure-400/40 bg-azure-500 px-6 py-2"
            >
              <PackagePlus size={16} strokeWidth={1.5} color="white" />
              <Text className="ml-2 font-bold text-white">
                Add First Box
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
