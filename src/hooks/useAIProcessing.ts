import { useState, useCallback } from "react";

export interface ProcessedData {
  items?: Array<{
    name: string;
    amount: number;
    category?: string;
  }>;
  totalAmount?: number;
  currency?: string;
  date?: string;
  note?: string;
  confidence?: number;
  rawText?: string;
}

interface UseAIProcessingProps {
  imageUri?: string;
  handwritingText?: string;
}

interface UseAIProcessingReturn {
  isProcessing: boolean;
  processedData: ProcessedData | null;
  editedData: ProcessedData | null;
  error: string | null;
  selectedItems: number[];
  processData: () => Promise<void>;
  toggleItemSelection: (index: number) => void;
  setError: (error: string | null) => void;
}

export const useAIProcessing = ({
  imageUri,
  handwritingText,
}: UseAIProcessingProps): UseAIProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [editedData, setEditedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  /**
   * Process image or handwriting text using AI
   * Simulates API call with mock data
   */
  const processData = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Simulate API call delay (2.5 seconds)
      await new Promise<void>((resolve) => setTimeout(resolve, 2500));

      // Mock AI processing result
      // In production, replace this with actual API call
      const mockResult: ProcessedData = {
        items: [
          { name: "Cơm tấm", amount: 45000, category: "Ăn uống" },
          { name: "Cà phê", amount: 25000, category: "Ăn uống" },
          { name: "Xăng xe", amount: 200000, category: "Giao thông" },
        ],
        totalAmount: 270000,
        currency: "VND",
        date: new Date().toISOString().split("T")[0],
        note: handwritingText || (imageUri ? "📸 Từ ảnh hóa đơn" : ""),
        confidence: 0.94,
        rawText: handwritingText || "Expense receipt detected",
      };

      setProcessedData(mockResult);
      setEditedData(JSON.parse(JSON.stringify(mockResult)));
      setIsProcessing(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Lỗi xử lý";
      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [imageUri, handwritingText]);

  /**
   * Toggle selection state for an item
   */
  const toggleItemSelection = useCallback((index: number) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  return {
    isProcessing,
    processedData,
    editedData,
    error,
    selectedItems,
    processData,
    toggleItemSelection,
    setError,
  };
};
