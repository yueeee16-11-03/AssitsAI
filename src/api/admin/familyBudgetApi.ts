/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║                 FAMILY BUDGET API LAYER                                    ║
 * ║            Wrapper API cho FamilyBudgetManagementService                   ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 * 
 * 📌 Mục đích:
 * - Provide clean API interface cho UI components
 * - Type-safe methods với error handling
 * - Response formatting & logging
 * - Data transformation
 */

import FamilyBudgetManagementService, {
  FamilyBudget,
  BudgetDetail,
  MemberSpendingLimit,
  BudgetReport,
  DEFAULT_BUDGET_CONFIG,
} from '../../services/admin/FamilyBudgetManagementService';

// ════════════════════════════════════════════════════════════════════════════
// API RESPONSE FORMAT
// ════════════════════════════════════════════════════════════════════════════

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// ════════════════════════════════════════════════════════════════════════════
// BUDGET QUERIES
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📖 Get all family budgets with calculations
 */
export async function getFamilyBudgets(
  familyId: string,
  options?: {
    includeInactive?: boolean;
    orderBy?: 'createdAt' | 'spentAmount' | 'allocatedAmount';
  }
): Promise<ApiResponse<BudgetDetail[]>> {
  try {
    const budgets = await FamilyBudgetManagementService.getFamilyBudgets(
      familyId,
      options
    );
    return {
      success: true,
      data: budgets,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * 💵 Get single budget detail with full calculations
 */
export async function getBudgetDetail(
  familyId: string,
  budgetId: string
): Promise<ApiResponse<BudgetDetail>> {
  try {
    const budget = await FamilyBudgetManagementService.getBudgetDetail(
      familyId,
      budgetId
    );
    return {
      success: true,
      data: budget,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * 👥 Get member spending limits
 */
export async function getMemberSpendingLimits(
  familyId: string
): Promise<ApiResponse<MemberSpendingLimit[]>> {
  try {
    const limits = await FamilyBudgetManagementService.getSpendingLimits(
      familyId
    );
    return {
      success: true,
      data: limits,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * 📊 Generate comprehensive budget report
 */
export async function generateBudgetReport(
  familyId: string
): Promise<ApiResponse<BudgetReport>> {
  try {
    const report = await FamilyBudgetManagementService.generateBudgetReport(
      familyId
    );
    return {
      success: true,
      data: report,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// BUDGET MUTATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * ➕ Create new budget
 */
export async function createBudget(
  familyId: string,
  budgetData: Omit<
    FamilyBudget,
    'id' | 'createdAt' | 'updatedAt' | 'spentAmount' | 'remainingAmount'
  >
): Promise<ApiResponse<BudgetDetail>> {
  try {
    const budget = await FamilyBudgetManagementService.createBudget(
      familyId,
      budgetData
    );
    return {
      success: true,
      data: budget,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * ✏️ Update budget
 */
export async function updateBudget(
  familyId: string,
  budgetId: string,
  updates: Partial<FamilyBudget>
): Promise<ApiResponse<{ success: true }>> {
  try {
    await FamilyBudgetManagementService.updateBudget(
      familyId,
      budgetId,
      updates
    );
    return {
      success: true,
      data: { success: true },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * 🔒 Lock/unlock budget
 */
export async function lockBudget(
  familyId: string,
  budgetId: string,
  locked: boolean
): Promise<ApiResponse<{ success: true }>> {
  try {
    await FamilyBudgetManagementService.lockBudget(
      familyId,
      budgetId,
      locked
    );
    return {
      success: true,
      data: { success: true },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * 🗑️ Delete budget
 */
export async function deleteBudget(
  familyId: string,
  budgetId: string
): Promise<ApiResponse<{ success: true }>> {
  try {
    await FamilyBudgetManagementService.deleteBudget(familyId, budgetId);
    return {
      success: true,
      data: { success: true },
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * 📋 Get default budget config
 */
export function getDefaultBudgetConfig() {
  return DEFAULT_BUDGET_CONFIG;
}

/**
 * 🎨 Format budget status with color
 */
export function formatBudgetStatus(status: string) {
  const statusConfig: Record<
    string,
    { label: string; color: string; icon: string }
  > = {
    safe: {
      label: '✅ An toàn',
      color: '#10B981',
      icon: 'check-circle',
    },
    warning: {
      label: '⚠️ Cảnh báo',
      color: '#F59E0B',
      icon: 'alert-circle',
    },
    critical: {
      label: '❌ Vượt quá',
      color: '#EF4444',
      icon: 'close-circle',
    },
  };

  return statusConfig[status] || statusConfig.safe;
}

/**
 * 💱 Format currency display
 */
export function formatCurrencyDisplay(
  amount: number,
  currency: string = 'VND'
): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * 📊 Calculate progress bar data
 */
export function calculateProgressData(spent: number, allocated: number) {
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);
  const remaining = Math.max(0, allocated - spent);

  return {
    percentage: clampedPercentage,
    remaining,
    isOver: spent > allocated,
    overAmount: Math.max(0, spent - allocated),
  };
}

/**
 * 📈 Get alert level based on percentage
 */
export function getAlertLevel(
  percentage: number
): 'safe' | 'warning' | 'critical' {
  if (percentage < 50) return 'safe';
  if (percentage < 80) return 'warning';
  return 'critical';
}

// ════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════════════════

export type {
  FamilyBudget,
  BudgetDetail,
  MemberSpendingLimit,
  BudgetReport,
};
export { DEFAULT_BUDGET_CONFIG };
