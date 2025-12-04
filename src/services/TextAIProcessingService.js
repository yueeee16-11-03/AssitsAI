import { GoogleGenerativeAI } from '@google/generative-ai';
import ENV from '../config/env';

/**
 * TextAIProcessingService: Xử lý Gemini AI cho TEXT/NOTE
 * (Lấy API Key từ env.ts - được .gitignore bảo vệ)
 */

// Lấy API key từ env.ts (được .gitignore - không bị commit)
const API_KEY = ENV.GEMINI_API_KEY_TEXT;

if (!API_KEY) {
  throw new Error("⚠️ Thiếu GEMINI_API_KEY - vui lòng cấu hình trong src/config/env.ts");
}

// Tạo instance genAI
const genAI = new GoogleGenerativeAI(API_KEY);


class TextAIProcessingServiceClass {
  
  // 3. Không cần constructor nữa, vì genAI đã được khởi tạo ở ngoài.

  /**
   * 🤖 Xử lý note/text thông qua Gemini
   * (Đã được sửa, dùng model và try...catch từ file GeminiAIService.ts)
   */
  async processTextNote(textInput, transactionType = 'expense') {
    console.log(`🤖 [TEXT-AI] Processing text for ${transactionType}:`, textInput);
    
    if (!textInput || !textInput.trim()) {
      throw new Error('❌ Text input is empty');
    }

    const startTime = Date.now();

    try {
      // 4. LẤY PROMPT (Giữ nguyên logic prompt của bạn)
      const prompt = this._getTextProcessingPrompt(textInput, transactionType);
      
      console.log("🚀 [TEXT-AI] Gọi Gemini API (gemini-2.5-flash)...");
      console.log("📝 [TEXT-AI] Prompt:", prompt.substring(0, 100));
      
      // 5. SỬ DỤNG MODEL VÀ INSTANCE TỪ FILE "ĐANG CHẠY"
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log("✅ [TEXT-AI] Gemini trả về:", responseText.substring(0, 100) + "...");

      // 6. PARSE KẾT QUẢ (Giữ nguyên logic parse của bạn)
      const parsed = this._parseGeminiResponse(responseText, transactionType);
      
      const processingTime = Date.now() - startTime;
      console.log(`⏱️ [TEXT-AI] Processing time: ${processingTime}ms`);

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
      // 7. SỬ DỤNG BLOCK CATCH LỖI CHI TIẾT TỪ FILE "GeminiAIService.ts"
      console.error("❌ [TEXT-AI] Lỗi:", error.message);
      
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
   * ------------------------------------------------------------------
   * CÁC HÀM HELPER (Giữ nguyên y hệt file cũ của bạn)
   * ------------------------------------------------------------------
   */

  /**
   * 📝 Tạo prompt cho xử lý TEXT (khác với image OCR)
   * @private
   */
  _getTextProcessingPrompt(text, transactionType) {
    // 🟢 Prompt cho INCOME (Thu nhập)
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

Ví dụ 1 (Single item):
Input: "Lương tháng 5 triệu"
Output:
{
  "totalAmount": 5000000,
  "items": [{"item": "Lương tháng", "amount": 5000000}],
  "category": "Lương",
  "description": "Lương tháng",
  "confidence": "high"
}

Ví dụ 2 (Multiple items):
Input: "lương 5 triệu thưởng 500k"
Output:
{
  "totalAmount": 5500000,
  "items": [
    {"item": "Lương", "amount": 5000000},
    {"item": "Thưởng", "amount": 500000}
  ],
  "category": "Lương",
  "description": "Lương + Thưởng",
  "confidence": "high"
}
      `.trim();
    }
    
    // 🔴 Prompt cho EXPENSE (Chi tiêu)
    return `
Bạn là trợ lý thông minh xử lý thông tin tài chính cho ứng dụng quản lý chi tiêu.

TASK: Phân tích ghi chú CHI TIÊU này (có thể nhiều item), trích xuất thông tin và TÍNH TỔNG TIỀN:

Ghi chú: "${text}"

Hãy trích xuất và trả về JSON với các trường:
{
  "totalAmount": <TỔNG số tiền (chỉ số, VD: 150000, KHÔNG có chữ)>,
  "items": [
    {
      "item": "<Mô tả item>",
      "amount": <số tiền của item này>
    }
  ],
  "category": "<Danh mục CHI TIÊU: Ăn uống, Vận chuyển, Mua sắm, Giải trí, Sức khỏe, Giáo dục, Nhà cửa, Khác>",
  "description": "<Mô tả chi tiết tổng hợp của giao dịch>",
  "confidence": "<high/medium/low - độ chắc chắn>"
}

LƯU Ý:
- QUAN TRỌNG: Tính tổng ALL items vào totalAmount
- Nếu có nhiều item, liệt kê tất cả trong "items" array
- Nếu không tìm thấy số tiền, set totalAmount = 0
- Danh mục phải là một trong các lựa chọn trên
- Description nên rõ ràng, ngắn gọn
- Confidence = "high" nếu rõ ràng, "low" nếu mơ hồ
- CHỈ trả về JSON, không giải thích thêm

Ví dụ 1 (Single item):
Input: "Ăn trưa 150k tại Phở Hà Nội"
Output:
{
  "totalAmount": 150000,
  "items": [{"item": "Ăn trưa tại Phở Hà Nội", "amount": 150000}],
  "category": "Ăn uống",
  "description": "Ăn trưa tại Phở Hà Nội",
  "confidence": "high"
}

Ví dụ 2 (Multiple items):
Input: "ăn sáng 30 ăn trưa 30"
Output:
{
  "totalAmount": 60000,
  "items": [
    {"item": "Ăn sáng", "amount": 30000},
    {"item": "Ăn trưa", "amount": 30000}
  ],
  "category": "Ăn uống",
  "description": "Ăn sáng + Ăn trưa",
  "confidence": "high"
}
    `.trim();
  }

  /**
   * 🔍 Parse JSON response từ Gemini
   * @private
   */
  _parseGeminiResponse(responseText, transactionType) {
    try {
      // Tìm JSON trong response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ [TEXT-AI] No JSON found in response');
        return {
          totalAmount: 0,
          items: [],
          category: transactionType === 'income' ? '💰 Thu nhập' : '📝 Ghi chú',
          description: responseText,
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      console.log('✅ [TEXT-AI] Parsed:', parsed);
      console.log('📊 [TEXT-AI] Total amount:', parsed.totalAmount);
      console.log('📋 [TEXT-AI] Items:', parsed.items);

      return {
        totalAmount: parsed.totalAmount || 0,
        items: parsed.items || [],
        category: this._mapCategory(parsed.category, transactionType),
        description: parsed.description || '',
        confidence: parsed.confidence || 'low',
      };

    } catch (error) {
      console.error('❌ [TEXT-AI] Error parsing response:', error);
      return {
        totalAmount: 0,
        items: [],
        category: transactionType === 'income' ? '💰 Thu nhập' : '📝 Ghi chú',
        description: responseText,
        confidence: 'low',
      };
    }
  }

  /**
   * 🏷️ Map danh mục từ Gemini → categoryId của app
   * @private
   */
  _mapCategory(geminiCategory, transactionType) {
    if (!geminiCategory) {
      return transactionType === 'income' ? '💰 Thu nhập' : '📝 Ghi chú';
    }

    // Loại bỏ emoji từ geminiCategory nếu có
    const cleanCategory = geminiCategory.replace(/[🍔🚗🛍️🎮💊📚🏠💼🎁📈🌟✓]/g, '').trim();
    
    const categoryMap = {
      // Expense categories
      'Ăn uống': 'Ăn uống 🍔',
      'Vận chuyển': 'Vận chuyển 🚗',
      'Giao thông': 'Vận chuyển 🚗', // Alias
      'Mua sắm': 'Mua sắm 🛍️',
      'Giải trí': 'Giải trí 🎮',
      'Sức khỏe': 'Sức khỏe 💊',
      'Y tế': 'Sức khỏe 💊', // Alias
      'Giáo dục': 'Giáo dục 📚',
      'Nhà cửa': 'Nhà cửa 🏠',
      'Nhà ở': 'Nhà cửa 🏠', // Alias
      'Tiện ích': 'Nhà cửa 🏠', // Dùng chung category
      'Khác': 'Khác 📦',
      // Income categories
      'Lương': 'Lương 💼',
      'Thưởng': 'Thưởng 🎁',
      'Đầu tư': 'Đầu tư 📈',
      'Thu nhập khác': 'Khác 💰',
    };

    // Try exact match trước
    if (categoryMap[cleanCategory]) {
      return categoryMap[cleanCategory];
    }

    // Try lowercase match
    for (const [key, value] of Object.entries(categoryMap)) {
      if (key.toLowerCase() === cleanCategory.toLowerCase()) {
        return value;
      }
    }

    // Fallback: Return as is với emoji nếu không match
    return transactionType === 'income' ? '💰 Thu nhập' : '📝 Ghi chú';
  }

  /**
   * 💰 Format số tiền dễ đọc
   */
  formatAmount(amount) {
    if (!amount) return '0';
    return amount.toLocaleString('vi-VN');
  }
}

// 9. EXPORT SINGLETON INSTANCE (Giữ nguyên cấu trúc export của bạn)
const TextAIProcessingService = new TextAIProcessingServiceClass();
export default TextAIProcessingService;