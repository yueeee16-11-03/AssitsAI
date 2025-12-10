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
import ENV from '../config/env';

const API_KEY = ENV.GEMINI_API_KEY_IMAGE;

if (!API_KEY) {
  throw new Error("⚠️ Thiếu GEMINI_API_KEY - vui lòng cấu hình trong src/config/env.ts");
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
export function extractAmountFromProcessedTextFromDescription(processedText: string): number {
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
 * Xử lý OCR text bằng Gemini AI với prompt khác nhau cho income/expense
 * Flow: Raw OCR Text → Gemini AI → Processed Result
 * 
 * @param ocrText - Văn bản thô từ OCR
 * @param transactionType - 'income' hoặc 'expense' (default: 'expense')
 * @param customPrompt - Custom prompt (optional, override transactionType)
 * @returns Kết quả xử lý từ Gemini
 */
export async function processOCRTextWithGemini(
  ocrText: string,
  transactionType: 'income' | 'expense' = 'expense',
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

    console.log(`\n🤖 [GEMINI_OCR] Bắt đầu xử lý OCR text bằng Gemini...`);
    console.log("📝 [GEMINI_OCR] Text length:", ocrText.length);
    console.log("📊 [GEMINI_OCR] Transaction type:", transactionType);

    // Generate prompt based on transactionType
    let prompt = customPrompt;

    // NOTE: This service is dedicated to expense processing. For income OCR/text
    // use processOCRTextWithGeminiIncome (IncomeGeminiAIService) which uses a
    // separate API key and prompt optimized for income.
    if (transactionType === 'income') {
      throw new Error('Use IncomeGeminiAIService.processOCRTextWithGeminiIncome for income processing');
    }

    if (!prompt) {
        //  EXPENSE PROMPT (default)
        prompt = `Bạn là một trợ lý xử lý hóa đơn chi tiêu chuyên nghiệp.

Phân tích văn bản OCR từ ảnh/hóa đơn dưới đây và trích xuất:
1. **Tên cửa hàng/Merchant**: Tên nơi mua
2. **Ngày giờ**: Thời gian giao dịch ( ví dụ: 25/12/2023 14:30 )
3. **Tổng tiền**: Số tiền thanh toán (chỉ lấy con số cuối cùng nếu có nhiều)
4. **Danh sách items**: Các sản phẩm/dịch vụ mua kèm danh mục (nếu có)

Danh mục chi tiêu: Ăn uống, Giao thông, Mua sắm, Y tế, Giáo dục, Giải trí, Nhà ở, Tiện ích, Khác

Định dạng kết quả:
---
🏪 Cửa hàng: [Tên]
🕐 Giờ: [Giờ] (ví dụ 23:59:00)
📅 Ngày: [Ngày]
💰 Tổng: [Số tiền] VND
📦 Items:
- [Item 1] [số tiền] (Danh mục: [Loại])
- [Item 2] [số tiền] (Danh mục: [Loại])
...

---

Văn bản OCR:
${ocrText}

Trích xuất thông tin từ ảnh/hóa đơn chi tiêu trên:`;
    }

    console.log(`🔄 [GEMINI_OCR] Gửi request tới Gemini...`);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const processedText = (result as any).response.text();

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
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const processingTime = Date.now() - startTime;

    console.error(`❌ [GEMINI_OCR] Error:`, errorMessage);
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

/**
 * 📦 Extract danh mục từ processed text
 * Input: "---
 *    📦 Danh mục: Ăn uống
 *    ..."
 * Output: "Ăn uống"
 * 
 * Fallback: Nếu không tìm thấy danh mục rõ ràng, sẽ trích từ items hoặc keywords
 */
export function extractCategoryFromProcessedText(processedText: string): string {
  try {
    if (!processedText) return "Khác";

    // 🎯 Method 1: Tìm "📦 Danh mục:" hoặc "Danh mục:" trực tiếp
    let categoryMatch = processedText.match(/(?:📦\s*)?Danh mục:\s*([^\n()]+)/i);
    if (categoryMatch) {
      let category = categoryMatch[1].trim();
      // Loại bỏ emoji và dấu câu thừa
      category = category.replace(/[🍔🚗🛍️🎮💊📚🏠💼🎁📈🌟✓]/g, '').trim();
      if (category && category !== "Khác") {
        console.log("✅ [GEMINI] Extracted category (Method 1 - Direct match):", category);
        return category;
      }
    }

    // 🎯 Method 2: Nếu có items, lấy category từ item đầu tiên
    const itemsMatch = processedText.match(/(?:📦\s*)?Items:?([\s\S]*?)(?=\n---|$)/i);
    if (itemsMatch) {
      // Tìm "(Danh mục: ...)" trong items
      const categoriesInItems = itemsMatch[1].match(/\(Danh mục:\s*([^)]+)\)/gi);
      if (categoriesInItems && categoriesInItems.length > 0) {
        // Lấy category từ item đầu tiên
        const firstCategoryMatch = categoriesInItems[0].match(/Danh mục:\s*([^)]+)/i);
        if (firstCategoryMatch) {
          let category = firstCategoryMatch[1].trim();
          category = category.replace(/[🍔🚗🛍️🎮💊📚🏠💼🎁📈🌟✓]/g, '').trim();
          if (category && category !== "Khác") {
            console.log("✅ [GEMINI] Extracted category (Method 2 - From items):", category);
            return category;
          }
        }
      }
    }

    // 🎯 Method 3: Tìm keywords danh mục trong text
    const categoryKeywords = {
      'Ăn uống': ['ăn', 'cơm', 'phở', 'cà phê', 'nước', 'nhà hàng', 'quán', 'cafe'],
      'Vận chuyển': ['xe', 'taxi', 'grab', 'xế', 'vận chuyển', 'xăng', 'đổ', 'bền'],
      'Mua sắm': ['mua', 'quần áo', 'áo', 'quần', 'giày', 'balo', 'túi', 'đồ'],
      'Giải trí': ['xem', 'chiếu', 'phim', 'game', 'vé', 'entertainment', 'giải trí'],
      'Sức khỏe': ['thuốc', 'bệnh', 'viện', 'khám', 'y tế', 'sức khỏe'],
      'Giáo dục': ['học', 'sách', 'khoá', 'lớp', 'giáo dục', 'học phí'],
      'Nhà cửa': ['nhà', 'tiền nhà', 'sửa chữa', 'cải tạo', 'nước', 'điện', 'nhà ở'],
      'Thu nhập': ['lương', 'thưởng', 'đầu tư', 'tiền lãi'],
      'Lương': ['lương', 'salary', 'công lương'],
      'Thưởng': ['thưởng', 'bonus'],
      'Đầu tư': ['đầu tư', 'cổ phiếu', 'lãi suất'],
    };

    const lowerText = processedText.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          console.log("✅ [GEMINI] Extracted category (Method 3 - Keyword match):", category);
          return category;
        }
      }
    }

    console.warn("⚠️ [GEMINI] Could not find category in processed text - using 'Khác'");
    return "Khác";
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting category:", error);
    return "Khác";
  }
}

