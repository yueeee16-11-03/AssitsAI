import { create } from 'zustand';
import ReportExportService from '../services/ReportExportService';
import type { Budget, Habit, Goal, ReportType, ExportFormat, ReportData, PeriodType } from '../types/report';

interface ReportState {
  // ========== STATE ==========
  reportData: ReportData | null;
  transactions: any[];
  budgets: Budget[];
  habits: Habit[];
  goals: Goal[];
  
  // Filter & Period
  period: PeriodType;
  startDate: Date;
  endDate: Date;
  filterCategory: string | null;
  filterType: 'all' | 'income' | 'expense';
  
  // Export
  exportFormat: ExportFormat;
  reportType: ReportType;
  
  // Loading & Error
  isLoading: boolean;
  isExporting: boolean;
  error: string | null;
  lastSyncTime: string | null;

  // ========== ACTIONS ==========
  setReportData: (data: ReportData) => void;
  setTransactions: (transactions: any[]) => void;
  setBudgets: (budgets: Budget[]) => void;
  setHabits: (habits: Habit[]) => void;
  setGoals: (goals: Goal[]) => void;
  
  setPeriod: (period: PeriodType) => void;
  setStartDate: (date: Date) => void;
  setEndDate: (date: Date) => void;
  setFilterCategory: (category: string | null) => void;
  setFilterType: (type: 'all' | 'income' | 'expense') => void;
  
  setExportFormat: (format: ExportFormat) => void;
  setReportType: (type: ReportType) => void;
  
  setLoading: (isLoading: boolean) => void;
  setExporting: (isExporting: boolean) => void;
  setError: (error: string | null) => void;
  setLastSyncTime: (time: string | null) => void;

  // ========== GETTERS ==========
  getPeriodLabel: () => string;
  formatCurrency: (value: number) => string;
  generateCSV: () => string;
  generateJSON: () => string;
  generateHTML: () => string;
  getTotalIncomeAll: () => number;
  getTotalExpenseAll: () => number;
  getBalanceAll: () => number;
  
  // ========== CRUD OPERATIONS ==========
  fetchReportData: (transactions: any[]) => void;
  loadReportData: (
    transactions: any[],
    budgets: Budget[],
    habits: Habit[],
    goals: Goal[]
  ) => void;
  fetchAllReportDataFromAPI: () => Promise<void>;
  resetFilters: () => void;
}

