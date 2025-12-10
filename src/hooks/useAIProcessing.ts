import { useState, useCallback } from "react";
import { OCRService } from "../services/OCRService";
import { 
  processOCRTextWithGemini, 
  extractDescriptionFromProcessedText, 
  extractAmountFromProcessedText,
  extractCategoryFromProcessedText,
  extractItemsFromProcessedText,
  extractConfidenceFromProcessedText,
  extractMerchantFromProcessedText,
  extractDateFromProcessedText,
} from "../services/GeminiAIService";
import { processOCRTextWithGeminiIncome } from "../services/IncomeGeminiAIService";

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
  merchant?: string;
  date?: string;
}

interface UseAIProcessingProps {
  imageUri?: string;
  enableGeminiProcessing?: boolean;
  transactionType?: 'income' | 'expense';
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
  transactionType = 'expense',
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
        console.log('📊 [OCR_PROCESSOR] Transaction type:', transactionType);
        const geminiResult = transactionType === 'income'
          ? await processOCRTextWithGeminiIncome(rawOCRText, transactionType)
          : await processOCRTextWithGemini(rawOCRText, transactionType);

        if (geminiResult.success) {
          console.log('✅ [OCR_PROCESSOR] Gemini processing completed');
          processingResult.processedText = geminiResult.processedText;
          processingResult.description = extractDescriptionFromProcessedText(geminiResult.processedText);
          processingResult.totalAmount = extractAmountFromProcessedText(geminiResult.processedText);
          processingResult.category = extractCategoryFromProcessedText(geminiResult.processedText);
          processingResult.items = extractItemsFromProcessedText(geminiResult.processedText);
          processingResult.confidence = extractConfidenceFromProcessedText(geminiResult.processedText);
          processingResult.merchant = extractMerchantFromProcessedText(geminiResult.processedText);
          processingResult.date = extractDateFromProcessedText(geminiResult.processedText);
          processingResult.processingTime = (processingResult.processingTime || 0) + geminiResult.processingTime;
          
          // 🎯 AUTO-REPAIR: Nếu category miss nhưng items có category, lấy từ items
          if ((!processingResult.category || processingResult.category === 'Khác') && 
              processingResult.items && processingResult.items.length > 0 &&
              processingResult.items[0].category) {
            console.log('🔧 [OCR_PROCESSOR] Auto-repairing category from items...');
            processingResult.category = processingResult.items[0].category;
            console.log('✅ [OCR_PROCESSOR] Category repaired to:', processingResult.category);
          }
          
          console.log('💰 [OCR_PROCESSOR] Extracted amount:', processingResult.totalAmount);
          console.log('📦 [OCR_PROCESSOR] Extracted category:', processingResult.category);
          console.log('📋 [OCR_PROCESSOR] Extracted items:', processingResult.items);
          console.log('🏪 [OCR_PROCESSOR] Extracted merchant:', processingResult.merchant);
          console.log('📅 [OCR_PROCESSOR] Extracted date:', processingResult.date);
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
  }, [imageUri, enableGeminiProcessing, transactionType]);

  return {
    isProcessing,
    processedData,
    editedData,
    error,
    processData,
    setError,
  };
};
