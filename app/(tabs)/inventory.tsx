import AddBoxForm from "@/components/inventory/AddBoxForm";
import AddItemForm from "@/components/inventory/AddItemForm";
import BoxList from "@/components/inventory/BoxList";
import InventoryList from "@/components/inventory/InventoryList";
import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Item {
  _id: string;
  productName: string;
  quantity: number;
  weight: number; // in grams
  price: number;
  dimensions: { length: number; breadth: number; height: number };
  category?: string;
  brand?: string;
}

interface Box {
  _id: string;
  box_name: string;
  length: number;
  breadth: number;
  height: number;
  quantity: number;
  max_weight: number; // in kgs
}

export default function Inventory() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"items" | "boxes">("items");

  // Modal state
  // Modal state
  const { fetchItems } = useInventory();

  // Items state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    productName: "",
    quantity: "",
    weight: "",
    price: "",
    length: "",
    breadth: "",
    height: "",
    category: "",
    brand: "",
  });
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Boxes state
  const [showAddBoxForm, setShowAddBoxForm] = useState(false);
  const [newBox, setNewBox] = useState({
    box_name: "",
    length: "",
    breadth: "",
    height: "",
    quantity: "",
    max_weight: "",
  });
  const [isAddingBox, setIsAddingBox] = useState(false);

  // Contexts
  const {
    items,
    isLoading: isLoadingItems,
    addItem,
    updateItem,
    removeItem,
  } = useInventory();

  const {
    boxes,
    isLoading: isLoadingBoxes,
    fetchBoxes,
    addBox,
    updateBox,
  } = useBoxes();

  // Edit states
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editBoxId, setEditBoxId] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const tabBarHeight = useBottomTabBarHeight();

  // Pre-fill form
  React.useEffect(() => {
    if (params.prefill) {
      try {
        const prediction = JSON.parse(params.prefill as string);
        setShowAddForm(true);
        setNewItem({
          productName: prediction.product_name || "",
          quantity: "1",
          weight: prediction.weight?.value
            ? String(prediction.weight.value)
            : "",
          price: prediction.price ? String(prediction.price) : "",
          length: prediction.dimensions?.length
            ? String(prediction.dimensions.length)
            : "",
          breadth: prediction.dimensions?.breadth
            ? String(prediction.dimensions.breadth)
            : "",
          height: prediction.dimensions?.height
            ? String(prediction.dimensions.height)
            : "",
          category: prediction.category || "",
          brand: prediction.brand === "Unknown" ? "" : (prediction.brand || ""),
        });
      } catch {
        // ignore
      }
    }
  }, [params.prefill]);

  // Filters
  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.productName.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [items, searchText],
  );

  const filteredBoxes = useMemo(
    () =>
      boxes.filter((box) =>
        box.box_name.toLowerCase().includes(searchText.toLowerCase()),
      ),
    [boxes, searchText],
  );

  // Handlers
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchItems(true), fetchBoxes(true)]);
    setIsRefreshing(false);
  }, [fetchItems, fetchBoxes]);

  const handleAddItemSubmit = useCallback(async () => {
    try {
      setIsAddingItem(true);
      const itemData = {
        productName: newItem.productName,
        quantity: Number.parseInt(newItem.quantity, 10),
        weight: Number.parseFloat(newItem.weight),
        price: Number.parseFloat(newItem.price),
        dimensions: {
          length: Number.parseFloat(newItem.length),
          breadth: Number.parseFloat(newItem.breadth),
          height: Number.parseFloat(newItem.height),
        },
        category: newItem.category,
        brand: newItem.brand,
      };

      if (editItemId) {
        await updateItem(editItemId, itemData);
        Alert.alert("Success", "Item updated");
      } else {
        await addItem(itemData);
        Alert.alert("Success", "Item added");
      }

      setNewItem({
        productName: "",
        quantity: "",
        weight: "",
        price: "",
        length: "",
        breadth: "",
        height: "",
        category: "",
        brand: "",
      });
      setShowAddForm(false);
      setEditItemId(null);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save item");
    } finally {
      setIsAddingItem(false);
    }
  }, [newItem, editItemId, updateItem, addItem]);

  const handleAddBoxSubmit = useCallback(async () => {
    try {
      setIsAddingBox(true);
      const boxData = {
        box_name: newBox.box_name,
        length: Number.parseFloat(newBox.length),
        breadth: Number.parseFloat(newBox.breadth),
        height: Number.parseFloat(newBox.height),
        quantity: Number.parseInt(newBox.quantity, 10),
        max_weight: Number.parseFloat(newBox.max_weight),
      };

      if (editBoxId) {
        await updateBox(editBoxId, boxData);
        Alert.alert("Success", "Box updated");
      } else {
        await addBox(boxData);
        Alert.alert("Success", "Box added");
      }

      setNewBox({
        box_name: "",
        length: "",
        breadth: "",
        height: "",
        quantity: "",
        max_weight: "",
      });
      setShowAddBoxForm(false);
      setEditBoxId(null);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save box");
    } finally {
      setIsAddingBox(false);
    }
  }, [newBox, editBoxId, updateBox, addBox]);

  const handleEditItem = useCallback((item: Item) => {
    setEditItemId(item._id);
    setNewItem({
      productName: item.productName,
      quantity: String(item.quantity),
      weight: String(item.weight),
      price: String(item.price),
      length: String(item.dimensions.length),
      breadth: String(item.dimensions.breadth),
      height: String(item.dimensions.height),
      category: item.category || "",
      brand: item.brand || "",
    });
    setShowAddForm(true);
  }, []);

  const handleDeleteItem = useCallback(
    (item: Item) => {
      Alert.alert(
        "Delete Item",
        `Remove ${item.productName} from inventory?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await removeItem(item._id);
                Alert.alert("Deleted", "Item removed from inventory");
              } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to delete item");
              }
            },
          },
        ],
      );
    },
    [removeItem],
  );

  const handleEditBox = useCallback((box: Box) => {
    setEditBoxId(box._id);
    setNewBox({
      box_name: box.box_name,
      length: String(box.length),
      breadth: String(box.breadth),
      height: String(box.height),
      quantity: String(box.quantity),
      max_weight: String(box.max_weight),
    });
    setShowAddBoxForm(true);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" />
      <View className="border-b border-navy-800/30 px-4 py-2">
        <Text className="mb-4 text-2xl font-bold text-azure-50">
          Inventory
        </Text>
        <View className="flex-row mb-4">
          <TouchableOpacity
            onPress={() => setActiveTab("items")}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === "items"
                ? "border-azure-500"
                : "border-transparent"
            }`}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === "items"
                  ? "text-azure-500"
                  : "text-azure-200"
              }`}
            >
              Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("boxes")}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === "boxes"
                ? "border-azure-400"
                : "border-transparent"
            }`}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === "boxes"
                  ? "text-azure-400"
                  : "text-azure-200"
              }`}
            >
              Boxes
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-2 flex-row items-center rounded-xl border border-navy-800/30 bg-navy-900 px-4 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder={
              activeTab === "items" ? "Search items..." : "Search boxes..."
            }
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-azure-50"
            selectionColor="#3399FF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {activeTab === "items" ? (
        <View className="flex-1" style={{ paddingBottom: tabBarHeight }}>
          <InventoryList
            items={filteredItems}
            isLoading={isLoadingItems}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            onItemPress={(item) => handleEditItem(item)}
            onDeletePress={(item) => handleDeleteItem(item)}
            tabBarHeight={tabBarHeight}
            onAddPress={() => {
              setEditItemId(null);
              setNewItem({
                productName: "",
                quantity: "",
                weight: "",
                price: "",
                length: "",
                breadth: "",
                height: "",
                category: "",
                brand: "",
              });
              setShowAddForm(true);
            }}
          />
        </View>
      ) : (
        <View className="flex-1" style={{ paddingBottom: tabBarHeight }}>
          <BoxList
            boxes={filteredBoxes}
            isLoading={isLoadingBoxes}
            onRefresh={onRefresh}
            onBoxPress={handleEditBox}
            tabBarHeight={tabBarHeight}
            onAddPress={() => {
              setEditBoxId(null);
              setNewBox({
                box_name: "",
                length: "",
                breadth: "",
                height: "",
                quantity: "",
                max_weight: "",
              });
              setShowAddBoxForm(true);
            }}
          />
        </View>
      )}

      <AddItemForm
        visible={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddItemSubmit}
        newItem={newItem}
        setNewItem={setNewItem}
        isAdding={isAddingItem}
      />

      <AddBoxForm
        visible={showAddBoxForm}
        onClose={() => setShowAddBoxForm(false)}
        onSubmit={handleAddBoxSubmit}
        newBox={newBox}
        setNewBox={setNewBox}
        isAdding={isAddingBox}
      />
    </SafeAreaView>
  );
}
