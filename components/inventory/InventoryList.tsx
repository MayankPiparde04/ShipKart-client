import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  onAddPress: () => void;
}

export default function InventoryList({
  items,
  isLoading,
  isRefreshing,
  onRefresh,
  onItemPress,
  onAddPress,
}: InventoryListProps) {
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-4">Loading inventory...</Text>
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
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 shadow-sm border border-gray-100 dark:border-gray-700"
            onPress={() => onItemPress(item)}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                  {item.productName}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  {item.brand ? `${item.brand} • ` : ""}
                  {item.category || "Uncategorized"}
                </Text>
                <View className="flex-row gap-2">
                  <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <Text className="text-xs text-gray-600 dark:text-gray-300">
                      {item.dimensions.length}x{item.dimensions.breadth}x
                      {item.dimensions.height} cm
                    </Text>
                  </View>
                  <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    <Text className="text-xs text-gray-600 dark:text-gray-300">
                      {item.weight}g
                    </Text>
                  </View>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {item.quantity}
                </Text>
                <Text className="text-xs text-gray-400">units</Text>
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                  ${item.price}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="cube-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">No items found</Text>
            <TouchableOpacity
              onPress={onAddPress}
              className="mt-4 bg-blue-100 dark:bg-blue-900/30 px-6 py-2 rounded-full"
            >
              <Text className="text-blue-600 dark:text-blue-400 font-bold">
                Add First Item
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={onAddPress}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
