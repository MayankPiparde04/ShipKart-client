import { createContext, ReactNode, useContext, useState } from "react";
import { apiService } from "../services/api";

type OptimalPackingInput = {
  productId: string;
  quantity: number;
};

type OptimalPackingOutput = {
  success: boolean;
  message: string;
  productInfo: any;
  unpackedProducts: any[];
  remainingQuantity: number;
  summary: any;
  analytics: any;
  metadata: any;
};

interface OptimalContextType {
  loading: boolean;
  error: string | null;
  result: OptimalPackingOutput | null;
  fetchOptimalPacking: (input: OptimalPackingInput) => Promise<void>;
  clearResult: () => void;
}

const OptimalContext = createContext<OptimalContextType | undefined>(undefined);

export const OptimalProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimalPackingOutput | null>(null);

  const fetchOptimalPacking = async (input: OptimalPackingInput) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // Fetch the full item details first so we can send dimension data
      const itemRes = await apiService.getItems({});
      const allItems: any[] = itemRes?.data?.items || itemRes?.items || [];
      const item = allItems.find((i: any) => i._id === input.productId);

      if (!item) {
        setError("Selected item not found in inventory.");
        setLoading(false);
        return;
      }

      // Build the products array that the backend expects
      const products = [
        {
          id: item._id,
          name: item.productName,
          length: parseFloat(item.dimensions?.length) || 0,
          breadth: parseFloat(item.dimensions?.breadth) || 0,
          height: parseFloat(item.dimensions?.height) || 0,
          weight: parseFloat(item.weight) || 0,
          quantity: input.quantity,
          isFragile: item.isFragile || false,
          price: item.price || 0,
        },
      ];

      const response = await apiService.optimalPacking2(products);
      if (response.success) {
        // Inject productInfo since the backend service doesn't return it directly
        const enrichedResult = {
          ...response,
          productInfo: {
            name: item.productName,
            dimensions: `${item.dimensions?.length} × ${item.dimensions?.breadth} × ${item.dimensions?.height} cm`,
            weight: parseFloat(item.weight) || 0,
            canRotate: true,
            isFragile: item.isFragile || false,
            requestedQuantity: input.quantity,
          },
        };
        setResult(enrichedResult as OptimalPackingOutput);
      } else {
        setError(response.message || "Unknown error");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => setResult(null);

  return (
    <OptimalContext.Provider
      value={{ loading, error, result, fetchOptimalPacking, clearResult }}
    >
      {children}
    </OptimalContext.Provider>
  );
};

export const useOptimal = () => {
  const ctx = useContext(OptimalContext);
  if (!ctx) throw new Error("useOptimal must be used within OptimalProvider");
  return ctx;
};
