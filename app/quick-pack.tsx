import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Import axios instance directly
import api from "@/services/api";

interface PackItem {
  id: string;
  name: string;
  length: string;
  breadth: string;
  height: string;
  weight: string;
  quantity: string;
}

export default function QuickPack() {
  const [items, setItems] = useState<PackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    length: "",
    breadth: "",
    height: "",
    weight: "",
    quantity: "1",
  });

  const addItem = () => {
    if (
      !newItem.name ||
      !newItem.length ||
      !newItem.breadth ||
      !newItem.height
    ) {
      Alert.alert("Error", "Please fill in Name and Dimensions (L, B, H)");
      return;
    }

    const item: PackItem = {
      id: Date.now().toString(),
      name: newItem.name,
      length: newItem.length,
      breadth: newItem.breadth,
      height: newItem.height,
      weight: newItem.weight || "0",
      quantity: newItem.quantity || "1",
    };

    setItems([...items, item]);
    setNewItem({
      name: "",
      length: "",
      breadth: "",
      height: "",
      weight: "",
      quantity: "1",
    });
    setShowForm(false);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const calculatePacking = async () => {
    if (items.length === 0) {
      Alert.alert("Error", "Please add at least one item to pack");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Transform items for API
      const products = items.map((item) => ({
        name: item.name,
        dimensions: {
          length: Number.parseFloat(item.length),
          breadth: Number.parseFloat(item.breadth),
          height: Number.parseFloat(item.height),
        },
        weight: Number.parseFloat(item.weight),
        quantity: Number.parseInt(item.quantity, 10),
      }));

      // Call API using the centralized axios instance
      const response = await api.post("/enhanced-packing", { products });

      if (response.data?.success) {
        setResult(response.data.data);
      } else {
        Alert.alert(
          "Error",
          response.data?.message || "Packing calculation failed",
        );
      }
    } catch (error: any) {
      console.error("Packing error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "Failed to calculate packing",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmPacking = async () => {
    Alert.alert(
      "Confirm Packing",
      "This will deduct the used cartons from your inventory. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setLoading(true);
            try {
              const { packingResults } = result;
              // Group by box name to minimize API calls
              const boxUsage: Record<string, number> = {};

              if (packingResults) {
                packingResults.forEach((carton: any) => {
                  const name = carton.cartonDetails.name;
                  boxUsage[name] = (boxUsage[name] || 0) + 1;
                });

                // Call removebox for each type
                for (const [boxName, qty] of Object.entries(boxUsage)) {
                  await api.post("/removebox", {
                    boxName: boxName,
                    quantity: qty,
                  });
                }
              }

              Alert.alert("Success", "Inventory updated successfully!", [
                {
                  text: "OK",
                  onPress: () => {
                    setResult(null);
                    setItems([]);
                    router.back();
                  },
                },
              ]);
            } catch (error: any) {
              console.error("Inventory update failed:", error);
              Alert.alert(
                "Error",
                "Failed to update inventory. Some items may not have been deducted.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderResult = () => {
    if (!result) return null;

    const { summary, packingResults } = result;

    return (
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-azure-50">
            Results
          </Text>
          <TouchableOpacity
            onPress={() => setResult(null)}
            className="rounded-full border border-navy-800/30 bg-navy-950 px-3 py-1"
          >
            <Text className="text-azure-200">Close</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 items-center rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="text-3xl font-bold text-azure-50">
              {summary.totalCartonsUsed}
            </Text>
            <Text className="text-sm text-azure-200">
              Cartons
            </Text>
          </View>
          <View className="flex-1 items-center rounded-card border border-navy-800/30 bg-navy-900 p-4">
            <Text className="text-3xl font-bold text-[#00F6FF]">
              {summary.packingRate}%
            </Text>
            <Text className="text-sm text-azure-200">
              Efficiency
            </Text>
          </View>
        </View>

        <Text className="mb-3 text-lg font-bold text-azure-50">
          Carton Breakdown
        </Text>

        {packingResults.map((carton: any, index: number) => (
          <View
            key={carton?.cartonDetails?.id ?? `${carton?.cartonDetails?.name}-${index}`}
            className="mb-3 rounded-card border border-navy-800/30 bg-navy-900 p-4"
          >
            <View className="flex-row justify-between mb-2">
              <Text className="text-lg font-bold text-azure-50">
                Carton #{index + 1}
              </Text>
              <Text className="text-azure-200">
                {carton.cartonDetails.name}
              </Text>
            </View>
            <Text className="mb-2 text-azure-200">
              {carton.cartonDetails.dimensions.length}x
              {carton.cartonDetails.dimensions.breadth}x
              {carton.cartonDetails.dimensions.height} cm
            </Text>

            <View className="my-2 h-px bg-navy-800/30" />

            <Text className="mb-1 font-medium text-azure-50">
              Items ({carton.itemsPacked}):
            </Text>
            <Text className="text-xs text-azure-200">
              See detailed analysis for arrangement.
            </Text>

            <View className="flex-row mt-3 gap-2">
              <View className="rounded border border-navy-800/30 bg-navy-950 px-2 py-1">
                <Text className="text-xs text-azure-200">
                  Vol Eff: {carton.efficiency.volumeEfficiency}%
                </Text>
              </View>
              <View className="rounded border border-navy-800/30 bg-navy-950 px-2 py-1">
                <Text className="text-xs text-azure-200">
                  Wt Util: {carton.efficiency.weightUtilization}%
                </Text>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center rounded-xl border border-azure-400/40 bg-azure-500 p-4"
          onPress={confirmPacking}
        >
          <Text className="text-white font-bold text-lg">
            Confirm & Update Inventory
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center border-b border-navy-800/30 px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#99CCFF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-azure-50">
            Quick Pack
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-4 py-4"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {result ? (
            renderResult()
          ) : (
            <>
              <Text className="mb-4 text-azure-200">
                Add items to your packing list below.
              </Text>

              {items.map((item) => (
                <View
                  key={item.id}
                  className="mb-3 flex-row items-center justify-between rounded-card border border-navy-800/30 bg-navy-900 p-4"
                >
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-azure-50">
                      {item.name}
                    </Text>
                    <Text className="text-sm text-azure-200">
                      {item.length}x{item.breadth}x{item.height} cm •{" "}
                      {item.weight}g
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="mb-1 font-bold text-[#00F6FF]">
                      x{item.quantity}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      className="rounded-full border border-navy-800/30 bg-navy-950 p-2"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#99CCFF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {items.length === 0 && (
                <View className="items-center justify-center py-10 opacity-50">
                  <Ionicons name="cube-outline" size={64} color="#99CCFF" />
                  <Text className="mt-2 text-azure-200">No items added yet</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Bottom Action Bar */}
        {!result && (
          <View className="border-t border-navy-800/30 bg-navy-950 p-4">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                className="flex-1 rounded-xl border border-navy-800/30 bg-navy-900 py-4"
              >
                <Text className="text-center font-bold text-azure-50">
                  Add Item
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={calculatePacking}
                className={`flex-1 rounded-xl border border-azure-400/40 bg-azure-500 py-4 ${
                  items.length === 0 ? "opacity-50" : ""
                }`}
                disabled={items.length === 0 || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-center font-bold text-white">
                    Pack Now
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add Item Modal/Form Sheet */}
        {showForm && (
          <View className="absolute inset-x-0 bottom-0 z-50 h-[70%] rounded-t-3xl border border-navy-800/30 bg-navy-900 p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-azure-50">
                Add Item
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="#99CCFF" />
              </TouchableOpacity>
            </View>

            <ScrollView className="space-y-4">
              <View>
                <Text className="mb-1 text-azure-200">Name</Text>
                <TextInput
                  value={newItem.name}
                  onChangeText={(t) => setNewItem({ ...newItem, name: t })}
                  className="rounded-xl border border-navy-800/30 bg-navy-950 p-4 text-azure-50"
                  placeholder="e.g. Headphones"
                  placeholderTextColor="#99CCFF"
                  selectionColor="#3399FF"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1 text-azure-200">Length (cm)</Text>
                  <TextInput
                    value={newItem.length}
                    onChangeText={(t) => setNewItem({ ...newItem, length: t })}
                    className="rounded-xl border border-navy-800/30 bg-navy-950 p-4 text-azure-50"
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-azure-200">Breadth (cm)</Text>
                  <TextInput
                    value={newItem.breadth}
                    onChangeText={(t) => setNewItem({ ...newItem, breadth: t })}
                    className="rounded-xl border border-navy-800/30 bg-navy-950 p-4 text-azure-50"
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-azure-200">Height (cm)</Text>
                  <TextInput
                    value={newItem.height}
                    onChangeText={(t) => setNewItem({ ...newItem, height: t })}
                    className="rounded-xl border border-navy-800/30 bg-navy-950 p-4 text-azure-50"
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                  />
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1 text-azure-200">Weight (g)</Text>
                  <TextInput
                    value={newItem.weight}
                    onChangeText={(t) => setNewItem({ ...newItem, weight: t })}
                    className="rounded-xl border border-navy-800/30 bg-navy-950 p-4 text-azure-50"
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-azure-200">Quantity</Text>
                  <TextInput
                    value={newItem.quantity}
                    onChangeText={(t) =>
                      setNewItem({ ...newItem, quantity: t })
                    }
                    className="rounded-xl border border-navy-800/30 bg-navy-950 p-4 text-azure-50"
                    placeholder="1"
                    keyboardType="numeric"
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={addItem}
                className="mt-4 rounded-xl border border-azure-400/40 bg-azure-500 py-4"
              >
                <Text className="text-center font-bold text-white">
                  Add to List
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Overlay for form */}
        {showForm && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowForm(false)}
            className="absolute inset-0 z-40 bg-[#001224]/70"
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
