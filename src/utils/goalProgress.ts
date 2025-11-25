export const parseNumber = (v: any): number => {
  if (typeof v === 'number') return v;
  if (v === null || v === undefined || v === '') return 0;
  try {
    const cleaned = String(v).replace(/[^0-9.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
};

export const computeGoalCurrent = (goal: any): number => {
  if (!goal) return 0;
  // Prefer summing transactions when available (source-of-truth).
  const txs = Array.isArray(goal.transactions) ? goal.transactions : [];
  if (txs.length > 0) {
    return txs.reduce((acc: number, t: any) => acc + parseNumber(t?.amount), 0);
  }
  // Fallback to currentAmount field
  return parseNumber(goal.currentAmount || 0);
};

export const getProgress = (current: any, target: any): number => {
  const c = parseNumber(current);
  const t = parseNumber(target);
  if (t <= 0) return 0;
  const pct = (c / t) * 100;
  if (!Number.isFinite(pct) || Number.isNaN(pct)) return 0;
  return Math.min(Math.max(pct, 0), 100);
};

export const computeTotalCurrent = (goals: any[] = []): number => {
  return goals.reduce((sum, g) => sum + computeGoalCurrent(g), 0);
};

export default {
  parseNumber,
  computeGoalCurrent,
  getProgress,
  computeTotalCurrent,
};
