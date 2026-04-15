import React, { memo } from "react";
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
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
}

const InventoryListItem = memo(function InventoryListItem({
  item,
  onPress,
  onDelete,
  cardWidth,
}: {
  item: Item;
  onPress: () => void;
  onDelete: () => void;
  cardWidth: `${number}%`;
}) {
  return (
    <View
      className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 px-4 py-4"
      style={{ width: cardWidth }}
    >
      <View className="flex-row items-start justify-between gap-4">
        <TouchableOpacity className="flex-1" onPress={onPress}>
          {item.imageUrl ? (
            <ExpoImage
              source={{ uri: item.imageUrl }}
              cachePolicy="memory-disk"
              contentFit="cover"
              transition={120}
              style={{ width: "100%", height: 108, borderRadius: 12, marginBottom: 10 }}
            />
          ) : null}
          <Text className="mb-1 text-lg font-semibold text-azure-50">
            {item.productName}
          </Text>
          <Text className="mb-3 text-sm text-azure-200">
            {item.brand ? `${item.brand} • ` : ""}
            {item.category || "Uncategorized"}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full border border-[#054161]/50 bg-[#001933] px-3 py-1">
              <Text className="text-xs text-azure-200">
                {item.dimensions.length}x{item.dimensions.breadth}x
                {item.dimensions.height} cm
              </Text>
            </View>
            <View className="rounded-full border border-[#054161]/50 bg-[#001933] px-3 py-1">
              <Text className="text-xs text-azure-200">{item.weight}g</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View className="w-24 items-end self-stretch pr-3">
          <View className="w-full items-end">
            <Text className="text-xs uppercase tracking-[1px] text-azure-200">
              Units
            </Text>
          </View>

          <View className="mt-2 w-full items-end">
            <Text className="text-2xl font-bold text-azure-50">
              {item.quantity}
            </Text>
          </View>

          <View className="mt-auto w-full items-end gap-3">
            <Text className="mt-2 text-xs uppercase tracking-[1px] text-azure-200">
              Price
            </Text>
            <Text className="text-sm font-semibold text-[#00F6FF]">
              ₹{item.price}
            </Text>

            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.productName}`}
              style={({ pressed }) => ({
                height: 40,
                width: 40,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: pressed ? "rgba(239, 68, 68, 0.16)" : "transparent",
                borderWidth: 1,
                borderColor: pressed ? "rgba(239, 68, 68, 0.35)" : "rgba(5, 65, 97, 0.35)",
              })}
            >
              <Trash2 size={18} strokeWidth={1.5} color="#EF4444" />
            </Pressable>
          </View>
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
}: Readonly<InventoryListProps>) {
  const { width } = useWindowDimensions();
  const numColumns = Platform.OS === "web" && width >= 960 ? 3 : 2;
  const cardWidth: `${number}%` = numColumns === 3 ? "32%" : "48.5%";

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
        numColumns={numColumns}
        key={`inventory-grid-${numColumns}`}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={60}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        renderItem={({ item }) => (
          <InventoryListItem
            item={item}
            onPress={() => onItemPress(item)}
            onDelete={() => onDeletePress(item)}
            cardWidth={cardWidth}
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
            <Text className="mt-1 text-center text-azure-200">No items in stock yet.</Text>
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
