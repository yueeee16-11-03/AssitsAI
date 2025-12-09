/**
 * AIRecommendationService.ts
 * 
 * Mục đích: Tạo gợi ý hàng ngày dựa trên 7 ngày dữ liệu từ habits + transactions
 * Gọi API Gemini trực tiếp (không qua Cloud Function)
 * Model: gemini-2.5-flash (Free tier)
 * 
 * Logic:
 * ✅ Lấy 7 ngày dữ liệu từ habits + transactions
 * ✅ Tạo prompt tóm tắt + gợi ý theo ngày (5 gợi ý/ngày)
 * ✅ Lưu với date field = hôm nay
 * ✅ Khi load: nếu đã có gợi ý hôm nay → load, không create lại
 * ✅ User bấm "Tạo gợi ý" → xóa cũ, tạo mới
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import NotificationService from './NotificationService';
import firestore from "@react-native-firebase/firestore";
import ENV from '../config/env';

const API_KEY = ENV.GEMINI_API_KEY_RECOM;

if (!API_KEY) {
  throw new Error("⚠️ Thiếu GEMINI_API_KEY - vui lòng cấu hình trong src/config/env.ts");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Interface cho gợi ý hàng ngày
 */
export interface DailyRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "finance" | "habit" | "lifestyle" | "health" | "productivity";
  icon: string;
  date: string; // YYYY-MM-DD
}

export interface RecommendationServiceResult {
  success: boolean;
  recommendations: DailyRecommendation[];
  date: string;
  error?: string;
  processingTime: number;
}

/**
 * Lấy ngày hiện tại theo format YYYY-MM-DD
 */
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Lấy date 7 ngày trước
 */
function getDate7DaysAgo(): Date {
  const now = new Date();
  now.setDate(now.getDate() - 7);
  return now;
}

/**
 * Lấy 7 ngày dữ liệu transactions (expenses)
 */
async function fetch7DayTransactions(userId: string): Promise<{
  [key: string]: number;
}> {
  try {
    console.log("💳 [RECOMMENDATION] Fetching 7-day transactions...");

    const sevenDaysAgo = getDate7DaysAgo();
    const snapshot = await firestore()
      .collection(`users/${userId}/transactions`)
      .where("type", "==", "expense")
      .where("isDeleted", "==", false)
      .where("date", ">=", firestore.Timestamp.fromDate(sevenDaysAgo))
      .get();

    const spending: { [key: string]: number } = {};

    snapshot.docs.forEach((doc) => {
      const tx = doc.data();
      const category = tx.category || "Other";
      const amount = tx.amount || 0;
      spending[category] = (spending[category] || 0) + amount;
    });

    console.log("✅ [RECOMMENDATION] Transactions fetched:", Object.keys(spending).length, "categories");
    return spending;
  } catch (error) {
    console.error("❌ [RECOMMENDATION] Error fetching transactions:", error);
    return {};
  }
}

/**
 * Lấy danh sách active habits
 */
async function fetchActiveHabits(userId: string): Promise<string[]> {
  try {
    console.log("🎯 [RECOMMENDATION] Fetching active habits...");

    const snapshot = await firestore()
      .collection(`users/${userId}/habits`)
      .where("isActive", "==", true)
      .get();

    const habits: string[] = [];

    snapshot.docs.forEach((doc) => {
      const habit = doc.data();
      habits.push(`${habit.name} (${habit.frequency || "daily"})`);
    });

    console.log("✅ [RECOMMENDATION] Habits fetched:", habits.length);
    return habits;
  } catch (error) {
    console.error("❌ [RECOMMENDATION] Error fetching habits:", error);
    return [];
  }
}

/**
 * Xóa gợi ý hôm nay cũ từ Firestore
 */
