/**
 * useFamilyReports.ts
 * Custom hook để quản lý family reports
 */

import { useState, useEffect, useCallback } from 'react';
import FamilyReportService, {
  MonthlyStats,
  TrendData,
  CategoryBreakdown,
  MemberReport,
  ReportSummary,
} from '../services/admin/FamilyReportService';

export const useFamilyReports = (familyId: string | null) => {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [memberReports, setMemberReports] = useState<MemberReport[]>([]);
  const [availableReports, setAvailableReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lấy thống kê tháng hiện tại
  const fetchMonthlyStats = useCallback(
    async (month?: number, year?: number) => {
      if (!familyId) return;

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        const stats = await FamilyReportService.getMonthlyStats(
          familyId,
          targetMonth,
          targetYear
        );
        setMonthlyStats(stats);
      } catch (err: any) {
        console.error('Error fetching monthly stats:', err);
        setError(err.message || 'Không thể tải thống kê tháng');
      } finally {
        setLoading(false);
      }
    },
    [familyId]
  );

  // Lấy xu hướng chi tiêu
  const fetchTrends = useCallback(
    async (monthCount: number = 3) => {
      if (!familyId) return;

      try {
        setLoading(true);
        setError(null);

        const trendData = await FamilyReportService.getTrendAnalysis(familyId, monthCount);
        setTrends(trendData);
      } catch (err: any) {
        console.error('Error fetching trends:', err);
        setError(err.message || 'Không thể tải xu hướng chi tiêu');
      } finally {
        setLoading(false);
      }
    },
    [familyId]
  );

  // Lấy phân tích danh mục
  const fetchCategoryBreakdown = useCallback(
    async (month?: number, year?: number) => {
      if (!familyId) return;

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        const breakdown = await FamilyReportService.getCategoryBreakdown(
          familyId,
          targetMonth,
          targetYear
        );
        setCategoryBreakdown(breakdown);
      } catch (err: any) {
        console.error('Error fetching category breakdown:', err);
        setError(err.message || 'Không thể tải phân tích danh mục');
      } finally {
        setLoading(false);
      }
    },
    [familyId]
  );

  // Lấy báo cáo thành viên
  const fetchMemberReports = useCallback(
    async (month?: number, year?: number) => {
      if (!familyId) return;

      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        const reports = await FamilyReportService.getMemberReports(
          familyId,
          targetMonth,
          targetYear
        );
        setMemberReports(reports);
      } catch (err: any) {
        console.error('Error fetching member reports:', err);
        setError(err.message || 'Không thể tải báo cáo thành viên');
      } finally {
        setLoading(false);
      }
    },
    [familyId]
  );

  // Lấy danh sách báo cáo có sẵn
  const fetchAvailableReports = useCallback(async () => {
    if (!familyId) return;

    try {
      const reports = await FamilyReportService.getAvailableReports(familyId);
      setAvailableReports(reports);
    } catch (err: any) {
      console.error('Error fetching available reports:', err);
    }
  }, [familyId]);

  // Refresh tất cả dữ liệu
  const refreshAll = useCallback(async () => {
    if (!familyId) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchMonthlyStats(),
        fetchTrends(),
        fetchCategoryBreakdown(),
        fetchMemberReports(),
        fetchAvailableReports(),
      ]);
    } catch (err: any) {
      console.error('Error refreshing all reports:', err);
      setError('Không thể tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  }, [
    familyId,
    fetchMonthlyStats,
    fetchTrends,
    fetchCategoryBreakdown,
    fetchMemberReports,
    fetchAvailableReports,
  ]);

  // Auto-fetch khi có familyId
  useEffect(() => {
    if (familyId) {
      fetchMonthlyStats();
      fetchAvailableReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  return {
    // Data
    monthlyStats,
    trends,
    categoryBreakdown,
    memberReports,
    availableReports,

    // State
    loading,
    error,

    // Methods
    fetchMonthlyStats,
    fetchTrends,
    fetchCategoryBreakdown,
    fetchMemberReports,
    fetchAvailableReports,
    refreshAll,
  };
};
