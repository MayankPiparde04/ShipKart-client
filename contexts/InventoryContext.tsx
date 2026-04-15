import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

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

interface DailyData {
  day: string;
  quantity: number;
}

interface DailySold {
  day: string;
  quantity: number;
}

interface InventoryContextType {
  items: Item[];
  isLoading: boolean;
  lastFetch: number | null;
  dailyData: DailyData[];
  dailySold: DailySold[];
  fetchItems: (refresh?: boolean) => Promise<void>;
  addItem: (item: Omit<Item, "_id">) => Promise<void>;
  updateItem: (id: string, item: Partial<Item>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearCache: () => void;
  predictItemDimensions: (
    imageUri: string,
    referenceObject?: string,
    unit?: string,
    additionalContext?: string,
    signal?: AbortSignal
  ) => Promise<any>;
  removeBoxItem: (data: {
    boxId: string;
    itemId: string;
    boxQuantity: number;
    itemQuantity: number;
  }) => Promise<any>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined,
);

const ITEMS_STORAGE_KEY = "inventory_items";
const DAILY_DATA_STORAGE_KEY = "daily_data";
const DAILY_SOLD_STORAGE_KEY = "daily_sold";

const sortItemsByName = (itemsList: Item[]) =>
  [...itemsList].sort((left, right) =>
    left.productName.localeCompare(right.productName, undefined, {
      sensitivity: "base",
    }),
  );

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [dailySold, setDailySold] = useState<DailySold[]>([]);

  useEffect(() => {
    loadItemsFromStorage();
    loadDailyDataFromStorage();
    loadDailySoldFromStorage();
  }, []);

  const loadItemsFromStorage = async () => {
    try {
      const storedItems = await AsyncStorage.getItem(ITEMS_STORAGE_KEY);
      if (storedItems) {
        setItems(sortItemsByName(JSON.parse(storedItems)));
      } else {
        setItems([]);
      }
    } catch (error) {
      console.error("Error loading items from storage:", error);
      setItems([]);
    }
  };

  const loadDailyDataFromStorage = async () => {
    try {
      const storedDailyData = await AsyncStorage.getItem(
        DAILY_DATA_STORAGE_KEY,
      );
      if (storedDailyData) {
        setDailyData(JSON.parse(storedDailyData));
      } else {
        setDailyData([]);
      }
    } catch (error) {
      console.error("Error loading daily data from storage:", error);
      setDailyData([]);
    }
  };

  const loadDailySoldFromStorage = async () => {
    try {
      const storedDailySold = await AsyncStorage.getItem(
        DAILY_SOLD_STORAGE_KEY,
      );
      if (storedDailySold) {
        setDailySold(JSON.parse(storedDailySold));
      } else {
        setDailySold([]);
      }
    } catch (error) {
      console.error("Error loading daily sold data from storage:", error);
      setDailySold([]);
    }
  };

