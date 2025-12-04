import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV } from '../config/env';

/**
 * Interface cho gợi ý mục tiêu tiết kiệm
 */
export interface GoalSuggestion {
  title: string;
  description: string;
  targetAmount: number;
  monthlyContribution: number;
  deadline: string; // format: "MM/YYYY"
  category: 'saving' | 'purchase' | 'investment' | 'education';
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface GoalSuggestionsResponse {
  suggestions: GoalSuggestion[];
  timestamp: string;
}

/**
 * GoalSuggestionService
 * Service xử lý gợi ý mục tiêu tiết kiệm dùng Gemini AI
 * - Trả về 3-4 gợi ý mục tiêu tiết kiệm
 * - Prompt ngắn gọn, tối ưu chi phí token
 * - Mỗi gợi ý có lý do chi tiết
 */
class GoalSuggestionService {
  private client: GoogleGenerativeAI;
  private apiKey: string;

  constructor() {
    this.apiKey = ENV.GEMINI_API_KEY_GOAL;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY_BUDGET không được cấu hình trong env.ts');
    }
    this.client = new GoogleGenerativeAI(this.apiKey);
  }

  /**
   * Tạo gợi ý mục tiêu tiết kiệm từ Gemini AI
   * @param userContext - Thông tin chi tiêu người dùng (tùy chọn)
   * @returns Promise<GoalSuggestionsResponse>
   */
  async suggestGoals(userContext?: string): Promise<GoalSuggestionsResponse> {
    try {
      console.log('🎯 [GoalSuggestion] Bắt đầu tạo gợi ý mục tiêu...');
      
      const prompt = this._buildPrompt(userContext);
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log('✅ [GoalSuggestion] Nhận được phản hồi từ Gemini');

      const suggestions = this._parseGoalSuggestions(responseText);

      return {
        suggestions,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('❌ [GoalSuggestion] Error:', error?.message);
      throw new Error(error?.message || 'Không thể tạo gợi ý từ AI');
    }
  }

  /**
   * Xây dựng prompt cho Gemini AI - PROMPT NGẮN GỌN
   */
  private _buildPrompt(userContext?: string): string {
    const basePrompt = `Bạn là trợ lý tài chính. Tạo 3-4 gợi ý mục tiêu tiết kiệm hợp lý cho người Việt.

${userContext ? `Thông tin chi tiêu: ${userContext}` : 'Tạo gợi ý tiết kiệm phổ biến.'}

Trả CHỈ JSON (không text khác):
[
  {
    "title": "Tên mục tiêu",
    "description": "Mô tả ngắn",
    "targetAmount": số tiền,
    "monthlyContribution": số tiền/tháng,
    "deadline": "MM/YYYY",
    "category": "saving|purchase|investment|education",
    "priority": "high|medium|low",
    "reason": "Lý do"
  }
]`;

    return basePrompt;
  }

  /**
   * Parse response từ Gemini
   */
  private _parseGoalSuggestions(responseText: string): GoalSuggestion[] {
    try {
      let jsonStr = responseText;

      // Loại bỏ markdown code blocks
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.split('```json')[1]?.split('```')[0] || jsonStr;
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.split('```')[1]?.split('```')[0] || jsonStr;
      }

      jsonStr = jsonStr.trim();
      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed)) {
        throw new Error('Response không phải là array');
      }

      const suggestions = parsed
        .slice(0, 4)
        .filter((s: any) => this._isValidSuggestion(s))
        .map((s: any) => ({
          title: String(s.title || ''),
          description: String(s.description || ''),
          targetAmount: Math.round(parseFloat(s.targetAmount) || 0),
          monthlyContribution: Math.round(parseFloat(s.monthlyContribution) || 0),
          deadline: String(s.deadline || ''),
          category: this._validateCategory(s.category),
          priority: this._validatePriority(s.priority),
          reason: String(s.reason || ''),
        }));

      if (suggestions.length === 0) {
        throw new Error('Không có gợi ý hợp lệ');
      }

      console.log(`✅ [GoalSuggestion] Parse thành công ${suggestions.length} gợi ý`);
      return suggestions;
    } catch (error: any) {
      console.error('❌ [GoalSuggestion] Parse error:', error?.message);
      throw new Error('Không thể phân tích gợi ý từ AI');
    }
  }

  /**
   * Kiểm tra gợi ý hợp lệ
   */
  private _isValidSuggestion(s: any): boolean {
    return (
      s.title &&
      s.description &&
      s.targetAmount &&
      s.monthlyContribution &&
      s.deadline &&
      s.category &&
      s.priority &&
      s.reason
    );
  }

  /**
   * Validate category
   */
  private _validateCategory(
    cat: string
  ): 'saving' | 'purchase' | 'investment' | 'education' {
    const valid = ['saving', 'purchase', 'investment', 'education'];
    if (valid.includes(String(cat).toLowerCase())) {
      return String(cat).toLowerCase() as any;
    }
    return 'saving';
  }

  /**
   * Validate priority
   */
  private _validatePriority(pri: string): 'high' | 'medium' | 'low' {
    const valid = ['high', 'medium', 'low'];
    if (valid.includes(String(pri).toLowerCase())) {
      return String(pri).toLowerCase() as any;
    }
    return 'medium';
  }
}

export default new GoalSuggestionService();
