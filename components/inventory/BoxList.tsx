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
import { Package } from "lucide-react-native";

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
}

export default function BoxList({
  boxes,
  isLoading,
  onRefresh,
  onBoxPress,
  onAddPress,
}: BoxListProps) {
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-500 mt-4">Loading boxes...</Text>
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
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white dark:bg-gray-800 p-4 rounded-xl mb-3 shadow-sm border border-gray-100 dark:border-gray-700"
            onPress={() => onBoxPress(item)}
          >
            <View className="flex-row items-center">
              <View className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mr-4">
                <Package size={24} color="#ea580c" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-900 dark:text-white text-lg">
                  {item.box_name}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {item.length}x{item.breadth}x{item.height} cm • Max{" "}
                  {item.max_weight}kg
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {item.quantity}
                </Text>
                <Text className="text-xs text-gray-400">in stock</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Package size={64} color="#9CA3AF" />
            <Text className="text-gray-500 mt-4 text-lg">No boxes found</Text>
            <TouchableOpacity
              onPress={onAddPress}
              className="mt-4 bg-orange-100 dark:bg-orange-900/30 px-6 py-2 rounded-full"
            >
              <Text className="text-orange-600 dark:text-orange-400 font-bold">
                Add First Box
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-orange-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
        onPress={onAddPress}
      >
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}
