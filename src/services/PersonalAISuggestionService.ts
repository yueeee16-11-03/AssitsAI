import { GoogleGenerativeAI } from "@google/generative-ai";
import ENV from '../config/env';

interface PersonalSuggestion {
  id: string;
  name: string;
  description: string;
  category?: string;
  icon?: string;
  benefits?: string;
  target?: number;
  unit?: string;
}

class PersonalAISuggestionService {
  private apiKey: string | null;
  private client: GoogleGenerativeAI | null;

  constructor() {
    // Allow developer key for personal AI suggestions — fallback order: USER -> COAL -> HABIT
    this.apiKey =  ENV.GEMINI_API_KEY_COAL  || null;
    this.client = this.apiKey ? new GoogleGenerativeAI(this.apiKey) : null;

    if (!this.apiKey) {
      console.warn("⚠️ Thiếu API key cho PersonalAI (GEMINI_API_KEY_USER/COAL/HABIT) - sử dụng fallback hoặc gọi setApiKey()");
    }
  }

  setApiKey(key: string | null) {
    this.apiKey = key;
    this.client = key ? new GoogleGenerativeAI(key) : null;
  }

  async generatePersonalSuggestions(options: { prompt?: string; category?: string; limit?: number } = {}): Promise<PersonalSuggestion[]> {
    const { prompt, category, limit = 4 } = options;
    try {
      if (!this.client || !this.apiKey) {
        console.warn("PersonalAISuggestionService: No API key configured — returning fallback suggestions");
        return this.getFallbackSuggestions(category, limit);
      }

      const finalPrompt = prompt || this.buildSuggestionPrompt(category, limit);
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });

      let retries = 3;
      let lastError: any = null;
      let responseText = '';
      while (retries > 0) {
        try {
          const result = await model.generateContent(finalPrompt);
          responseText = result.response.text();
          break;
        } catch (err: any) {
          lastError = err;
          retries -= 1;
          if (err?.status === 503 && retries > 0) {
            await new Promise((res) => setTimeout(() => res(null), 800));
            continue;
          }
          throw err;
        }
      }

      if (!responseText) throw lastError || new Error('Không nhận được phản hồi từ AI');

      const parsed = this.parseResponse(responseText, limit);
      if (!parsed || parsed.length === 0) return this.getFallbackSuggestions(category, limit);
      return parsed;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('PersonalAISuggestionService error:', errMsg);
      return this.getFallbackSuggestions(category, limit);
    }
  }

  private buildSuggestionPrompt(category?: string, limit: number = 4): string {
    const cat = category ? ` danh mục: ${category}` : '';
    return `Bạn là trợ lý gợi ý cá nhân. Đề xuất ${limit} thói quen thực tế, dễ thực hiện${cat}. Trả về JSON array (duy nhất JSON): [
  {
    "name": "Tiêu đề thói quen ngắn gọn",
    "description": "Mô tả ngắn cách thực hiện (1-2 câu)",
    "benefits": "Lợi ích chính",
    "category": "${category || ''}",
    "target": 20,
    "unit": "phút",
    "icon": "meditation"
  }
]
Ghi chú: "target" và "unit" là tuỳ chọn nhưng hữu ích để hiển thị trong UI. Trả về đúng JSON, không kèm text nào khác.`;
  }

  private parseResponse(responseText: string, limit: number): PersonalSuggestion[] {
    try {
      let jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];
      const arr = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(arr)) return [];
      return arr.slice(0, limit).map((item: any, idx: number) => {
        const rawTarget = item.target !== undefined ? Number(item.target) : undefined;
        const parsedTarget = Number.isFinite(rawTarget as number) ? (rawTarget as number) : undefined;
        const parsedUnit = item.unit || undefined;
        return {
        id: `personal-${Date.now()}-${idx}`,
        name: item.title || item.name || '',
        description: item.description || '',
        category: item.category || '',
        icon: item.icon || 'star',
        benefits: item.benefits || '',
        target: parsedTarget,
        unit: parsedUnit,
      };
      });
    } catch (error) {
      console.warn('PersonalAISuggestionService: parse error', error);
      return [];
    }
  }

  private getFallbackSuggestions(category?: string, limit: number = 4): PersonalSuggestion[] {
    const common: PersonalSuggestion[] = [
      { id: 'p-1', name: 'Uống đủ nước', description: 'Uống 8 cốc nước mỗi ngày', benefits: 'Tăng năng lượng', icon: 'water', category: 'health', target: 8, unit: 'cốc' },
      { id: 'p-2', name: 'Đọc sách', description: 'Đọc ít nhất 20 phút mỗi ngày', benefits: 'Mở rộng kiến thức', icon: 'book-open-variant', category: 'learning', target: 20, unit: 'phút' },
      { id: 'p-3', name: 'Thiền', description: 'Thiền 10-15 phút mỗi ngày', benefits: 'Giảm stress', icon: 'meditation', category: 'wellness', target: 15, unit: 'phút' },
      { id: 'p-4', name: 'Lập kế hoạch', description: 'Lập kế hoạch 10 phút mỗi sáng', benefits: 'Tăng hiệu suất', icon: 'bullseye', category: 'productivity', target: 10, unit: 'phút' },
    ];
    if (!category) return common.slice(0, limit);
    return common.filter(s => !category || s.category === category).slice(0, limit) || common.slice(0, limit);
  }
}

export default new PersonalAISuggestionService();
