import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * CheckInCleanupService: Xóa check-in records khi thói quen bị xóa hoặc đã hoàn thành
 * 
 * Responsibility:
 * - Xóa toàn bộ check-in data liên quan đến 1 habit
 * - Dọn dẹp orphaned check-in data
 * - Xóa check-in khi habit hoàn thành (completed = true)
 * - Tích hợp với HabitService.deleteHabit()
 * 
 * Architecture: Service Layer (Business Logic Only - Not UI)
 */

class CheckInCleanupService {
  /**
   * ✅ Xóa TOÀN BỘ check-in của 1 habit
   * Dùng khi: User xóa habit hoàn toàn
   */
  async deleteAllCheckInsForHabit(habitId: string) {
    try {
      const currentUser = (auth() as any).currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const checkInsRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns');

      // Get tất cả check-ins của habit này
      const querySnapshot = await checkInsRef
        .where('habitId', '==', habitId)
        .get();

      if (querySnapshot.empty) {
        console.log(`🧹 [CLEANUP] No check-ins found for habit: ${habitId}`);
        return { success: true, deleted: 0, habitId, message: 'No check-ins to delete' };
      }

      // Batch delete (atomic operation)
      const batch = firestore().batch();
      let deleteCount = 0;

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        deleteCount++;
      });

      await batch.commit();

      console.log(`✅ [CLEANUP] Deleted ${deleteCount} check-in records for habit: ${habitId}`);
      return { success: true, deleted: deleteCount, habitId, message: `Deleted ${deleteCount} check-in records` };
    } catch (error: any) {
      console.error('❌ [CLEANUP] Error deleting check-ins:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Xóa check-in của hôm nay cho 1 habit
   * Dùng khi: Habit hoàn thành hôm nay, cần xóa để không hiển thị lại
   */
  async deleteTodayCheckIn(habitId: string) {
    try {
      const currentUser = (auth() as any).currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0];
      const checkInRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns');

      // Query check-in hôm nay của habit này
      const querySnapshot = await checkInRef
        .where('habitId', '==', habitId)
        .where('date', '==', today)
        .get();

      if (querySnapshot.empty) {
        console.log(`🗑️ [CLEANUP] No check-in found for today on habit: ${habitId}`);
        return { success: true, deleted: 0, habitId, message: 'No check-in today' };
      }

      const batch = firestore().batch();
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`✅ [CLEANUP] Deleted today's check-in for habit: ${habitId}`);
      return { success: true, deleted: 1, habitId, message: 'Today check-in deleted' };
    } catch (error: any) {
      console.error('❌ [CLEANUP] Error deleting today check-in:', error);
      throw error;
    }
  }

  /**
   * 📊 Lấy thống kê check-in trước khi xóa
   */
  async getCheckInStats(habitId: string) {
    try {
      const currentUser = (auth() as any).currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const checkInRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns');

      const querySnapshot = await checkInRef
        .where('habitId', '==', habitId)
        .get();

      const count = querySnapshot.size;
      const dates: string[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date) dates.push(data.date);
      });

      return {
        habitId,
        count,
        dates: dates.sort(),
        oldestDate: dates.length > 0 ? dates[0] : null,
        newestDate: dates.length > 0 ? dates[dates.length - 1] : null,
      };
    } catch (error: any) {
      console.error('❌ [CLEANUP] Error getting stats:', error);
      return { habitId, count: 0, dates: [], oldestDate: null, newestDate: null };
    }
  }

  /**
   * 🔄 Cleanup orphaned check-ins (habit không còn tồn tại nhưng check-in vẫn có)
   */
  async cleanupOrphanedCheckIns(habitId: string) {
    try {
      const currentUser = (auth() as any).currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const checkInRef = firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('checkIns');

      const querySnapshot = await checkInRef
        .where('habitId', '==', habitId)
        .get();

      if (querySnapshot.empty) {
        console.log(`✅ [CLEANUP] No orphaned data for habit: ${habitId}`);
        return { success: true, cleaned: 0, message: 'No orphaned data' };
      }

      const batch = firestore().batch();
      let cleanedCount = 0;

      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
        cleanedCount++;
      });

      await batch.commit();

      console.log(`✅ [CLEANUP] Cleaned ${cleanedCount} orphaned records for habit: ${habitId}`);
      return { success: true, cleaned: cleanedCount, message: `Cleaned ${cleanedCount} orphaned records` };
    } catch (error: any) {
      console.error('❌ [CLEANUP] Error cleaning orphaned data:', error);
      return { success: false, cleaned: 0, error: error.message || 'Unknown error' };
    }
  }
}

export default new CheckInCleanupService();
