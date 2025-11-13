/**
 * Report Types and Interfaces
 * Định nghĩa các loại báo cáo và cấu trúc dữ liệu
 */

export type ReportType = 'summary' | 'detailed' | 'budget' | 'habits' | 'goals';
export type ExportFormat = 'csv' | 'json' | 'pdf' | 'detailed-pdf';
export type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Giao dịch tài chính
 */
export interface Transaction {
  id: string;
  date: string; // Format: YYYY-MM-DD
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  wallet: string; // Tài khoản: Tiền mặt, VCB, etc.
  note?: string;
}

/**
 * Dữ liệu báo cáo chính
 */
export interface ReportData {
  totalIncome: number;
  totalExpense: number;
  balance: number; // totalIncome - totalExpense
  transactions: Transaction[];
  categoryBreakdown: Record<string, number>;
}

/**
 * Ngân sách theo danh mục
 */
export interface Budget {
  id: string;
  category: string; // Tên danh mục
  amount: number; // Ngân sách dự kiến
  spent: number; // Đã chi tiêu
}

/**
 * Thói quen
 */
export interface Habit {
  id: string;
  name: string; // Tên thói quen
  completionRate: number; // Tỷ lệ hoàn thành (%)
  totalCheckIns: number; // Tổng số lần check-in
  longestStreak: number; // Chuỗi dài nhất (ngày)
}

/**
 * Mục tiêu tài chính
 */
export interface Goal {
  id: string;
  name: string; // Tên mục tiêu
  targetAmount: number; // Mục tiêu tiền tệ
  amountSaved: number; // Đã tiết kiệm
  targetDate: string; // Ngày dự kiến đạt (YYYY-MM-DD)
}

/**
 * Cấu hình báo cáo
 */
export interface ReportConfig {
  type: ReportType;
  format: ExportFormat;
  period: PeriodType;
  startDate: Date;
  endDate: Date;
  filterCategory?: string | null;
  filterType?: 'all' | 'income' | 'expense';
}

/**
 * Kết quả xuất báo cáo
 */
export interface ExportResult {
  success: boolean;
  fileName: string;
  content: string;
  mimeType: string;
  size?: number;
  error?: string;
}

/**
 * Thống kê danh mục
 */
export interface CategoryStats {
  category: string;
  amount: number;
  percentage: number;
  transactionCount?: number;
}

/**
 * Thống kê chi tiêu vs ngân sách
 */
export interface BudgetStats extends Budget {
  remaining: number;
  overspent: boolean;
  percentage: number;
}

/**
 * Thống kê mục tiêu
 */
export interface GoalStats extends Goal {
  remaining: number;
  progress: number;
  daysRemaining?: number;
}

/**
 * Cấu trúc HTML Report
 */
export interface HTMLReport {
  title: string;
  styles: string;
  content: string;
  footer: string;
}

/**
 * Report Summary
 */
export interface ReportSummary {
  period: string;
  generatedAt: string;
  generatedBy: string;
  totalTransactions: number;
}
