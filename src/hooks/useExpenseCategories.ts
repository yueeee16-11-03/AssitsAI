import React from 'react';

const CATEGORY_COLORS = ["#EC4899", "#8B5CF6", "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

export type Period = 'day' | 'week' | 'month' | 'year';

export type ExpenseCategory = {
  name: string;
  amount: number;
  percent: number;
  color: string;
  trend: string;
};

function parseTxDate(t: any): Date | null {
  try {
    if (!t) return null;
    if (t.date?.toDate && typeof t.date.toDate === 'function') return t.date.toDate();
    if (typeof t.date === 'string') return new Date(t.date);
    if (typeof t.createdAt === 'string') return new Date(t.createdAt);
    if (t.createdAt?.toDate && typeof t.createdAt.toDate === 'function') return t.createdAt.toDate();
    if (typeof t.date === 'number') return new Date(t.date);
    return null;
  } catch {
    return null;
  }
}

export default function useExpenseCategories(transactions: any[] | undefined, selectedPeriod: Period) {
  return React.useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    switch (selectedPeriod) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week': {
        const dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }
    const endDate = now;

    const byCat = {} as Record<string, number>;
    (transactions || []).forEach((tx: any) => {
      if (tx.type !== 'expense') return;
      const txDate = parseTxDate(tx);
      if (!txDate) return;
      if (txDate < startDate || txDate > endDate) return;
      const cat = tx.category || 'Khác';
      byCat[cat] = (byCat[cat] || 0) + (Number(tx.amount) || 0);
    });

    const entries = Object.entries(byCat).map(([name, amount]) => ({ name, amount }));
    const total = entries.reduce((s, e) => s + e.amount, 0) || 1;
    const sorted = entries.sort((a, b) => b.amount - a.amount).slice(0, 6);

    return sorted.map((e, idx) => ({
      name: e.name,
      amount: e.amount,
      percent: Math.round((e.amount / total) * 100),
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      trend: '',
    })) as ExpenseCategory[];
  }, [transactions, selectedPeriod]);
}
