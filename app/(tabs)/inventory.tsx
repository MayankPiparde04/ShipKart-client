import AddBoxForm from "@/components/inventory/AddBoxForm";
import AddItemForm from "@/components/inventory/AddItemForm";
import BoxList from "@/components/inventory/BoxList";
import InventoryList from "@/components/inventory/InventoryList";
import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";
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
          price: "",
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
          brand: "",
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
        quantity: parseInt(newItem.quantity),
        weight: parseFloat(newItem.weight),
        price: parseFloat(newItem.price),
        dimensions: {
          length: parseFloat(newItem.length),
          breadth: parseFloat(newItem.breadth),
          height: parseFloat(newItem.height),
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
        length: parseFloat(newBox.length),
        breadth: parseFloat(newBox.breadth),
        height: parseFloat(newBox.height),
        quantity: parseInt(newBox.quantity),
        max_weight: parseFloat(newBox.max_weight),
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
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950">
      <StatusBar style="auto" />
      <View className="px-4 py-2 border-b border-gray-200 dark:border-gray-800">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Inventory
        </Text>
        <View className="flex-row mb-4">
          <TouchableOpacity
            onPress={() => setActiveTab("items")}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === "items"
                ? "border-primary-600 dark:border-primary-400"
                : "border-transparent"
            }`}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === "items"
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500"
              }`}
            >
              Items
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("boxes")}
            className={`flex-1 py-3 border-b-2 ${
              activeTab === "boxes"
                ? "border-secondary-600 dark:border-secondary-400"
                : "border-transparent"
            }`}
          >
            <Text
              className={`text-center font-bold ${
                activeTab === "boxes"
                  ? "text-secondary-600 dark:text-secondary-400"
                  : "text-gray-500"
              }`}
            >
              Boxes
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-gray-200 dark:bg-gray-900 rounded-xl flex-row items-center px-4 py-2 mb-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder={
              activeTab === "items" ? "Search items..." : "Search boxes..."
            }
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-2 text-gray-900 dark:text-white"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {activeTab === "items" ? (
        <InventoryList
          items={filteredItems}
          isLoading={isLoadingItems}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onItemPress={(item) => handleEditItem(item)}
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
      ) : (
        <BoxList
          boxes={filteredBoxes}
          isLoading={isLoadingBoxes}
          onRefresh={onRefresh}
          onBoxPress={(box) => handleEditBox(box)}
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
