/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                    HOOKS FOR FAMILY BUDGET                                 ║
 * ║         Custom React Hooks để quản lý ngân sách gia đình                   ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * 🎣 Các hook này cung cấp:
 * - State management cho budgets
 * - Real-time listeners & sync
 * - Loading & error handling
 * - Caching & optimization
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as familyBudgetApi from '../../api/admin/familyBudgetApi';
import {
  BudgetDetail,
  MemberSpendingLimit,
  BudgetReport,
  FamilyBudget,
} from '../../api/admin/familyBudgetApi';

/**
 * 📖 Hook lấy danh sách ngân sách của gia đình
 */
export function useFamilyBudgets(familyId: string) {
  const [budgets, setBudgets] = useState<BudgetDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchBudgets = useCallback(async () => {
    if (!familyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await familyBudgetApi.getFamilyBudgets(familyId);

      if (isMountedRef.current) {
        if (response.success && response.data) {
          setBudgets(response.data);
        } else {
          setError(response.error || 'Failed to fetch budgets');
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [familyId]);

  useEffect(() => {
    fetchBudgets();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    error,
    refetch: fetchBudgets,
  };
}

/**
 * 💵 Hook lấy chi tiết ngân sách cụ thể
 */
export function useBudgetDetail(familyId: string, budgetId: string) {
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchBudget = useCallback(async () => {
    if (!familyId || !budgetId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await familyBudgetApi.getBudgetDetail(
        familyId,
        budgetId
      );

      if (isMountedRef.current) {
        if (response.success && response.data) {
          setBudget(response.data);
        } else {
          setError(response.error || 'Failed to fetch budget');
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [familyId, budgetId]);

  useEffect(() => {
    fetchBudget();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBudget]);

  return {
    budget,
    loading,
    error,
    refetch: fetchBudget,
  };
}

/**
 * 👥 Hook lấy hạn mức chi tiêu của thành viên
 */
export function useMemberSpendingLimits(familyId: string) {
  const [limits, setLimits] = useState<MemberSpendingLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchLimits = useCallback(async () => {
    if (!familyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await familyBudgetApi.getMemberSpendingLimits(
        familyId
      );

      if (isMountedRef.current) {
        if (response.success && response.data) {
          setLimits(response.data);
        } else {
          setError(response.error || 'Failed to fetch limits');
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [familyId]);

  useEffect(() => {
    fetchLimits();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchLimits]);

  return {
    limits,
    loading,
    error,
    refetch: fetchLimits,
  };
}

/**
 * 📊 Hook lấy báo cáo ngân sách
 */
export function useBudgetReport(familyId: string) {
  const [report, setReport] = useState<BudgetReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchReport = useCallback(async () => {
    if (!familyId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await familyBudgetApi.generateBudgetReport(familyId);

      if (isMountedRef.current) {
        if (response.success && response.data) {
          setReport(response.data);
        } else {
          setError(response.error || 'Failed to generate report');
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [familyId]);

  useEffect(() => {
    fetchReport();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchReport]);

  return {
    report,
    loading,
    error,
    refetch: fetchReport,
  };
}

/**
 * ✏️ Hook tạo/cập nhật ngân sách
 */
export function useBudgetMutation(familyId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBudget = useCallback(
    async (
      budgetData: Omit<
        FamilyBudget,
        'id' | 'createdAt' | 'updatedAt' | 'spentAmount' | 'remainingAmount'
      >
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await familyBudgetApi.createBudget(
          familyId,
          budgetData
        );

        if (response.success) {
          return { success: true, budgetId: response.data?.id };
        } else {
          setError(response.error || 'Failed to create budget');
          return { success: false };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [familyId]
  );

  const updateBudget = useCallback(
    async (
      budgetId: string,
      updates: Partial<FamilyBudget>
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await familyBudgetApi.updateBudget(
          familyId,
          budgetId,
          updates
        );

        if (response.success) {
          return { success: true };
        } else {
          setError(response.error || 'Failed to update budget');
          return { success: false };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [familyId]
  );

  const deleteBudget = useCallback(
    async (budgetId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await familyBudgetApi.deleteBudget(
          familyId,
          budgetId
        );

        if (response.success) {
          return { success: true };
        } else {
          setError(response.error || 'Failed to delete budget');
          return { success: false };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [familyId]
  );

  const lockBudget = useCallback(
    async (budgetId: string, locked: boolean) => {
      setLoading(true);
      setError(null);

      try {
        const response = await familyBudgetApi.lockBudget(
          familyId,
          budgetId,
          locked
        );

        if (response.success) {
          return { success: true };
        } else {
          setError(response.error || 'Failed to lock budget');
          return { success: false };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [familyId]
  );

  return {
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    lockBudget,
  };
}

export type {
  BudgetDetail,
  MemberSpendingLimit,
  BudgetReport,
  FamilyBudget,
};

export {
  formatCurrencyDisplay,
  calculateProgressData,
  getAlertLevel,
  formatBudgetStatus,
} from '../../api/admin/familyBudgetApi';
