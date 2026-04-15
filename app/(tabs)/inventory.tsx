import AddBoxForm from "@/components/inventory/AddBoxForm";
import AddItemForm from "@/components/inventory/AddItemForm";
import BoxList from "@/components/inventory/BoxList";
import InventoryList from "@/components/inventory/InventoryList";
import FormModal from "@/components/ui/FormModal";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useAuth } from "@/contexts/AuthContext";
import { triggerSuccessHaptic } from "@/utils/haptics";
import { rankByFuzzySearch } from "@/utils/search";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
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
  imageUrl?: string;
}

interface Box {
  _id: string;
  box_name: string;
  length: number;
  breadth: number;
  height: number;
  quantity: number;
  max_weight: number; // in kgs
  category?: string;
  brand?: string;
}

const sortByName = <T,>(list: T[], picker: (entry: T) => string) =>
  [...list].sort((left, right) =>
    picker(left).localeCompare(picker(right), undefined, { sensitivity: "base" }),
  );

const getEmptyMessage = (
  filter: "all" | "low" | "out",
  kind: "items" | "boxes",
) => {
  if (filter === "low") {
    return kind === "items"
      ? "No Low Stock items found."
      : "No Low Stock boxes found.";
  }

  if (filter === "out") {
    return kind === "items"
      ? "No Out of Stock items found."
      : "No Out of Stock boxes found.";
  }

  return kind === "items"
    ? "No items in stock yet."
    : "No boxes available yet.";
};

export default function Inventory() {
  const { showSnackbar } = useSnackbar();
  const { user, isLoading: isAuthLoading } = useAuth();
  const isAuthenticated = Boolean(user);
  type StockFilter = "all" | "low" | "out";
  // Tab state
  const [activeTab, setActiveTab] = useState<"items" | "boxes">("items");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

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
  const [pendingDelete, setPendingDelete] = useState<
    | { kind: "item"; item: Item }
    | { kind: "box"; box: Box }
    | null
  >(null);
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
    removeBox,
  } = useBoxes();

  // Edit states
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editBoxId, setEditBoxId] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const tabBarHeight = useBottomTabBarHeight();
  const hasLoadedOnFocusRef = useRef(false);

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

  useFocusEffect(
    useCallback(() => {
      if (isAuthLoading || !isAuthenticated) return;

      if (!hasLoadedOnFocusRef.current) {
        hasLoadedOnFocusRef.current = true;
      }

      fetchItems(true);
      fetchBoxes(true);
    }, [isAuthLoading, isAuthenticated, fetchItems, fetchBoxes]),
  );

  // Filters
  const filteredItems = useMemo(() => {
    const stockMatched = items.filter((item) => {
      if (stockFilter === "out") return Number(item.quantity) <= 0;
      if (stockFilter === "low") return Number(item.quantity) < 20;
      return true;
    });

    const searched = rankByFuzzySearch(stockMatched, searchText, (item) => item.productName);
    return sortByName(searched, (item) => item.productName);
  }, [items, searchText, stockFilter]);

  const filteredBoxes = useMemo(() => {
    const stockMatched = boxes.filter((box) => {
      if (stockFilter === "out") return Number(box.quantity) <= 0;
      if (stockFilter === "low") return Number(box.quantity) < 20;
      return true;
    });

    const searched = rankByFuzzySearch(stockMatched, searchText, (box) => box.box_name);
    return sortByName(searched, (box) => box.box_name);
  }, [boxes, searchText, stockFilter]);

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
        showSnackbar("Item updated", "success");
      } else {
        await addItem(itemData);
        showSnackbar("Item added", "success");
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
      showSnackbar(error.message || "Failed to save item", "error");
    } finally {
      setIsAddingItem(false);
    }
  }, [newItem, editItemId, updateItem, addItem, showSnackbar]);

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
        showSnackbar("Box updated", "success");
      } else {
        await addBox(boxData);
        showSnackbar("Box added", "success");
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
      showSnackbar(error.message || "Failed to save box", "error");
    } finally {
      setIsAddingBox(false);
    }
  }, [newBox, editBoxId, updateBox, addBox, showSnackbar]);

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
      setPendingDelete({ kind: "item", item });
    },
    [],
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

  const handleDeleteBox = useCallback((box: Box) => {
    setPendingDelete({ kind: "box", box });
  }, []);

  const confirmDeleteBox = useCallback(async () => {
    if (!pendingDelete) return;

    try {
      if (pendingDelete.kind === "item") {
        await removeItem(pendingDelete.item._id);
        await triggerSuccessHaptic();
        showSnackbar("Item removed from inventory", "success");
      } else {
        await removeBox(pendingDelete.box._id);
        await triggerSuccessHaptic();
        showSnackbar("Box removed from inventory", "success");
      }
      setPendingDelete(null);
    } catch (error: any) {
      showSnackbar(error.message || "Failed to delete inventory entry", "error");
    }
  }, [pendingDelete, removeItem, removeBox, showSnackbar]);

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
              activeTab === "items"
                ? "Search name, brand, category..."
                : "Search box name, brand, category..."
            }
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-azure-50"
            selectionColor="#3399FF"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View className="mt-2 flex-row gap-2">
          {[
            { key: "all", label: "All" },
            { key: "low", label: "Low Stock" },
            { key: "out", label: "Out of Stock" },
          ].map((entry) => {
            const selected = stockFilter === entry.key;
            return (
              <TouchableOpacity
                key={entry.key}
                className={`rounded-full border px-4 py-2 ${selected ? "border-azure-400/50 bg-azure-500/20" : "border-navy-800/30 bg-navy-900"}`}
                onPress={() => setStockFilter(entry.key as StockFilter)}
              >
                <Text className={`text-xs font-semibold ${selected ? "text-azure-50" : "text-azure-200"}`}>
                  {entry.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
            emptyMessage={getEmptyMessage(stockFilter, "items")}
            bottomInset={tabBarHeight}
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
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            onBoxPress={handleEditBox}
            onDeletePress={handleDeleteBox}
            emptyMessage={getEmptyMessage(stockFilter, "boxes")}
            bottomInset={tabBarHeight}
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

      <TouchableOpacity
        className="absolute right-6 z-20 h-14 w-14 items-center justify-center rounded-full border border-azure-400/40 bg-azure-500"
        style={{ bottom: tabBarHeight + 16 }}
        onPress={() => {
          if (activeTab === "items") {
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
            return;
          }

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
      >
        <Ionicons name="add" size={30} color="#E5F2FF" />
      </TouchableOpacity>

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

      <FormModal
        visible={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title={pendingDelete?.kind === "item" ? "Delete Item" : "Delete Box"}
      >
        <Text className="text-base text-azure-200">
          {pendingDelete?.kind === "item"
            ? `Remove ${pendingDelete.item.productName} from inventory?`
            : `Remove ${pendingDelete?.box.box_name || "this box"} from inventory?`}
        </Text>
        <Text className="mt-3 text-sm text-azure-200">
          This cannot be undone.
        </Text>
        <View className="mt-6 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 rounded-xl border border-navy-800/30 bg-navy-950 py-4"
            onPress={() => setPendingDelete(null)}
          >
            <Text className="text-center font-bold text-azure-50">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-xl border border-[#D58F3C]/50 bg-[#231815] py-4"
            onPress={confirmDeleteBox}
          >
            <Text className="text-center font-bold text-white">Delete</Text>
          </TouchableOpacity>
        </View>
      </FormModal>
    </SafeAreaView>
  );
}
