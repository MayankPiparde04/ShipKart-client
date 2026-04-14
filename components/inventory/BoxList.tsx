import { Ionicons } from "@expo/vector-icons";
import React, { memo } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Package, PackagePlus } from "lucide-react-native";
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
  onRefresh: () => void;
  onBoxPress: (box: Box) => void;
  onAddPress: () => void;
  tabBarHeight?: number;
}

const BoxListItem = memo(function BoxListItem({
  item,
  onPress,
}: {
  item: Box;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 p-4"
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <View className="mr-4 rounded-full bg-azure-500/15 p-3">
          <Package size={24} strokeWidth={1.5} color="#007FFF" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-azure-50">{item.box_name}</Text>
          <Text className="text-sm text-azure-200">
            {item.length}x{item.breadth}x{item.height} cm • Max {item.max_weight}kg
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-2xl font-bold text-[#00F6FF]">{item.quantity}</Text>
          <Text className="text-xs text-azure-200">in stock</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function BoxList({
  boxes,
  isLoading,
  onRefresh,
  onBoxPress,
  onAddPress,
  tabBarHeight = 0,
}: Readonly<BoxListProps>) {
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
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={60}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => <BoxListItem item={item} onPress={() => onBoxPress(item)} />}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Package size={64} strokeWidth={1.5} color="#99CCFF" />
            <Text className="mt-4 text-lg text-azure-200">No boxes found</Text>
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
      <TouchableOpacity
        className="absolute right-6 h-14 w-14 items-center justify-center rounded-full border border-azure-400/40 bg-azure-500"
        style={{ bottom: tabBarHeight + 16 }}
        onPress={onAddPress}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