  const saveItemsToStorage = async (itemsData: Item[]) => {
    try {
      await AsyncStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(itemsData));
    } catch (error) {
      console.error("Error saving items to storage:", error);
    }
  };

  const saveDailyDataToStorage = async (data: DailyData[]) => {
    try {
      await AsyncStorage.setItem(DAILY_DATA_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving daily data to storage:", error);
    }
  };

  const saveDailySoldToStorage = async (data: DailySold[]) => {
    try {
      await AsyncStorage.setItem(DAILY_SOLD_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving daily sold data to storage:", error);
    }
  };

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getItems({
        page: 1,
        limit: 100,
        sortBy: "productName",
        sortOrder: "asc",
      });

      if (response.success && response.data?.items) {
        // Clean items to match Item interface
        const cleanedItems = response.data.items.map((item: any) => ({
          _id: item._id,
          productName: item.productName,
          quantity: item.quantity,
          weight: item.weight,
          price: item.price,
          dimensions: {
            length: item.dimensions?.length ?? 0,
            breadth: item.dimensions?.breadth ?? 0,
            height: item.dimensions?.height ?? 0,
          },
          category: item.category,
          brand: item.brand,
        }));
        const sortedItems = sortItemsByName(cleanedItems);
        setItems(sortedItems);
        await saveItemsToStorage(sortedItems);

        // Handle dailyData if present
        if (Array.isArray(response.data.dailyData)) {
          setDailyData(response.data.dailyData);
          await saveDailyDataToStorage(response.data.dailyData);
        }

        // Handle dailySold if present
        if (Array.isArray(response.data.dailySold)) {
          setDailySold(response.data.dailySold);
          await saveDailySoldToStorage(response.data.dailySold);
        }
      } else if (response.data === null) {
        setItems([]);
        await saveItemsToStorage([]);
        setDailyData([]);
        await saveDailyDataToStorage([]);
        setDailySold([]);
        await saveDailySoldToStorage([]);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      await loadItemsFromStorage();
      await loadDailyDataFromStorage();
      await loadDailySoldFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = async (item: Omit<Item, "_id">) => {
    const response = await apiService.addOrUpdateItem(item);
    if (response.success) {
      if (response.data?.item) {
        const newItems = sortItemsByName([...items, response.data.item]);
        setItems(newItems);
        await saveItemsToStorage(newItems);
      } else {
        await fetchItems();
      }
    } else {
      throw new Error(response.message || "Failed to add item");
    }
  };

  const updateItem = async (id: string, itemUpdate: Partial<Item>) => {
    const response = await apiService.updateItem(id, {
      _id: id,
      ...itemUpdate,
      productName: itemUpdate.productName || "",
      quantity: itemUpdate.quantity || 0,
      weight: itemUpdate.weight || 0,
      price: itemUpdate.price || 0,
      dimensions: itemUpdate.dimensions || { length: 0, breadth: 0, height: 0 },
    });
    if (response.success) {
      await fetchItems(); // Refresh items and dailyData for dashboard/graph
    } else {
      throw new Error(response.message || "Failed to update item");
    }
  };

  const removeItem = async (id: string) => {
    const response = await apiService.deleteItem(id);
    if (response.success) {
      const filteredItems = sortItemsByName(
        items.filter((item) => item._id !== id),
      );
      setItems(filteredItems);
      await saveItemsToStorage(filteredItems);
    } else {
      throw new Error(response.message || "Failed to delete item");
    }
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.removeItem(ITEMS_STORAGE_KEY);
      await AsyncStorage.removeItem(DAILY_SOLD_STORAGE_KEY);
      setItems([]);
      setDailySold([]);
    } catch (error) {
      console.error("Error clearing data from storage:", error);
    }
  };
  const predictItemDimensions = async (
    imageUri: string,
    referenceObject?: string,
    unit?: string,
    additionalContext?: string,
    signal?: AbortSignal
  ) => {
    try {
      // Set default values if not provided
      const finalReferenceObject = referenceObject || "coin";
      const finalUnit = unit || "cm";
      const finalAdditionalContext =
        additionalContext || "object for dimension measurement";

      const result = await apiService.predictDimensionsWithDetails(
        imageUri,
        finalReferenceObject,
        finalUnit,
        finalAdditionalContext,
        signal
      );
      return result;
    } catch (error: any) {
      console.error("AI prediction failed:", error);

      // Check if it's a network connectivity issue
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("Unable to connect")
      ) {
        throw new Error(
          "Unable to connect to the AI service. Please check your internet connection and ensure the server is running on the correct IP address.",
        );
      }

      throw new Error(
        error.message || "Failed to predict dimensions. Please try again.",
      );
    }
  };
  const removeBoxItem = async (data: {
    boxId: string;
    itemId: string;
    boxQuantity: number;
    itemQuantity: number;
  }) => {
    try {
      const result = await apiService.removeBoxItem(data);

      if (result.success) {
        // Refresh items after successful removal
        await fetchItems();
        return result;
      } else {
        throw new Error(result.message || "Failed to remove box item");
      }
    } catch (error: any) {
      console.error("Remove box item failed:", error);
      throw new Error(
        error.message || "Failed to remove box item. Please try again.",
      );
    }
  };

  const contextValue = useMemo(
    () => ({
      items,
      isLoading,
      lastFetch: null,
      dailyData,
      dailySold,
      fetchItems,
      addItem,
      updateItem,
      removeItem,
      clearCache,
      predictItemDimensions,
      removeBoxItem,
    }),
    [
      items,
      isLoading,
      dailyData,
      dailySold,
      fetchItems,
      addItem,
      updateItem,
      removeItem,
      clearCache,
      predictItemDimensions,
      removeBoxItem,
    ],
  );

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

// Make sure this is at the top level, not inside any function or block!
export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
