/**
 * env.example.ts - Template file (không commit API keys!)
 * 
 * ⚠️ SETUP:
 * 1. Copy file này thành env.ts
 * 2. Điền API key từ .env.local vào env.ts
 * 3. env.ts sẽ được .gitignore - không bị commit
 * 
 * Lấy API Key:
 * - Gemini: https://aistudio.google.com/apikey
 */

// API Key cho Gemini (REPLACE_WITH_YOUR_KEY - lấy từ https://aistudio.google.com/apikey)
export const GEMINI_API_KEY_CHAT = 'REPLACE_WITH_YOUR_GEMINI_API_KEY';

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
if (!GEMINI_API_KEY_CHAT || GEMINI_API_KEY_CHAT === 'REPLACE_WITH_YOUR_GEMINI_API_KEY') {
  console.error(
    '❌ ERROR: GEMINI_API_KEY_CHAT không được cấu hình!\n' +
    'Vui lòng:\n' +
    '1. Copy src/config/env.example.ts thành src/config/env.ts\n' +
    '2. Điền API key từ https://aistudio.google.com/apikey vào env.ts'
  );
}

export default ENV;
