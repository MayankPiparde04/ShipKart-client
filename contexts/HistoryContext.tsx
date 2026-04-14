import { apiService } from "@/services/api";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export interface ShipmentTransaction {
  _id: string;
  productName: string;
  packedQty: number;
  metadata?: {
    productInfo?: {
      name?: string;
      dimensions?: string;
      isFragile?: boolean;
      weight?: number;
      requestedQuantity?: number;
    };
    summary?: {
      estimatedCost?: {
        total?: number;
        breakdown?: {
          cartonBaseCost?: number;
          shippingRatePerKg?: number;
          shippingCostByWeight?: number;
          fragileHandlingFee?: number;
        };
      };
      totalItemsRequested?: number;
    };
    packingResults?: Array<{
      cartonDetails?: {
        id?: string;
        name?: string;
        cost?: number;
      };
      cartonId?: string;
      cartonName?: string;
      itemsPacked?: number;
      orientation?: string | null;
      orientationDetails?: {
        dimensionsUsed?: {
          length?: number;
          breadth?: number;
          height?: number;
        };
      };
    }>;
  };
  packed_details?: {
    packingResults?: Array<{
      cartonId?: string;
      cartonName?: string;
      itemsPacked?: number;
      orientation?: string | null;
      dimensionsUsed?: {
        length?: number;
        breadth?: number;
        height?: number;
      };
    }>;
  };
  cartonsUsed?: Array<{
    cartonId: string;
    cartonName: string;
    itemsPacked: number;
    orientation?: string | null;
    dimensionsUsed?: {
      length?: number | null;
      breadth?: number | null;
      height?: number | null;
    };
  }>;
  createdAt?: string;
  packedAt?: string;
  timestamp?: string;
}

interface HistoryContextType {
  transactions: ShipmentTransaction[];
  isLoading: boolean;
  fetchTransactions: (limit?: number) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<ShipmentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async (limit = 100) => {
    setIsLoading(true);
    try {
      const response = await apiService.getShipmentTransactions(limit);
      if (response?.success && Array.isArray(response?.data)) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error("Error fetching shipment transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const response = await apiService.deleteShipmentTransaction(id);
    if (!response?.success) {
      throw new Error(response?.message || "Failed to delete history record");
    }

    setTransactions((currentTransactions) =>
      currentTransactions.filter((transaction) => transaction._id !== id),
    );
  }, []);

  const value = useMemo(
    () => ({ transactions, isLoading, fetchTransactions, deleteTransaction }),
    [transactions, isLoading, fetchTransactions, deleteTransaction],
  );

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }
  return context;
};
