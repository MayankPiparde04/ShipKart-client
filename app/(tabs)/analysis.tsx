import PackingAnalysisResult from "@/components/analysis/PackingAnalysisResult";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { useInventory } from "@/contexts/InventoryContext";
import { useOptimal } from "@/contexts/OptimalContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
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
  const { items, isLoading: isLoadingItems } = useInventory();
  const { loading, error, result, fetchOptimalPacking, clearResult } =
    useOptimal();

  // Tab state: 0 = select item, 1 = select quantity, 2 = show result
  const [tab, setTab] = useState<0 | 1 | 2>(0);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const tabBarHeight = useBottomTabBarHeight();

  // Tab 1: Select Item
  const renderSelectItem = () => (
    <View style={{ flex: 1 }}>
      <Text className="mb-6 text-3xl font-bold text-azure-50">
        Choose Product
      </Text>
      <Text className="mb-4 text-azure-200">
        Select an item to calculate optimal packing
      </Text>
      {isLoadingItems ? (
        <View className="py-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="mb-4 rounded-3xl border border-navy-800/30 bg-navy-900 p-5"
              onPress={() => {
                setSelectedItem(item);
                setTab(1);
                setQuantity("1");
              }}
            >
              <Text className="mb-2 text-xl font-bold text-azure-50">
                {item.productName}
              </Text>
              <View className="flex-row justify-between mb-2">
                <Text className="font-medium text-azure-200">
                  Available: {item.quantity}
                </Text>
                <Text className="font-medium text-azure-200">
                  Weight: {item.weight}g
                </Text>
              </View>
              <Text className="text-azure-200">
                Size: {item.dimensions.length} × {item.dimensions.breadth} ×{" "}
                {item.dimensions.height} cm
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-center text-lg text-azure-200">
                No items found
              </Text>
              <Text className="mt-2 text-center text-azure-200">
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
        <View className="flex-1 justify-center bg-[#001224]/80 px-4">
          <View
            style={{
              backgroundColor: "#001933",
              padding: 24,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: "rgba(5, 65, 97, 0.5)",
              elevation: 6,
            }}
          >
            <Text className="mb-6 text-center text-3xl font-bold text-azure-50">
              Set Quantity
            </Text>
            <View className="mb-6">
              <Text className="mb-2 text-lg text-azure-50">
                Product: {selectedItem?.productName}
              </Text>
              <Text className="text-base text-azure-200">
                Available:{" "}
                <Text className="font-bold text-[#00F6FF]">
                  {maxQty} units
                </Text>
              </Text>
            </View>
            <TextInput
              style={{
                backgroundColor: "#001224",
                color: "#E5F2FF",
                borderColor: "rgba(5, 65, 97, 0.3)",
                borderWidth: 1,
                padding: 16,
                borderRadius: 16,
                marginBottom: 24,
                textAlign: "center",
                fontSize: 24,
                fontWeight: "bold",
              }}
              keyboardType="numeric"
              value={quantity}
              onChangeText={(val) => {
                setQuantity(val.replaceAll(/\D/g, ""));
              }}
              placeholder="Enter quantity"
              placeholderTextColor="#99CCFF"
              selectionColor="#3399FF"
            />
            <View className="flex-row space-x-4 gap-2">
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#001224",
                  paddingVertical: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "rgba(5, 65, 97, 0.5)",
                }}
                onPress={() => setQuantityModalVisible(false)}
              >
                <Text className="text-center text-lg font-bold text-azure-50">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#007FFF",
                  paddingVertical: 16,
                  borderRadius: 16,
                }}
                onPress={async () => {
                  const num = Number.parseInt(quantity, 10);
                  if (!quantity || Number.isNaN(num) || num < 1 || num > maxQty) {
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
          backgroundColor: "#001933",
          borderRadius: 16,
          padding: 4,
          borderWidth: 1,
          borderColor: "rgba(5, 65, 97, 0.3)",
        }}
      >
        <Pressable
          className={`flex-1 py-3 rounded-xl ${tab === 0 ? "bg-azure-500/20" : "transparent"}`}
          onPress={() => {
            clearResult();
            setTab(0);
            setSelectedItem(null);
            setQuantity("1");
          }}
        >
          <Text
            className={`text-center text-sm font-bold ${tab === 0 ? "text-azure-50" : "text-azure-200"}`}
          >
            Select Item
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 rounded-xl ${tab === 1 ? "bg-azure-500/20" : "transparent"}`}
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
            className={`text-center text-sm font-bold ${tab === 1 ? "text-azure-50" : "text-azure-200"}`}
          >
            Quantity
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 rounded-xl ${tab === 2 ? "bg-azure-500/20" : "transparent"}`}
          onPress={() => {
            if (result) {
              setTab(2);
            }
          }}
          disabled={!result}
        >
          <Text
            className={`text-center text-sm font-bold ${tab === 2 ? "text-azure-50" : "text-azure-200"}`}
          >
            Results
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" translucent={true} />
      <KeyboardAvoidingView
        className="flex-1 "
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-1 px-6 py-4" style={{ paddingBottom: tabBarHeight + 12 }}>
          <View className="mb-6">
            <Text className="text-center text-4xl font-bold text-azure-50">
              Packing Analysis
            </Text>
            <Text className="mt-2 text-center text-azure-200">
              Optimize your shipping costs
            </Text>
          </View>
          {renderTabs()}
          {tab === 0 && renderSelectItem()}
          {tab === 1 && selectedItem && (
            <View className="flex-1">
              <View className="mb-6 rounded-card border border-navy-800/30 bg-navy-900 p-4">
                <Text className="mb-2 text-sm text-azure-200">
                  Selected Product
                </Text>
                <Text className="mb-2 text-2xl font-bold text-azure-50">
                  {selectedItem.productName}
                </Text>
                <Text className="text-azure-200">
                  Available: {selectedItem.quantity} units
                </Text>
                <TouchableOpacity
                  className="mt-4 self-start rounded-lg border border-azure-400/35 bg-azure-500/15 px-2 py-2"
                  onPress={() => {
                    setTab(0);
                    clearResult();
                    setSelectedItem(null);
                    setQuantity("1");
                  }}
                >
                  <Text className="text-sm font-medium text-azure-50">
                    Change Product
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                className="rounded-2xl border border-azure-400/40 bg-azure-500 py-4"
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
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
