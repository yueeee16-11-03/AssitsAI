import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * ⚠️ DEPRECATED: TransactionApi
 * 
 * Lý do deprecate:
 * - Logic đã được move sang TransactionService
 * - API gọi Firestore trực tiếp gây cache issues
 * - Screens nên dùng Store (via TransactionService) thay vì API
 * 
 * Migration guide:
 * ❌ OLD: import transactionApi from '../../api/transactionApi'
 *         await transactionApi.getTransactions()
 * 
 * ✅ NEW: import { useTransactionStore } from '../../store/transactionStore'
 *         await store.fetchTransactions()
 * 
 * Details: Xem ARCHITECTURE_SERVICE_STORE.md
 */

class TransactionApi {
  /**
   * @deprecated Sử dụng useTransactionStore.fetchTransactions() thay vì
   */
  async getTransactions() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .get({ source: 'server' });

      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return transactions;
    } catch (error) {
      console.error('Lỗi lấy giao dịch:', error);
      throw error;
    }
  }

  /**
   * @deprecated Sử dụng useTransactionStore.addTransaction() thay vì
   */
  async addTransaction(transactionData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const docRef = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .add({
          ...transactionData,
          userId: currentUser.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      return {
        id: docRef.id,
        ...transactionData,
      };
    } catch (error) {
      console.error('Lỗi thêm giao dịch:', error);
      throw error;
    }
  }

  /**
   * @deprecated Sử dụng useTransactionStore.getByType() thay vì
   */
  async getTransactionsByType(type) {
    try {
      const transactions = await this.getTransactions();
      return transactions.filter(t => t.type === type);
    } catch (error) {
      console.error('Lỗi lấy giao dịch theo loại:', error);
      throw error;
    }
  }

  /**
   * @deprecated Sử dụng useTransactionStore.deleteTransaction() thay vì
   */
  async deleteTransaction(transactionId) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('🗑️ [API] Deleting transaction:', transactionId);

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .doc(transactionId)
        .delete();

      console.log('🗑️ [API] Delete successful');
      return true;
    } catch (error) {
      console.error('❌ Lỗi xóa giao dịch:', error);
      throw error;
    }
  }

  /**
   * @deprecated Sử dụng useTransactionStore.updateTransaction() thay vì
   */
  async updateTransaction(transactionId, updateData) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .doc(transactionId)
        .update({
          ...updateData,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      return true;
    } catch (error) {
      console.error('Lỗi cập nhật giao dịch:', error);
      throw error;
    }
  }

  /**
   * @deprecated Sử dụng TransactionService.getMonthlyTotal() thay vì
   */
  async getMonthlyTotal(type = 'expense', month = null, year = null) {
    try {
      const now = new Date();
      const currentMonth = month || now.getMonth() + 1;
      const currentYear = year || now.getFullYear();

      const transactions = await this.getTransactionsByType(type);

      return transactions
        .filter(t => {
          const date = t.date?.toDate?.() || t.createdAt?.toDate?.() || new Date(t.date) || new Date(t.createdAt);
          return date.getFullYear() === currentYear && date.getMonth() === currentMonth - 1;
        })
        .reduce((sum, t) => {
          const amount = parseInt(t.amount, 10) || 0;
          return sum + amount;
        }, 0);
    } catch (error) {
      console.error('Lỗi tính tổng:', error);
      throw error;
    }
  }

  /**
   * @deprecated Sử dụng TransactionService.getTotalByCategory() thay vì
   */
  async getTotalByCategory(category = null) {
    try {
      const transactions = await this.getTransactions();
      
      if (category) {
        return transactions
          .filter(t => t.category === category)
          .reduce((sum, t) => sum + (parseInt(t.amount, 10) || 0), 0);
      }

      const byCategory = {};
      transactions.forEach(t => {
        const cat = t.category || 'Khác';
        byCategory[cat] = (byCategory[cat] || 0) + (parseInt(t.amount, 10) || 0);
      });

      return byCategory;
    } catch (error) {
      console.error('Lỗi tính tổng theo danh mục:', error);
      throw error;
    }
  }
}

export default new TransactionApi();