async function deleteOldRecommendations(userId: string, today: string): Promise<void> {
  try {
    console.log("🗑️ [RECOMMENDATION] Deleting old recommendations for", today);

    const snapshot = await firestore()
      .collection(`users/${userId}/insights`)
      .where("date", "==", today)
      .get();

    if (snapshot.docs.length > 0) {
      const batch = firestore().batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log("✅ [RECOMMENDATION] Deleted", snapshot.docs.length, "old recommendations");
    }
  } catch (error) {
    console.error("❌ [RECOMMENDATION] Error deleting old recommendations:", error);
  }
}

/**
 * Lưu gợi ý mới vào Firestore
 */
async function saveRecommendations(
  userId: string,
  recommendations: DailyRecommendation[]
): Promise<void> {
  try {
    console.log("💾 [RECOMMENDATION] Saving", recommendations.length, "recommendations...");

    if (recommendations.length === 0) {
      console.warn("⚠️ [RECOMMENDATION] No recommendations to save");
      return;
    }

    const batch = firestore().batch();
    const insightsRef = firestore().collection(`users/${userId}/insights`);

    recommendations.forEach((rec) => {
      const docId = `${rec.date}-${rec.id}`;
      batch.set(insightsRef.doc(docId), {
        ...rec,
        generatedAt: firestore.Timestamp.now(),
        userId: userId,
      });
    });

    await batch.commit();
    console.log("✅ [RECOMMENDATION] Recommendations saved successfully");
  } catch (error) {
    console.error("❌ [RECOMMENDATION] Error saving recommendations:", error);
    throw error;
  }
}

/**
 * Tạo prompt cho Gemini từ 7 ngày dữ liệu
 */
function buildPrompt(goal: string, spending: { [key: string]: number }, habits: string[]): string {
  const spendingSummary = Object.entries(spending)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => `${category}: ${amount.toLocaleString("vi-VN")} VND`)
    .join("\n") || "No transactions recorded";

  const habitsSummary = habits.length > 0 ? habits.join("\n") : "No active habits";

  return `Bạn là một tư vấn tài chính và phát triển cá nhân, phong cách thân thiện, tinh tế và súc tích.

**MỤC TIÊU NGƯỜI DÙNG:** ${goal}

**DỮ LIỆU 7 NGÀY:**
Chi tiêu theo danh mục:
${spendingSummary}

Thói quen đang theo dõi:
${habitsSummary}

---

**YÊU CẦU:** Tạo 3 gợi ý CỤ THỂ (ngắn, tinh tế) cho HÔM NAY. Mỗi gợi ý phải súc tích.

**TIÊU CHUAN CHO MỖI GỢI Ý:**
1. **Tiêu đề (Title)**: 1 câu hành động, tối đa 60 ký tự
   - ❌ SAIS: "Tiết kiệm tiền"
   - ✅ ĐÚNG: "Cắt chi phí ăn uống: Dùng thực phẩm có sẵn thay cà phê ngoài"

2. **Mô tả (Description)**: Ngắn gọn, tối đa 140 ký tự — nêu con số, hành động, lợi ích cụ thể
   - TÍNH CÁCH (dữ liệu cụ thể từ 7 ngày)
   - CÁCH LÀM (hành động cụ thể, dễ thực hiện hôm nay)
   - LỢI ỊCH (con số, kết quả cụ thể)
   - Ví dụ: "Bạn đã chi 1.5M cho ăn uống. Hôm nay: chuẩn bị cơm nhà + mang nước từ nhà, tiết kiệm ~200k"

3. **Ưu tiên (Priority)**:
   - "high" = liên quan trực tiếp đến khoản chi lớn nhất 7 ngày hoặc rủi ro sức khỏe
   - "medium" = liên quan đến thói quen hoặc chi phí trung bình
   - "low" = gợi ý bổ sung, tối ưu hóa

4. **Danh mục (Category)**: Chỉ dùng 1 trong 5: finance/habit/lifestyle/health/productivity

5. **Biểu tượng (Icon)**: Dùng emoji NGẮN, RÕ RÀNG (wallet, heart, zap, leaf, star)

---

**KHÔNG ĐƯỢC:**
- Giải thích dài dòng "dựa trên dữ liệu..."
- Dùng từ mơ hồ "có thể", "nên", "cần"
- Lặp lại dữ liệu đã cho
- Gợi ý chung chung như "lên kế hoạch", "theo dõi chi phí"

**PHẢI:**
- Nêu con số cụ thể (bao nhiêu tiền, mấy tiếng)
- Hành động NGAY HÔM NAY (không phải tương lai mơ hồ)
- Dựa trên DỮ LIỆU THỰC của người dùng

---

**ĐỊNH DẠNG TRUYỀN VỀ**: CHỈ JSON array, hợp lệ 100%, không markdown, không giải thích. Trả về 3 gợi ý nếu có thể:
[
  {
    "id": "rec-1",
    "title": "Hành động cụ thể: chi tiết cách làm",
    "description": "Cơ sở dữ liệu (con số) + Cách thực hiện + Lợi ích cụ thể",
    "priority": "high|medium|low",
    "category": "finance|habit|lifestyle|health|productivity",
    "icon": "💰" hoặc "❤️" hoặc "⚡" hoặc "🍃" hoặc "⭐"
  }
]

Trả về JSON ngay bây giờ:`;
}


