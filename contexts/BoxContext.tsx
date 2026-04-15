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

interface Box {
  _id: string;
  box_name: string;
  length: number;
  breadth: number;
  height: number;
  quantity: number;
  max_weight: number;
}

interface BoxContextType {
  boxes: Box[];
  isLoading: boolean;
  lastFetch: number | null;
  fetchBoxes: (refresh?: boolean) => Promise<void>;
  addBox: (box: Omit<Box, "_id">) => Promise<void>;
  updateBoxQuantity: (
    box_name: string,
    additionalQuantity: number,
  ) => Promise<void>;
  removeBox: (id: string) => Promise<void>;
  clearCache: () => void;
  updateBox: (id: string, boxUpdate: Partial<Box>) => Promise<void>; // <-- add this
}

const BoxContext = createContext<BoxContextType | undefined>(undefined);

const BOXES_STORAGE_KEY = "inventory_boxes";

const sortBoxesByName = (boxesList: Box[]) =>
  [...boxesList].sort((left, right) =>
    left.box_name.localeCompare(right.box_name, undefined, {
      sensitivity: "base",
    }),
  );

export const BoxProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadBoxesFromStorage();
  }, []);

  const loadBoxesFromStorage = async () => {
    try {
      const storedBoxes = await AsyncStorage.getItem(BOXES_STORAGE_KEY);
      if (storedBoxes) {
        setBoxes(sortBoxesByName(JSON.parse(storedBoxes)));
      } else {
        setBoxes([]);
      }
    } catch (error) {
      console.error("Error loading boxes from storage:", error);
      setBoxes([]);
    }
  };

  const saveBoxesToStorage = async (boxesData: Box[]) => {
    try {
      await AsyncStorage.setItem(BOXES_STORAGE_KEY, JSON.stringify(boxesData));
    } catch (error) {
      console.error("Error saving boxes to storage:", error);
    }
  };

  const fetchBoxes = useCallback(async () => {
    setIsLoading(true);
    try {
      type GetBoxesResponse = {
        success: boolean;
        message?: string;
        data: {
          boxes: any[]; // Accept any fields from API
        } | null;
      };

      const response: GetBoxesResponse = await apiService.getBoxes({
        page: 1,
        limit: 100,
        sortBy: "box_name",
        sortOrder: "asc",
      });

      if (response.success && response.data?.boxes) {
        // Only keep fields defined in Box interface
        const cleanedBoxes = response.data.boxes.map((box: any) => ({
          _id: box._id,
          box_name: box.box_name,
          length: box.length,
          breadth: box.breadth,
          height: box.height,
          quantity: box.quantity,
          max_weight: box.max_weight,
        }));
        const sortedBoxes = sortBoxesByName(cleanedBoxes);
        setBoxes(sortedBoxes);
        await saveBoxesToStorage(sortedBoxes);
      } else if (response.data === null) {
        // Handle 304 responses - keep existing data
        // Data not modified, so no need to update state
      }
    } catch (error) {
      console.error("Error fetching boxes:", error);
      await loadBoxesFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addBox = useCallback(async (box: Omit<Box, "_id">) => {
    const response = await apiService.addBox(box);
    if (response.success) {
      if (response.data?.box) {
        const newBoxes = sortBoxesByName([...boxes, response.data.box]);
        setBoxes(newBoxes);
        await saveBoxesToStorage(newBoxes);
      } else {
        await fetchBoxes();
      }
    } else {
      throw new Error(response.message || "Failed to add box");
    }
  }, [boxes, fetchBoxes]);

  const updateBoxQuantity = useCallback(async (
    box_name: string,
    additionalQuantity: number,
  ) => {
    const response = await apiService.updateBoxQuantity(
      box_name,
      additionalQuantity,
    );
    if (response.success) {
      const updatedBoxes = sortBoxesByName(
        boxes.map((box) =>
          box.box_name === box_name
            ? { ...box, quantity: box.quantity + additionalQuantity }
            : box,
        ),
      );
      setBoxes(updatedBoxes);
      await saveBoxesToStorage(updatedBoxes);
    } else {
      throw new Error(response.message || "Failed to update box quantity");
    }
  }, [boxes]);

  const removeBox = useCallback(async (id: string) => {
    const response = await apiService.deleteBox(id);
    if (response.success) {
      const filteredBoxes = sortBoxesByName(
        boxes.filter((box) => box._id !== id),
      );
      setBoxes(filteredBoxes);
      await saveBoxesToStorage(filteredBoxes);
    } else {
      throw new Error(response.message || "Failed to delete box");
    }
  }, [boxes]);

  const clearCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(BOXES_STORAGE_KEY);
      setBoxes([]);
    } catch (error) {
      console.error("Error clearing boxes from storage:", error);
    }
  }, []);

  const updateBox = useCallback(async (id: string, boxUpdate: Partial<Box>) => {
    const response = await apiService.updateBox(id, boxUpdate);
    if (response.success) {
      await fetchBoxes();
    } else {
      throw new Error(response.message || "Failed to update box");
    }
  }, [fetchBoxes]);

  const contextValue = useMemo(
    () => ({
      boxes,
      isLoading,
      lastFetch: null,
      fetchBoxes,
      addBox,
      updateBoxQuantity,
      removeBox,
      clearCache,
      updateBox,
    }),
    [
      boxes,
      isLoading,
      fetchBoxes,
      addBox,
      updateBoxQuantity,
      removeBox,
      clearCache,
      updateBox,
    ],
  );

  return (
    <BoxContext.Provider value={contextValue}>
      {children}
    </BoxContext.Provider>
  );
};

export const useBoxes = () => {
  const context = useContext(BoxContext);
  if (!context) {
    throw new Error("useBoxes must be used within a BoxProvider");
  }
  return context;
};
