import { useState, useCallback } from "react";
import { OCRService } from "../services/OCRService";

export interface ProcessedData {
  rawText?: string;
  note?: string;
  processingTime?: number;
  error?: string;
}

interface UseAIProcessingProps {
  imageUri?: string;
}

interface UseAIProcessingReturn {
  isProcessing: boolean;
  processedData: ProcessedData | null;
  editedData: ProcessedData | null;
  error: string | null;
  processData: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAIProcessing = ({
  imageUri,
}: UseAIProcessingProps): UseAIProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [editedData, setEditedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process image using OCR only
   * Flow: Image → OCR → Raw Text
   */
  const processData = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      console.log('🚀 [OCR_PROCESSOR] Starting OCR processing...');
      console.log('📷 [OCR_PROCESSOR] Image URI:', imageUri ? 'Yes' : 'No');

      let processingResult: ProcessedData = {};

      if (!imageUri) {
        throw new Error('Vui lòng chọn ảnh để xử lý');
      }

      console.log('\n📸 [OCR_PROCESSOR] Starting OCR...');
      const ocrResult = await OCRService.recognizeText(imageUri);

      if (!ocrResult.success) {
        console.warn('⚠️ [OCR_PROCESSOR] OCR failed:', ocrResult.error);
        setError(ocrResult.error || 'OCR không thành công');
        setIsProcessing(false);
        return;
      }

      processingResult = {
        rawText: ocrResult.rawText,
        note: '📸 Từ ảnh hóa đơn',
        processingTime: ocrResult.processingTime,
      };

      console.log('✅ [OCR_PROCESSOR] OCR completed successfully');
      console.log('� [OCR_PROCESSOR] Text length:', processingResult.rawText?.length || 0);

      setProcessedData(processingResult);
      setEditedData(JSON.parse(JSON.stringify(processingResult)));
      setIsProcessing(false);

      console.log('\n✅ [OCR_PROCESSOR] Processing completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi xử lý';
      console.error('❌ [OCR_PROCESSOR] Error:', errorMessage);
      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [imageUri]);

  return {
    isProcessing,
    processedData,
    editedData,
    error,
    processData,
    setError,
  };
};