/**
 * Parse Gemini response để extract JSON
 */
function parseGeminiResponse(text: string): DailyRecommendation[] {
  try {
    console.log("📝 [RECOMMENDATION] Parsing Gemini response...");

    // Remove markdown code blocks if present
    let cleaned = text
      .trim()
      .replace(/^```json\n?/, "")
      .replace(/\n?```$/, "")
      .replace(/^```\n?/, "")
      .replace(/\n?```$/, "");

    // Extract JSON array
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      throw new Error("Response is not an array");
    }

    // Add today's date to each recommendation and enforce concise formatting
    const today = getTodayDate();
    const MAX_TITLE_LEN = 60;
    const MAX_DESC_LEN = 140;
    const ALLOWED_PRIORITIES = ["high", "medium", "low"];
    const ALLOWED_CATEGORIES = ["finance", "habit", "lifestyle", "health", "productivity"];

    function sanitizeString(input: any, maxLen: number, fallback = ""): string {
      if (!input) return fallback;
      const s = String(input).trim();
      if (s.length <= maxLen) return s;
      return s.slice(0, maxLen - 1).trim() + "…";
    }

    function sanitizeIcon(icon: any): string {
      if (!icon) return "💡";
      const s = String(icon).trim();
      // simple emoji heuristic: contains non-ASCII characters or is very short
      const containsNonAscii = [...s].some((ch) => ch.charCodeAt(0) > 127);
      if (s.length <= 2 || containsNonAscii) return s;
      return "💡";
    }

    const recs: DailyRecommendation[] = parsed.map((rec: any, idx: number) => {
      const id = rec.id || `rec-${idx + 1}`;
      const title = sanitizeString(rec.title || "Untitled", MAX_TITLE_LEN, "Untitled");
      const description = sanitizeString(rec.description || "", MAX_DESC_LEN, "");
      const priority = ALLOWED_PRIORITIES.includes(rec.priority) ? rec.priority : "medium";
      const category = ALLOWED_CATEGORIES.includes(rec.category) ? rec.category : "finance";
      const icon = sanitizeIcon(rec.icon || rec.emoji || "💡");
      return { id, title, description, priority, category, icon, date: today } as DailyRecommendation;
    });

    console.log("✅ [RECOMMENDATION] Parsed", recs.length, "recommendations");
    return recs;
  } catch (error) {
    console.error("❌ [RECOMMENDATION] Error parsing response:", error);
    throw new Error("Failed to parse Gemini response");
  }
}

/**
 * Main function: Tạo gợi ý hàng ngày
 * 
 * @param userId - Firebase user ID
 * @param goal - Mục tiêu của user
 * @returns Kết quả với danh sách gợi ý
 */
