import React, { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTransactionStore } from '../store/transactionStore';

/**
 * Custom Hook: useTransactionData
 * 
 * Mục đích: Tập trung logic tự động fetch dữ liệu giao dịch
 * 
 * Features:
 * ✓ Tự động gọi store.initialize() lần đầu tiên
 * ✓ Tự động refresh dữ liệu khi màn hình được focus (useFocusEffect)
 * ✓ Cấp cố định: transactions, isLoading, error
 * 
 * Usage:
 * const { transactions, isLoading, error } = useTransactionData();
 * 
 * @returns {Object} { transactions, isLoading, error, refetch }
 */
export const useTransactionData = () => {
  // Lấy từ Zustand store
  const transactions = useTransactionStore((state) => state.transactions);
  const isLoading = useTransactionStore((state) => state.isLoading);
  const error = useTransactionStore((state) => state.error);
  const fetchTransactions = useTransactionStore((state) => state.fetchTransactions);
  const initialize = useTransactionStore((state) => state.initialize);

  // Khởi tạo dữ liệu lần đầu tiên
  useEffect(() => {
    console.log('📱 [HOOK] useTransactionData mounted - initializing store');
    initialize();
  }, [initialize]);

  // Refresh dữ liệu khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [HOOK] Screen focused - refreshing transactions');
      fetchTransactions().catch((err) => {
        console.error('❌ [HOOK] Error refreshing transactions:', err);
      });
    }, [fetchTransactions])
  );

  // Hàm manual refresh (nếu cần)
  const refetch = async () => {
    console.log('🔁 [HOOK] Manual refetch called');
    try {
      await fetchTransactions();
    } catch (err) {
      console.error('❌ [HOOK] Error during manual refetch:', err);
    }
  };

  return {
    transactions,
    isLoading,
    error,
    refetch,
  };
};
