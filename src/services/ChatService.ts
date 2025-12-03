import { GoogleGenerativeAI } from "@google/generative-ai";
import ENV from '../config/env';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

// Lấy API key từ .env.local (qua config file)
const GEMINI_API_KEY = ENV.GEMINI_API_KEY_CHAT;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'REPLACE_WITH_YOUR_API_KEY') {
  console.error('[ChatService] GEMINI_API_KEY_CHAT không được cấu hình - vui lòng cập nhật .env.local');
}

// Tạo Gemini instance
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * ChatService - Chuyên xử lý logic chatbox
 * - Gọi Gemini API trực tiếp
 * - Xử lý lỗi
 * - Format message
 */
class ChatService {
  /**
   * Gửi câu hỏi đến Gemini AI và lấy response
   * @param userMessage - Câu hỏi từ người dùng
   * @returns ChatResponse với message từ AI
   */
  async sendMessageToAI(userMessage: string): Promise<ChatResponse> {
    try {
      if (!userMessage || userMessage.trim().length === 0) {
        return {
          success: false,
          error: 'Vui lòng nhập câu hỏi',
        };
      }

      console.log('[ChatService] Gọi Gemini API...', userMessage.substring(0, 50));

      // Gọi Gemini API trực tiếp
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const enhancedPrompt = this.enhancePromptWithContext(userMessage);
      const result = await model.generateContent(enhancedPrompt);
      const aiResponse = result.response.text();

      // Tạo message object
      const message: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      console.log('[ChatService] AI response received successfully');

      return {
        success: true,
        message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      
      console.error('[ChatService] Error:', errorMessage);

      return {
        success: false,
        error: this.formatErrorMessage(errorMessage),
      };
    }
  }

  /**
   * Tạo message từ user input
   * @param text - Nội dung tin nhắn
   * @returns Message object
   */
  createUserMessage(text: string): Message {
    return {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };
  }

  /**
   * Format error message từ Gemini
   * @param error - Error message
   * @returns Formatted error message
   */
  formatErrorMessage(error: string): string {
    // Replace common error messages (không dùng emoji)
    const errorMap: { [key: string]: string } = {
      'API Key không hợp lệ hoặc hết hạn': 'API Key không hợp lệ. Vui lòng kiểm tra cấu hình.',
      'Cần enable billing': 'Cần enable billing cho Gemini API.',
      'Vượt quá rate limit': 'Vượt quá giới hạn yêu cầu. Vui lòng chờ và thử lại.',
      'Timeout': 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.',
      'Lỗi kết nối mạng': 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
    };

    let formatted = error;
    for (const [key, value] of Object.entries(errorMap)) {
      if (error.includes(key)) {
        formatted = value;
        break;
      }
    }

    return formatted;
  }

  /**
   * Tạo suggestion chips cho chatbox
   * @returns Array của suggestion strings
   */
  getSuggestions(): string[] {
    return [
      'Tài chính',
      'Chi tiêu',
      'Tiết kiệm',
      'Ngân sách',
      'Quản lý tiền',
    ];
  }

  /**
   * Kiểm tra xem text có phải là câu hỏi tài chính không
   * @param text - Input text
   * @returns Boolean
   */
  isFinancialQuestion(text: string): boolean {
    const financialKeywords = [
      'chi tiêu',
      'tiền',
      'ngân sách',
      'tiết kiệm',
      'thu nhập',
      'lương',
      'tài chính',
      'giá',
      'chi phí',
      'mục tiêu',
      'kế hoạch',
      'quản lý',
      'tính toán',
      'phân tích',
      'gợi ý',
    ];

    const lowerText = text.toLowerCase();
    return financialKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Thêm context tài chính vào prompt nếu cần
   * @param userMessage - Câu hỏi từ user
   * @returns Prompt đã được thêm context
   */
  enhancePromptWithContext(userMessage: string): string {
    // Nếu là câu hỏi tài chính, thêm context
    if (this.isFinancialQuestion(userMessage)) {
      return `Bạn là một trợ lý tài chính thân thiện. Trả lời ngắn gọn, tự nhiên, xưng là "bạn" khi nói với tôi.

Câu hỏi: ${userMessage}

Trả lời: (ngắn gọn, không quá 2-3 dòng, tự nhiên như nói chuyện với bạn)`;
    }

    return `Trả lời ngắn gọn, tự nhiên, xưng là "bạn" khi nói với tôi.\n\nCâu hỏi: ${userMessage}\n\nTrả lời:`;
  }

  /**
   * Validate message trước khi gửi
   * @param text - Input text
   * @returns Object với valid flag và error message (nếu có)
   */
  validateMessage(text: string): { valid: boolean; error?: string } {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'Vui lòng nhập câu hỏi' };
    }

    if (text.trim().length > 500) {
      return { valid: false, error: 'Câu hỏi không được vượt quá 500 ký tự' };
    }

    return { valid: true };
  }

  /**
   * Format timestamp để hiển thị
   * @param date - Date object
   * @returns Formatted time string (HH:mm)
   */
  formatTime(date: Date): string {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Tạo initial message cho chat
   * @returns First message từ AI
   */
  getInitialMessage(): Message {
    return {
      id: '1',
      text: 'Xin chào! Tôi là AI Assistant của bạn. Tôi có thể giúp bạn:\n\n• Gợi ý quản lý tài chính\n• Phân tích chi tiêu\n• Lập kế hoạch tiết kiệm\n• Đạt mục tiêu tài chính\n\nHỏi tôi bất cứ điều gì về tài chính của bạn!',
      isUser: false,
      timestamp: new Date(),
    };
  }
}

export default new ChatService();
