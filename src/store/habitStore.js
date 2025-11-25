import { create } from 'zustand';
import HabitService from '../services/HabitService';
import { useCheckInStore } from './checkInStore';

/**
 * HabitStore: Zustand store cho thói quen
 * * Responsibility: Chỉ quản lý STATE.
 * Business logic được handle bởi HabitService.
 *
 * Flow (Đồng bộ 100%):
 * Screen → Store.action → Service (thực hiện CUD + fetch fresh data) → Store.state
 */

export const useHabitStore = create((set, get) => ({
  // ========== STATE ==========
  habits: [],
  isLoading: false,
  error: null,
  lastSyncTime: null,

  // ========== SIMPLE STATE SETTERS ==========
  setHabits: (habits) => set({ habits }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  // ========== CRUD OPERATIONS (Đã đồng bộ) ==========

  /**
   * 1️⃣ THÊM THÓI QUEN (ĐÃ ĐỒNG BỘ)
   * Gọi Service, sau đó cập nhật state bằng freshData
   */
  addHabit: async (habitData) => {
    console.log('🔵 [STORE] addHabit called');
    set({ isLoading: true, error: null });
    
    try {
      // 1. Gọi Service, Service sẽ thêm và fetch lại dữ liệu mới
      const result = await HabitService.addHabit(habitData);
      
      // 2. Cập nhật state với dữ liệu đồng bộ (freshData)
      set({
        habits: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Habit added AND state synced');
      return result;

    } catch (error) {
      console.error('❌ [STORE] Error adding habit:', error.message);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * 2️⃣ CẬP NHẬT THÓI QUEN (ĐÃ ĐỒNG BỘ)
   * Gọi Service, sau đó cập nhật state bằng freshData
   */
  updateHabit: async (habitId, updateData) => {
    console.log('🔵 [STORE] updateHabit called');
    set({ isLoading: true, error: null });
    
    try {
      // 1. Gọi Service, Service sẽ sửa và fetch lại dữ liệu mới
      const result = await HabitService.updateHabit(habitId, updateData);

      // 2. Cập nhật state với dữ liệu đồng bộ (freshData)
      set({
        habits: result.freshData,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Habit updated AND state synced');
      return result;

    } catch (error) {
      console.error('❌ [STORE] Error updating habit:', error.message);
      set({ 
        isLoading: false, 
        error: error.message 
      });
      throw error;
    }
  },

  /**
   * 3️⃣ XÓA THÓI QUEN (ĐÃ ĐỒNG BỘ)
   * Gọi Service, sau đó cập nhật state bằng freshData
   */
  deleteHabit: async (habitId) => {
    console.log('🔵 [STORE] deleteHabit called');
    set({ isLoading: true, error: null });
    
    try {
      // 1. Gọi Service, Service sẽ xóa và fetch lại dữ liệu mới
      const result = await HabitService.deleteHabit(habitId);

      // Optimistically update local state so UI reflects deletion immediately.
      if (result && result.freshData) {
        set({ habits: result.freshData });
      } else {
        set((state) => ({ habits: state.habits.filter(h => h.id !== habitId) }));
      }

      // Remove today's check-in for this habit from the check-in store
      try {
        const checkInStore = useCheckInStore.getState();
        // Synchronous state update to remove stale check-in data immediately
        if (typeof checkInStore.removeCheckInFromState === 'function') {
          checkInStore.removeCheckInFromState(habitId);
        } else if (typeof checkInStore.removeCheckInFromDisplay === 'function') {
          await checkInStore.removeCheckInFromDisplay(habitId);
        } else if (typeof checkInStore.getTodayAllCheckIns === 'function') {
          await checkInStore.getTodayAllCheckIns();
        }
      } catch (ciErr) {
        console.warn('⚠️ [STORE] Failed to remove today check-in after delete (non-fatal):', ciErr?.message || ciErr);
      }

      // Still attempt to refresh from server to ensure authoritative state.
      try {
        await get().fetchHabits();
      } catch (fetchErr) {
        console.warn('⚠️ [STORE] fetchHabits failed after delete (non-fatal):', fetchErr?.message || fetchErr);
      }

      set({
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Habit deleted AND state synced');
      return result;

    } catch (error) {
      console.error('❌ [STORE] Error deleting habit:', error);
      set({ 
        isLoading: false, 
        error: error?.message || String(error) 
      });
      throw error;
    }
  },

  /**
   * 4️⃣ LẤY TẤT CẢ THÓI QUEN (ĐÃ ĐỒNG BỘ)
   * Gọi Service và cập nhật state
   */
  fetchHabits: async () => {
    console.log('🔵 [STORE] fetchHabits called');
    set({ isLoading: true, error: null });
    
    try {
      // Gọi Service để fetch từ Firestore
      const habits = await HabitService.getAllHabits();

      // Update state
      set({ 
        habits,
        isLoading: false,
        error: null,
        lastSyncTime: new Date().toISOString(),
      });

      console.log('✅ [STORE] Fetched', habits.length, 'habits');
      return habits;

    } catch (error) {
      console.error('❌ [STORE] Error fetching habits:', error.message);
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
    console.log('🔵 [STORE] Initializing habit store');
    if (get().isLoading) return; // Tránh gọi lại nếu đang load
    
    try {
      await get().fetchHabits();
      console.log('✅ [STORE] Habit store initialized');
    } catch (error) {
      console.error('❌ [STORE] Error initializing habit store:', error);
      set({ error: error.message });
    }
  },

  // ========== SELECTORS / GETTERS ==========

  getHabitById: (habitId) => {
    return get().habits.find(h => h.id === habitId);
  },

  getHabitsByCategory: (category) => {
    return get().habits.filter(h => h.category === category);
  },

  getActiveHabits: () => {
    return get().habits.filter(h => h.isActive !== false);
  },

  getCompletedToday: () => {
    const today = new Date().toDateString();
    return get().habits.filter(h => 
      h.completedDates?.includes(today)
    ).length;
  },

  getTotalStreak: (habitId) => {
    const habit = get().getHabitById(habitId);
    return habit?.currentStreak || 0;
  },

  getHabitCount: () => {
    return get().habits.length;
  },

  getCompletionRate: (habitId) => {
    const habit = get().getHabitById(habitId);
    if (!habit || !habit.completedDates) return 0;
    
    // Tính % hoàn thành dựa trên ngày tạo
    const createdDate = new Date(habit.createdAt?.toDate?.() || habit.createdAt);
    const today = new Date();
    const totalDays = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24)) || 1;
    
    return Math.round((habit.completedDates.length / totalDays) * 100);
  },
}));
