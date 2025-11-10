import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * BudgetApi: Các API liên quan đến ngân sách
 * 
 * Firestore Structure:
 * users/{userId}/budgets/{budgetId}
 * {
 *   categoryId: string,
 *   category: string,
 *   icon: string,
 *   budget: number,
 *   color: string,
 *   createdAt: Timestamp,
 *   updatedAt: Timestamp,
 *   isActive: boolean
 * }
 */

class BudgetApi {
  /**
   * Lấy tất cả ngân sách của user
   */
  async getBudgets() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('budgets')
        .orderBy('createdAt', 'desc')
        .get({ source: 'server' });

      const budgets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('✅ [API] Fetched', budgets.length, 'budgets');
      return budgets;
    } catch (error) {
      console.error('❌ [API] Lỗi lấy ngân sách:', error);
      throw error;
    }
  }

  /**
   * Thêm ngân sách mới
   */
  async addBudget(budgetData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const docRef = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('budgets')
        .add({
          ...budgetData,
          userId: currentUser.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
          isActive: true,
        });

      console.log('✅ [API] Budget added with ID:', docRef.id);
      return {
        id: docRef.id,
        ...budgetData,
      };
    } catch (error) {
      console.error('❌ [API] Lỗi thêm ngân sách:', error);
      throw error;
    }
  }

  /**
   * Cập nhật ngân sách
   */
  async updateBudget(budgetId, updateData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('budgets')
        .doc(budgetId)
        .update({
          ...updateData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ [API] Budget updated:', budgetId);
      return true;
    } catch (error) {
      console.error('❌ [API] Lỗi cập nhật ngân sách:', error);
      throw error;
    }
  }

  /**
   * Xóa ngân sách
   */
  async deleteBudget(budgetId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('budgets')
        .doc(budgetId)
        .delete();

      console.log('✅ [API] Budget deleted:', budgetId);
      return true;
    } catch (error) {
      console.error('❌ [API] Lỗi xóa ngân sách:', error);
      throw error;
    }
  }

  /**
   * Lấy ngân sách theo categoryId
   */
  async getBudgetByCategory(categoryId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('budgets')
        .where('categoryId', '==', categoryId)
        .limit(1)
        .get({ source: 'server' });

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      console.error('❌ [API] Lỗi lấy ngân sách theo danh mục:', error);
      throw error;
    }
  }
}

export default new BudgetApi();
