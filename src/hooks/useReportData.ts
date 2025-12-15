import React, { useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useReportStore } from '../store/reportStore';

/**
 * Custom Hook: useReportData
 * 
 * Mục đích: Tập trung logic tự động fetch dữ liệu báo cáo
 * 
 * Features:
 * ✓ Tự động gọi initialize() lần đầu tiên để fetch từ API
 * ✓ Tự động refresh dữ liệu khi màn hình được focus
 * ✓ Cấp cố định: reportData, isLoading, error
 * 
 * Usage:
 * const { reportData, isLoading, error } = useReportData();
 * 
 * @returns {Object} { reportData, isLoading, error, refetch }
 */
export const useReportData = () => {
  // Lấy từ Zustand store
  const reportData = useReportStore((state) => state.reportData);
  const budgets = useReportStore((state) => state.budgets);
  const habits = useReportStore((state) => state.habits);
  const goals = useReportStore((state) => state.goals);
  const isLoading = useReportStore((state) => state.isLoading);
  const error = useReportStore((state) => state.error);
  
  const fetchAllReportDataFromAPI = useReportStore((state) => state.fetchAllReportDataFromAPI);

  // Khởi tạo dữ liệu lần đầu tiên (fetch từ API)
  useEffect(() => {
    console.log('📊 [HOOK] useReportData mounted - initializing store');
    const initialize = async () => {
      try {
        await fetchAllReportDataFromAPI();
        console.log('✅ [HOOK] Report data initialized from API');
      } catch (err) {
        console.error('❌ [HOOK] Error initializing report data:', err);
      }
    };

    initialize();
  }, [fetchAllReportDataFromAPI]);

  // Refresh dữ liệu khi màn hình được focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [HOOK] Report screen focused - refreshing data');
      const refresh = async () => {
        try {
          await fetchAllReportDataFromAPI();
        } catch (err) {
          console.error('❌ [HOOK] Error refreshing report data:', err);
        }
      };
      refresh();
    }, [fetchAllReportDataFromAPI])
  );

  // Hàm manual refresh (nếu cần)
  const refetch = async () => {
    console.log('🔁 [HOOK] Manual refetch called');
    try {
      await fetchAllReportDataFromAPI();
    } catch (err) {
      console.error('❌ [HOOK] Error during manual refetch:', err);
    }
  };

  return {
    reportData,
    budgets,
    habits,
    goals,
    isLoading,
    error,
    refetch,
  };
};
