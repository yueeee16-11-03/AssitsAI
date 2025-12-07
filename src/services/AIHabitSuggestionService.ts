import { GoogleGenerativeAI } from "@google/generative-ai";
import ENV from '../config/env';

interface HabitSuggestion {
  id: string;
  name: string;
  icon: string;
  target: number;
  unit: string;
  category: string;
  description: string;
  benefits: string;
}

interface CategoryConfig {
  name: string;
  description: string;
  suggestionsCount: number;
}

const categoryConfigs: { [key: string]: CategoryConfig } = {
  health: {
    name: "Sức khỏe",
    description: "Các thói quen liên quan đến sức khỏe thể chất, thể dục, dinh dưỡng",
    suggestionsCount: 4,
  },
  learning: {
    name: "Học tập",
    description: "Các thói quen liên quan đến học hỏi, đọc sách, nâng cao kỹ năng",
    suggestionsCount: 4,
  },
  wellness: {
    name: "Tinh thần",
    description: "Các thói quen liên quan đến sức khỏe tinh thần, thiền, thư giãn, tự chăm sóc",
    suggestionsCount: 4,
  },
  productivity: {
    name: "Năng suất",
    description: "Các thói quen liên quan đến quản lý thời gian, hiệu suất làm việc, lập kế hoạch",
    suggestionsCount: 4,
  },
};

const iconMappings: { [key: string]: string } = {
  "uống nước": "water",
  "nước": "water",
  "tập": "arm-flex",
  "thể dục": "arm-flex",
  "chạy": "run",
  "bộ": "run",
  "đi bộ": "walk",
  "đi": "walk",
  "đọc": "book-open-variant",
  "sách": "book-open-variant",
  "học": "book-open-variant",
  "thiền": "meditation",
  "yoga": "yoga",
  "viết": "pencil",
  "nhật ký": "pencil",
  "kế hoạch": "bullseye",
  "làm việc": "laptop",
  "tập trung": "laptop",
  "dumbbell": "dumbbell",
  "tạ": "dumbbell",
  "bơi": "swimming",
  "xe": "biking",
  "camera": "camera",
  "ảnh": "camera",
  "mã": "code",
  "lập trình": "code",
  "nhạc": "music",
  "guitar": "guitar",
  "vẽ": "palette",
  "hội họa": "palette",
  "đàn": "guitar",
  "nấu": "chef-hat",
  "ăn": "utensils",
  "ngủ": "bed",
  "cà phê": "coffee",
  "tia": "weather-sunny",
  "sáng": "weather-sunny",
  "tối": "weather-moon",
  "đêm": "weather-moon",
  "ý tưởng": "lightbulb-on-outline",
  "sáng tạo": "palette",
  "công việc": "briefcase",
  "văn phòng": "briefcase",
  "điện thoại": "phone",
  "máy tính": "laptop",
  "tàu": "train",
  "máy bay": "airplane",
  "bản đồ": "map",
  "du lịch": "map",
  "núi": "mountain",
  "tự nhiên": "tree",
  "cây": "tree",
  "cô lập": "circle",
};

class AIHabitSuggestionService {
  private apiKey: string;
  private client: GoogleGenerativeAI;

  constructor() {
    // Lấy API key từ env.ts (được .gitignore bảo vệ)
    this.apiKey = ENV.GEMINI_API_KEY_HABIT;
    this.client = new GoogleGenerativeAI(this.apiKey);
    
    if (!this.apiKey) {
      console.warn("⚠️ Thiếu GEMINI_API_KEY - vui lòng cấu hình trong src/config/env.ts");
    }
  }

  /**
   * Set API key từ app (call this trong app initialization)
   */
  setApiKey(key: string) {
    this.apiKey = key;
    this.client = new GoogleGenerativeAI(key);
  }

  /**
   * Tìm icon phù hợp dựa trên tên thói quen
   */
  private findIconForHabit(habitName: string): string {
    const lowerName = habitName.toLowerCase();
    
    // Tìm từ khóa match
    for (const [keyword, icon] of Object.entries(iconMappings)) {
      if (lowerName.includes(keyword)) {
        return icon;
      }
    }
    
    // Mặc định trả về icon 'star'
    return "star";
  }

