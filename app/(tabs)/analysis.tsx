import PackingAnalysisResult from "@/components/analysis/PackingAnalysisResult";
import { useInventory } from "@/contexts/InventoryContext";
import { useOptimal } from "@/contexts/OptimalContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Analysis() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { items, isLoading: isLoadingItems, removeBoxItem } = useInventory();
  const { loading, error, result, fetchOptimalPacking, clearResult } =
    useOptimal();

  // Tab state: 0 = select item, 1 = select quantity, 2 = show result
  const [tab, setTab] = useState<0 | 1 | 2>(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);

  // Tab 1: Select Item
  const renderSelectItem = () => (
    <View style={{ flex: 1 }}>
      <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Choose Product
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 mb-4">
        Select an item to calculate optimal packing
      </Text>
      {isLoadingItems ? (
        <View className="items-center py-8">
          <ActivityIndicator
            size="large"
            color={isDark ? "#8b5cf6" : "#7c3aed"}
          />
          <Text className="text-gray-500 dark:text-gray-400 mt-4">
            Loading items...
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-gray-100/40 dark:bg-gray-900 p-5 mb-4 rounded-3xl border border-gray-200 dark:border-gray-700 "
              onPress={() => {
                setSelectedItem(item);
                setTab(1);
                setQuantity("1");
              }}
            >
              <Text className="text-gray-900 dark:text-gray-100 text-xl font-bold mb-2">
                {item.productName}
              </Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600 dark:text-gray-300 font-medium">
                  Available: {item.quantity}
                </Text>
                <Text className="text-gray-600 dark:text-gray-300 font-medium">
                  Weight: {item.weight}g
                </Text>
              </View>
              <Text className="text-gray-500 dark:text-gray-400">
                Size: {item.dimensions.length} × {item.dimensions.breadth} ×{" "}
                {item.dimensions.height} cm
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-gray-500 dark:text-gray-400 text-lg text-center">
                No items found
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
                Add some products to get started
              </Text>
            </View>
          }
        />
      )}
    </View>
  );

  // Tab 2: Select Quantity (Modal)
  const renderSelectQuantityModal = () => {
    const maxQty = selectedItem?.quantity;
    return (
      <Modal
        visible={quantityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/50 dark:bg-black/70">
          <View
            style={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              padding: 32,
              borderRadius: 24,
              marginHorizontal: 16,
              borderWidth: 2,
              borderColor: isDark ? "#8b5cf6" : "#7c3aed",
              elevation: 10,
            }}
          >
            <Text className="text-3xl font-bold text-green-600 dark:text-green-400 mb-6 text-center">
              Set Quantity
            </Text>
            <View className="mb-6">
              <Text className="text-gray-900 dark:text-gray-100 text-lg mb-2">
                Product: {selectedItem?.productName}
              </Text>
              <Text className="text-gray-600 dark:text-gray-300 text-base">
                Available:{" "}
                <Text className="font-bold text-green-600 dark:text-green-400">
                  {maxQty} units
                </Text>
              </Text>
            </View>
            <TextInput
              style={{
                backgroundColor: isDark ? "#374151" : "#f9fafb",
                color: isDark ? "#f3f4f6" : "#111827",
                borderColor: isDark ? "#6b7280" : "#d1d5db",
                borderWidth: 2,
                padding: 16,
                borderRadius: 12,
                marginBottom: 24,
                textAlign: "center",
                fontSize: 24,
                fontWeight: "bold",
              }}
              keyboardType="numeric"
              value={quantity}
              onChangeText={(val) => {
                setQuantity(val.replace(/[^0-9]/g, ""));
              }}
              placeholder="Enter quantity"
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
            />
            <View className="flex-row space-x-4 gap-2">
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#6b7280" : "#e5e7eb",
                  paddingVertical: 16,
                  borderRadius: 12,
                }}
                onPress={() => setQuantityModalVisible(false)}
              >
                <Text className="text-gray-900 dark:text-gray-100 font-bold text-center text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#16a34a",
                  paddingVertical: 16,
                  borderRadius: 12,
                }}
                onPress={async () => {
                  const num = parseInt(quantity, 10);
                  if (!quantity || isNaN(num) || num < 1 || num > maxQty) {
                    Alert.alert(
                      "Invalid Quantity",
                      `Please enter a quantity between 1 and ${maxQty}.`,
                    );
                    return;
                  }
                  setQuantityModalVisible(false);
                  setTab(2);
                  await fetchOptimalPacking({
                    productId: selectedItem._id,
                    quantity: num,
                  });
                }}
                disabled={loading}
              >
                <Text className="text-white font-bold text-center text-lg">
                  {loading ? "Processing..." : "Calculate"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderTabs = () => {
    return (
      <View
        style={{
          flexDirection: "row",
          marginBottom: 16,
          backgroundColor: isDark ? "#374151" : "#e5e7eb",
          borderRadius: 16,
          padding: 4,
        }}
      >
        <Pressable
          className={`flex-1 py-3 rounded-xl ${tab === 0 ? (isDark ? "bg-gray-700" : "bg-white") : "transparent"}`}
          onPress={() => {
            clearResult();
            setTab(0);
            setSelectedItem(null);
            setQuantity("1");
          }}
        >
          <Text
            className={`text-center font-bold text-sm ${tab === 0 ? (isDark ? "text-white" : "text-primary-700") : isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Select Item
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 rounded-xl ${tab === 1 ? (isDark ? "bg-gray-700" : "bg-white") : "transparent"}`}
          onPress={() => {
            if (selectedItem) {
              if (tab === 2) {
                clearResult();
              }
              setTab(1);
            }
          }}
          disabled={!selectedItem}
        >
          <Text
            className={`text-center font-bold text-sm ${tab === 1 ? (isDark ? "text-white" : "text-primary-700") : isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Quantity
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 rounded-xl ${tab === 2 ? (isDark ? "bg-gray-700" : "bg-white") : "transparent"}`}
          onPress={() => {
            if (result) {
              setTab(2);
            }
          }}
          disabled={!result}
        >
          <Text
            className={`text-center font-bold text-sm ${tab === 2 ? (isDark ? "text-white" : "text-primary-700") : isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Results
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white/40 dark:bg-gray-950 pb-4">
      <StatusBar style="auto" translucent={true} />
      <KeyboardAvoidingView
        className="flex-1 "
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="px-6 py-2 flex-1 mb-20">
          <View className="mb-6">
            <Text className="text-4xl font-bold text-gray-900 dark:text-gray-100 text-center">
              Packing Analysis
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mt-2">
              Optimize your shipping costs
            </Text>
          </View>
          {renderTabs()}
          {tab === 0 && renderSelectItem()}
          {tab === 1 && selectedItem && (
            <View className="flex-1 ">
              <View className="bg-gray-100/40 dark:bg-gray-900 p-4 rounded-2xl border border-gray-400 dark:border-gray-400 mb-6">
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  Selected Product
                </Text>
                <Text className="text-gray-900 dark:text-gray-100 text-2xl font-bold mb-2">
                  {selectedItem.productName}
                </Text>
                <Text className="text-gray-600 dark:text-gray-300">
                  Available: {selectedItem.quantity} units
                </Text>
                <TouchableOpacity
                  className="mt-4 py-2 px-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg self-start"
                  onPress={() => {
                    setTab(0);
                    clearResult();
                    setSelectedItem(null);
                    setQuantity("1");
                  }}
                >
                  <Text className="text-primary-700 dark:text-primary-300 text-sm font-medium">
                    Change Product
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="bg-green-600 py-4 rounded-2xl"
                onPress={() => setQuantityModalVisible(true)}
              >
                <Text className="text-white font-bold text-center text-xl">
                  Set Quantity
                </Text>
              </TouchableOpacity>
              {renderSelectQuantityModal()}
            </View>
          )}
          {tab === 2 && (
            <PackingAnalysisResult
              loading={loading}
              error={error}
              result={result}
              selectedItem={selectedItem}
              clearResult={clearResult}
              setTab={setTab}
              setSelectedItem={setSelectedItem}
              setQuantity={setQuantity}
              removeBoxItem={removeBoxItem}
              isDark={isDark}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
