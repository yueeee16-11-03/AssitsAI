import { GoogleGenerativeAI } from "@google/generative-ai";
import ENV from '../config/env';

// Khởi tạo Gemini client với API key riêng cho AIInsightService
const API_KEY = ENV.GEMINI_API_KEY_SIGHT;
if (!API_KEY) {
  console.warn("⚠️ Thiếu GEMINI_API_KEY_SIGHT - vui lòng cấu hình trong src/config/env.ts");
}
const genAI = new GoogleGenerativeAI(API_KEY);

type Transaction = {
  id?: string;
  type: 'income' | 'expense';
  amount: number;
  category?: string;
  description?: string;
  date?: any; // Firestore timestamp or ISO string
  createdAt?: any;
};

// Helper: parse various transaction date representations to a Date or null
function parseTransactionDate(t: Transaction): Date | null {
  try {
    if (!t) return null;
    // Firestore Timestamp with toDate()
    if (t.date?.toDate && typeof t.date.toDate === 'function') return t.date.toDate();
    if (t.createdAt?.toDate && typeof t.createdAt.toDate === 'function') return t.createdAt.toDate();
    // ISO string
    if (typeof t.date === 'string') return new Date(t.date);
    if (typeof t.createdAt === 'string') return new Date(t.createdAt);
    // numeric epoch millis or seconds
    if (typeof t.date === 'number') return new Date(t.date);
    if (typeof t.createdAt === 'number') return new Date(t.createdAt);
    // object with seconds (Firestore-like)
    if (t.date && typeof t.date.seconds === 'number') return new Date(t.date.seconds * 1000);
    if (t.createdAt && typeof t.createdAt.seconds === 'number') return new Date(t.createdAt.seconds * 1000);
    return null;
  } catch {
    return null;
  }
}

function safeAmount(a: any): number {
  const n = Number(a);
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.round(n);
}

const CATEGORY_MAP: Record<string, string> = {
  'ăn uống': 'Ăn uống',
  'ăn': 'Ăn uống',
  'food': 'Ăn uống',
  'ăn-uống': 'Ăn uống',
  'di chuyển': 'Di chuyển',
  'di-chuyển': 'Di chuyển',
  'transport': 'Di chuyển',
  'mua sắm': 'Mua sắm',
  'mua-sắm': 'Mua sắm',
  'shopping': 'Mua sắm',
  'giải trí': 'Giải trí',
  'giai tri': 'Giải trí',
  'entertainment': 'Giải trí',
  'khác': 'Khác',
};

function normalizeCategory(name?: string): string {
  if (!name) return 'Khác';
  const key = String(name).trim().toLowerCase();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  // try to match by contains
  for (const k of Object.keys(CATEGORY_MAP)) {
    if (key.includes(k)) return CATEGORY_MAP[k];
  }
  // fallback: if it already looks like canonical, capitalize first letter
  const canonical = ['Ăn uống', 'Di chuyển', 'Mua sắm', 'Giải trí', 'Khác'];
  if (canonical.includes(name)) return name;
  return 'Khác';
}

