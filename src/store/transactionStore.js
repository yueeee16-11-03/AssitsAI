import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const useTransactionStore = create((set, get) => ({
  // State
  transactions: [],
  isLoading: false,
  error: null,
  lastSyncTime: null,

  // Actions
  setTransactions: (transactions) => set({ transactions }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  // Thêm giao dịch mới
  addTransaction: async (transactionData) => {
    set({ isLoading: true });
    
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Lưu vào Firestore
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .add({
          ...transactionData,
          userId: currentUser.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      // Cập nhật danh sách
      await get().fetchTransactions();

      set({ isLoading: false, error: null });
    } catch (error) {
      console.error('Error adding transaction:', error);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  // Lấy tất cả giao dịch
  fetchTransactions: async () => {
    set({ isLoading: true });
    
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .get();

      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      set({ 
        transactions,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  // Xóa giao dịch
  deleteTransaction: async (transactionId) => {
    set({ isLoading: true });
    
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .doc(transactionId)
        .delete();

      // Cập nhật state
      const updated = get().transactions.filter(t => t.id !== transactionId);
      set({ 
        transactions: updated,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  // Cập nhật giao dịch
  updateTransaction: async (transactionId, updateData) => {
    set({ isLoading: true });
    
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .doc(transactionId)
        .update({
          ...updateData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      // Cập nhật state
      const updated = get().transactions.map(t =>
        t.id === transactionId ? { ...t, ...updateData } : t
      );

      set({ 
        transactions: updated,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  // Khởi tạo - lấy dữ liệu từ Firestore
  initialize: async () => {
    try {
      await get().fetchTransactions();
    } catch (error) {
      console.error('Error initializing:', error);
    }
  },

  // Lấy tổng số giao dịch
  getTransactionCount: () => {
    return get().transactions.length;
  },

  // Lấy tổng chi tiêu trong tháng
  getMonthlyExpense: (year, month) => {
    return get().transactions
      .filter(t => {
        const date = new Date(t.date?.toDate?.() || t.createdAt?.toDate?.() || t.date || t.createdAt);
        return date.getFullYear() === year && date.getMonth() === month - 1 && t.type === 'expense';
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  },

  // Lấy tổng thu nhập trong tháng
  getMonthlyIncome: (year, month) => {
    return get().transactions
      .filter(t => {
        const date = new Date(t.date?.toDate?.() || t.createdAt?.toDate?.() || t.date || t.createdAt);
        return date.getFullYear() === year && date.getMonth() === month - 1 && t.type === 'income';
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  },

  // Lấy giao dịch theo loại
  getByType: (type) => {
    return get().transactions.filter(t => t.type === type);
  },

  // Lấy giao dịch theo danh mục
  getByCategory: (category) => {
    return get().transactions.filter(t => t.category === category);
  },

  // Tính tổng theo danh mục
  getTotalByCategory: () => {
    const byCategory = {};
    get().transactions.forEach(t => {
      const cat = t.category || 'Khác';
      byCategory[cat] = (byCategory[cat] || 0) + (t.amount || 0);
    });
    return byCategory;
  },
}));
