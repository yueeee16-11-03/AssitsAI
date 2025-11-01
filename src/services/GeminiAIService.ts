/**
 * GeminiAIService.ts
 * 
 * Mục đích: Xử lý AI từ OCR text để trích xuất thông tin giao dịch
 * 
 * Flow: OCR Text → Gemini API → Structured Transaction Data
 */

export interface BillData {
  items?: Array<{
    name: string;
    amount: number;
    category?: string;
    quantity?: number;
    unitPrice?: number;
  }>;
  storeName?: string;
  storeAddress?: string;
  totalAmount?: number;
  tax?: number;
  currency?: string;
  date?: string;
  time?: string;
  note?: string;
  confidence?: number;
  rawText?: string;
}

interface ParsedItem {
  name: string;
  amount: number;
  category?: string;
  quantity?: number;
  unitPrice?: number;
}

export const GeminiAIService = {
  /**
   * Phân tích OCR text để trích xuất thông tin giao dịch
   * @param ocrText - Text từ OCR
   * @returns BillData
   */
  parseReceiptText: (ocrText: string): BillData => {
    console.log('🤖 [GEMINI] Starting to parse OCR text...');
    
    if (!ocrText || ocrText.trim().length === 0) {
      console.warn('⚠️ [GEMINI] Empty OCR text');
      return {
        items: [],
        totalAmount: 0,
        currency: 'VND',
        confidence: 0,
        rawText: ocrText,
      };
    }

    try {
      const result = GeminiAIService._extractBillData(ocrText);
      console.log('✅ [GEMINI] Parse completed successfully');
      console.log('📊 [GEMINI] Extracted items:', result.items?.length || 0);
      console.log('💰 [GEMINI] Total amount:', result.totalAmount);
      return result;
    } catch (error) {
      console.error('❌ [GEMINI] Parse error:', error);
      return {
        items: [],
        totalAmount: 0,
        currency: 'VND',
        confidence: 0,
        rawText: ocrText,
      };
    }
  },

  /**
   * Internal method để trích xuất dữ liệu hóa đơn từ text
   */
  _extractBillData: (text: string): BillData => {
    const lines = text.split('\n').map(line => line.trim()).filter(l => l);
    
    const result: BillData = {
      items: [],
      storeName: undefined,
      storeAddress: undefined,
      totalAmount: 0,
      tax: 0,
      currency: 'VND',
      date: new Date().toISOString().split('T')[0],
      confidence: 0,
      rawText: text,
    };

    let totalAmount = 0;
    const items: ParsedItem[] = [];

    // Duyệt qua từng dòng
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

      // Tìm tên cửa hàng (thường dòng đầu, viết hoa, dài)
      if (i === 0 && line.length > 10) {
        result.storeName = GeminiAIService._cleanStoreName(line);
      }
      
      // Tìm địa chỉ (chứa từ khóa địa chỉ)
      if (GeminiAIService._isAddressLine(line) && !result.storeAddress) {
        result.storeAddress = line;
      }

      // Tìm ngày (định dạng: DD/MM/YYYY hoặc DD-MM-YYYY)
      const dateMatch = GeminiAIService._extractDate(line);
      if (dateMatch && !result.date) {
        result.date = dateMatch;
      }

      // Tìm giờ (định dạng: HH:MM)
      const timeMatch = line.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
      if (timeMatch && !result.time) {
        result.time = timeMatch[0];
      }

      // Tìm các mục (dòng chứa số tiền)
      const itemMatch = GeminiAIService._parseItemLine(line, nextLine);
      if (itemMatch) {
        items.push(itemMatch);
        totalAmount += itemMatch.amount;
      }

      // Tìm "TOTAL" hoặc "TỔNG"
      if (/^(TOTAL|TỔNG|THANH\s*TOÁN)/i.test(line)) {
        const amountMatch = line.match(/(\d+(?:[.,]\d{3})*|\d+)/);
        if (amountMatch) {
          const parsedAmount = parseInt(amountMatch[1].replace(/[.,]/g, ''), 10);
          if (parsedAmount > 0) {
            totalAmount = parsedAmount;
          }
        }
      }

      // Tìm VAT/Thuế
      if (/VAT|TAX|THUẾ/i.test(line)) {
        const taxMatch = line.match(/(\d+(?:[.,]\d{3})*|\d+)/);
        if (taxMatch) {
          result.tax = parseInt(taxMatch[1].replace(/[.,]/g, ''), 10);
        }
      }
    }

    // Gán kết quả
    result.items = items;
    result.totalAmount = totalAmount || 0;

    // Tính confidence dựa trên số mục tìm thấy
    const itemsFound = items.length;
    const hasStore = !!result.storeName;
    const hasDate = !!result.date;
    const hasTotal = result.totalAmount > 0;

    let confidence = 0;
    if (itemsFound > 0) confidence += 0.3;
    if (hasStore) confidence += 0.2;
    if (hasDate) confidence += 0.2;
    if (hasTotal) confidence += 0.3;

    result.confidence = Math.min(confidence, 1);

    return result;
  },

  /**
   * Parse một dòng có chứa thông tin mục
   * Format: "Tên mục      Số lượng x Giá    Tổng"
   *         "Cơm tấm      1 x 45.000    45.000"
   */
  _parseItemLine: (line: string, _nextLine: string): ParsedItem | null => {
    // Loại bỏ dòng quá ngắn hoặc không chứa số
    if (line.length < 5 || !/\d/.test(line)) {
      return null;
    }

    // Loại bỏ các header hoặc footer
    if (/ITEM|PRODUCT|DESCRIPTION|TOTAL|TỔNG|QTY|PRICE/i.test(line)) {
      return null;
    }

    // Tìm số tiền (định dạng: XXX.XXX hoặc XXX,XXX hoặc số thường)
    const amountMatches = line.match(/(\d{1,3}(?:[.,]\d{3})*|\d+)/g);
    if (!amountMatches || amountMatches.length === 0) {
      return null;
    }

    // Lấy số tiền cuối cùng (thường là tổng tiền)
    const lastAmount = amountMatches[amountMatches.length - 1];
    const amount = parseInt(lastAmount.replace(/[.,]/g, ''), 10);

    // Validate: số tiền hợp lý (> 0 và < 100 triệu)
    if (amount <= 0 || amount > 100000000) {
      return null;
    }

    // Trích xuất tên mục (phần trước số tiền đầu tiên)
    const firstAmountIndex = line.indexOf(amountMatches[0]);
    let name = line.substring(0, firstAmountIndex).trim();

    // Làm sạch tên mục
    name = name.replace(/^\d+\s*\.?\s*/, '') // Loại bỏ số thứ tự
              .replace(/\s{2,}/g, ' ')        // Xoá khoảng trắng thừa
              .trim();

    if (name.length === 0) {
      name = 'Item';
    }

    // Phân loại mục
    const category = GeminiAIService._categorizeItem(name);

    // Tìm số lượng nếu có
    const quantityMatch = line.match(/(\d+)\s*x\s*(\d+(?:[.,]\d{3})*|\d+)/i);
    const quantity = quantityMatch ? parseInt(quantityMatch[1], 10) : undefined;
    const unitPrice = quantityMatch ? parseInt(quantityMatch[2].replace(/[.,]/g, ''), 10) : undefined;

    return {
      name,
      amount,
      category,
      quantity,
      unitPrice,
    };
  },

  /**
   * Phân loại mục dựa trên tên
   */
  _categorizeItem: (itemName: string): string => {
    const name = itemName.toLowerCase();

    if (/cơm|cà\s*phê|trà|nước|ăn|uống|thức\s*ăn|đồ\s*uống|bánh|mì|phở/i.test(name)) {
      return 'Ăn uống';
    }
    if (/xăng|dầu|xe|giao\s*thông|taxi|xe\s*bus|đi\s*lại/i.test(name)) {
      return 'Giao thông';
    }
    if (/hóa|đơn|thuốc|y\s*tế|bệnh|viện|sức\s*khỏe/i.test(name)) {
      return 'Y tế';
    }
    if (/quần|áo|giày|dép|trang\s*phục|thời\s*trang/i.test(name)) {
      return 'Mua sắm';
    }
    if (/điện|nước|gas|tiền|hóa\s*đơn|thanh\s*toán/i.test(name)) {
      return 'Tiện ích';
    }
    if (/vé|chuyến|tour|du\s*lịch|khách\s*sạn|phòng/i.test(name)) {
      return 'Du lịch';
    }
    if (/giải\s*trí|phim|game|sách|vui\s*chơi/i.test(name)) {
      return 'Giải trí';
    }

    return 'Khác';
  },

  /**
   * Kiểm tra xem dòng có phải địa chỉ hay không
   */
  _isAddressLine: (line: string): boolean => {
    return /địa\s*chỉ|address|phố|đường|quận|huyện|tỉnh|tp|thành\s*phố/i.test(line);
  },

  /**
   * Trích xuất ngày từ dòng text
   */
  _extractDate: (line: string): string | null => {
    // Tìm định dạng DD/MM/YYYY hoặc DD-MM-YYYY
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,           // DD/MM/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/,             // DD-MM-YYYY
      /(\d{4})\/(\d{1,2})\/(\d{1,2})/,           // YYYY/MM/DD
      /(\d{4})-(\d{1,2})-(\d{1,2})/,             // YYYY-MM-DD
    ];

    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        // Normalize sang YYYY-MM-DD
        let year, month, day;
        
        if (pattern === datePatterns[0] || pattern === datePatterns[1]) {
          day = match[1];
          month = match[2];
          year = match[3];
        } else {
          year = match[1];
          month = match[2];
          day = match[3];
        }

        day = day.padStart(2, '0');
        month = month.padStart(2, '0');

        return `${year}-${month}-${day}`;
      }
    }

    return null;
  },

  /**
   * Làm sạch tên cửa hàng
   */
  _cleanStoreName: (name: string): string => {
    return name
      .replace(/^(STORE|SHOP|RECEIPT|HÓA\s*ĐƠN)/i, '')
      .trim()
      .substring(0, 50);
  },

  /**
   * Format số tiền sang Vietnamese Dong
   */
  formatCurrency: (amount: number, currency: string = 'VND'): string => {
    return `${amount.toLocaleString('vi-VN')} ${currency}`;
  },
};
