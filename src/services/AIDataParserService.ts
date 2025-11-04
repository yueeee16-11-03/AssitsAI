/**
 * AIDataParserService: Parse dữ liệu từ Gemini AI response
 * Chuyển đổi text đã xử lý từ Gemini thành structured data
 */

interface ParsedItem {
  name: string;
  amount?: number;
  quantity?: number;
  unit?: string;
}

interface AIParseResult {
  merchant?: string;
  totalAmount?: number;
  items?: ParsedItem[];
  date?: string;
  paymentMethod?: string;
  description?: string;
  success: boolean;
}

class AIDataParserService {
  /**
   * Parse text từ Gemini AI thành structured data
   * Ví dụ:
   * Input: "Nhà hàng XYZ - Cơm gà: 50000 VND, Nước: 20000 VND. Tổng: 70000 VND"
   * Output: {
   *   merchant: "Nhà hàng XYZ",
   *   items: [{ name: "Cơm gà", amount: 50000 }, { name: "Nước", amount: 20000 }],
   *   totalAmount: 70000,
   *   success: true
   * }
   */
  static parseAIResult(aiText: string): AIParseResult {
    console.log('🔍 [PARSER] Parsing AI text:', aiText);

    try {
      const result: AIParseResult = {
        success: false,
        items: [],
      };

      // Nếu text rỗng, trả về result fail
      if (!aiText || !aiText.trim()) {
        console.warn('⚠️ [PARSER] AI text is empty');
        return result;
      }

      // ===== Parse Merchant Name =====
      // Tìm tên nhà hàng/cửa hàng (thường ở đầu)
      const merchantMatch = aiText.match(/^([^-\n]+?)(?:\s*[-:]|$)/);
      if (merchantMatch) {
        result.merchant = merchantMatch[1].trim();
      }

      // ===== Parse Total Amount =====
      // Tìm "Tổng: XXX VND" hoặc "Total: XXX" hoặc chỉ số cuối cùng
      const totalMatch = aiText.match(
        /(?:tổng|total|amount|tổng cộng|sum)[:\s]*([0-9,.]+)\s*(?:vnd|đ|đồng)?/i
      );
      if (totalMatch) {
        const amount = this.parseAmount(totalMatch[1]);
        if (amount > 0) {
          result.totalAmount = amount;
        }
      }

      // ===== Parse Items =====
      // Tìm các item có format: "Tên item: Giá" hoặc "Tên item - Giá"
      const itemMatches = aiText.matchAll(
        /([^:\-\n]+?)(?::|x|-)\s*([0-9,.]+)\s*(?:vnd|đ|đồng)?/gi
      );

      const items: ParsedItem[] = [];
      for (const match of itemMatches) {
        const itemName = match[1].trim();
        const itemAmount = this.parseAmount(match[2]);

        // Bỏ qua merchant name nếu nó được lặp lại
        if (itemName.toLowerCase() !== result.merchant?.toLowerCase()) {
          items.push({
            name: itemName,
            amount: itemAmount > 0 ? itemAmount : undefined,
          });
        }
      }

      if (items.length > 0) {
        result.items = items;
      }

      // ===== Parse Date if present =====
      const dateMatch = aiText.match(
        /(?:date|ngày|hôm|lúc)[:\s]*([0-9/.|-]+\s*[0-9:]*)/i
      );
      if (dateMatch) {
        result.date = dateMatch[1].trim();
      }

      // ===== Parse Payment Method =====
      const paymentMatch = aiText.match(
        /(?:payment|thanh toán|trả tiền)[:\s]*([^,\n]+)/i
      );
      if (paymentMatch) {
        result.paymentMethod = paymentMatch[1].trim();
      }

      // ===== Determine success =====
      // Thành công nếu có ít nhất merchant hoặc totalAmount hoặc items
      result.success = !!(
        result.merchant ||
        result.totalAmount ||
        result.items?.length
      );

      console.log('✅ [PARSER] Parsed result:', result);
      return result;
    } catch (error) {
      console.error('❌ [PARSER] Error parsing AI text:', error);
      return {
        success: false,
        items: [],
      };
    }
  }

  /**
   * Parse amount từ string chứa số và dấu phân cách
   * Ví dụ: "50,000" → 50000 | "50.000" → 50000 | "50000" → 50000
   */
  private static parseAmount(amountStr: string): number {
    try {
      // Loại bỏ khoảng trắng
      let cleaned = amountStr.trim();

      // Nếu có cả dấu phẩy và dấu chấm, xác định xem cái nào là decimal separator
      if (cleaned.includes(',') && cleaned.includes('.')) {
        // Nếu dấu phẩy ở trước, nó là thousands separator (1,000.50)
        if (cleaned.lastIndexOf(',') < cleaned.lastIndexOf('.')) {
          cleaned = cleaned.replace(/,/g, '');
        } else {
          // Nếu dấu chấm ở trước, nó là thousands separator (1.000,50)
          cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
        }
      } else if (cleaned.includes(',')) {
        // Chỉ có dấu phẩy - có thể là decimal hoặc thousands separator
        // Nếu > 2 số sau dấu phẩy hoặc có nhiều dấu phẩy → là thousands
        const commaCount = (cleaned.match(/,/g) || []).length;
        const afterComma = cleaned.split(',').pop()?.length || 0;

        if (commaCount > 1 || afterComma > 2) {
          // Là thousands separator
          cleaned = cleaned.replace(/,/g, '');
        } else {
          // Là decimal separator
          cleaned = cleaned.replace(/,/g, '.');
        }
      }

      const amount = parseFloat(cleaned);
      return isNaN(amount) ? 0 : Math.round(amount);
    } catch {
      console.warn('⚠️ [PARSER] Could not parse amount:', amountStr);
      return 0;
    }
  }

  /**
   * Format amount theo định dạng Việt Nam
   * Ví dụ: 50000 → "50.000 VND"
   */
  static formatAmount(amount: number): string {
    return amount.toLocaleString('vi-VN') + ' VND';
  }

  /**
   * Tạo description từ parsed data
   */
  static createDescription(parsed: AIParseResult): string {
    if (!parsed.success) {
      return 'OCR Data';
    }

    const parts: string[] = [];

    if (parsed.merchant) {
      parts.push(`🏪 ${parsed.merchant}`);
    }

    if (parsed.items && parsed.items.length > 0) {
      const itemList = parsed.items
        .map(
          (item) =>
            `  • ${item.name}${item.amount ? `: ${this.formatAmount(item.amount)}` : ''}`
        )
        .join('\n');
      parts.push(itemList);
    }

    if (parsed.totalAmount) {
      parts.push(`\n💰 Tổng: ${this.formatAmount(parsed.totalAmount)}`);
    }

    if (parsed.date) {
      parts.push(`📅 ${parsed.date}`);
    }

    if (parsed.paymentMethod) {
      parts.push(`💳 ${parsed.paymentMethod}`);
    }

    return parts.join('\n');
  }
}

export default AIDataParserService;