export async function analyzeTransactionsWithAI(
  transactions: Transaction[],
  habits: any[] = [],
  _opts?: { periodLabel?: string; startDate?: string | Date; endDate?: string | Date }
): Promise<{
  success: boolean;
  data?: any;
  raw?: string;
  error?: string;
}> {
  try {
    // Nếu không có transactions, trả về mock data
    const hasTransactions = transactions && transactions.length > 0;
    
    if (!hasTransactions) {
      console.log('[AIInsightService] No transactions available, returning mock analysis');
      return {
        success: true,
        data: {
          summary: 'Bạn chưa có giao dịch nào. Hãy thêm giao dịch để nhận được phân tích chi tiết từ AI.',
          totalIncome: 0,
          totalExpense: 0,
          categoryBreakdown: [],
          suggestions: [
            { title: 'Bắt đầu ghi chép', description: 'Thêm giao dịch để AI phân tích' }
          ],
          anomalies: [],
        },
        raw: 'Mock data (no transactions)',
      };
    }

    // ✅ THAY ĐỔI: Sử dụng hàm tối ưu token
    // Bước 1: Tính toán dữ liệu trước (app-side)
    const compact = prepareCompactPayload(transactions, habits);
    console.log('[AIInsightService] Compact payload prepared:', JSON.stringify(compact).length, 'bytes');

    // Bước 2: Gửi dữ liệu đã tính toán lên AI (thay vì raw data)
    const result = await analyzeCompactPayload(compact, { periodLabel: _opts?.periodLabel || 'month' });
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        raw: result.raw,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error: any) {
    console.error('[AIInsightService] Error in analyzeTransactionsWithAI:', error?.message || error);
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}

export default {
  analyzeTransactionsWithAI,
};

export function prepareCompactPayload(transactions: Transaction[], habits: any[]) {
  const now = new Date();
  const txs = transactions || [];
  
  // 1. Tính tổng thu/chi
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + safeAmount((t as any).amount), 0);
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + safeAmount((t as any).amount), 0);
  const balance = totalIncome - totalExpense;
  const savingRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // 2. Top 3 danh mục tốn tiền nhất
  const categoryMap: Record<string, number> = {};
  txs.forEach(t => {
    if (t.type === 'expense') {
      const cat = normalizeCategory(t.category);
      categoryMap[cat] = (categoryMap[cat] || 0) + safeAmount((t as any).amount);
    }
  });

  const topCategories = Object.entries(categoryMap)
    .map(([name, amount]) => ({ 
      name, 
      amount,
      percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  // 3. Thói quen tốt nhất/tệ nhất
  const bestHabit = (habits || []).length > 0 
    ? (habits || []).reduce((prev: any, cur: any) => (prev?.streak > cur?.streak ? prev : cur))
    : null;
  const worstHabit = (habits || []).length > 0
    ? (habits || []).reduce((prev: any, cur: any) => (prev?.streak < cur?.streak ? prev : cur))
    : null;
  const habitCount = (habits || []).length;
  const avgHabitStreak = habitCount > 0 
    ? Math.round(habits.reduce((s: number, h: any) => s + (h?.streak || 0), 0) / habitCount)
    : 0;

  // 4. Xu hướng 5 ngày gần nhất
  const recentTrend = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const daySpend = txs
      .filter(t => {
        const dt = parseTransactionDate(t);
        if (!dt) return false;
        return dt.toISOString().slice(0, 10) === dayStr && t.type === 'expense';
      })
      .reduce((s, t) => s + safeAmount((t as any).amount), 0);

    const dayIncome = txs
      .filter(t => {
        const dt = parseTransactionDate(t);
        if (!dt) return false;
        return dt.toISOString().slice(0, 10) === dayStr && t.type === 'income';
      })
      .reduce((s, t) => s + safeAmount((t as any).amount), 0);

    const spend_level = daySpend >= 500000 ? 'HIGH' : daySpend >= 200000 ? 'MEDIUM' : 'LOW';
    const habit_status = (habits || []).some(h => (h.progress || 0) >= 80) ? 'SUCCESS' : 'FAIL';
    return { date: dayStr, daySpend, dayIncome, spend_level, habit_status };
  });

  // 5. Transaction count
  const txCount = txs.length;
  const expenseCount = txs.filter(t => t.type === 'expense').length;

  return {
    summary: {
      totalExpense,
      totalIncome,
      balance,
      savingRate: `${savingRate}%`,
      transactionCount: txCount,
      expenseCount,
    },
    top_spending_categories: topCategories,
    habits_summary: {
      best: bestHabit ? `${bestHabit.name} (${bestHabit.streak}d)` : 'Không có',
      worst: worstHabit ? `${worstHabit.name} (${worstHabit.streak}d)` : 'Không có',
      total_habits: habitCount,
      avg_streak: avgHabitStreak,
    },
    recent_daily_trend: recentTrend,
  };
}

export async function analyzeCompactPayload(compactPayload: any, _opts?: { periodLabel?: string }) {
  try {
    if (!compactPayload) {
      return { success: false, error: 'No compact payload provided' };
    }

    const summary = compactPayload.summary || {};
    const topCat = (compactPayload.top_spending_categories || [])[0];
    
    // Prompt cực ngắn (~30 tokens)
    const prompt = `Chi ${Math.round(summary.totalExpense / 1000)}k, tiết kiệm ${summary.savingRate}%, top ${topCat?.name}. Trả về một JSON hợp lệ (không có văn bản phụ). Ví dụ: {"suggestion":"Sao lưu nhỏ: giảm đồ ăn nhanh"}. Hãy trả lời CHỈ một JSON với trường "suggestion".`;

    console.log('[AIInsightService] analyzeCompactPayload - ~30 tokens');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    
    // Attempt to extract and parse a JSON object from the AI response.
    // The model may return plain text or plain error message; avoid attempting JSON.parse on such strings.
    const extractJSONFromRaw = (text: string) => {
      if (!text || typeof text !== 'string') return null;
      // Find first `{` and last `}` and parse the substring; this is more tolerant than the earlier regex.
      const first = text.indexOf('{');
      const last = text.lastIndexOf('}');
      if (first === -1 || last === -1 || last <= first) return null;
      const candidate = text.slice(first, last + 1);
      try {
        return JSON.parse(candidate);
      } catch (err) {
        // Re-throw so caller can handle.
        throw err;
      }
    };

    let parsed: any = null;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/m);
      if (jsonMatch) {
        // Use regex match if present (covers cases with extra text around JSON)
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Try explicit index/last-char extraction heuristic
        const candidate = extractJSONFromRaw(raw);
        if (candidate) {
          parsed = candidate;
        } else {
          console.warn('[AIInsightService] No JSON object detected in AI response - returning raw output for inspection:', raw?.slice?.(0, 400));
          return { success: false, raw, error: 'AI returned non-JSON response' };
        }
      }
    } catch (err: any) {
      console.error('[AIInsightService] JSON parse error - raw response (truncated 400 chars):', raw?.slice?.(0, 400));
      console.error('[AIInsightService] JSON parse error:', err?.message || err);
      return { success: false, raw, error: 'Lỗi phân tích' };
    }

    return { success: true, data: parsed, raw };
  } catch (error: any) {
    console.error('analyzeCompactPayload error:', error?.message || error);
    return { success: false, error: error?.message || String(error) };
  }
}