export const useReportStore = create<ReportState>((set, get) => ({
  // ========== INITIAL STATE ==========
  reportData: null,
  transactions: [],
  budgets: [],
  habits: [],
  goals: [],
  
  period: 'month',
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  endDate: new Date(),
  filterCategory: null,
  filterType: 'all',
  
  exportFormat: 'csv',
  reportType: 'summary',
  
  isLoading: false,
  isExporting: false,
  error: null,
  lastSyncTime: null,

  // ========== SIMPLE STATE SETTERS ==========
  setReportData: (data: ReportData) => {
    console.log('🔵 [REPORT STORE] setReportData');
    set({ reportData: data });
  },

  setTransactions: (transactions: any[]) => {
    console.log('🔵 [REPORT STORE] setTransactions ->', transactions.length, 'transactions');
    set({ transactions });
  },

  setBudgets: (budgets: Budget[]) => {
    console.log('🔵 [REPORT STORE] setBudgets ->', budgets.length, 'budgets');
    set({ budgets });
  },

  setHabits: (habits: Habit[]) => {
    console.log('🔵 [REPORT STORE] setHabits ->', habits.length, 'habits');
    set({ habits });
  },

  setGoals: (goals: Goal[]) => {
    console.log('🔵 [REPORT STORE] setGoals ->', goals.length, 'goals');
    set({ goals });
  },

  setPeriod: (period: PeriodType) => {
    console.log('🔵 [REPORT STORE] setPeriod ->', period);
    set({ period });
  },

  setStartDate: (date: Date) => {
    console.log('🔵 [REPORT STORE] setStartDate ->', date.toLocaleDateString('vi-VN'));
    set({ startDate: date });
  },

  setEndDate: (date: Date) => {
    console.log('🔵 [REPORT STORE] setEndDate ->', date.toLocaleDateString('vi-VN'));
    set({ endDate: date });
  },

  setFilterCategory: (category: string | null) => {
    console.log('🔵 [REPORT STORE] setFilterCategory ->', category);
    set({ filterCategory: category });
  },

  setFilterType: (type: 'all' | 'income' | 'expense') => {
    console.log('🔵 [REPORT STORE] setFilterType ->', type);
    set({ filterType: type });
  },

  setExportFormat: (format: ExportFormat) => {
    console.log('🔵 [REPORT STORE] setExportFormat ->', format);
    set({ exportFormat: format });
  },

  setReportType: (type: ReportType) => {
    console.log('🔵 [REPORT STORE] setReportType ->', type);
    set({ reportType: type });
  },

  setLoading: (isLoading: boolean) => {
    console.log('🔵 [REPORT STORE] setLoading ->', isLoading);
    set({ isLoading });
  },

  setExporting: (isExporting: boolean) => {
    console.log('🔵 [REPORT STORE] setExporting ->', isExporting);
    set({ isExporting });
  },

  setError: (error: string | null) => {
    console.log('🔵 [REPORT STORE] setError ->', error);
    set({ error });
  },

  setLastSyncTime: (time: string | null) => {
    set({ lastSyncTime: time });
  },

  // ========== GETTERS ==========
  getPeriodLabel: () => {
    const state = get();
    return ReportExportService.getPeriodLabel(state.period, state.startDate, state.endDate);
  },

  formatCurrency: (value: number) => {
    return ReportExportService.formatCurrency(value);
  },

  generateCSV: () => {
    const state = get();
    if (!state.reportData) return '';
    
    console.log('🔵 [REPORT STORE] generateCSV');
    return ReportExportService.generateCSV(
      state.reportType,
      state.reportData,
      state.budgets,
      state.habits,
      state.goals,
      state.getPeriodLabel()
    );
  },

  generateJSON: () => {
    const state = get();
    if (!state.reportData) return '';
    
    console.log('🔵 [REPORT STORE] generateJSON');
    return ReportExportService.generateJSON(
      state.reportType,
      state.reportData,
      state.budgets,
      state.habits,
      state.goals,
      state.getPeriodLabel()
    );
  },

  generateHTML: () => {
    const state = get();
    if (!state.reportData) return '';
    
    console.log('🔵 [REPORT STORE] generateHTML');
    return ReportExportService.generateHTML(
      state.reportType,
      state.reportData,
      state.budgets,
      state.habits,
      state.goals,
      state.getPeriodLabel()
    );
  },

  // NEW: Total getters from all transactions
  getTotalIncomeAll: () => {
    const state = get();
    return state.transactions.reduce((sum, t) => sum + (Number(t.amount) || 0) * (t.type === 'income' ? 1 : 0), 0);
  },

  getTotalExpenseAll: () => {
    const state = get();
    return state.transactions.reduce((sum, t) => sum + (Number(t.amount) || 0) * (t.type === 'expense' ? 1 : 0), 0);
  },

  getBalanceAll: () => {
    const totalIncome = get().getTotalIncomeAll();
    const totalExpense = get().getTotalExpenseAll();
    return totalIncome - totalExpense;
  },

  // ========== CRUD OPERATIONS ==========
  fetchReportData: (transactions: any[]) => {
    console.log('🔵 [REPORT STORE] fetchReportData ->', transactions.length, 'transactions');
    const state = get();
    
    // Gọi service để tính toán
    const reportData = ReportExportService.calculateReportData(
      transactions,
      state.filterCategory,
      state.filterType,
      state.startDate,
      state.endDate
    );

    set({
      reportData,
      lastSyncTime: new Date().toISOString(),
    });

    console.log('✅ [REPORT STORE] fetchReportData completed');
  },

  loadReportData: (transactions: any[], budgets: Budget[], habits: Habit[], goals: Goal[]) => {
    console.log('🔵 [REPORT STORE] loadReportData');
    set({
      budgets,
      habits,
      goals,
    });
    
    get().fetchReportData(transactions);
  },

  /**
   * Fetch tất cả dữ liệu từ API
   */
  fetchAllReportDataFromAPI: async () => {
    console.log('🔵 [REPORT STORE] fetchAllReportDataFromAPI');
    set({ isLoading: true, error: null });

    try {
      const data = await ReportExportService.fetchAllReportData();
      
      // Lưu toàn bộ transactions (chưa filter)
      set({
        transactions: data.transactions as any,
        budgets: data.budgets as any,
        habits: data.habits as any,
        goals: data.goals as any,
        isLoading: false,
      });

      // Tính toán reportData từ toàn bộ transactions
      get().fetchReportData(data.transactions);
      console.log('✅ [REPORT STORE] All data loaded from API');
    } catch (error) {
      console.error('❌ [REPORT STORE] Error fetching all data:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  resetFilters: () => {
    console.log('🔵 [REPORT STORE] resetFilters');
    const state = get();
    set({
      filterCategory: null,
      filterType: 'all',
      period: 'month',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
    
    // Recalculate with new filters
    if (state.reportData?.transactions) {
      get().fetchReportData(state.reportData.transactions);
    }
  },
}));
