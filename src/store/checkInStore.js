import { create } from 'zustand';
import CheckInService from '../services/CheckInService';

/**
 * CheckInStore: Zustand store cho daily check-in
 * Responsibility: Quản lý STATE cho check-in hằng ngày
 * Business logic được handle bởi CheckInService
 *
 * Flow (Đồng bộ 100%):
 * Screen → Store.action → Service (thực hiện + fetch fresh data) → Store.state
 */

export const useCheckInStore = create((set, get) => ({
  // ========== STATE ==========
  todayCheckIns: {}, // { habitId: { completed, points, streak, ... } }
  checkInHistory: {}, // { habitId: [{ date, completed, points }, ...] }
  totalPointsToday: 0,
  isLoading: false,
  error: null,
  lastSyncTime: null,

  // ========== SIMPLE STATE SETTERS ==========
  setTodayCheckIns: (todayCheckIns) => set({ todayCheckIns }),
  setCheckInHistory: (checkInHistory) => set({ checkInHistory }),
  setTotalPointsToday: (totalPointsToday) => set({ totalPointsToday }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  // ========== CRUD OPERATIONS ==========

  /**
   * 1️⃣ LẤY TODAY CHECK-IN CHO HABIT
   */
  getTodayCheckIn: async (habitId) => {
    console.log('🔵 [STORE] getTodayCheckIn called for', habitId);
    set({ isLoading: true, error: null });

    try {
      const checkIn = await CheckInService.getTodayCheckIn(habitId);

      // Update state
      set(state => ({
        todayCheckIns: {
          ...state.todayCheckIns,
          [habitId]: checkIn,
        },
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      }));

      console.log('✅ [STORE] Got today check-in for', habitId);
      return checkIn;

    } catch (error) {
      console.error('❌ [STORE] Error getting today check-in:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 2️⃣ LẤY CHECK-IN HISTORY CHO HABIT
   */
  getCheckInHistory: async (habitId, days = 30) => {
    console.log('🔵 [STORE] getCheckInHistory called for', habitId);
    set({ isLoading: true, error: null });

    try {
      const history = await CheckInService.getCheckInHistory(habitId, days);

      set(state => ({
        checkInHistory: {
          ...state.checkInHistory,
          [habitId]: history,
        },
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      }));

      console.log('✅ [STORE] Got', history.length, 'check-in history');
      return history;

    } catch (error) {
      console.error('❌ [STORE] Error getting check-in history:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 3️⃣ TOGGLE CHECK-IN TODAY
   */
  toggleCheckInToday: async (habitId, habitData = {}) => {
    console.log('🔵 [STORE] toggleCheckInToday called for', habitId);
    set({ isLoading: true, error: null });

    try {
      const result = await CheckInService.toggleCheckInToday(habitId, habitData);

      // Update state
      set(state => ({
        todayCheckIns: {
          ...state.todayCheckIns,
          [habitId]: result.freshData,
        },
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      }));
      
      // Sau khi toggle, cập nhật lại tổng điểm
      await get().getTodayTotalPoints(); 

      console.log('✅ [STORE] Toggled check-in for', habitId);
      return result;

    } catch (error) {
      console.error('❌ [STORE] Error toggling check-in:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 4️⃣ LẤY TODAY TOTAL POINTS
   */
  getTodayTotalPoints: async () => {
    console.log('🔵 [STORE] getTodayTotalPoints called');
    set({ isLoading: true, error: null });

    try {
      const totalPoints = await CheckInService.getTodayTotalPoints();

      set({
        totalPointsToday: totalPoints,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Got today total points:', totalPoints);
      return totalPoints;

    } catch (error) {
      console.error('❌ [STORE] Error getting today total points:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  // ----- BẮT ĐẦU SỬA LỖI -----
  /**
   * 5️⃣ LẤY TẤT CẢ TODAY CHECK-INS (TẤT CẢ THÓI QUEN)
   */
  getTodayAllCheckIns: async () => {
    console.log('🔵 [STORE] getTodayAllCheckIns called');
    set({ isLoading: true, error: null });

    try {
      // 1. Service trả về một OBJECT (Map), không phải Array
      const checkInsMap = await CheckInService.getTodayAllCheckIns();

      // 2. Không cần lặp (forEach) nữa. Chỉ cần set thẳng.
      set({
        todayCheckIns: checkInsMap, // ✅ ĐÃ SỬA: Set object trực tiếp
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Got all today check-ins');
      return checkInsMap;

    } catch (error) {
      console.error('❌ [STORE] Error getting all today check-ins:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },
  // ----- KẾT THÚC SỬA LỖI -----

  /**
   * 6️⃣ LẤY CURRENT STREAK CHO HABIT
   */
  getCurrentStreak: async (habitId) => {
    console.log('🔵 [STORE] getCurrentStreak called for', habitId);
    set({ isLoading: true, error: null });

    try {
      const streak = await CheckInService.getCurrentStreak(habitId);

      console.log('✅ [STORE] Got current streak:', streak);
      return streak;

    } catch (error) {
      console.error('❌ [STORE] Error getting current streak:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 7️⃣ LẤY COMPLETION RATE CHO HABIT
   */
  getCompletionRate: async (habitId, days = 30) => {
    console.log('🔵 [STORE] getCompletionRate called for', habitId);
    set({ isLoading: true, error: null });

    try {
      const rate = await CheckInService.getCompletionRate(habitId, days);

      console.log('✅ [STORE] Got completion rate:', rate, '%');
      return rate;

    } catch (error) {
      console.error('❌ [STORE] Error getting completion rate:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 8️⃣ BULK CHECK-IN
   */
  bulkCheckIn: async (checkIns) => {
    console.log('🔵 [STORE] bulkCheckIn called for', checkIns.length, 'items');
    set({ isLoading: true, error: null });

    try {
      const result = await CheckInService.bulkCheckIn(checkIns);

      // Update state after bulk operation
      await get().getTodayAllCheckIns();

      console.log('✅ [STORE] Bulk check-in completed');
      return result;

    } catch (error) {
      console.error('❌ [STORE] Error bulk checking in:', error.message);
      set({
        isLoading: false,
        error: error.message,
      });
      throw error;
    }
  },

  /**
   * 9️⃣ INITIALIZE (Load all today check-ins on app start)
   */
  initialize: async () => {
    console.log('🔵 [STORE] Initializing check-in store');

    try {
      await get().getTodayAllCheckIns();
      await get().getTodayTotalPoints();

      console.log('✅ [STORE] Check-in store initialized');
    } catch (error) {
      console.error('❌ [STORE] Error initializing check-in store:', error);
      set({ error: error.message });
    }
  },

  // ========== SELECTORS / GETTERS ==========

  /**
   * Get check-in for specific habit
   */
  getCheckInByHabitId: (habitId) => {
    return get().todayCheckIns[habitId] || {
      habitId,
      completed: false,
      points: 0,
      streak: 0,
    };
  },

  /**
   * Get total completed habits today
   */
  getTodayCompletedCount: () => {
    return Object.values(get().todayCheckIns).filter(c => c.completed).length;
  },

  /**
   * Get all habits with their today completion status
   */
  getTodayCompletionStatus: () => {
    return get().todayCheckIns;
  },

  /**
   * Check if habit is completed today
   */
  isCompletedToday: (habitId) => {
    return get().todayCheckIns[habitId]?.completed || false;
  },

  /**
   * Get streak for habit
   */
  getStreak: (habitId) => {
    return get().todayCheckIns[habitId]?.streak || 0;
  },

  /**
   * Get points for habit today
   */
  getPoints: (habitId) => {
    return get().todayCheckIns[habitId]?.points || 0;
  },
}));