import HabitApi from '../api/habitApi';
import CheckInCleanupService from './CheckInCleanupService';
import CheckInService from './CheckInService';

/**
 * HabitService: Business logic ONLY
 * Responsibility:
 * - Xử lý logic kinh doanh (validation, streak calculation, etc.)
 * - Gọi HabitApi để thực hiện Firebase operations
 * - Fetch dữ liệu mới (freshData) sau mỗi thay đổi
 * - Trả về result object chứa {success, addedId/updatedId/deletedId, freshData}
 * - Handle errors
 * - Tích hợp CheckInCleanupService để xóa check-in khi thói quen bị xóa
 *
 * Pattern: Screen → Store → Service → API → Firebase → freshData → Store state
 */

class HabitService {
  /**
   * 1️⃣ LẤY TẤT CẢ THÓI QUEN
   * @returns {Array} habits array
   */
  async getAllHabits() {
    try {
      console.log('📖 [SERVICE] Getting all habits via API...');

      const habits = await HabitApi.getAllHabits();

      console.log('✅ [SERVICE] Got', habits.length, 'habits');
      return habits;

    } catch (error) {
      console.error('❌ [SERVICE] Error getting habits:', error);
      throw error;
    }
  }

  /**
   * 2️⃣ THÊM THÓI QUEN MỚI (ĐÃ ĐỒNG BỘ)
   * @param {Object} habitData - {name, icon, color, category, target, unit, schedule[], isActive}
   * @returns {Object} {success, addedId, freshData}
   */
  async addHabit(habitData) {
    try {
      console.log('➕ [SERVICE] Adding habit:', habitData.name);

      // 1. Thêm thói quen qua API
      const newHabitId = await HabitApi.addHabitToFirebase(habitData);

      console.log('✅ [SERVICE] Habit added with ID:', newHabitId);

      // 2. Wait a bit để Firebase sync
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Fetch freshData (cache bypass)
      const freshData = await this.getAllHabits();

      return {
        success: true,
        addedId: newHabitId,
        freshData,
      };

    } catch (error) {
      console.error('❌ [SERVICE] Error adding habit:', error);
      throw error;
    }
  }

  /**
   * 3️⃣ CẬP NHẬT THÓI QUEN (ĐÃ ĐỒNG BỘ)
   * @param {string} habitId
   * @param {Object} updateData
   * @returns {Object} {success, updatedId, freshData}
   */
  async updateHabit(habitId, updateData) {
    try {
      console.log('✏️ [SERVICE] Updating habit:', habitId);

      // 1. Cập nhật thói quen qua API
      await HabitApi.updateHabitOnFirebase(habitId, updateData);

      console.log('✅ [SERVICE] Habit updated');

      // 2. Wait a bit để Firebase sync
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Fetch freshData (cache bypass)
      const freshData = await this.getAllHabits();

      return {
        success: true,
        updatedId: habitId,
        freshData,
      };

    } catch (error) {
      console.error('❌ [SERVICE] Error updating habit:', error);
      throw error;
    }
  }

  /**
   * 4️⃣ XÓA THÓI QUEN (ĐÃ ĐỒNG BỘ)
   * @param {string} habitId
   * @returns {Object} {success, deletedId, freshData}
   */
  async deleteHabit(habitId) {
    try {
      console.log('🗑️ [SERVICE] Deleting habit:', habitId);

      // 0. Attempt to cancel any scheduled notifications for this habit
      try {
        const habit = await HabitApi.getHabitByIdFromFirebase(habitId);
        const notificationIds = habit?.notificationIds || habit?.notificationIds || null;
        if (notificationIds) {
          try {
            const NotificationService = require('./NotificationService').default;
            await NotificationService.cancelReminder(notificationIds);
            console.log('🔕 [SERVICE] Cancelled notifications for habit:', habitId);
          } catch (e) {
            console.warn('⚠️ [SERVICE] Failed to cancel notifications for habit (non-fatal):', e);
          }
        }
      } catch (e) {
        console.warn('⚠️ [SERVICE] Could not load habit before delete to cancel notifications:', e);
      }

      // 1. Xóa thói quen qua API
      await HabitApi.deleteHabitFromFirebase(habitId);

      console.log('✅ [SERVICE] Habit deleted from habits collection');

      // 2. 🆕 Xóa dữ liệu check-in liên quan (today summary key + today's check-in)
      try {
        const res = await CheckInService.deleteHabitData(habitId);
        console.log('🧹 [SERVICE] Check-in service removed habit data:', res.message);
      } catch (cleanupError) {
        console.warn('⚠️ [SERVICE] Warning during check-in data cleanup:', cleanupError);
        // Don't throw - habit deletion already succeeded
      }

      // 3. Wait a bit để Firebase sync
      await new Promise(resolve => setTimeout(resolve, 500));

      // 4. Fetch freshData (cache bypass)
      const freshData = await this.getAllHabits();

      return {
        success: true,
        deletedId: habitId,
        freshData,
      };

    } catch (error) {
      console.error('❌ [SERVICE] Error deleting habit:', error);
      throw error;
    }
  }

