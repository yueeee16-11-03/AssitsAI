import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * CheckInService: Business logic cho daily check-in
 * Responsibility:
 * - Quản lý check-in hằng ngày cho từng thói quen
 * - Lưu trữ lịch sử check-in
 * - Tính toán streak
 * - Tính toán điểm thưởng
 * - Lấy check-in data cho ngày cụ thể
 *
 * Pattern: Screen → Store → Service → Firebase → freshData → Store state
 *
 * Data Structure:
 * users/{uid}/checkIns/{habitId}/
 *   ├── 2025-10-28: { completed: true, points: 35, streak: 6 }
 *   ├── 2025-10-27: { completed: true, points: 35, streak: 5 }
 *   └── ...
 */

class CheckInService {
  /**
   * 1️⃣ LẤY CHECK-IN HÔM NAY CHO HABIT
   * @param {string} habitId
   * @returns {Object} { completed, points, streak, date }
   */
  async getTodayCheckIn(habitId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log('📖 [CHECK-IN SERVICE] Getting today check-in for:', habitId, today);

      const docRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns')
        .doc(habitId)
        .collection('dates')
        .doc(today);

      const doc = await docRef.get({ source: 'server' });

      if (!doc.exists) {
        console.log('ℹ️ [CHECK-IN SERVICE] No check-in found for today');
        return {
          habitId,
          date: today,
          completed: false,
          points: 0,
          streak: 0,
        };
      }

      const data = doc.data();
      console.log('✅ [CHECK-IN SERVICE] Found today check-in:', data);

      return {
        habitId,
        date: today,
        ...data,
      };

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error getting today check-in:', error);
      throw error;
    }
  }

  /**
   * 2️⃣ LẤY CHECK-IN CHO NGÀY CỤ THỂ
   * @param {string} habitId
   * @param {string} date (YYYY-MM-DD format)
   * @returns {Object} check-in data
   */
  async getCheckInByDate(habitId, date) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('📖 [CHECK-IN SERVICE] Getting check-in for date:', date);

      const doc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns')
        .doc(habitId)
        .collection('dates')
        .doc(date)
        .get({ source: 'server' });

      if (!doc.exists) {
        return {
          habitId,
          date,
          completed: false,
          points: 0,
          streak: 0,
        };
      }

      return {
        habitId,
        date,
        ...doc.data(),
      };

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error getting check-in by date:', error);
      throw error;
    }
  }

  /**
   * 3️⃣ LẤY TẤT CẢ CHECK-IN CỦA HABIT (LỊCH SỬ)
   * @param {string} habitId
   * @param {number} days (số ngày lịch sử, mặc định 30)
   * @returns {Array} check-in list
   */
  async getCheckInHistory(habitId, days = 30) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('📖 [CHECK-IN SERVICE] Getting check-in history for:', habitId);

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns')
        .doc(habitId)
        .collection('dates')
        .orderBy('date', 'desc')
        .limit(days)
        .get({ source: 'server' });

      const history = snapshot.docs.map(doc => ({
        habitId,
        date: doc.id,
        ...doc.data(),
      }));

      console.log('✅ [CHECK-IN SERVICE] Fetched', history.length, 'check-ins');
      return history;

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error getting check-in history:', error);
      throw error;
    }
  }

  /**
   * 4️⃣ TOGGLE CHECK-IN HÔM NAY (COMPLETED/UNCOMPLETED)
   * @param {string} habitId
   * @param {Object} habitData - { target, currentStreak, bestStreak }
   * @returns {Object} { success, completed, points, newStreak, date }
   */
  async toggleCheckInToday(habitId, habitData = {}) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      console.log('🔄 [CHECK-IN SERVICE] Toggling check-in for today:', today);

      const currentCheckIn = await this.getTodayCheckIn(habitId);
      const isCurrentlyCompleted = currentCheckIn.completed;

      let newData = {};

      if (!isCurrentlyCompleted) {
        // Mark as completed
        console.log('✅ [CHECK-IN SERVICE] Marking as completed');

        // Calculate points: base + streak bonus
        const basePoints = habitData.target || 10;
        const currentStreak = habitData.currentStreak || 0;
        const streakBonus = Math.floor(currentStreak / 7) * 5;
        const totalPoints = basePoints + streakBonus;

        const newStreak = currentStreak + 1;
        const bestStreak = Math.max(newStreak, habitData.bestStreak || 0);

        newData = {
          completed: true,
          points: totalPoints,
          streak: newStreak,
          bestStreak: bestStreak,
          completedAt: firestore.FieldValue.serverTimestamp(),
          date: today,
        };

        console.log('📊 [CHECK-IN SERVICE] Points:', totalPoints, 'Streak:', newStreak);

      } else {
        // Mark as uncompleted (reset streak)
        console.log('❌ [CHECK-IN SERVICE] Unchecking - resetting streak');

        newData = {
          completed: false,
          points: 0,
          streak: 0,
          completedAt: firestore.FieldValue.serverTimestamp(),
          date: today,
        };
      }

      // Save to Firebase
      const checkInRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns')
        .doc(habitId)
        .collection('dates')
        .doc(today);

      await checkInRef.set(newData, { merge: true });

      console.log('✅ [CHECK-IN SERVICE] Check-in saved');

      // Wait a bit for Firebase sync
      await new Promise(resolve => setTimeout(resolve, 300));

      // Fetch fresh data
      const freshCheckIn = await this.getTodayCheckIn(habitId);

      return {
        success: true,
        habitId,
        date: today,
        completed: freshCheckIn.completed,
        points: freshCheckIn.points,
        streak: freshCheckIn.streak,
        freshData: freshCheckIn,
      };

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error toggling check-in:', error);
      throw error;
    }
  }

  /**
   * 5️⃣ LẤY CURRENT STREAK (SỐ NGÀY LIÊN TIẾP)
   * @param {string} habitId
   * @returns {number} current streak
   */
  async getCurrentStreak(habitId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('📈 [CHECK-IN SERVICE] Calculating current streak for:', habitId);

      let streak = 0;
      let currentDate = new Date();

      // Đếm ngày liên tiếp từ hôm nay
      while (true) {
        const dateString = currentDate.toISOString().split('T')[0];
        const checkIn = await this.getCheckInByDate(habitId, dateString);

        if (!checkIn.completed) {
          break; // Dừng khi gặp ngày chưa hoàn thành
        }

        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // Ngày hôm trước

        // An toàn: không đếm quá 365 ngày
        if (streak > 365) break;
      }

      console.log('✅ [CHECK-IN SERVICE] Current streak:', streak);
      return streak;

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error calculating streak:', error);
      throw error;
    }
  }

  /**
   * 6️⃣ LẤY COMPLETION RATE (%)
   * @param {string} habitId
   * @param {number} days (số ngày tính, mặc định 30)
   * @returns {number} percentage (0-100)
   */
  async getCompletionRate(habitId, days = 30) {
    try {
      const history = await this.getCheckInHistory(habitId, days);
      const completed = history.filter(c => c.completed).length;
      const rate = Math.round((completed / days) * 100);

      console.log('📊 [CHECK-IN SERVICE] Completion rate:', rate, '%');
      return rate;

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error calculating completion rate:', error);
      throw error;
    }
  }

  /**
   * 7️⃣ LẤY TOTAL POINTS HÔM NAY
   * @returns {number} total points
   */
  async getTodayTotalPoints() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('💰 [CHECK-IN SERVICE] Getting total points for today');

      // Get all checkIns for this user
      const checkInsSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns')
        .get({ source: 'server' });

      let totalPoints = 0;

      // For each habit's checkIns, get today's data
      for (const habitDoc of checkInsSnapshot.docs) {
        try {
          const datesSnapshot = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('checkIns')
            .doc(habitDoc.id)
            .collection('dates')
            .doc(today)
            .get({ source: 'server' });

          if (datesSnapshot.exists) {
            const data = datesSnapshot.data();
            if (data?.completed) {
              totalPoints += data.points || 0;
            }
          }
        } catch (error) {
          console.warn('⚠️ [CHECK-IN SERVICE] Error getting points for habit:', habitDoc.id, error);
        }
      }

      console.log('✅ [CHECK-IN SERVICE] Today total points:', totalPoints);
      return totalPoints;

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error getting today total points:', error);
      throw error;
    }
  }

  /**
   * 8️⃣ LẤY TẤT CẢ CHECK-IN CỦA HÔM NAY (TẤT CẢ THÓI QUEN)
   * @returns {Array} check-in array
   */
  async getTodayAllCheckIns() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('📋 [CHECK-IN SERVICE] Getting all check-ins for today');

      // Get all checkIns for this user
      const checkInsSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns')
        .get({ source: 'server' });

      const allCheckIns = {};

      // For each habit's checkIns, get today's data
      for (const habitDoc of checkInsSnapshot.docs) {
        try {
          const datesSnapshot = await firestore()
            .collection('users')
            .doc(currentUser.uid)
            .collection('checkIns')
            .doc(habitDoc.id)
            .collection('dates')
            .doc(today)
            .get({ source: 'server' });

          if (datesSnapshot.exists) {
            allCheckIns[habitDoc.id] = {
              habitId: habitDoc.id,
              date: today,
              ...datesSnapshot.data(),
            };
          }
        } catch (error) {
          console.warn('⚠️ [CHECK-IN SERVICE] Error getting check-in for habit:', habitDoc.id, error);
        }
      }

      console.log('✅ [CHECK-IN SERVICE] Found', Object.keys(allCheckIns).length, 'check-ins today');
      return allCheckIns;

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error getting today all check-ins:', error);
      throw error;
    }
  }

  /**
   * 9️⃣ XÓA CHECK-IN (Admin purpose)
   * @param {string} habitId
   * @param {string} date (YYYY-MM-DD format)
   * @returns {Object} { success }
   */
  async deleteCheckIn(habitId, date) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('🗑️ [CHECK-IN SERVICE] Deleting check-in:', habitId, date);

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns')
        .doc(habitId)
        .collection('dates')
        .doc(date)
        .delete();

      console.log('✅ [CHECK-IN SERVICE] Check-in deleted');
      return { success: true };

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error deleting check-in:', error);
      throw error;
    }
  }

  /**
   * 🔟 BULK CHECK-IN (Batch update nhiều habits)
   * @param {Array} checkIns - [{ habitId, completed, points, ... }, ...]
   * @returns {Object} { success, updated }
   */
  async bulkCheckIn(checkIns) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('📦 [CHECK-IN SERVICE] Bulk updating', checkIns.length, 'check-ins');

      const batch = firestore().batch();

      checkIns.forEach(checkIn => {
        const docRef = firestore()
          .collection('users')
          .doc(currentUser.uid)
          .collection('checkIns')
          .doc(checkIn.habitId)
          .collection('dates')
          .doc(today);

        batch.set(docRef, {
          completed: checkIn.completed,
          points: checkIn.points || 0,
          streak: checkIn.streak || 0,
          date: today,
          completedAt: firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      });

      await batch.commit();

      console.log('✅ [CHECK-IN SERVICE] Bulk update completed');
      return {
        success: true,
        updated: checkIns.length,
      };

    } catch (error) {
      console.error('❌ [CHECK-IN SERVICE] Error bulk updating check-ins:', error);
      throw error;
    }
  }
}

export default new CheckInService();
