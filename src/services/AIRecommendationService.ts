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
import firestore from "@react-native-firebase/firestore";

const API_KEY = "AIzaSyBLCiOB6D52RkyaPIo6wDMcRk3eFOZ2t1E";

if (!API_KEY) {
  throw new Error("⚠️ Thiếu GEMINI_API_KEY");
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
    .map(([category, amount]) => `${category}: ${amount.toLocaleString("vi-VN")} VND`)
    .join("\n") || "No transactions recorded";

  const habitsSummary = habits.length > 0 ? habits.join("\n") : "No active habits";

  return `Bạn là một chuyên gia tài chính cá nhân và lập kế hoạch tương lai.

**Mục tiêu của người dùng:** ${goal}

**Dữ liệu 7 ngày gần nhất:**
Chi tiêu theo danh mục:
${spendingSummary}

Các thói quen đang theo dõi:
${habitsSummary}

---

**Nhiệm vụ:** Tạo 5 gợi ý CỤ THỂ, HÀNH ĐỘNG CHI TIẾT cho HÔM NAY để giúp người dùng đạt mục tiêu.
Mỗi gợi ý nên:
1. Cụ thể và có thể thực hiện trong 1 ngày
2. Liên quan đến mục tiêu và dữ liệu 7 ngày
3. Có mức ưu tiên (cao/trung bình/thấp)
4. Thuộc một danh mục (tài chính/thói quen/lối sống/sức khỏe/năng suất)

---

**QUAN TRỌNG:** Trả về CHỈ một JSON array hợp lệ (không markdown, không giải thích thêm):
[
  {
    "id": "rec-1",
    "title": "Tiêu đề gợi ý",
    "description": "Mô tả chi tiết cách thực hiện và lợi ích",
    "priority": "high",
    "category": "finance",
    "icon": "💡"
  },
  ...
]

Gợi ý:`;
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

    // Add today's date to each recommendation
    const today = getTodayDate();
    const recs: DailyRecommendation[] = parsed.map((rec: any, idx: number) => ({
      id: rec.id || `rec-${idx}`,
      title: rec.title || "Untitled",
      description: rec.description || "",
      priority: rec.priority || "medium",
      category: rec.category || "finance",
      icon: rec.icon || "💡",
      date: today,
    }));

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
