/**
 * GeminiAIService.ts
 * 
 * Mục đích: Gọi API Gemini qua thư viện (Free tier - 100%)
 * Model: gemini-2.5-flash (miễn phí, cải thiện hơn 1.5-flash)
 * Docs: https://ai.google.dev
 * 
 * Free Models:
 * - gemini-2.5-flash: Nhanh, cải thiện, tiết kiệm token ✅ (lựa chọn này)
 * - gemini-1.5-flash: Nhanh, tiết kiệm token
 * - gemini-1.5-pro: Mạnh hơn nhưng chậm hơn
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBLCiOB6D52RkyaPIo6wDMcRk3eFOZ2t1E";

if (!API_KEY) {
  throw new Error("⚠️ Thiếu GEMINI_API_KEY");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Gọi Gemini API để xử lý text đơn giản
 */
export async function generateGeminiText(prompt: string): Promise<string> {
  try {
    console.log("🚀 [GEMINI] Gọi Gemini API (gemini-2.5-flash)...");
    console.log("📝 [GEMINI] Prompt:", prompt.substring(0, 100));
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    console.log("✅ [GEMINI] Gemini trả về:", response.substring(0, 100) + "...");
    
    return response;
  } catch (error: any) {
    console.error("❌ [GEMINI] Lỗi:", error.message);
    
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
 * Parse processedText từ Gemini để lấy description ngắn gọn
 * Input: 
 *   "---
 *    🏪 Cửa hàng: NGUYEN THI TU UYEN
 *    🕐 Giờ: 21:05:19
 *    📅 Ngày: 04/11/2025
 *    💰 Tổng: 300.000 VND
 *    ..."
 * Output: "Cửa hàng: NGUYEN THI TU UYEN - 300.000 VND"
 */
export function extractDescriptionFromProcessedText(processedText: string): string {
  try {
    console.log("📝 [GEMINI] Extracting description from processed text...");
    
    if (!processedText) return "";

    // Extract merchant/cửa hàng
    const merchantMatch = processedText.match(/🏪\s*Cửa hàng:\s*([^\n]+)/i);
    const merchant = merchantMatch ? merchantMatch[1].trim() : "";

    // Extract total/tổng
    const totalMatch = processedText.match(/💰\s*Tổng:\s*([^\n]+)/i);
    const total = totalMatch ? totalMatch[1].trim() : "";

    // Extract time/giờ
    const timeMatch = processedText.match(/🕐\s*Giờ:\s*([^\n]+)/i);
    const time = timeMatch ? timeMatch[1].trim() : "";

    // Combine vào description ngắn gọn
    let description = "";
    if (merchant) description += merchant;
    if (time) description += ` - ${time}`;
    if (total) description += ` (${total})`;

    console.log("✅ [GEMINI] Extracted description:", description);
    return description || processedText.substring(0, 100); // Fallback nếu không tìm thấy
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting description:", error);
    return processedText.substring(0, 100);
  }
}

/**
 * 💰 Extract số tiền từ processed text
 * Input: "300.000 VND" hoặc "300000 VND" 
 * Output: 300000 (số nguyên)
 */
export function extractAmountFromProcessedText(processedText: string): number {
  try {
    console.log("💰 [GEMINI] Extracting amount from processed text...");
    
    if (!processedText) return 0;

    // Extract tổng tiền từ "💰 Tổng: 300.000 VND"
    let totalMatch = processedText.match(/💰\s*Tổng:\s*([0-9.,]+)\s*(?:VND)?/i);
    
    if (!totalMatch) {
      // Try alternative format: "Tổng: 300.000 VND" (without emoji)
      totalMatch = processedText.match(/(?:Tổng|Total):\s*([0-9.,]+)\s*(?:VND)?/i);
    }
    
    if (!totalMatch) {
      // Try format: "300.000 VND" (anywhere in text)
      totalMatch = processedText.match(/([0-9]{1,3}(?:[.,][0-9]{3})+)\s*VND/i);
    }

    if (!totalMatch) {
      // Try format: "300000 VND" (without thousand separator)
      totalMatch = processedText.match(/([0-9]+)\s*VND/i);
    }
    
    if (totalMatch) {
      const amountStr = totalMatch[1].trim();
      console.log("📊 [GEMINI] Found amount string:", amountStr);
      
      // Remove dots and commas to get pure number
      // "300.000" → "300000"
      // "300,000" → "300000"
      const cleanedAmount = amountStr.replace(/[.,]/g, "");
      const amount = parseInt(cleanedAmount, 10);
      
      console.log("✅ [GEMINI] Parsed amount:", amount);
      return isNaN(amount) ? 0 : amount;
    }

    console.warn("⚠️ [GEMINI] Could not find amount in processed text");
    return 0;
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting amount:", error);
    return 0;
  }
}

/**
 * Xử lý OCR text bằng Gemini AI
 * Flow: Raw OCR Text → Gemini AI → Processed Result
 * 
 * @param ocrText - Văn bản thô từ OCR
 * @param customPrompt - Custom prompt (optional)
 * @returns Kết quả xử lý từ Gemini
 */
export async function processOCRTextWithGemini(
  ocrText: string,
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

    console.log("\n🤖 [GEMINI_OCR] Bắt đầu xử lý OCR text bằng Gemini...");
    console.log("📝 [GEMINI_OCR] Text length:", ocrText.length);

    // Default prompt nếu không có custom prompt
    const prompt = customPrompt || `Bạn là một trợ lý xử lý hóa đơn chuyên nghiệp.

Phân tích văn bản OCR từ hóa đơn dưới đây và trích xuất:
1. **Tên cửa hàng/Merchant**: Tên nơi mua
2. **Ngày giờ**: Thời gian giao dịch ( ví dụ: 25/12/2023 14:30 )
3. **Tổng tiền**: Số tiền thanh toán (chỉ lấy con số cuối cùng nếu có nhiều)
4. **Danh sách items**: Các sản phẩm/dịch vụ mua (nếu có)


Định dạng kết quả:
---
🏪 Cửa hàng: [Tên]
🕐 Giờ: [Giờ] (ví dụ 23:59:00)
📅 Ngày: [Ngày]
💰 Tổng: [Số tiền] VND
📦 Items:
- [Item 1] [số tiền]
- [Item 2] [số tiền]
...

---

Văn bản OCR:
${ocrText}

Trích xuất thông tin từ hóa đơn trên:`;

    console.log("🔄 [GEMINI_OCR] Gửi request tới Gemini...");

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const processedText = result.response.text();

    const processingTime = Date.now() - startTime;

    console.log("✅ [GEMINI_OCR] Xử lý thành công!");
    console.log("⏱️ [GEMINI_OCR] Processing time:", processingTime, "ms");
    console.log("📊 [GEMINI_OCR] Result preview:", processedText.substring(0, 150) + "...");

    return {
      success: true,
      processedText,
      originalText: ocrText,
      processingTime,
    };
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("❌ [GEMINI_OCR] Lỗi:", errorMessage);
    console.error("⏱️ [GEMINI_OCR] Processing time:", processingTime, "ms");

    return {
      success: false,
      processedText: "",
      originalText: ocrText,
      error: errorMessage,
      processingTime,
    };
  }
}
