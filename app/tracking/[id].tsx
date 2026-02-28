import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackingDetail() {
  const { data } = useLocalSearchParams();
  const shipment = data ? JSON.parse(data as string) : null;

  if (!shipment) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-950 justify-center items-center">
        <Text className="text-gray-500">Shipment not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-600">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const timeline = [
    {
      time: "Today, 10:00 AM",
      status: "Out for delivery",
      description: "Courier is on the way to your location",
      completed: shipment.progress >= 90,
    },
    {
      time: "Yesterday, 06:00 PM",
      status: "Arrived at distribution center",
      description: "Package processed at local facility",
      completed: shipment.progress >= 60,
    },
    {
      time: "Yesterday, 02:00 PM",
      status: "In Transit",
      description: "Package is on the way",
      completed: shipment.progress >= 40,
    },
    {
      time: "2 days ago, 09:00 AM",
      status: "Picked Up",
      description: "Courier picked up the package",
      completed: shipment.progress >= 20,
    },
    {
      time: "2 days ago, 08:00 AM",
      status: "Label Created",
      description: "Shipping label created",
      completed: true,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950">
      <StatusBar style="auto" />

      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200 dark:border-gray-800 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            Shipment Details
          </Text>
          <Text className="text-gray-500 text-sm">{shipment.id}</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* Status Card */}
        <View className="bg-blue-600 dark:bg-blue-800 p-6 rounded-b-3xl shadow-lg mb-6">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-blue-100 text-sm mb-1">
                Estimated Delivery
              </Text>
              <Text className="text-white text-3xl font-bold">
                {shipment.eta}
              </Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white font-bold">{shipment.status}</Text>
            </View>
          </View>

          <View className="bg-white/10 p-4 rounded-xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="bg-white p-2 rounded-full mr-3">
                <Ionicons name="cube" size={20} color="#2563EB" />
              </View>
              <View>
                <Text className="text-white font-bold">{shipment.courier}</Text>
                <Text className="text-blue-100 text-xs">Standard Shipping</Text>
              </View>
            </View>
            <TouchableOpacity className="bg-white px-4 py-2 rounded-lg">
              <Text className="text-blue-600 font-bold text-sm">
                Call Support
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Info */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center mb-6">
            <View className="items-center mr-4">
              <View className="w-3 h-3 bg-gray-300 rounded-full" />
              <View className="w-0.5 h-10 bg-gray-300 my-1" />
              <View className="w-3 h-3 bg-blue-600 rounded-full" />
            </View>
            <View className="flex-1 h-16 justify-between py-1">
              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                  From
                </Text>
                <Text className="text-gray-900 dark:text-white font-bold">
                  Warsaw, Poland
                </Text>
              </View>
              <View>
                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                  To
                </Text>
                <Text className="text-gray-900 dark:text-white font-bold">
                  {shipment.destination}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View className="px-6 pb-10">
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Tracking History
          </Text>

          {timeline.map((event, index) => (
            <View key={index} className="flex-row mb-6">
              <View className="items-center mr-4 pt-1">
                <View
                  className={`w-4 h-4 rounded-full border-2 ${event.completed ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600"}`}
                />
                {index < timeline.length - 1 && (
                  <View
                    className={`w-0.5 flex-1 my-1 ${event.completed ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"}`}
                  />
                )}
              </View>
              <View className="flex-1 pb-4">
                <View className="flex-row justify-between mb-1">
                  <Text
                    className={`font-bold text-base ${event.completed ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {event.status}
                  </Text>
                  <Text className="text-gray-400 text-xs">{event.time}</Text>
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm leading-5">
                  {event.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
