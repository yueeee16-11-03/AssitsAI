import { GoogleGenerativeAI } from '@google/generative-ai';
import AudioRecordingService from './AudioRecordingService';
import ENV from '../config/env';

// Khởi tạo Gemini client với API key riêng cho GeminiSpeechService
const API_KEY = ENV.GEMINI_API_KEY_AUDIO;
if (!API_KEY) {
  console.warn("⚠️ Thiếu GEMINI_API_KEY_CHAT - vui lòng cấu hình trong src/config/env.ts");
}
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * GeminiSpeechService - Gửi file âm thanh lên Gemini để chuyển đổi thành text
 * 
 * Sử dụng:
 * 1. Ghi âm âm thanh từ thiết bị
 * 2. Gửi đường dẫn file đến transcribeAudioFile()
 * 3. Nhận kết quả text đã chuyển đổi
 */

class GeminiSpeechService {
  private model: any;

  constructor() {
    // Khởi tạo Gemini model
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Mã hóa file URI sang base64
   */
  async encodeFileToBase64(fileUri: string): Promise<string | null> {
    try {
      console.log('📝 [Gemini] Mã hóa file sang base64:', fileUri);
      console.log('📝 [Gemini] AudioRecordingService current path:', AudioRecordingService.getCurrentRecordingPath());
      const base64Data = await AudioRecordingService.audioToBase64(fileUri);
      if (base64Data) {
        console.log('✅ File đã mã hóa, kích thước:', base64Data.length);
      }
      return base64Data;
    } catch (error) {
      console.error('❌ Lỗi mã hóa file:', error);
      return null;
    }
  }

  /**
   * Gửi base64 audio lên Gemini và nhận text chuyển đổi
   */
  private async sendAudioToGemini(base64Audio: string, mimeType: string = 'audio/mp4'): Promise<string | null> {
    try {
      const prompt = `Hãy phiên âm âm thanh được cung cấp. Chỉ trả lại văn bản đã phiên âm mà không có bất kỳ bình luận hoặc định dạng bổ sung nào. Nếu bạn không thể hiểu rõ âm thanh, hãy chỉ ra những gì bạn nghe được.`;

      console.log('🚀 [Gemini] Đang gửi âm thanh lên Gemini API...');

      // Gọi Gemini với âm thanh
      const response = await this.model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        prompt,
      ]);

      const result = await response.response;
      const text = result.text();

      console.log('✅ [Gemini] Đã nhận kết quả phiên âm:', text);
      return text.trim();
    } catch (error) {
      console.error('❌ Lỗi gửi âm thanh lên Gemini:', error);
      throw error;
    }
  }

  /**
   * Phiên âm file âm thanh - điểm vào chính
   * Hỗ trợ: audio/mp4, audio/mpeg, audio/wav, audio/webm, audio/ogg, audio/aac
   */
  async transcribeAudioFile(fileUri: string, mimeType: string = 'audio/mp4'): Promise<string | null> {
    try {
      console.log('📝 [Gemini] Đang phiên âm file âm thanh:', fileUri);

      // Mã hóa file sang base64
      const base64Audio = await this.encodeFileToBase64(fileUri);
      if (!base64Audio) {
        console.error('❌ Không thể mã hóa file âm thanh');
        return null;
      }

      // Gửi lên Gemini và nhận kết quả
      const transcribedText = await this.sendAudioToGemini(base64Audio, mimeType);
      return transcribedText;
    } catch (error) {
      console.error('❌ Lỗi phiên âm file:', error);
      return null;
    }
  }

  /**
   * Phiên âm âm thanh base64 trực tiếp
   */
  async transcribeBase64Audio(base64Audio: string, mimeType: string = 'audio/mp4'): Promise<string | null> {
    try {
      console.log('📝 [Gemini] Đang phiên âm âm thanh base64...');
      const transcribedText = await this.sendAudioToGemini(base64Audio, mimeType);
      return transcribedText;
    } catch (error) {
      console.error('❌ Lỗi phiên âm base64:', error);
      return null;
    }
  }
}

export default new GeminiSpeechService();
