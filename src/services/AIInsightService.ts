import { generateGeminiText } from './GeminiAIService';

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

export async function analyzeTransactionsWithAI(
  transactions: Transaction[],
  _opts?: { periodLabel?: string; startDate?: string | Date; endDate?: string | Date }
): Promise<{
  success: boolean;
  data?: any;
  raw?: string;
  error?: string;
}> {
  try {
    if (!transactions || transactions.length === 0) {
      return {
        success: true,
        data: {
          summary: 'No transactions available for analysis.',
          totalIncome: 0,
          totalExpense: 0,
          categoryBreakdown: [],
          suggestions: [],
          anomalies: [],
        },
        raw: '',
      };
    }

    // Xác định khoảng thời gian phân tích dựa trên _opts (periodLabel hoặc start/end cụ thể)
    let start: Date | null = null;
    let end: Date | null = null;
    const now = new Date();
    if (_opts?.startDate) {
      start = new Date(_opts.startDate);
    }
    if (_opts?.endDate) {
      end = new Date(_opts.endDate);
    }

    if (!start && _opts?.periodLabel) {
      const p = _opts.periodLabel;
      switch (p) {
        case 'day':
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          start = new Date(now);
          const dayOfWeek = now.getDay();
          start.setDate(now.getDate() - dayOfWeek);
          start.setHours(0, 0, 0, 0);
          end = now;
          break;
        case 'month':
          start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          end = now;
          break;
        case 'year':
          start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          end = now;
          break;
        default:
          start = null;
          end = null;
      }
    }

    // Lọc transactions theo khoảng thời gian (nếu có)
    const filtered = (transactions || []).filter((t) => {
      try {
        const txDate = parseTransactionDate(t) || new Date();
        if (!txDate) return false;
        if (start && txDate < start) return false;
        if (end && txDate > end) return false;
        return true;
      } catch {
        return false;
      }
    });

    // Chuẩn bị lines từ filtered transactions
    const lines = filtered.slice(0, 200).map((t) => {
      const dateObj = parseTransactionDate(t) || new Date();
      const dateStr = dateObj.toISOString();
      const amount = safeAmount((t as any).amount);
      return `${dateStr} | ${t.type === 'income' ? 'THU' : 'CHI'} | ${t.category || 'Khác'} | ${amount} | ${t.description || ''}`;
    });

    const rangeText = start && end ? `${start.toISOString()} → ${end.toISOString()}` : 'Toàn bộ dữ liệu';

    const prompt = `Bạn là trợ lý tài chính thông minh.\nPhân tích các giao dịch trong khoảng thời gian: ${rangeText}.\n\nChỉ phân tích và trả về kết quả cho các giao dịch trong khoảng này.` +
      `\n\nYêu cầu (trả về JSON):` +
      `\n1) summary: Tóm tắt (1-2 câu) bằng tiếng Việt, nêu các danh mục chi tiêu chính.` +
      `\n2) totalIncome: tổng thu nhập (số nguyên VND).` +
      `\n3) totalExpense: tổng chi tiêu (số nguyên VND).` +
      `\n4) categoryBreakdown: mảng { category: string, amount: integer, percent: number } — category phải khớp tên hệ thống (Ăn uống, Di chuyển, Mua sắm, Giải trí, Khác).` +
      `\n5) suggestions: mảng các khuyến nghị ngắn (3-6 mục).` +
      `\n6) anomalies: mảng mô tả giao dịch bất thường.` +
      `\n\nDữ liệu giao dịch (tối đa 200 dòng):\n${lines.join('\n')}\n\nTrả về duy nhất JSON hợp lệ.`;

    console.log('🚀 [AIInsightService] Gọi Gemini với prompt:', prompt.substring(0, 200));
    const raw = await generateGeminiText(prompt);
    console.log('✅ [AIInsightService] Kết quả trả về:', raw.substring(0, 200));

    // Try to parse JSON from the raw text. Gemini should return JSON only per instruction.
    let parsed: any = null;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/m);
      const jsonText = jsonMatch ? jsonMatch[0] : raw;
      parsed = JSON.parse(jsonText);
    } catch {
      return {
        success: false,
        raw,
        error: 'Không thể phân tích JSON trả về từ AI. Xem raw để debug.',
      };
    }

    return {
      success: true,
      data: parsed,
      raw,
    };
  } catch (error: any) {
    console.error('[AIInsightService] Error calling AI:', error?.message || error);
    return {
      success: false,
      error: error?.message || String(error),
    };
  }
}

export default {
  analyzeTransactionsWithAI,
};
