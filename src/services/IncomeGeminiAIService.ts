import { GoogleGenerativeAI } from "@google/generative-ai";
import ENV from '../config/env';

const API_KEY = ENV.GEMINI_API_KEY_TEXT_INCOME ;

if (!API_KEY) {
  throw new Error("⚠️ Thiếu GEMINI_API_KEY_TEXT_INCOME - vui lòng cấu hình trong src/config/env.ts");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Gọi Gemini API để xử lý text thu nhập
 * (Sử dụng model gemini-2.5-flash, same as GeminiAIService)
 */
export async function generateGeminiTextIncome(prompt: string): Promise<string> {
  try {
    console.log("🚀 [GEMINI-INCOME] Gọi Gemini API (gemini-2.5-flash)...");
    console.log("📝 [GEMINI-INCOME] Prompt:", prompt.substring(0, 100));
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    console.log("✅ [GEMINI-INCOME] Gemini trả về:", response.substring(0, 100) + "...");
    return response;
  } catch (error: any) {
    console.error("❌ [GEMINI-INCOME] Lỗi:", error.message);
    if (error.message?.includes("API_KEY")) {
      throw new Error("⚠️ API Key không hợp lệ hoặc hết hạn");
    }
    if (error.message?.includes("billing")) {
      throw new Error("💰 Cần enable billing - vào https://ai.google.dev");
    }
    if (error.message?.includes("quota")) {
      throw new Error("⏱️ Vượt quá rate limit - chờ và thử lại");
    }
    if (error.message?.includes("timeout")) {
      throw new Error("⏰ Timeout - Gemini không phản hồi");
    }
    if (error.message?.includes("Network")) {
      throw new Error("🌐 Lỗi kết nối mạng");
    }
    throw new Error("🚨 Lỗi: " + error.message);
  }
}

/**
 * Process OCR text with Gemini using a dedicated income API key
 */
export async function processOCRTextWithGeminiIncome(
  ocrText: string,
  transactionType: 'income' | 'expense' = 'income',
  customPrompt?: string
): Promise<{
  success: boolean;
  processedText: string;
  originalText: string;
  error?: string;
  processingTime: number;
}> {
  const startTime = Date.now();
  try {
    if (!ocrText || ocrText.trim().length === 0) {
      throw new Error("Văn bản OCR không được để trống");
    }
    console.log(`\n🤖 [GEMINI_OCR_INCOME] Bắt đầu xử lý OCR text bằng Gemini...`);
    console.log("📝 [GEMINI_OCR_INCOME] Text length:", ocrText.length);
    console.log("📊 [GEMINI_OCR_INCOME] Transaction type:", transactionType);
    let prompt = customPrompt;
    if (!prompt) {
      // Always use income prompt
      prompt = `Bạn là một trợ lý xử lý hóa đơn thu nhập chuyên nghiệp.
\nPhân tích văn bản OCR từ ảnh/hóa đơn thu nhập dưới đây và trích xuất:
1. **Tên nguồn thu nhập/Merchant**: Tên nơi/người gửi tiền
2. **Ngày giờ**: Thời gian nhận tiền ( ví dụ: 25/12/2023 14:30 )
3. **Tổng tiền**: Số tiền nhận được (chỉ lấy con số cuối cùng nếu có nhiều)
4. **Danh sách items**: Các khoản thu nhập kèm danh mục (nếu có)\n\nDanh mục thu nhập: Lương, Thưởng, Đầu tư, Thu nhập khác\n\nĐịnh dạng kết quả:\n---\n🏪 Nguồn: [Tên]\n🕐 Giờ: [Giờ] (ví dụ 23:59:00)\n📅 Ngày: [Ngày]\n💰 Tổng: [Số tiền] VND\n📦 Items:\n- [Item 1] [số tiền] (Danh mục: [Loại])\n...\n---\n\nVăn bản OCR:\n${ocrText}\n\nTrích xuất thông tin từ ảnh/hóa đơn thu nhập trên:`;
    }
    console.log(`🔄 [GEMINI_OCR_INCOME] Gửi request tới Gemini...`);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const processedText = (result as any).response.text();
    const processingTime = Date.now() - startTime;
    console.log("✅ [GEMINI_OCR_INCOME] Xử lý thành công!");
    console.log("⏱️ [GEMINI_OCR_INCOME] Processing time:", processingTime, "ms");
    console.log("📊 [GEMINI_OCR_INCOME] Result preview:", processedText.substring(0, 150) + "...");
    return {
      success: true,
      processedText,
      originalText: ocrText,
      processingTime,
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const processingTime = Date.now() - startTime;
    console.error(`❌ [GEMINI_OCR_INCOME] Error:`, errorMessage);
    console.error("⏱️ [GEMINI_OCR_INCOME] Processing time:", processingTime, "ms");
    return {
      success: false,
      processedText: "",
      originalText: ocrText,
      error: errorMessage,
      processingTime,
    };
  }
}

export default {
  generateGeminiTextIncome,
  processOCRTextWithGeminiIncome,
};
