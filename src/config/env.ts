/**
 * env.ts - Quản lý environment variables
 * 
 * ⚠️ CÁCH SETUP:
 * 1. Copy giá trị từ .env.local vào các biến dưới đây
 * 2. Hoặc sử dụng Firebase Remote Config để load động
 * 
 * Giá trị hiện tại được lấy từ .env.local
 */

// API Key cho Gemini (lấy từ .env.local)
export const GEMINI_API_KEY_CHAT = 'AIzaSyDbSlSkVgm-vpwoQG69SaRKYSYRJp900tM';

// Backend API URL
export const API_BASE_URL = 'https://api.example.com';

// Debug mode
export const DEBUG_MODE = true;

/**
 * API Configuration
 */
export const ENV = {
  GEMINI_API_KEY_CHAT,
  API_BASE_URL,
  DEBUG_MODE,
};

// Validate required keys
if (!GEMINI_API_KEY_CHAT) {
  console.error(
    '❌ ERROR: GEMINI_API_KEY_CHAT không được cấu hình!\n' +
    'Vui lòng cập nhật giá trị trong src/config/env.ts từ file .env.local'
  );
}

export default ENV;
