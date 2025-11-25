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

// Initialize month/year ONCE at module load time (not on every render)
const initDate = new Date();
const INIT_YEAR = initDate.getFullYear();
const INIT_MONTH = initDate.getMonth();

export const useBudgetStore = create((set, get) => ({
  // ========== STATE ==========
  budgets: [],
  isLoading: false,
  error: null,
  lastSyncTime: null,
  // remember which year/month we last fetched so mutations can re-sync the same view
  currentYear: INIT_YEAR,
  currentMonth: INIT_MONTH,

  // ========== SIMPLE STATE SETTERS ==========
  setBudgets: (budgets) => set({ budgets }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),
  setCurrentYear: (year) => set({ currentYear: year }),
  setCurrentMonth: (month) => {
    console.log('🔁 [STORE] setCurrentMonth ->', month);
    set({ currentMonth: month });
  },

  // ========== CRUD OPERATIONS ==========

  /**
   * 1️⃣ FETCH BUDGETS (với tính toán chi tiêu)
   */
  fetchBudgets: async (year, month) => {
    const currentState = get();
    const useYear = typeof year === 'number' ? year : currentState.currentYear;
    const useMonth = typeof month === 'number' ? month : currentState.currentMonth;
    
    console.log('🔵 [STORE] fetchBudgets START - requesting year=', useYear, 'month=', useMonth);
    console.log('   Current state - budgets:', currentState.budgets.length, 'year:', currentState.currentYear, 'month:', currentState.currentMonth);
    // Show full-page loader only if we don't have cached budgets
    const showLoader = !(currentState.budgets && currentState.budgets.length > 0);
    set({ isLoading: showLoader, error: null });

    try {
      console.log(`🔎 [STORE] Service call: getAllBudgetsWithSpending(${useYear}, ${useMonth})`);
      const budgets = await BudgetService.getAllBudgetsWithSpending(useYear, useMonth);

      console.log(`✅ [STORE] Service returned ${budgets.length} budgets`);
      if (budgets.length > 0) {
        console.log('   Budgets:', budgets.map((b) => `${b.category}(id=${b.id},spent=${b.spent})`).join(', '));
      }

      // Update state with new budgets
      set({
        budgets,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
        currentYear: useYear,
        currentMonth: useMonth,
      });

      console.log('✅ [STORE] State updated - budgets now:', budgets.length);
      return budgets;
    } catch (error) {
      console.error('❌ [STORE] fetchBudgets ERROR:', error.message);
      // If we have cached budgets, keep them and surface the error (background error)
      if (currentState.budgets && currentState.budgets.length > 0) {
        console.warn('⚠️ [STORE] Fetch failed but keeping cached budgets');
        set({
          isLoading: false,
          error: `Fetch error (using cached): ${error.message}`,
          lastSyncTime: new Date().toISOString(),
          currentYear: useYear,
          currentMonth: useMonth,
        });
        return currentState.budgets;
      }

      // No cached budgets - show an empty state with error
      set({
        isLoading: false,
        error: error.message,
        budgets: [],
      });
      throw error;
    }
  },

  /**
   * 2️⃣ THÊM NGÂN SÁCH
   */
  addBudget: async (budgetData) => {
    console.log('🔵 [STORE] addBudget called');
    const currentState = get();
    const showLoader = !(currentState.budgets && currentState.budgets.length > 0);
    set({ isLoading: showLoader, error: null });

    try {
      await BudgetService.addBudget(budgetData);

      // Fetch lại dữ liệu mới
      const budgets = await BudgetService.getAllBudgetsWithSpending(get().currentYear, get().currentMonth);

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
    const currentState = get();
    const showLoader = !(currentState.budgets && currentState.budgets.length > 0);
    set({ isLoading: showLoader, error: null });

    try {
      await BudgetService.updateBudget(budgetId, updateData);

      // Fetch lại dữ liệu mới
      const budgets = await BudgetService.getAllBudgetsWithSpending(get().currentYear, get().currentMonth);

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
    const currentState = get();
    const showLoader = !(currentState.budgets && currentState.budgets.length > 0);
    set({ isLoading: showLoader, error: null });

    try {
      await BudgetService.deleteBudget(budgetId);

      // Fetch lại dữ liệu mới
      const budgets = await BudgetService.getAllBudgetsWithSpending(get().currentYear, get().currentMonth);

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
      await get().fetchBudgets(get().currentYear, get().currentMonth);
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
