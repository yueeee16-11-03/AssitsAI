import { create } from 'zustand';
import TransactionService from '../services/TransactionService';

/**
 * TransactionStore: Zustand store cho giao dịch
 * * Responsibility: Chỉ quản lý STATE.
 * Business logic được handle bởi TransactionService.
 *
 * Flow (Đồng bộ 100%):
 * Screen → Store.action → Service (thực hiện CUD + fetch fresh data) → Store.state
 */

export const useTransactionStore = create((set, get) => ({
  // ========== STATE ==========
  transactions: [],
  isLoading: false,
  error: null,
  lastSyncTime: null,

  // ========== SIMPLE STATE SETTERS ==========
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  // ========== CRUD OPERATIONS (Đã đồng bộ) ==========

  /**
   * 1️⃣ THÊM GIAO DỊCH (ĐÃ SỬA)
   * Gọi Service, sau đó cập nhật state bằng freshData
   */
  addTransaction: async (transactionData) => {
    console.log('🔵 [STORE] addTransaction called');
    set({ isLoading: true, error: null });
    
    try {
      // 1. Gọi Service, Service sẽ thêm và fetch lại dữ liệu mới
      const result = await TransactionService.addTransaction(transactionData);
      
      // 2. Cập nhật state với dữ liệu đồng bộ (freshData)
      set({
        transactions: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Transaction added AND state synced');
      return result; // Trả về kết quả từ Service

    } catch (error) {
      console.error('❌ [STORE] Error adding transaction:', error.message);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * 2️⃣ CẬP NHẬT GIAO DỊCH (ĐÃ SỬA)
   * Gọi Service, sau đó cập nhật state bằng freshData
   */
  updateTransaction: async (transactionId, updateData) => {
    console.log('🔵 [STORE] updateTransaction called');
    set({ isLoading: true, error: null });
    
    try {
      // 1. Gọi Service, Service sẽ sửa và fetch lại dữ liệu mới
      const result = await TransactionService.updateTransaction(
        transactionId,
        updateData
      );

      // 2. Cập nhật state với dữ liệu đồng bộ (freshData)
      set({
        transactions: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Transaction updated AND state synced');
      return result;

    } catch (error) {
      console.error('❌ [STORE] Error updating transaction:', error.message);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * 3️⃣ XÓA GIAO DỊCH (Hàm này đã đúng, giữ nguyên)
   * Gọi Service, sau đó cập nhật state bằng freshData
   */
  deleteTransaction: async (transactionId) => {
    console.log('🔵 [STORE] deleteTransaction called');
    set({ isLoading: true, error: null });
    
    try {
      // 1. Gọi Service, Service sẽ xóa và fetch lại dữ liệu mới
      const result = await TransactionService.deleteTransaction(transactionId);
      
      // 2. Cập nhật state với dữ liệu đồng bộ (freshData)
      set({
        transactions: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Transaction deleted AND state synced');
      return result;

    } catch (error) {
      console.error('❌ [STORE] Error deleting transaction:', error.message);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * 4️⃣ LẤY TẤT CẢ GIAO DỊCH (Hàm này đã đúng)
   * Gọi Service và cập nhật state
   */
  fetchTransactions: async () => {
    console.log('🔵 [STORE] fetchTransactions called');
    set({ isLoading: true, error: null });
    
    try {
      // Gọi Service để fetch từ Firestore
      const transactions = await TransactionService.getAllTransactions();

      // Update state
      set({ 
        transactions,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Fetched', transactions.length, 'transactions');
      return transactions;

    } catch (error) {
      console.error('❌ [STORE] Error fetching transactions:', error.message);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * 5️⃣ KHỞI TẠO (lấy dữ liệu lần đầu)
   */
  initialize: async () => {
    console.log('🔵 [STORE] Initializing store');
    if (get().isLoading) return; // Tránh gọi lại nếu đang load
    
    try {
      await get().fetchTransactions();
      console.log('✅ [STORE] Store initialized');
    } catch (error) {
      console.error('❌ [STORE] Error initializing store:', error);
      set({ error: error.message });
    }
  },

  // ========== SELECTORS / GETTERS ==========
  // (Giữ nguyên)

  getTransactionCount: () => {
    return get().transactions.length;
  },

  getMonthlyExpense: (year, month) => {
    return get().transactions
      .filter(t => {
        const date = new Date(t.date?.toDate?.() || t.createdAt?.toDate?.() || t.date || t.createdAt);
        if (!date || isNaN(date.getTime())) return false; // Thêm kiểm tra date hợp lệ
        return date.getFullYear() === year && date.getMonth() === month - 1 && t.type === 'expense';
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  },

  getMonthlyIncome: (year, month) => {
    return get().transactions
      .filter(t => {
        const date = new Date(t.date?.toDate?.() || t.createdAt?.toDate?.() || t.date || t.createdAt);
        if (!date || isNaN(date.getTime())) return false; // Thêm kiểm tra date hợp lệ
        return date.getFullYear() === year && date.getMonth() === month - 1 && t.type === 'income';
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  },

  getByType: (type) => {
    return get().transactions.filter(t => t.type === type);
  },

  getByCategory: (category) => {
    return get().transactions.filter(t => t.category === category);
  },

  getTotalByCategory: () => {
    const byCategory = {};
    get().transactions.forEach(t => {
      // Chỉ tính toán nếu là 'expense' (chi tiêu)
      if (t.type === 'expense') {
        const cat = t.category || 'Khác';
        byCategory[cat] = (byCategory[cat] || 0) + (t.amount || 0);
      }
    });
    return byCategory;
  },
}));