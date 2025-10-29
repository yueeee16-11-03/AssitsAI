import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * HabitApi: Firebase Calls ONLY
 * Responsibility:
 * - Gọi Firestore API
 * - Không chứa logic kinh doanh
 * - Trả về raw data từ Firebase
 * 
 * Pattern: Service → API → Firebase
 */

class HabitApi {
  /**
   * 1️⃣ LẤY TẤT CẢ THÓI QUEN TỪ FIREBASE
   */
  async getAllHabits() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('📖 [API] Fetching all habits from Firebase...');

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

      console.log('✅ [API] Fetched', habits.length, 'habits from Firebase');
      return habits;

    } catch (error) {
      console.error('❌ [API] Error fetching habits:', error);
      throw error;
    }
  }

  /**
   * 2️⃣ THÊM THÓI QUEN LÊN FIREBASE
   */
  async addHabitToFirebase(habitData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('➕ [API] Adding habit to Firebase:', habitData.name);

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
      console.log('✅ [API] Habit added to Firebase with ID:', newHabitId);

      return newHabitId;

    } catch (error) {
      console.error('❌ [API] Error adding habit to Firebase:', error);
      throw error;
    }
  }

  /**
   * 3️⃣ CẬP NHẬT THÓI QUEN TRÊN FIREBASE
   */
  async updateHabitOnFirebase(habitId, updateData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('✏️ [API] Updating habit on Firebase:', habitId);

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .doc(habitId)
        .update({
          ...updateData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ [API] Habit updated on Firebase');

    } catch (error) {
      console.error('❌ [API] Error updating habit:', error);
      throw error;
    }
  }

  /**
   * 4️⃣ XÓA THÓI QUEN TỪ FIREBASE
   */
  async deleteHabitFromFirebase(habitId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('🗑️ [API] Deleting habit from Firebase:', habitId);

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .doc(habitId)
        .delete();

      console.log('✅ [API] Habit deleted from Firebase');

    } catch (error) {
      console.error('❌ [API] Error deleting habit:', error);
      throw error;
    }
  }

  /**
   * 5️⃣ LẤY THÓI QUEN THEO ID TỪ FIREBASE
   */
  async getHabitByIdFromFirebase(habitId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('📖 [API] Fetching habit from Firebase:', habitId);

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
      console.error('❌ [API] Error fetching habit by ID:', error);
      throw error;
    }
  }

  /**
   * 6️⃣ CẬP NHẬT STREAK & COMPLETED DATES TRÊN FIREBASE
   */
  async updateStreakOnFirebase(habitId, updateData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('🔄 [API] Updating streak on Firebase:', habitId);

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('habits')
        .doc(habitId)
        .update({
          ...updateData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ [API] Streak updated on Firebase');

    } catch (error) {
      console.error('❌ [API] Error updating streak:', error);
      throw error;
    }
  }
}

export default new HabitApi();
