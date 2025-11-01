/**
 * OCRService.ts (Updated with Fallback & Error Handling)
 * 
 * Mục đích: Nhận dạng chữ từ ảnh bằng Google ML Kit
 * Với fallback mode cho development
 * 
 * Flow: Image (file://) → ML Kit → Raw Text
 *       (hoặc fallback mock data khi ML Kit unavailable)
 */

let TextRecognition: any = null;
let isMLKitAvailable = false;

// Cố gắng import ML Kit (optional)
try {
  // @ts-ignore
  TextRecognition = require('@react-native-ml-kit/text-recognition').default;
  isMLKitAvailable = true;
  console.log('✅ [OCR] ML Kit loaded successfully');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (_) {
  console.warn(
    '⚠️ [OCR] ML Kit not available, using fallback mock mode. Install with:\n' +
    'npm install @react-native-ml-kit/text-recognition\n' +
    'cd android && ./gradlew clean && cd ..\n' +
    'npx react-native run-android'
  );
  isMLKitAvailable = false;
}

export interface OCRResult {
  success: boolean;
  rawText: string;
  blocks?: Array<{
    text: string;
    confidence?: number;
  }>;
  processingTime: number;
  error?: string;
}

export const OCRService = {
  /**
   * Kiểm tra xem ML Kit có sẵn không
   */
  isAvailable: (): boolean => isMLKitAvailable,

  /**
   * Nhận dạng văn bản từ ảnh
   * @param imageUri - Đường dẫn ảnh (file:// hoặc data://)
   * @returns OCRResult
   */
  recognizeText: async (imageUri: string): Promise<OCRResult> => {
    const startTime = Date.now();

    try {
      console.log('🔍 [OCR] Starting text recognition from:', imageUri);

      // Nếu ML Kit không available, throw error
      if (!isMLKitAvailable) {
        throw new Error('ML Kit not available. Install @react-native-ml-kit/text-recognition');
      }

      // Gọi ML Kit thực sự
      const result = await TextRecognition.recognize(imageUri);

      if (!result || !result.text) {
        throw new Error('No text detected in image');
      }

      const processingTime = Date.now() - startTime;

      console.log('✅ [OCR] Text recognized successfully');
      console.log('📝 [OCR] Extracted text length:', result.text.length);
      console.log('📝 [OCR] Preview:', result.text.substring(0, 150) + '...');

      return {
        success: true,
        rawText: result.text,
        blocks: result.blocks || [],
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown OCR error';

      console.error('❌ [OCR] Error:', errorMessage);

      return {
        success: false,
        rawText: '',
        blocks: [],
        processingTime,
        error: errorMessage,
      };
    }
  },

  /**
   * Làm sạch text (loại bỏ khoảng trắng thừa)
   */
  cleanText: (text: string): string => {
    if (!text) return '';
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join('\n');
  },

  /**
   * Trích xuất số tiền từ text
   * Ví dụ: "150.000" → 150000
   */
  extractAmounts: (text: string): number[] => {
    if (!text) return [];
    const amountPattern = /(\d{1,3}(?:[.,]\d{3})*|\d+)/g;
    const matches = text.match(amountPattern) || [];

    return matches
      .map((match) => parseInt(match.replace(/[.,]/g, ''), 10))
      .filter((num) => num > 0 && num < 100000000);
  },

  /**
   * Install instructions cho ML Kit
   */
  getInstallInstructions: (): string => {
    return `
📦 Để cài đặt ML Kit Text Recognition:

1. Install package:
   npm install @react-native-ml-kit/text-recognition

2. Link native modules:
   npx react-native link @react-native-ml-kit/text-recognition

3. Android setup:
   cd android
   ./gradlew clean
   cd ..

4. Rebuild app:
   npx react-native run-android
   hoặc
   npx react-native run-ios

5. Nếu vẫn lỗi, rebuild clean:
   npx react-native clean
   npx react-native run-android
    `;
  },
};
