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
import { Package, PackagePlus, Trash2 } from "lucide-react-native";
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
}

const BoxListItem = memo(function BoxListItem({
  item,
  onPress,
  onDelete,
  cardWidth,
}: {
  item: Box;
  onPress: () => void;
  onDelete: () => void;
  cardWidth: `${number}%`;
}) {
  return (
    <TouchableOpacity
      className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 px-4 py-4"
      style={{ width: cardWidth }}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between gap-4">
        <View className="mr-1 rounded-full bg-azure-500/15 p-3">
          <Package size={24} strokeWidth={1.5} color="#007FFF" />
        </View>
        <View className="flex-1">
          <Text className="mb-1 text-lg font-semibold text-azure-50">
            {item.box_name}
          </Text>
          <Text className="mb-3 text-sm text-azure-200">
            Shipping container
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="rounded-full border border-[#054161]/50 bg-[#001933] px-3 py-1">
              <Text className="text-xs text-azure-200">
                {item.length}x{item.breadth}x{item.height} cm
              </Text>
            </View>
            <View className="rounded-full border border-[#054161]/50 bg-[#001933] px-3 py-1">
              <Text className="text-xs text-azure-200">
                Max {item.max_weight}kg
              </Text>
            </View>
          </View>
        </View>
        <View className="w-24 items-end self-stretch">
          <View className="w-full items-end">
            <Text className="text-xs uppercase tracking-[1px] text-azure-200">
              Stock
            </Text>
          </View>
          <View className="mt-2 w-full items-end">
            <Text className="text-2xl font-bold text-azure-50">
              {item.quantity}
            </Text>
          </View>

          <View className="mt-auto w-full items-end pt-3">
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.box_name}`}
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
}: Readonly<BoxListProps>) {
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
        data={boxes}
        keyExtractor={(box) => box._id}
        numColumns={numColumns}
        key={`box-grid-${numColumns}`}
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
          <BoxListItem
            item={item}
            onPress={() => onBoxPress(item)}
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
            <Package size={46} strokeWidth={1.5} color="#99CCFF" />
            <Text className="mt-4 text-lg font-semibold text-azure-50">Empty Warehouse</Text>
            <Text className="mt-1 text-center text-azure-200">No boxes available yet.</Text>
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