/**
 * 📋 Extract danh sách items từ processed text kèm categories
 * Input: "---
 *    📦 Items:
 *    - Cơm: 50.000 VND (Danh mục: Ăn uống)
 *    - Canh: 30.000 VND (Danh mục: Ăn uống)
 *    ..."
 * Output: [{item: "Cơm", amount: 50000, category: "Ăn uống"}, {item: "Canh", amount: 30000, category: "Ăn uống"}]
 */
export function extractItemsFromProcessedText(processedText: string): Array<{item: string; amount: number; category?: string}> {
  try {
    if (!processedText) return [];

    const items: Array<{item: string; amount: number; category?: string}> = [];

    // 🎯 Method 1: Tìm section "📦 Items:" hoặc "📋 Items:"
    const itemsSection = processedText.match(/(?:📦|📋)\s*Items:?([\s\S]*?)(?=\n---|---|\n✓|$)/i);
    
    if (!itemsSection) {
      console.warn("⚠️ [GEMINI] Could not find items section");
      return [];
    }

    const itemsText = itemsSection[1];
    const itemsLines = itemsText.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('-') || trimmed.match(/^[•*]/) || trimmed.length > 0;
    });
    
    itemsLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return; // Skip empty lines
      
      // 🎯 Method 1: Format "- Cơm: 50.000 VND (Danh mục: Ăn uống)"
      let itemMatch = trimmed.match(/^[-•*]\s*([^:]+):\s*([0-9.,]+)\s*(?:VND|₫)?\s*(?:\(Danh mục:\s*([^)]+)\))?/i);
      
      // 🎯 Method 2: Format "- Item name - 50.000 VND"
      if (!itemMatch) {
        itemMatch = trimmed.match(/^[-•*]\s*([^-]+?)\s*-\s*([0-9.,]+)\s*(?:VND|₫)?\s*(?:\(([^)]+)\))?/i);
      }
      
      // 🎯 Method 3: Format "Item name [50.000] VND"
      if (!itemMatch) {
        itemMatch = trimmed.match(/^[-•*]\s*([^[]+)\s*\[([0-9.,]+)\]\s*(?:VND|₫)?/i);
      }
      
      if (itemMatch) {
        const itemName = itemMatch[1].trim();
        const amountStr = itemMatch[2].trim();
        const amount = parseInt(amountStr.replace(/[.,]/g, ''), 10);
        const category = itemMatch[3]?.trim() || undefined;
        
        if (!isNaN(amount) && amount > 0) {
          // Loại bỏ emoji khỏi category nếu có
          const cleanCategory = category ? category.replace(/[🍔🚗🛍️🎮💊📚🏠💼🎁📈🌟✓]/g, '').trim() : undefined;
          
          items.push({
            item: itemName,
            amount: amount,
            category: cleanCategory || undefined,
          });
          console.log(`✅ [GEMINI] Extracted item: ${itemName} = ${amount} (${cleanCategory || 'no category'})`);
        }
      }
    });

    console.log("✅ [GEMINI] Extracted", items.length, "items with categories");
    return items.length > 0 ? items : [];
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting items:", error);
    return [];
  }
}