export async function generateDailyRecommendations(
  userId: string,
  goal: string
): Promise<RecommendationServiceResult> {
  const startTime = Date.now();
  const today = getTodayDate();

  try {
    console.log("\n🤖 [RECOMMENDATION] Starting daily recommendation generation...");
    console.log(`📅 [RECOMMENDATION] Date: ${today}`);
    console.log(`🎯 [RECOMMENDATION] Goal: ${goal}`);

    // Step 1: Fetch 7-day data
    console.log("\n📊 [RECOMMENDATION] Step 1: Fetching 7-day data...");
    const [spending, habits] = await Promise.all([
      fetch7DayTransactions(userId),
      fetchActiveHabits(userId),
    ]);

    // Step 2: Build prompt
    console.log("\n✍️ [RECOMMENDATION] Step 2: Building prompt...");
    const prompt = buildPrompt(goal, spending, habits);

    // Step 3: Call Gemini API
    console.log("\n🔄 [RECOMMENDATION] Step 3: Calling Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("✅ [RECOMMENDATION] Gemini response received");
    console.log("📄 [RECOMMENDATION] Response preview:", responseText.substring(0, 100) + "...");

    // Step 4: Parse response
    console.log("\n🔍 [RECOMMENDATION] Step 4: Parsing response...");
    const recommendations = parseGeminiResponse(responseText);

    if (recommendations.length === 0) {
      throw new Error("No recommendations generated");
    }

    // Step 5: Delete old recommendations
    console.log("\n🗑️ [RECOMMENDATION] Step 5: Deleting old recommendations...");
    await deleteOldRecommendations(userId, today);

    // Step 6: Save new recommendations
    console.log("\n💾 [RECOMMENDATION] Step 6: Saving new recommendations...");
    await saveRecommendations(userId, recommendations);

    const processingTime = Date.now() - startTime;

    console.log("\n✅ [RECOMMENDATION] Successfully generated daily recommendations!");
    // Notify the user that new recommendations are available and persist it
    try {
      const notifId = `ai-recommendation-${today}`;
      await NotificationService.displayNotification({
        id: notifId,
        title: 'Gợi ý mới',
        body: `Có ${recommendations.length} gợi ý tài chính và thói quen cho hôm nay.`,
        type: 'ai',
        icon: 'robot',
        actionRoute: 'AIRecommendation',
      });
      console.log('RECOMMENDATION: persisted and displayed AI suggestions notification', notifId);
    } catch (err) {
      console.warn('RECOMMENDATION: failed to create ai notification', err);
    }
    console.log(`⏱️ [RECOMMENDATION] Processing time: ${processingTime}ms`);

    return {
      success: true,
      recommendations,
      date: today,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    console.error("\n❌ [RECOMMENDATION] Error:", errorMessage);
    console.error(`⏱️ [RECOMMENDATION] Processing time: ${processingTime}ms`);

    return {
      success: false,
      recommendations: [],
      date: today,
      error: errorMessage,
      processingTime,
    };
  }
}

/**
 * Load today's recommendations từ Firestore
 * 
 * @param userId - Firebase user ID
 * @returns Danh sách gợi ý hôm nay
 */
export async function loadTodayRecommendations(
  userId: string
): Promise<{
  success: boolean;
  recommendations: DailyRecommendation[];
  error?: string;
}> {
  try {
    console.log("\n📖 [RECOMMENDATION] Loading today's recommendations...");
    const today = getTodayDate();

    const snapshot = await firestore()
      .collection(`users/${userId}/insights`)
      .where("date", "==", today)
      .get();

    const recommendations: DailyRecommendation[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        category: data.category,
        icon: data.icon,
        date: data.date,
      };
    });

    console.log("✅ [RECOMMENDATION] Loaded", recommendations.length, "recommendations for", today);

    return {
      success: true,
      recommendations,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ [RECOMMENDATION] Error loading recommendations:", errorMessage);

    return {
      success: false,
      recommendations: [],
      error: errorMessage,
    };
  }
}
