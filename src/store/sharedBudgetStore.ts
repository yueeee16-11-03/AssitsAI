import { create } from 'zustand';
import SharedBudgetApi, { SharedBudget } from '../api/sharedBudgetApi';

interface SharedBudgetState {
  // State
  budgets: SharedBudget[];
  currentBudget: SharedBudget | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchBudgets: (familyId: string) => Promise<void>;
  fetchBudgetDetail: (familyId: string, budgetId: string) => Promise<void>;
  createBudget: (
    familyId: string,
    budget: Omit<SharedBudget, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ success: boolean; budgetId?: string }>;
  updateBudget: (
    familyId: string,
    budgetId: string,
    updates: Partial<Omit<SharedBudget, 'id' | 'createdAt' | 'createdBy'>>
  ) => Promise<{ success: boolean }>;
  deleteBudget: (familyId: string, budgetId: string) => Promise<{ success: boolean }>;
  addSpending: (
    familyId: string,
    budgetId: string,
    amount: number,
    description: string,
    category: string,
    memberName?: string
  ) => Promise<{ success: boolean }>;
  clearError: () => void;
  clearCurrentBudget: () => void;
}

export const useSharedBudgetStore = create<SharedBudgetState>((set) => ({
  // Initial state
  budgets: [],
  currentBudget: null,
  loading: false,
  error: null,

  // Fetch all budgets for a family
  fetchBudgets: async (familyId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await SharedBudgetApi.getSharedBudgets(familyId);
      if (response.success && response.budgets) {
        set({ budgets: response.budgets, loading: false });
      } else {
        set({ error: response.error || 'Failed to fetch budgets', loading: false });
      }
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  // Fetch a specific budget
  fetchBudgetDetail: async (familyId: string, budgetId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await SharedBudgetApi.getSharedBudget(familyId, budgetId);
      if (response.success && response.budget) {
        set({ currentBudget: response.budget, loading: false });
      } else {
        set({ error: response.error || 'Failed to fetch budget', loading: false });
      }
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  // Create a new budget
  createBudget: async (familyId: string, budget) => {
    set({ loading: true, error: null });
    try {
      const response = await SharedBudgetApi.createSharedBudget(familyId, budget);
      if (response.success) {
        // Refresh budgets list
        const budgetsResponse = await SharedBudgetApi.getSharedBudgets(familyId);
        if (budgetsResponse.success && budgetsResponse.budgets) {
          set({ budgets: budgetsResponse.budgets, loading: false });
        }
        return { success: true, budgetId: response.budgetId };
      } else {
        set({ error: response.error || 'Failed to create budget', loading: false });
        return { success: false };
      }
    } catch (error) {
      const errorMsg = String(error);
      set({ error: errorMsg, loading: false });
      return { success: false };
    }
  },

  // Update a budget
  updateBudget: async (familyId: string, budgetId: string, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await SharedBudgetApi.updateSharedBudget(familyId, budgetId, updates);
      if (response.success) {
        // Update local state
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === budgetId ? { ...b, ...updates } : b
          ),
          currentBudget:
            state.currentBudget?.id === budgetId
              ? { ...state.currentBudget, ...updates }
              : state.currentBudget,
          loading: false,
        }));
        return { success: true };
      } else {
        set({ error: response.error || 'Failed to update budget', loading: false });
        return { success: false };
      }
    } catch (error) {
      const errorMsg = String(error);
      set({ error: errorMsg, loading: false });
      return { success: false };
    }
  },

  // Delete a budget
  deleteBudget: async (familyId: string, budgetId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await SharedBudgetApi.deleteSharedBudget(familyId, budgetId);
      if (response.success) {
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== budgetId),
          currentBudget: state.currentBudget?.id === budgetId ? null : state.currentBudget,
          loading: false,
        }));
        return { success: true };
      } else {
        set({ error: response.error || 'Failed to delete budget', loading: false });
        return { success: false };
      }
    } catch (error) {
      const errorMsg = String(error);
      set({ error: errorMsg, loading: false });
      return { success: false };
    }
  },

  // Add spending to a budget
  addSpending: async (familyId, budgetId, amount, description, category, memberName) => {
    set({ loading: true, error: null });
    try {
      const response = await SharedBudgetApi.addBudgetSpending(
        familyId,
        budgetId,
        amount,
        description,
        category,
        memberName
      );
      if (response.success) {
        // Refresh budget detail
        const budgetResponse = await SharedBudgetApi.getSharedBudget(familyId, budgetId);
        if (budgetResponse.success && budgetResponse.budget) {
          set({ currentBudget: budgetResponse.budget, loading: false });
        }
        return { success: true };
      } else {
        set({ error: response.error || 'Failed to add spending', loading: false });
        return { success: false };
      }
    } catch (error) {
      const errorMsg = String(error);
      set({ error: errorMsg, loading: false });
      return { success: false };
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },

  // Clear current budget
  clearCurrentBudget: () => {
    set({ currentBudget: null });
  },
}));