/**
 * ✓ Extract độ chắc chắn từ processed text
 * Input: "---
 *    ✓ Độ chắc chắn: Cao
 *    ..."
 * Output: "high"
 */
export function extractConfidenceFromProcessedText(processedText: string): 'high' | 'medium' | 'low' {
  try {
    if (!processedText) return "low";

    const confidenceMatch = processedText.match(/✓\s*Độ chắc chắn:\s*([^\n]+)/i);
    if (!confidenceMatch) return "low";

    const confidenceText = confidenceMatch[1].toLowerCase().trim();
    
    if (confidenceText.includes('cao') || confidenceText.includes('high')) {
      return "high";
    } else if (confidenceText.includes('trung') || confidenceText.includes('medium')) {
      return "medium";
    } else {
      return "low";
    }
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting confidence:", error);
    return "low";
  }
}

/**
 * 🏪 Extract cửa hàng/merchant từ processed text
 * Input: "---
 *    🏪 Cửa hàng: VINH NGUYEN RES
 *    ..."
 * Output: "VINH NGUYEN RES"
 */
export function extractMerchantFromProcessedText(processedText: string): string {
  try {
    if (!processedText) return "";

    // Tìm cửa hàng/merchant (có hoặc không có emoji)
    let merchantMatch = processedText.match(/🏪\s*Cửa hàng:\s*([^\n]+)/i);
    
    // Nếu không tìm thấy, thử các pattern khác
    if (!merchantMatch) {
      merchantMatch = processedText.match(/Cửa hàng:\s*([^\n]+)/i);
    }
    
    if (!merchantMatch) {
      merchantMatch = processedText.match(/Merchant:\s*([^\n]+)/i);
    }
    
    if (!merchantMatch) {
      merchantMatch = processedText.match(/Shop:\s*([^\n]+)/i);
    }

    if (merchantMatch) {
      const merchant = merchantMatch[1].trim();
      console.log("✅ [GEMINI] Extracted merchant:", merchant);
      return merchant;
    }

    console.warn("⚠️ [GEMINI] Could not find merchant in processed text");
    return "";
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting merchant:", error);
    return "";
  }
}

/**
 * 📅 Extract ngày từ processed text
 * Input: "---
 *    📅 Ngày: 25/12/2023
 *    🕐 Giờ: 14:30:00
 *    ..."
 * Output: "25/12/2023 14:30:00"
 */
