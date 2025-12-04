import { GoogleGenerativeAI } from '@google/generative-ai';
import ENV from '../config/env';

/**
 * AIBudgetSuggestionService: Gọi Gemini để gợi ý tạo ngân sách mới
 * (Lấy API Key từ env.ts - được .gitignore bảo vệ)
 */

const API_KEY = ENV.GEMINI_API_KEY_BUDGET;

if (!API_KEY) {
  throw new Error("⚠️ Thiếu GEMINI_API_KEY_BUDGET - vui lòng cấu hình trong src/config/env.ts");
}

const genAI = new GoogleGenerativeAI(API_KEY);

interface BudgetCategory {
  categoryId: string;
  category: string;
  icon: string;
  spent?: number;
  budget?: number;
}

interface SuggestionResult {
  categoryId: string;
  category: string;
  icon: string;
  suggestedBudget: number;
  reason: string;
}

interface BudgetSuggestionsResponse {
  suggestions: SuggestionResult[];
  month: string;
  year: number;
}

class AIBudgetSuggestionServiceClass {
  /**
   * 🤖 Gợi ý tạo ngân sách dựa trên chi tiêu hiện tại (3-4 gợi ý theo tháng)
   * @param {Array} categories - Danh sách danh mục với chi tiêu
   * @param {number} month - Tháng hiện tại (1-12)
   * @param {number} year - Năm hiện tại
   * @returns {Promise<BudgetSuggestionsResponse>} Gợi ý 3-4 ngân sách
   */
  async suggestBudgets(
    categories: BudgetCategory[],
    month: number = new Date().getMonth() + 1,
    year: number = new Date().getFullYear()
  ): Promise<BudgetSuggestionsResponse> {
    console.log(`🎯 [BUDGET-AI] Suggesting budgets for ${categories.length} categories (Month: ${month}/${year})`);

    if (!categories || categories.length === 0) {
      throw new Error('❌ Danh sách danh mục trống');
    }

    try {
      const prompt = this._buildPrompt(categories, month, year);

      console.log('🚀 [BUDGET-AI] Gọi Gemini API');

      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log('✅ [BUDGET-AI] Gemini response:', responseText.substring(0, 150) + '...');

      const parsed = this._parseMultipleSuggestions(responseText);

      return {
        suggestions: parsed,
        month: this._getMonthName(month),
        year,
      };
    } catch (error) {
      console.error('❌ [BUDGET-AI] Lỗi:', error);

      if ((error as any).message?.includes('API_KEY')) {
        throw new Error('⚠️ API Key không hợp lệ');
      }
      if ((error as any).message?.includes('billing')) {
        throw new Error('💰 Cần enable billing');
      }
      if ((error as any).message?.includes('quota')) {
        throw new Error('⏱️ Vượt quá rate limit');
      }

      throw new Error('🚨 Lỗi: ' + (error as Error).message);
    }
  }

  /**
   * 📝 Tạo prompt gợi ý ngân sách
   * @private
   */
  private _buildPrompt(categories: BudgetCategory[], month: number, year: number): string {
    const categoryList = categories
      .map((c) => `- ${c.category}: đã chi ${c.spent || 0} VNĐ (hiện tại ngân sách: ${c.budget ? c.budget + ' VNĐ' : 'chưa có'})`)
      .join('\n');

    const monthName = this._getMonthName(month);

    return `Bạn là trợ lý tài chính thông minh. Dựa trên chi tiêu ${monthName}/${year}, hãy gợi ý tạo ngân sách cho 3-4 danh mục:

Chi tiêu hiện tại:
${categoryList}

TASK:
1. Chọn 3-4 danh mục cần tạo/cập nhật ngân sách nhất
2. Ưu tiên danh mục: chưa có ngân sách nhưng đã chi tiêu cao, hoặc đã chi tiêu vượt ngân sách
3. Gợi ý số tiền hợp lý (nên cao hơn 10-20% chi tiêu hiện tại để có buffer)
4. Giải thích ngắn gọn lý do

Trả về JSON array:
[
  {
    "category": "<tên danh mục>",
    "suggestedBudget": <số tiền (chỉ số)>,
    "reason": "<giải thích ngắn gọn>"
  }
]

Chỉ trả về JSON array, không giải thích thêm.

Ví dụ:
[
  {
    "category": "Ăn uống",
    "suggestedBudget": 5750000,
    "reason": "Đã chi 5M, nên đặt ngân sách 5.75M"
  },
  {
    "category": "Mua sắm",
    "suggestedBudget": 2500000,
    "reason": "Chưa có ngân sách nhưng đã chi 2.2M"
  }
]`;
  }

  /**
   * 🔍 Parse response từ Gemini (multiple suggestions)
   * @private
   */
  private _parseMultipleSuggestions(responseText: string): SuggestionResult[] {
    try {
      // Tìm JSON array trong response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Không tìm thấy JSON array trong response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Response không phải array');
      }

      return parsed.map((item: any) => ({
        categoryId: this._mapCategoryToCategoryId(item.category),
        category: item.category,
        icon: this._getCategoryIcon(item.category),
        suggestedBudget: item.suggestedBudget || 1000000,
        reason: item.reason || '',
      }));
    } catch (error) {
      console.error('❌ [BUDGET-AI] Error parsing multiple suggestions:', error);
      throw new Error('Không thể phân tích gợi ý từ AI');
    }
  }

  /**
   * 🏷️ Map danh mục sang categoryId
   * @private
   */
  private _mapCategoryToCategoryId(category: string): string {
    const map: { [key: string]: string } = {
      'ăn uống': '1',
      'mua sắm': '2',
      'di chuyển': '3',
      'nhà ở': '4',
      'y tế': '5',
      'giải trí': '6',
      'lương': '7',
      'thưởng': '8',
      'đầu tư': '9',
    };

    const normalized = category.toLowerCase().trim();
    return map[normalized] || '1';
  }

  /**
   * 🎨 Lấy icon cho danh mục
   * @private
   */
  private _getCategoryIcon(category: string): string {
    const iconMap: { [key: string]: string } = {
      'ăn uống': 'silverware-fork-knife',
      'mua sắm': 'shopping-outline',
      'di chuyển': 'car-outline',
      'nhà ở': 'home-outline',
      'y tế': 'hospital-box-outline',
      'giải trí': 'movie-outline',
      'lương': 'briefcase-outline',
      'thưởng': 'gift-outline',
      'đầu tư': 'chart-line',
    };

    const normalized = category.toLowerCase().trim();
    return iconMap[normalized] || 'wallet-outline';
  }

  /**
   * 📅 Lấy tên tháng
   * @private
   */
  private _getMonthName(month: number): string {
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
    ];
    return months[month - 1] || 'Tháng ' + month;
  }

  /**
   * 🔍 Parse response từ Gemini (deprecated - single suggestion)
   * @private
   */
  private _parseResponse(responseText: string): SuggestionResult {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Không tìm thấy JSON trong response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        categoryId: this._mapCategoryToCategoryId(parsed.category),
        category: parsed.category,
        icon: this._getCategoryIcon(parsed.category),
        suggestedBudget: parsed.suggestedBudget || 1000000,
        reason: parsed.reason || '',
      };
    } catch (error) {
      console.error('❌ [BUDGET-AI] Error parsing response:', error);
      throw new Error('Không thể phân tích gợi ý từ AI');
    }
  }
}

const AIBudgetSuggestionService = new AIBudgetSuggestionServiceClass();
export default AIBudgetSuggestionService;
