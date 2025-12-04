import { create } from 'zustand';
import RecurringTransactionService, { RecurringTransaction } from '../services/RecurringTransactionService';

/**
 * RecurringTransactionStore: Zustand store
 * 
 * Flow: Screen → Store.action → Service (CRUD + fetch fresh data) → Store.state
 */
export const useRecurringTransactionStore = create((set, get) => ({
  // ========== STATE ==========
  recurringTransactions: [] as RecurringTransaction[],
  isLoading: false,
  error: null as string | null,
  lastSyncTime: null as string | null,

  // ========== SIMPLE STATE SETTERS ==========
  setRecurringTransactions: (recurringTransactions: RecurringTransaction[]) => 
    set({ recurringTransactions }),
  setLoading: (isLoading: boolean) => 
    set({ isLoading }),
  setError: (error: string | null) => 
    set({ error }),

  // ========== CRUD OPERATIONS ==========

  /**
   * 1️⃣ THÊM GIAO DỊCH LẶP LẠI
   */
  addRecurringTransaction: async (data: RecurringTransaction) => {
    console.log('🔵 [STORE] addRecurringTransaction called');
    set({ isLoading: true, error: null });

    try {
      const result = await RecurringTransactionService.addRecurringTransaction(data);
      
      set({
        recurringTransactions: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Recurring transaction added AND state synced');
      return result;
    } catch (error: any) {
      console.error('❌ [STORE] Error adding recurring transaction:', error?.message);
      set({
        isLoading: false,
        error: error?.message || 'Không thể thêm giao dịch lặp lại',
      });
      throw error;
    }
  },

  /**
   * 2️⃣ CẬP NHẬT GIAO DỊCH LẶP LẠI
   */
  updateRecurringTransaction: async (id: string, data: Partial<RecurringTransaction>) => {
    console.log('🔵 [STORE] updateRecurringTransaction called');
    set({ isLoading: true, error: null });

    try {
      const result = await RecurringTransactionService.updateRecurringTransaction(id, data);
      
      set({
        recurringTransactions: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Recurring transaction updated AND state synced');
      return result;
    } catch (error: any) {
      console.error('❌ [STORE] Error updating recurring transaction:', error?.message);
      set({
        isLoading: false,
        error: error?.message || 'Không thể cập nhật giao dịch lặp lại',
      });
      throw error;
    }
  },

  /**
   * 3️⃣ XÓA GIAO DỊCH LẶP LẠI
   */
  deleteRecurringTransaction: async (id: string) => {
    console.log('🔵 [STORE] deleteRecurringTransaction called with id:', id);
    
    set({ isLoading: true, error: null });

    try {
      console.log('🔵 [STORE] Calling service to delete...');
      const result = await RecurringTransactionService.deleteRecurringTransaction(id);
      console.log('✅ [STORE] Service returned, updating state with', result?.freshData?.length ?? 0, 'items');
      
      set({
        recurringTransactions: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] State updated successfully');
      return result;
    } catch (error: any) {
      console.error('❌ [STORE] Error deleting recurring transaction:', error?.message);
      set({
        isLoading: false,
        error: error?.message || 'Không thể xóa giao dịch lặp lại',
      });
      throw error;
    }
  },

  /**
   * 4️⃣ LẤY TẤT CẢ GIAO DỊCH LẶP LẠI
   */
  fetchRecurringTransactions: async () => {
    console.log('🔵 [STORE] fetchRecurringTransactions called');
    set({ isLoading: true, error: null });

    try {
      const transactions = await RecurringTransactionService.getAllRecurringTransactions();
      console.log('📖 [STORE] Service returned:', transactions.length, 'transactions');

      set({
        recurringTransactions: transactions,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      const newState = get() as any;
      console.log('✅ [STORE] Fetched and state updated:', newState.recurringTransactions?.length, 'recurring transactions');
      return transactions;
    } catch (error: any) {
      console.error('❌ [STORE] Error fetching recurring transactions:', error?.message);
      set({
        isLoading: false,
        error: error?.message || 'Không thể lấy danh sách giao dịch lặp lại',
      });
      throw error;
    }
  },

  /**
   * 5️⃣ TOGGLE ACTIVE STATUS
   */
  toggleRecurringTransactionActive: async (id: string, isActive: boolean) => {
    console.log('🔵 [STORE] toggleRecurringTransactionActive called');
    set({ isLoading: true, error: null });

    try {
      const result = await RecurringTransactionService.toggleRecurringTransactionActive(id, isActive);
      
      set({
        recurringTransactions: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      return result;
    } catch (error: any) {
      console.error('❌ [STORE] Error toggling active:', error?.message);
      set({
        isLoading: false,
        error: error?.message,
      });
      throw error;
    }
  },

  /**
   * 6️⃣ MARK AS PAID
   */
  markRecurringTransactionAsPaid: async (id: string, lastPaid: string, nextDue: string) => {
    console.log('🔵 [STORE] markRecurringTransactionAsPaid called');
    set({ isLoading: true, error: null });

    try {
      const result = await RecurringTransactionService.markRecurringTransactionAsPaid(id, lastPaid, nextDue);
      
      set({
        recurringTransactions: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Marked as paid');
      return result;
    } catch (error: any) {
      console.error('❌ [STORE] Error marking as paid:', error?.message);
      set({
        isLoading: false,
        error: error?.message,
      });
      throw error;
    }
  },

  /**
   * 7️⃣ KHỞI TẠO (LẤY DỮ LIỆU LẦN ĐẦU)
   */
  initialize: async () => {
    console.log('🔵 [STORE] Initializing store');
    const state = get() as any;
    
    if (state.isLoading) return;

    try {
      const transactions = await RecurringTransactionService.getAllRecurringTransactions();
      
      set({
        recurringTransactions: transactions,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Initialized with', transactions.length, 'recurring transactions');
      return transactions;
    } catch (error: any) {
      console.error('❌ [STORE] Error initializing store:', error?.message);
      set({
        isLoading: false,
        error: error?.message,
      });
      throw error;
    }
  },

  /**
   * 8️⃣ GET BY TYPE (HELPER)
   */
  getByType: (type: 'expense' | 'income') => {
    const state = get() as any;
    return state.recurringTransactions.filter((t: RecurringTransaction) => t.type === type);
  },

  /**
   * 9️⃣ GET ACTIVE (HELPER)
   */
  getActive: () => {
    const state = get() as any;
    return state.recurringTransactions.filter((t: RecurringTransaction) => t.isActive);
  },
}));
