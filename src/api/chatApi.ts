/**
 * chatApi.ts
 * API layer for chat operations
 * Handles sending messages to AI, formatting responses, etc.
 */

import ChatService from '../services/ChatService';
import { Message } from '../store/aiChatStore';

export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

export interface ValidateMessageResponse {
  valid: boolean;
  error?: string;
}

class ChatApi {
  /**
   * Validate user message
   */
  static validateMessage(text: string): ValidateMessageResponse {
    const validation = ChatService.validateMessage(text);
    return validation;
  }

  /**
   * Create user message object
   */
  static createUserMessage(text: string): Message {
    return ChatService.createUserMessage(text);
  }

  /**
   * Create error message object
   */
  static createErrorMessage(errorText: string): Message {
    return {
      id: (Date.now() + 1).toString(),
      text: errorText,
      isUser: false,
      timestamp: new Date(),
    };
  }

  /**
   * Send message to AI and get response
   */
  static async sendMessage(userMessage: Message): Promise<SendMessageResponse> {
    try {
      const response = await ChatService.sendMessageToAI(userMessage.text);

      if (response.success && response.message) {
        return {
          success: true,
          message: response.message,
        };
      } else {
        const errorText = ChatService.formatErrorMessage(
          response.error || 'Có lỗi xảy ra'
        );
        const errorMessage = this.createErrorMessage(errorText);
        return {
          success: false,
          message: errorMessage,
          error: response.error,
        };
      }
    } catch (error) {
      const errorMessage = this.createErrorMessage('Có lỗi xảy ra. Vui lòng thử lại.');
      return {
        success: false,
        message: errorMessage,
        error: String(error),
      };
    }
  }

  /**
   * Get initial/welcome message from AI
   */
  static getInitialMessage(): Message {
    return ChatService.getInitialMessage();
  }

  /**
   * Get suggestion prompts for quick input
   */
  static getSuggestions(): string[] {
    return ChatService.getSuggestions();
  }

  /**
   * Get suggestion icon mapping
   */
  static getSuggestionIconMap(): { [key: string]: string } {
    return {
      'Tài chính': 'wallet',
      'Chi tiêu': 'credit-card',
      'Tiết kiệm': 'piggy-bank',
      'Ngân sách': 'chart-box',
      'Quản lý tiền': 'cash-multiple',
    };
  }
}

export default ChatApi;
