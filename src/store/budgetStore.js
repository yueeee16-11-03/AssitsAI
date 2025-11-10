import { create } from 'zustand';
import BudgetService from '../services/BudgetService';

/**
 * BudgetStore: Zustand store cho ngân sách
 * 
 * Responsibility: Chỉ quản lý STATE.
 * Business logic được handle bởi BudgetService.
 *
 * Flow:
 * Screen → Store.action → Service (CUD + fetch fresh data) → Store.state
 */

export const useBudgetStore = create((set, get) => ({
  // ========== STATE ==========
  budgets: [],
  isLoading: false,
  error: null,
  lastSyncTime: null,

  // ========== SIMPLE STATE SETTERS ==========
  setBudgets: (budgets) => set({ budgets }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  // ========== CRUD OPERATIONS ==========

  /**
   * 1️⃣ FETCH BUDGETS (với tính toán chi tiêu)
   */
  fetchBudgets: async (year, month) => {
    console.log('🔵 [STORE] fetchBudgets called');
    set({ isLoading: true, error: null });

    try {
      const budgets = await BudgetService.getAllBudgetsWithSpending(year, month);

      set({
        budgets,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Fetched', budgets.length, 'budgets');
      return budgets;
    } catch (error) {
      console.error('❌ [STORE] Error fetching budgets:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 2️⃣ THÊM NGÂN SÁCH
   */
  addBudget: async (budgetData) => {
    console.log('🔵 [STORE] addBudget called');
    set({ isLoading: true, error: null });

    try {
      await BudgetService.addBudget(budgetData);

      // Fetch lại dữ liệu mới
      const budgets = await BudgetService.getAllBudgetsWithSpending();

      set({
        budgets,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Budget added and state synced');
      return budgets;
    } catch (error) {
      console.error('❌ [STORE] Error adding budget:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 3️⃣ CẬP NHẬT NGÂN SÁCH
   */
  updateBudget: async (budgetId, updateData) => {
    console.log('🔵 [STORE] updateBudget called');
    set({ isLoading: true, error: null });

    try {
      await BudgetService.updateBudget(budgetId, updateData);

      // Fetch lại dữ liệu mới
      const budgets = await BudgetService.getAllBudgetsWithSpending();

      set({
        budgets,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Budget updated and state synced');
      return budgets;
    } catch (error) {
      console.error('❌ [STORE] Error updating budget:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 4️⃣ XÓA NGÂN SÁCH
   */
  deleteBudget: async (budgetId) => {
    console.log('🔵 [STORE] deleteBudget called');
    set({ isLoading: true, error: null });

    try {
      await BudgetService.deleteBudget(budgetId);

      // Fetch lại dữ liệu mới
      const budgets = await BudgetService.getAllBudgetsWithSpending();

      set({
        budgets,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Budget deleted and state synced');
      return budgets;
    } catch (error) {
      console.error('❌ [STORE] Error deleting budget:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 5️⃣ KHỞI TẠO (lấy dữ liệu lần đầu)
   */
  initialize: async () => {
    console.log('🔵 [STORE] Initializing budget store');
    if (get().isLoading) return; // Tránh gọi lại nếu đang load

    try {
      await get().fetchBudgets();
      console.log('✅ [STORE] Budget store initialized');
    } catch (error) {
      console.error('❌ [STORE] Error initializing budget store:', error);
      set({ error: error.message });
    }
  },

  // ========== GETTERS / SELECTORS ==========

  /**
   * Tính tổng ngân sách
   */
  getTotalBudget: () => {
    return BudgetService.getTotalBudget(get().budgets);
  },

  /**
   * Tính tổng chi tiêu
   */
  getTotalSpent: () => {
    return BudgetService.getTotalSpent(get().budgets);
  },

  /**
   * Tính tổng dự kiến
   */
  getTotalPredicted: () => {
    return BudgetService.getTotalPredicted(get().budgets);
  },

  /**
   * Kiểm tra nếu vượt ngân sách
   */
  isOverBudget: (spent, budget, predicted) => {
    return BudgetService.isOverBudget(spent, budget, predicted);
  },

  /**
   * Tính phần trăm
   */
  getPercentage: (spent, budget) => {
    return BudgetService.getPercentage(spent, budget);
  },

  /**
   * Lấy danh sách ngân sách hiện tại
   */
  getBudgets: () => {
    return get().budgets;
  },

  /**
   * Lấy ngân sách theo ID
   */
  getBudgetById: (budgetId) => {
    return get().budgets.find(b => b.id === budgetId);
  },

  /**
   * Lấy ngân sách theo categoryId
   */
  getBudgetByCategory: (categoryId) => {
    return get().budgets.find(b => b.categoryId === categoryId);
  },

  /**
   * Đếm số lượng ngân sách
   */
  getBudgetCount: () => {
    return get().budgets.length;
  },

  /**
   * Lấy danh sách ngân sách vượt limit
   */
  getOverBudgetItems: () => {
    return get().budgets.filter(b => BudgetService.isOverBudget(b.spent || 0, b.budget, b.predicted || 0));
  },

  /**
   * Tính tổng tiền được cảnh báo (vượt ngân sách)
   */
  getTotalOverAmount: () => {
    return get().getOverBudgetItems()
      .reduce((sum, b) => sum + Math.max(0, (b.spent || 0) - b.budget), 0);
  },
}));
