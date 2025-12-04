import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * RecurringTransactionApi
 * API layer for recurring transactions (deprecated pattern)
 * 
 * ⚠️ NOTE: Prefer using RecurringTransactionService + Store pattern
 * This API is here for reference but service/store should be used instead
 */

class RecurringTransactionApi {
  /**
   * Add recurring transaction
   * @deprecated Use store.addRecurringTransaction() instead
   */
  async addRecurringTransaction(data: any) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const docRef = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('recurringTransactions')
        .add({
          ...data,
          userId: currentUser.uid,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ [API] Recurring transaction added:', docRef.id);
      return {
        id: docRef.id,
        ...data,
      };
    } catch (error: any) {
      console.error('❌ [API] Error adding recurring transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get all recurring transactions
   * @deprecated Use store.fetchRecurringTransactions() instead
   */
  async getRecurringTransactions() {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('recurringTransactions')
        .orderBy('nextDue', 'asc')
        .get({ source: 'server' });

      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log('✅ [API] Fetched', transactions.length, 'recurring transactions');
      return transactions;
    } catch (error: any) {
      console.error('❌ [API] Error fetching recurring transactions:', error.message);
      throw error;
    }
  }

  /**
   * Update recurring transaction
   * @deprecated Use store.updateRecurringTransaction() instead
   */
  async updateRecurringTransaction(id: string, data: any) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('recurringTransactions')
        .doc(id)
        .update({
          ...data,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ [API] Recurring transaction updated:', id);
      return true;
    } catch (error: any) {
      console.error('❌ [API] Error updating recurring transaction:', error.message);
      throw error;
    }
  }

  /**
   * Delete recurring transaction
   * @deprecated Use store.deleteRecurringTransaction() instead
   */
  async deleteRecurringTransaction(id: string) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('recurringTransactions')
        .doc(id)
        .delete();

      console.log('✅ [API] Recurring transaction deleted:', id);
      return true;
    } catch (error: any) {
      console.error('❌ [API] Error deleting recurring transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get recurring transaction by ID
   * @deprecated Use service.getRecurringTransactionById() instead
   */
  async getRecurringTransactionById(id: string) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const doc = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('recurringTransactions')
        .doc(id)
        .get({ source: 'server' });

      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error: any) {
      console.error('❌ [API] Error getting recurring transaction:', error.message);
      throw error;
    }
  }
}

export default new RecurringTransactionApi();
