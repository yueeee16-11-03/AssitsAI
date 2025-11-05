import { useState, useCallback } from "react";
import { OCRService } from "../services/OCRService";
import { processOCRTextWithGemini, extractDescriptionFromProcessedText, extractAmountFromProcessedText } from "../services/GeminiAIService";

export interface ProcessedData {
  rawText?: string;
  processedText?: string;
  note?: string;
  processingTime?: number;
  error?: string;
  // 🟢 AI extracted fields (for text processing)
  totalAmount?: number;
  items?: any[];
  category?: string;
  description?: string;
  confidence?: 'high' | 'medium' | 'low';
}

interface UseAIProcessingProps {
  imageUri?: string;
  enableGeminiProcessing?: boolean;
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
  enableGeminiProcessing = true,
}: UseAIProcessingProps): UseAIProcessingReturn => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [editedData, setEditedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process image using OCR + optional Gemini AI
   * Flow: Image → OCR → Raw Text → (Optional) Gemini AI → Processed Data
   */
  const processData = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      console.log('🚀 [OCR_PROCESSOR] Starting processing...');
      console.log('📷 [OCR_PROCESSOR] Image URI:', imageUri ? 'Yes' : 'No');
      console.log('🤖 [OCR_PROCESSOR] Gemini Processing:', enableGeminiProcessing ? 'Enabled' : 'Disabled');

      let processingResult: ProcessedData = {};

      if (!imageUri) {
        throw new Error('Vui lòng chọn ảnh để xử lý');
      }

      // Step 1: OCR
      console.log('\n📸 [OCR_PROCESSOR] Step 1: Starting OCR...');
      const ocrResult = await OCRService.recognizeText(imageUri);

      if (!ocrResult.success) {
        console.warn('⚠️ [OCR_PROCESSOR] OCR failed:', ocrResult.error);
        setError(ocrResult.error || 'OCR không thành công');
        setIsProcessing(false);
        return;
      }

      const rawOCRText = ocrResult.rawText || '';
      console.log('✅ [OCR_PROCESSOR] OCR completed');
      console.log('📊 [OCR_PROCESSOR] Raw text length:', rawOCRText.length);

      processingResult = {
        rawText: rawOCRText,
        note: '📸 Từ ảnh hóa đơn',
        processingTime: ocrResult.processingTime,
      };

      // Step 2: Optional Gemini AI Processing
      if (enableGeminiProcessing && rawOCRText.trim().length > 0) {
        console.log('\n🤖 [OCR_PROCESSOR] Step 2: Starting Gemini AI processing...');
        const geminiResult = await processOCRTextWithGemini(rawOCRText);

        if (geminiResult.success) {
          console.log('✅ [OCR_PROCESSOR] Gemini processing completed');
          processingResult.processedText = geminiResult.processedText;
          // 🔥 Extract short description từ processed text thay vì lưu toàn bộ
          processingResult.description = extractDescriptionFromProcessedText(geminiResult.processedText);
          // 💰 Extract amount từ processed text
          processingResult.totalAmount = extractAmountFromProcessedText(geminiResult.processedText);
          processingResult.processingTime = (processingResult.processingTime || 0) + geminiResult.processingTime;
          console.log('💰 [OCR_PROCESSOR] Extracted amount:', processingResult.totalAmount);
        } else {
          console.warn('⚠️ [OCR_PROCESSOR] Gemini processing failed:', geminiResult.error);
          // Tiếp tục dù Gemini failed, vẫn có rawText
          console.log('💡 [OCR_PROCESSOR] Continuing with OCR text only');
        }
      }

      setProcessedData(processingResult);
      setEditedData(JSON.parse(JSON.stringify(processingResult)));
      setIsProcessing(false);

      console.log('\n✅ [OCR_PROCESSOR] All processing completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Lỗi xử lý';
      console.error('❌ [OCR_PROCESSOR] Error:', errorMessage);
      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [imageUri, enableGeminiProcessing]);

  return {
    isProcessing,
    processedData,
    editedData,
    error,
    processData,
    setError,
  };
};
