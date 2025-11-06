import React from 'react';

export type IncomePoint = { month: string; value: number; percent: number };

export default function useIncomeChartData(transactions: any[] | undefined): IncomePoint[] {
  return React.useMemo(() => {
    const parseTxDate = (t: any): Date | null => {
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
    };

    const now = new Date();
    const months: { label: string; value: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const total = (transactions || []).reduce((sum: number, tx: any) => {
        if (tx.type !== 'income') return sum;
        const txDate = parseTxDate(tx);
        if (!txDate) return sum;
        if (txDate >= monthStart && txDate <= monthEnd) return sum + (Number(tx.amount) || 0);
        return sum;
      }, 0);

      const label = `T${monthStart.getMonth() + 1}`;
      months.push({ label, value: total });
    }

    const max = Math.max(...months.map((m) => m.value), 1);
    return months.map((m) => ({ month: m.label, value: m.value, percent: Math.round((m.value / max) * 100) }));
  }, [transactions]);
}