  /**
   * Tính target và unit phù hợp dựa trên loại thói quen
   */
  private getDefaultTargetAndUnit(habitName: string): { target: number; unit: string } {
    const lowerName = habitName.toLowerCase();

    // Các thói quen tính bằng phút
    if (
      lowerName.includes("thiền") ||
      lowerName.includes("yoga") ||
      lowerName.includes("viết") ||
      lowerName.includes("đọc") ||
      lowerName.includes("học")
    ) {
      return { target: 20, unit: "phút" };
    }

    // Các thói quen tính bằng cốc/lít nước
    if (lowerName.includes("nước")) {
      return { target: 8, unit: "cốc" };
    }

    // Các thói quen tính bằng lần
    if (
      lowerName.includes("tập") ||
      lowerName.includes("chạy") ||
      lowerName.includes("bộ") ||
      lowerName.includes("bơi")
    ) {
      return { target: 30, unit: "phút" };
    }

    // Mặc định
    return { target: 1, unit: "lần" };
  }

  /**
   * Parse JSON response từ Gemini
   */
  private parseAIResponse(responseText: string): HabitSuggestion[] {
    const shortenToSingleSentence = (text: string, maxLen = 120) => {
      if (!text) return text;
      // Prefer the first sentence
      const sentenceEnd = text.indexOf('.') >= 0 ? text.indexOf('.') + 1 : -1;
      let short = sentenceEnd > 0 ? text.slice(0, sentenceEnd) : text;
      // If still too long, truncate to maxLen and remove trailing partial words
      if (short.length > maxLen) {
        short = short.slice(0, maxLen);
        const lastSpace = short.lastIndexOf(' ');
        if (lastSpace > 0) short = short.slice(0, lastSpace);
        short = `${short}…`;
      }
      return short.trim();
    };
    try {
      // Tìm JSON trong response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn("Không tìm thấy JSON trong response:", responseText);
        return [];
      }

      const suggestions = JSON.parse(jsonMatch[0]);

      // Validate và enrich data
      return suggestions.map((item: any, index: number) => {
        const habitName = (item.name || "").trim();
        const defaultIcon = this.findIconForHabit(habitName);
        const { target: defaultTarget, unit: defaultUnit } = this.getDefaultTargetAndUnit(habitName);

        // Use values returned by AI when possible, otherwise fallback to defaults
        const parsedIcon = item.icon || defaultIcon;
        const parsedTarget = item.target || defaultTarget;
        const parsedUnit = item.unit || defaultUnit;

        const shortName = habitName.length > 30 ? `${habitName.slice(0, 30).trim()}…` : habitName;
        const rawDescription = item.description || `Thực hiện ${habitName} thường xuyên`;
        const rawBenefits = item.benefits || "Cải thiện chất lượng cuộc sống";

        const shortDescription = shortenToSingleSentence(rawDescription, 120);
        const shortBenefits = shortenToSingleSentence(rawBenefits, 80);

        return {
          id: `ai-${Date.now()}-${index}`,
          name: shortName,
          icon: parsedIcon,
          target: parsedTarget,
          unit: parsedUnit,
          category: item.category || "",
          description: shortDescription,
          benefits: shortBenefits,
        };
      });
    } catch (error) {
      console.error("Lỗi parse AI response:", error);
      return [];
    }
  }

  /**
   * Gọi Gemini API để generate suggestions
   */
  async generateSuggestions(categoryId: string): Promise<HabitSuggestion[]> {
    try {
      // Nếu không có API key, trả về gợi ý mặc định
      if (!this.apiKey) {
        console.warn("❌ Không có Gemini API key, sử dụng gợi ý mặc định");
        return this.getFallbackSuggestions(categoryId);
      }

      console.log("✅ API Key found, calling Gemini...");

      const categoryConfig = categoryConfigs[categoryId];
      if (!categoryConfig) {
        console.warn("❌ Category không tìm thấy:", categoryId);
        return [];
      }

      const prompt = `
Bạn là một trợ lý AI chuyên tư vấn các thói quen tốt cho con người.
Hãy đề xuất ${categoryConfig.suggestionsCount} thói quen phù hợp cho danh mục: ${categoryConfig.name}.

Mô tả danh mục: ${categoryConfig.description}

Yêu cầu:
1. Đề xuất những thói quen thực tế, dễ thực hiện.
2. Phù hợp với người bận rộn.
3. Mỗi thói quen nêu rõ lợi ích và cách thực hiện ngắn gọn.
  YÊU CẦU NGẮN GỌN: tên ngắn (<= 30 ký tự), mô tả 1 câu (<= 120 ký tự), benefits ngắn (<= 80 ký tự).

Trả lời dưới dạng JSON array với cấu trúc sau (không thêm text khác):
[
  {
    "name": "Tên thói quen ngắn gọn",
    "description": "Mô tả ngắn cách thực hiện (1-2 câu)",
    "benefits": "Lợi ích chính",
    "category": "${categoryId}",
    "target": 20,
    "unit": "phút",
    "icon": "meditation"
  }
]

Ghi chú:
- "target" và "unit" giúp app hiển thị mục tiêu (vd: 20 phút, 8 cốc, 1 lần).
- "icon" là tên icon MaterialCommunityIcons ngắn (vd: meditation, water, book-open-variant).
Chỉ trả về JSON, KHÔNG kèm text ngoài JSON. Các trường mô tả và benefits nên ngắn gọn.
`;

      console.log("📤 Sending prompt to Gemini for category:", categoryId);
      const model = this.client.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // Retry logic cho trường hợp API overload
      let retries = 3;
      let lastError: any;
      let responseText = "";
      
      while (retries > 0) {
        try {
          const result = await model.generateContent(prompt);
          responseText = result.response.text();
          console.log("📥 AI Response received:", responseText);
          break; // Success, exit retry loop
        } catch (error: any) {
          lastError = error;
          retries--;
          
          // Nếu là lỗi 503 (overload), chờ và retry
          if (error?.status === 503 && retries > 0) {
            console.warn(`⚠️ API overloaded (503), retrying... (${retries} retries left)`);
            await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000)); // Chờ 1 giây
            continue;
          }
          
          // Nếu là lỗi khác hoặc hết retry, throw error
          throw error;
        }
      }
      
      if (!responseText) {
        throw lastError || new Error("Failed to get response from AI");
      }

      const suggestions = this.parseAIResponse(responseText);

      if (suggestions.length === 0) {
        console.warn("⚠️ AI không trả về suggestions, sử dụng fallback");
        return this.getFallbackSuggestions(categoryId);
      }

      console.log("✅ Suggestions parsed successfully:", suggestions.length, "items");
      return suggestions;
    } catch (error) {
      console.error("❌ Lỗi gọi AI Suggestion Service:", error);
      console.log("🔄 Using fallback suggestions...");
      return this.getFallbackSuggestions(categoryId);
    }
  }

  /**
   * Gợi ý mặc định khi AI không khả dụng
   */
  private getFallbackSuggestions(categoryId: string): HabitSuggestion[] {
    const fallbacks: { [key: string]: HabitSuggestion[] } = {
      health: [
        {
          id: "fallback-h1",
          name: "Uống đủ nước",
          icon: "water",
          target: 8,
          unit: "cốc",
          category: "health",
          description: "Uống 8 cốc nước mỗi ngày",
          benefits: "Cải thiện sức khỏe và năng lượng",
        },
        {
          id: "fallback-h2",
          name: "Tập thể dục",
          icon: "arm-flex",
          target: 30,
          unit: "phút",
          category: "health",
          description: "Tập luyện 30 phút mỗi ngày",
          benefits: "Tăng sức bền và mạnh khỏe",
        },
      ],
      learning: [
        {
          id: "fallback-l1",
          name: "Đọc sách",
          icon: "book-open-variant",
          target: 30,
          unit: "phút",
          category: "learning",
          description: "Đọc sách 30 phút mỗi ngày",
          benefits: "Mở rộng kiến thức và kỹ năng",
        },
      ],
      wellness: [
        {
          id: "fallback-w1",
          name: "Thiền",
          icon: "meditation",
          target: 15,
          unit: "phút",
          category: "wellness",
          description: "Thiền 15 phút mỗi ngày",
          benefits: "Giảm stress và cải thiện sức khỏe tinh thần",
        },
      ],
      productivity: [
        {
          id: "fallback-p1",
          name: "Lập kế hoạch ngày",
          icon: "bullseye",
          target: 10,
          unit: "phút",
          category: "productivity",
          description: "Lập kế hoạch 10 phút mỗi sáng",
          benefits: "Tăng hiệu suất và tập trung công việc",
        },
      ],
    };

    return fallbacks[categoryId] || [];
  }
}

export default new AIHabitSuggestionService();