export function extractDateFromProcessedText(processedText: string): string {
  try {
    if (!processedText) return "";

    // Tìm ngày (có hoặc không có emoji)
    let dateMatch = processedText.match(/📅\s*Ngày:\s*([^\n]+)/i);
    
    if (!dateMatch) {
      dateMatch = processedText.match(/Ngày:\s*([^\n]+)/i);
    }

    // Tìm giờ
    let timeMatch = processedText.match(/🕐\s*Giờ:\s*([^\n]+)/i);
    
    if (!timeMatch) {
      timeMatch = processedText.match(/Giờ:\s*([^\n]+)/i);
    }

    let result = "";
    
    if (dateMatch) {
      result = dateMatch[1].trim();
      console.log("✅ [GEMINI] Extracted date:", result);
    }
    
    if (timeMatch) {
      const time = timeMatch[1].trim();
      if (result) {
        result = `${result} ${time}`;
      } else {
        result = time;
      }
      console.log("✅ [GEMINI] Extracted time:", time);
    }

    return result;
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting date:", error);
    return "";
  }
}

/**
 * 💰 Extract tổng tiền từ processed text
 * Cải thiện version cũ để linh hoạt hơn
 * Input: "---
 *    💰 Tổng: 225.000 VND
 *    hoặc
 *    Total: 225000
 *    ..."
 * Output: 225000
 */
export function extractAmountFromProcessedText(processedText: string): number {
  try {
    if (!processedText) return 0;

    // 🎯 Method 1: Pattern "💰 Tổng:" hoặc "Tổng:"
    let amountMatch = processedText.match(/(?:💰\s*)?Tổng:\s*([0-9.,]+)\s*(?:VND)?/i);
    
    // 🎯 Method 2: Pattern "Total:" hoặc "Sum:"
    if (!amountMatch) {
      amountMatch = processedText.match(/(?:Total|Sum):\s*([0-9.,]+)/i);
    }
    
    // 🎯 Method 3: Tìm số tiền lớn nhất (theo định dạng XXX.000 VND)
    if (!amountMatch) {
      amountMatch = processedText.match(/([0-9]{1,3}(?:[.,][0-9]{3})*)\s*(?:VND|₫)?(?:\s|$)/);
    }

    let totalAmount = 0;
    
    if (amountMatch) {
      const amountStr = amountMatch[1].trim();
      totalAmount = parseInt(amountStr.replace(/[.,]/g, ''), 10);
      
      if (!isNaN(totalAmount) && totalAmount > 0) {
        console.log("✅ [GEMINI] Extracted amount (Primary method):", totalAmount);
        return totalAmount;
      }
    }

    // 🎯 Method 4: Fallback - Tính tổng từ items nếu có
    const itemsMatch = processedText.match(/(?:📦\s*)?Items:?([\s\S]*?)(?:\n---|$)/i);
    if (itemsMatch) {
      const itemsText = itemsMatch[1];
      // Tìm tất cả số tiền trong items: "- [Item name] [amount] (Danh mục: ...)"
      const itemAmounts = itemsText.match(/([0-9]{1,3}(?:[.,][0-9]{3})*)\s*(?:VND)?/g);
      
      if (itemAmounts && itemAmounts.length > 0) {
        totalAmount = 0;
        itemAmounts.forEach(amountStr => {
          const amount = parseInt(amountStr.replace(/[.,]/g, ''), 10);
          if (!isNaN(amount)) {
            totalAmount += amount;
          }
        });
        
        if (totalAmount > 0) {
          console.log("✅ [GEMINI] Calculated amount from items (Fallback):", totalAmount);
          return totalAmount;
        }
      }
    }

    console.warn("⚠️ [GEMINI] Could not find amount in processed text - returning 0");
    return 0;
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting amount:", error);
    return 0;
  }
}

/**
 * 📂 Extract danh sách các danh mục từ items
 * Input: items = [{item: "Cơm", amount: 50000, category: "Ăn uống"}, {item: "Canh", amount: 30000, category: "Ăn uống"}]
 * Output: ["Ăn uống"] (unique categories)
 */
export function extractCategoriesFromItems(items: Array<{item: string; amount: number; category?: string}>): string[] {
  try {
    if (!items || items.length === 0) return [];

    const categories = items
      .map(item => item.category)
      .filter((category): category is string => category !== undefined && category !== null && category.trim().length > 0)
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    console.log("✅ [GEMINI] Extracted categories:", categories);
    return categories;
  } catch (error) {
    console.error("❌ [GEMINI] Error extracting categories:", error);
    return [];
  }
}
