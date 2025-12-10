import { GoogleGenerativeAI } from '@google/generative-ai';
import ENV from '../config/env';

/**
 * IncomeTextAIProcessingService: Xử lý Gemini AI cho TEXT/NOTE của thu nhập (INCOME)
 * - Logic là copy từ TextAIProcessingService nhưng sử dụng API key riêng để tiết kiệm token
 */

const API_KEY = ENV.GEMINI_API_KEY_TEXT_INCOME ;

if (!API_KEY) {
  throw new Error("⚠️ Thiếu GEMINI_API_KEY_TEXT_INCOME - vui lòng cấu hình trong src/config/env.ts");
}

// Khởi tạo instance genAI
const genAI = new GoogleGenerativeAI(API_KEY);

class IncomeTextAIProcessingServiceClass {
  async processTextNote(textInput, transactionType = 'income') {
    console.log(`🤖 [TEXT-AI-INCOME] Processing text for ${transactionType}:`, textInput);
    if (!textInput || !textInput.trim()) {
      throw new Error('❌ Text input is empty');
    }
    const startTime = Date.now();
    try {
      const prompt = this._getTextProcessingPrompt(textInput, transactionType);
      console.log("🚀 [TEXT-AI-INCOME] Gọi Gemini API (gemini-2.5-flash)...");
      console.log("📝 [TEXT-AI-INCOME] Prompt:", prompt.substring(0, 100));
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      console.log("✅ [TEXT-AI-INCOME] Gemini trả về:", responseText.substring(0, 100) + "...");
      const parsed = this._parseGeminiResponse(responseText, transactionType);
      const processingTime = Date.now() - startTime;
      console.log(`⏱️ [TEXT-AI-INCOME] Processing time: ${processingTime}ms`);
      return {
        success: true,
        processedText: responseText,
        totalAmount: parsed.totalAmount,
        items: parsed.items || [],
        category: parsed.category,
        description: parsed.description,
        confidence: parsed.confidence || 'low',
        processingTime: processingTime,
      };
    } catch (error) {
      console.error("❌ [TEXT-AI-INCOME] Lỗi:", error.message);
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

  // copy helpers from TextAIProcessingService
  _getTextProcessingPrompt(text, transactionType) {
    if (transactionType === 'income') {
      return `
Bạn là trợ lý thông minh xử lý thông tin tài chính cho ứng dụng quản lý thu nhập.

TASK: Phân tích ghi chú THU NHẬP này (có thể nhiều item), trích xuất thông tin và TÍNH TỔNG TIỀN:

Ghi chú: "${text}"

Hãy trích xuất và trả về JSON với các trường:
{
  "totalAmount": <TỔNG số tiền (chỉ số, VD: 5000000, KHÔNG có chữ)>,
  "items": [
    {
      "item": "<Mô tả nguồn thu nhập>",
      "amount": <số tiền của item này>
    }
  ],
  "category": "<Danh mục THU NHẬP: Lương, Thưởng, Đầu tư, Thu nhập khác>",
  "description": "<Mô tả chi tiết tổng hợp của giao dịch>",
  "confidence": "<high/medium/low - độ chắc chắn>"
}

LƯU Ý:
- QUAN TRỌNG: Tính tổng ALL items vào totalAmount
- Nếu có nhiều item, liệt kê tất cả trong "items" array
- Nếu không tìm thấy số tiền, set totalAmount = 0
- Danh mục phải là một trong: Lương, Thưởng, Đầu tư, Thu nhập khác
- Description nên rõ ràng, ngắn gọn
- Confidence = "high" nếu rõ ràng, "low" nếu mơ hồ
- CHỈ trả về JSON, không giải thích thêm
      `.trim();
    }
    // fallback (shouldn't be called for income)
    return `
Bạn là trợ lý thông minh xử lý thông tin tài chính cho ứng dụng.
Ghi chú: "${text}"
Trích xuất thông tin và trả về JSON.
    `.trim();
  }

  _parseGeminiResponse(responseText, transactionType) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          totalAmount: 0,
          items: [],
          category: transactionType === 'income' ? '💰 Thu nhập' : '📝 Ghi chú',
          description: responseText,
        };
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        totalAmount: parsed.totalAmount || 0,
        items: parsed.items || [],
        category: this._mapCategory(parsed.category, transactionType),
        description: parsed.description || '',
        confidence: parsed.confidence || 'low',
      };
    } catch (error) {
      return {
        totalAmount: 0,
        items: [],
        category: transactionType === 'income' ? '💰 Thu nhập' : '📝 Ghi chú',
        description: responseText,
        confidence: 'low',
      };
    }
  }

  _mapCategory(geminiCategory, transactionType) {
    if (!geminiCategory) {
      return transactionType === 'income' ? '💰 Thu nhập' : '📝 Ghi chú';
    }
    const cleanCategory = geminiCategory.replace(/[🍔🚗🛍️🎮💊📚🏠💼🎁📈🌟✓]/g, '').trim();
    const categoryMap = {
      'Lương': 'Lương 💼',
      'Thưởng': 'Thưởng 🎁',
      'Đầu tư': 'Đầu tư 📈',
      'Thu nhập khác': 'Khác 💰',
    };
    if (categoryMap[cleanCategory]) {
      return categoryMap[cleanCategory];
    }
    for (const [key, value] of Object.entries(categoryMap)) {
      if (key.toLowerCase() === cleanCategory.toLowerCase()) {
        return value;
      }
    }
    return transactionType === 'income' ? '💰 Thu nhập' : '📝 Ghi chú';
  }
}

const IncomeTextAIProcessingService = new IncomeTextAIProcessingServiceClass();
export default IncomeTextAIProcessingService;
