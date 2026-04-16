import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

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
      // 1) Strict sync: fetch items first
      const itemRes = await api.get("/getitemdata");
      const itemPayload = itemRes?.data;
      if (!itemPayload?.success) {
        const syncError = "Error: Could not sync Items before analysis.";
        setError(syncError);
        throw new Error(syncError);
      }

      const allItems: any[] =
        itemPayload?.data?.items || itemPayload?.data?.data?.items || itemPayload?.items || [];
      const item = allItems.find((i: any) => i._id === input.productId);

      if (!item) {
        setError("Selected item not found in inventory.");
        setLoading(false);
        return;
      }

      // 2) Strict sync: only after items, fetch boxes
      const boxRes = await api.get("/boxes");
      const boxPayload = boxRes?.data;
      if (!boxPayload?.success) {
        const syncError = "Error: Could not sync Boxes before analysis.";
        setError(syncError);
        throw new Error(syncError);
      }

      const allBoxes: any[] =
        boxPayload?.data?.boxes || boxPayload?.data?.data?.boxes || boxPayload?.boxes || [];

      if (!Array.isArray(allBoxes) || allBoxes.length === 0) {
        setError("No boxes available in inventory. Add at least one box before analysis.");
        setLoading(false);
        return;
      }

      const selectedItems = [
        {
          id: item._id,
          name: item.productName,
          length: Number.parseFloat(item.dimensions?.length) || 0,
          breadth: Number.parseFloat(item.dimensions?.breadth) || 0,
          height: Number.parseFloat(item.dimensions?.height) || 0,
          weight: Number.parseFloat(item.weight) || 0,
          weight_per_unit: Number.parseFloat(item.weight_per_unit) || 0,
          max_vertical_stack:
            Number.parseInt(item.max_vertical_stack, 10) || 1,
          crush_resistance_kg:
            Number.parseFloat(item.crush_resistance_kg) ||
            (Number.parseFloat(item.weight_per_unit) > 0
              ? Number.parseFloat(item.weight_per_unit) * 50
              : 0),
          leakage_risk: item.leakage_risk || "Low",
          quantity: input.quantity,
          isFragile: item.isFragile || false,
          price: item.price || 0,
        },
      ];

      const availableBoxes = allBoxes.map((box: any) => ({
        _id: box._id,
        boxName: box.box_name,
        length: Number.parseFloat(box.length) || 0,
        width: Number.parseFloat(box.breadth ?? box.width) || 0,
        height: Number.parseFloat(box.height) || 0,
        maxWeight: Number.parseFloat(box.max_weight ?? box.maxWeight) || 0,
        quantity: Number.parseInt(box.quantity, 10) || 0,
        cost: Number.parseFloat(box.cost ?? box.price ?? 0) || 0,
      }));

      // 3) Strict sync: analysis only after both GET calls succeed.
      const responseEnvelope = await api.post("/optimal-analysis", {
        selectedItems,
        availableBoxes,
      });
      const response = responseEnvelope?.data;
      if (response.success) {
        // Inject productInfo since the backend service doesn't return it directly
        const enrichedResult = {
          ...response,
          productInfo: {
            name: item.productName,
            dimensions: `${item.dimensions?.length} × ${item.dimensions?.breadth} × ${item.dimensions?.height} cm`,
            weight: Number.parseFloat(item.weight) || 0,
            canRotate: true,
            isFragile: item.isFragile || false,
            requestedQuantity: input.quantity,
            max_vertical_stack:
              Number.parseInt(item.max_vertical_stack, 10) || 1,
            crush_resistance_kg:
              Number.parseFloat(item.crush_resistance_kg) ||
              (Number.parseFloat(item.weight_per_unit) > 0
                ? Number.parseFloat(item.weight_per_unit) * 50
                : 0),
            leakage_risk: item.leakage_risk || "Low",
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

  const providerValue = useMemo(
    () => ({ loading, error, result, fetchOptimalPacking, clearResult }),
    [loading, error, result],
  );

  return (
    <OptimalContext.Provider value={providerValue}>
      {children}
    </OptimalContext.Provider>
  );
};

export const useOptimal = () => {
  const ctx = useContext(OptimalContext);
  if (!ctx) throw new Error("useOptimal must be used within OptimalProvider");
  return ctx;
};
