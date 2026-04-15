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
import { Image as ExpoImage } from "expo-image";
import { Box, PackagePlus, Pencil, Trash2 } from "lucide-react-native";
import SkeletonCard from "../ui/SkeletonCard";

interface Item {
  _id: string;
  productName: string;
  quantity: number;
  weight: number;
  price: number;
  dimensions: { length: number; breadth: number; height: number };
  category?: string;
  brand?: string;
  imageUrl?: string;
}

interface InventoryListProps {
  items: Item[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onItemPress: (item: Item) => void;
  onDeletePress: (item: Item) => void;
  onAddPress: () => void;
  emptyMessage?: string;
  bottomInset?: number;
}

const InventoryListItem = memo(function InventoryListItem({
  item,
  onPress,
  onDelete,
}: {
  item: Item;
  onPress: () => void;
  onDelete: () => void;
}) {
  const isLowStock = Number(item.quantity) < 20;

  return (
    <TouchableOpacity
      className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 px-3 py-3"
      onPress={onPress}
      activeOpacity={0.86}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-navy-800/40 bg-[#001933]">
          {item.imageUrl ? (
            <ExpoImage
              source={{ uri: item.imageUrl }}
              cachePolicy="memory-disk"
              contentFit="cover"
              transition={120}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <Box size={20} strokeWidth={1.5} color="#99CCFF" />
          )}
        </View>

        <View className="min-w-0 flex-1">
          <Text className="text-base font-bold text-azure-50" numberOfLines={1}>
            {item.productName}
          </Text>
          <Text className="mt-0.5 text-sm text-azure-200" numberOfLines={1}>
            {item.brand ? `${item.brand} • ` : ""}
            {item.category || "Uncategorized"}
          </Text>
          <View className="mt-2 self-start rounded-md border border-[#054161]/55 bg-[#001933] px-2 py-1">
            <Text className="text-[11px] text-azure-200">
              {item.dimensions.length}x{item.dimensions.breadth}x{item.dimensions.height} cm
            </Text>
          </View>
        </View>

        <View className="w-14 items-end">
          <Text className="text-[10px] uppercase tracking-[0.8px] text-azure-200">Stock</Text>
          <Text className={`mt-1 text-xl font-bold ${isLowStock ? "text-[#F87171]" : "text-azure-50"}`}>
            {item.quantity}
          </Text>
        </View>

        <View className="ml-1 w-16 items-end self-stretch justify-between">
          <Text className="text-sm font-semibold text-[#00F6FF]">₹{item.price}</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.productName}`}
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
              accessibilityLabel={`Delete ${item.productName}`}
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

export default function InventoryList({
  items,
  isLoading,
  isRefreshing,
  onRefresh,
  onItemPress,
  onDeletePress,
  onAddPress,
  emptyMessage = "No items in stock yet.",
  bottomInset = 0,
}: Readonly<InventoryListProps>) {
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
        data={items}
        keyExtractor={(item) => item._id}
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
          <InventoryListItem
            item={item}
            onPress={() => onItemPress(item)}
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
            <Box size={46} strokeWidth={1.5} color="#99CCFF" />
            <Text className="mt-4 text-lg font-semibold text-azure-50">Empty Warehouse</Text>
            <Text className="mt-1 text-center text-azure-200">{emptyMessage}</Text>
            <TouchableOpacity
              onPress={onAddPress}
              className="mt-4 flex-row items-center rounded-full border border-azure-400/40 bg-azure-500 px-6 py-2"
            >
              <PackagePlus size={16} strokeWidth={1.5} color="#E5F2FF" />
              <Text className="ml-2 font-bold text-azure-50">
                Add First Item
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