  /**
   * 5️⃣ TOGGLE HOÀN THÀNH HOM NAY (ĐÃ ĐỒNG BỘ)
   * @param {string} habitId
   * @returns {Object} {success, updatedId, freshData}
   */
  async toggleHabitToday(habitId) {
    try {
      console.log('🎯 [SERVICE] Toggling habit completion for today:', habitId);

      const today = new Date().toDateString();

      // Lấy habit hiện tại từ API
      const habitData = await HabitApi.getHabitByIdFromFirebase(habitId);
      
      if (!habitData) {
        throw new Error('Thói quen không tồn tại');
      }

      const completedDates = habitData.completedDates || [];
      const isCompletedToday = completedDates.includes(today);

      // BUSINESS LOGIC: Toggle
      let newCompletedDates = isCompletedToday
        ? completedDates.filter(d => d !== today)
        : [...completedDates, today];

      // BUSINESS LOGIC: Calculate streak
      let newStreak = habitData.currentStreak || 0;
      let newBestStreak = habitData.bestStreak || 0;

      if (!isCompletedToday) {
        // Mark as completed
        newStreak = (newStreak || 0) + 1;
        newBestStreak = Math.max(newStreak, newBestStreak);
        console.log('🎯 [SERVICE] Habit completed! Streak:', newStreak);
      } else {
        // Unmark as completed - reset streak
        newStreak = 0;
        console.log('↩️ [SERVICE] Habit unmarked. Streak reset.');
      }

      // Update Firebase qua API
      await HabitApi.updateStreakOnFirebase(habitId, {
        completedDates: newCompletedDates,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
      });

      console.log('✅ [SERVICE] Habit toggled');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch freshData
      const freshData = await this.getAllHabits();

      return {
        success: true,
        updatedId: habitId,
        isCompletedToday: !isCompletedToday,
        newStreak,
        freshData,
      };

    } catch (error) {
      console.error('❌ [SERVICE] Error toggling habit:', error);
      throw error;
    }
  }

  /**
   * 6️⃣ LẤY THÓI QUEN THEO ID
   * @param {string} habitId
   * @returns {Object} habit
   */
  async getHabitById(habitId) {
    try {
      console.log('📖 [SERVICE] Getting habit by ID:', habitId);

      const habit = await HabitApi.getHabitByIdFromFirebase(habitId);

      return habit;

    } catch (error) {
      console.error('❌ [SERVICE] Error getting habit by ID:', error);
      throw error;
    }
  }

  /**
   * 7️⃣ LẤY THÓI QUEN THEO DANH MỤC
   * @param {string} category
   * @returns {Array} habits
   */
  async getHabitsByCategory(category) {
    try {
      const habits = await this.getAllHabits();
      return habits.filter(h => h.category === category);
    } catch (error) {
      console.error('❌ [SERVICE] Error fetching habits by category:', error);
      throw error;
    }
  }

  /**
   * 8️⃣ TÍNH COMPLETION RATE
   * @param {string} habitId
   * @returns {number} percentage (0-100)
   */
  async getCompletionRate(habitId) {
    try {
      const habit = await this.getHabitById(habitId);
      if (!habit || !habit.completedDates) return 0;

      const createdDate = new Date(habit.createdAt?.toDate?.() || habit.createdAt);
      const today = new Date();
      const totalDays = Math.ceil((today - createdDate) / (1000 * 60 * 60 * 24)) || 1;

      return Math.round((habit.completedDates.length / totalDays) * 100);

    } catch (error) {
      console.error('❌ [SERVICE] Error calculating completion rate:', error);
      throw error;
    }
  }
}

export default new HabitService();
