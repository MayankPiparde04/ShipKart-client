import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Mock data for shipments
const MOCK_SHIPMENTS = [
  {
    id: "SH-10234",
    destination: "New York, USA",
    status: "In Transit",
    courier: "FedEx",
    eta: "2 days",
    lastUpdate: "Arrived at distribution center",
    progress: 60,
  },
  {
    id: "SH-10235",
    destination: "London, UK",
    status: "Delivered",
    courier: "DHL",
    eta: "Delivered",
    lastUpdate: "Signed by recipient",
    progress: 100,
  },
  {
    id: "SH-10236",
    destination: "Toronto, Canada",
    status: "Pending",
    courier: "UPS",
    eta: "5 days",
    lastUpdate: "Label Created",
    progress: 10,
  },
  {
    id: "SH-10237",
    destination: "Mumbai, India",
    status: "Out for Delivery",
    courier: "BlueDart",
    eta: "Today",
    lastUpdate: "Out for delivery",
    progress: 90,
  },
];

export default function TrackingList() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShipments = MOCK_SHIPMENTS.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
      case "In Transit":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30";
      case "Pending":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
      case "Out for Delivery":
        return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Track Shipments
          </Text>
        </View>

        <View className="p-4">
          <View className="bg-gray-100 dark:bg-gray-900 rounded-xl flex-row items-center p-3 border border-gray-200 dark:border-gray-800">
            <Ionicons
              name="search"
              size={20}
              color="#9ca3af"
              className="mr-2"
            />
            <TextInput
              placeholder="Enter Tracking ID or Destination"
              placeholderTextColor="#9ca3af"
              className="flex-1 text-gray-900 dark:text-white text-base"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <FlatList
          data={filteredShipments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl mb-3 border border-gray-200 dark:border-gray-800"
              onPress={() =>
                router.push({
                  pathname: `/tracking/${item.id}` as any,
                  params: { data: JSON.stringify(item) },
                })
              }
            >
              <View className="flex-row justify-between mb-2">
                <Text className="font-bold text-gray-900 dark:text-white text-lg">
                  {item.id}
                </Text>
                <View
                  className={`px-2 py-1 rounded-full ${getStatusColor(item.status).split(" ")[1]}`}
                >
                  <Text
                    className={`text-xs font-bold ${getStatusColor(item.status).split(" ")[0]}`}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-2">
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#6b7280"
                  className="mr-1"
                />
                <Text className="text-gray-600 dark:text-gray-300">
                  {item.destination}
                </Text>
              </View>

              <View className="flex-row justify-between items-end mt-2">
                <View>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    Last Update
                  </Text>
                  <Text className="text-gray-700 dark:text-gray-200 text-sm font-medium">
                    {item.lastUpdate}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">
                    ETA
                  </Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {item.eta}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                <View
                  style={{ width: `${item.progress}%` }}
                  className={`h-full rounded-full ${
                    item.status === "Delivered"
                      ? "bg-green-500"
                      : item.status === "Pending"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                  }`}
                />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-10 opacity-50">
              <Ionicons name="cube-outline" size={64} color="#9ca3af" />
              <Text className="text-gray-400 mt-2">No shipments found</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
