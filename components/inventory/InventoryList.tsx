import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Box, PackagePlus, Trash2 } from "lucide-react-native";
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
}

interface InventoryListProps {
  items: Item[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onItemPress: (item: Item) => void;
  onDeletePress: (item: Item) => void;
  onAddPress: () => void;
  tabBarHeight?: number;
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
  return (
    <View className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 p-4">
      <View className="flex-row items-start justify-between">
        <TouchableOpacity className="flex-1" onPress={onPress}>
          <Text className="mb-1 text-lg font-bold text-azure-50">
            {item.productName}
          </Text>
          <Text className="mb-2 text-sm text-azure-200">
            {item.brand ? `${item.brand} • ` : ""}
            {item.category || "Uncategorized"}
          </Text>
          <View className="flex-row gap-2">
            <View className="rounded border border-navy-800/30 bg-navy-950 px-2 py-1">
              <Text className="text-xs text-azure-200">
                {item.dimensions.length}x{item.dimensions.breadth}x
                {item.dimensions.height} cm
              </Text>
            </View>
            <View className="rounded border border-navy-800/30 bg-navy-950 px-2 py-1">
              <Text className="text-xs text-azure-200">{item.weight}g</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View className="items-end">
          <Text className="text-2xl font-bold text-azure-50">{item.quantity}</Text>
          <Text className="text-xs text-azure-200">units</Text>
          <Text className="mt-2 text-sm font-medium text-[#00F6FF]">₹{item.price}</Text>
          <TouchableOpacity
            className="mt-2 h-11 w-11 items-center justify-center rounded-full border border-red-500/40 bg-red-500/15"
            onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.productName}`}
          >
            <Trash2 size={20} strokeWidth={1.5} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  tabBarHeight = 0,
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
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <InventoryListItem
            item={item}
            onPress={() => onItemPress(item)}
            onDelete={() => onDeletePress(item)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Box size={64} strokeWidth={1.5} color="#99CCFF" />
            <Text className="mt-4 text-lg text-azure-200">No items found</Text>
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
      <TouchableOpacity
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-full border border-azure-400/40 bg-azure-500"
        style={{ bottom: tabBarHeight + 16 }}
        onPress={onAddPress}
      >
        <Ionicons name="add" size={30} color="#E5F2FF" />
      </TouchableOpacity>
    </View>
  );
}
