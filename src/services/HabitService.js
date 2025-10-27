import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * HabitService: Business logic cho thói quen
 * Responsibility:
 * - Thực hiện CRUD operations trên Firebase
 * - Fetch dữ liệu mới (freshData) sau mỗi thay đổi
 * - Trả về result object chứa {success, addedId/updatedId/deletedId, freshData}
 * - Handle errors
 *
 * Pattern: Screen → Store → Service → Firebase → freshData → Store state
 */

class HabitService {
  /**
   * 1️⃣ LẤY TẤT CẢ THÓI QUEN
   * @returns {Array} habits array
   */
  async getAllHabits() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('📖 [SERVICE] Fetching all habits...');

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .orderBy('createdAt', 'desc')
        .get({ source: 'server' }); // Cache bypass

      const habits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('✅ [SERVICE] Fetched', habits.length, 'habits');
      return habits;

    } catch (error) {
      console.error('❌ [SERVICE] Error fetching habits:', error);
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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('➕ [SERVICE] Adding habit:', habitData.name);

      // 1. Thêm thói quen vào Firebase
      const docRef = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .add({
          ...habitData,
          userId: currentUser.uid,
          isActive: true,
          currentStreak: 0,
          bestStreak: 0,
          completedDates: [],
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      const newHabitId = docRef.id;
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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('✏️ [SERVICE] Updating habit:', habitId);

      // 1. Cập nhật thói quen trên Firebase
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .doc(habitId)
        .update({
          ...updateData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('🗑️ [SERVICE] Deleting habit:', habitId);

      // 1. Xóa thói quen từ Firebase
      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .doc(habitId)
        .delete();

      console.log('✅ [SERVICE] Habit deleted');

      // 2. Wait a bit để Firebase sync
      await new Promise(resolve => setTimeout(resolve, 500));

      // 3. Fetch freshData (cache bypass)
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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const today = new Date().toDateString();
      const habitRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .doc(habitId);

      // Lấy habit hiện tại
      const doc = await habitRef.get({ source: 'server' });
      if (!doc.exists) {
        throw new Error('Thói quen không tồn tại');
      }

      const habitData = doc.data();
      const completedDates = habitData.completedDates || [];
      const isCompletedToday = completedDates.includes(today);

      // Toggle
      let newCompletedDates = isCompletedToday
        ? completedDates.filter(d => d !== today)
        : [...completedDates, today];

      // Cập nhật streak
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

      // Update Firebase
      await habitRef.update({
        completedDates: newCompletedDates,
        currentStreak: newStreak,
        bestStreak: newBestStreak,
        updatedAt: firestore.FieldValue.serverTimestamp(),
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
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const doc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .doc(habitId)
        .get({ source: 'server' });

      if (!doc.exists) {
        throw new Error('Thói quen không tồn tại');
      }

      return {
        id: doc.id,
        ...doc.data(),
      };

    } catch (error) {
      console.error('❌ [SERVICE] Error fetching habit:', error);
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
