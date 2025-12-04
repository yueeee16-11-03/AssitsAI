import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * RecurringTransaction Model
 */
export interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  walletId: string;
  walletName: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dueDate: number; // Day of month (1-31) or day of week (1-7 for weekly)
  isAutomatic: boolean;
  isActive: boolean;
  lastPaid?: string; // ISO date string
  nextDue: string; // ISO date string
  reminderDays: number; // Days before due date to remind
  type: 'expense' | 'income';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
}

/**
 * RecurringTransactionService
 * Xử lý CRUD cho giao dịch lặp lại
 * * Flow: Screen → Store → Service → Firebase → freshData → Store state
 */
class RecurringTransactionService {
  /**
   * Lấy reference collection
   */
  private _getCollectionRef() {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('❌ User not authenticated');
    }
    return firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('recurringTransactions');
  }

  /**
   * Xóa undefined fields
   */
  private _cleanData(obj: any) {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }
    return cleaned;
  }

  /**
   * Validate dữ liệu
   */
  private _validateData(data: any, isPartial = false) {
    if (!isPartial) {
      if (!data.name?.trim()) throw new Error('Tên giao dịch không được để trống');
      if (!data.amount || data.amount <= 0) throw new Error('Số tiền phải lớn hơn 0');
      if (!data.frequency) throw new Error('Tần suất không hợp lệ');
      if (!data.type || !['expense', 'income'].includes(data.type)) throw new Error('Loại giao dịch không hợp lệ');
    }
  }

  /**
   * ✅ 1️⃣ THÊM GIAO DỊCH LẶP LẠI
   * FIX: Remove 'id' field from data to prevent storing document ID as a field
   */
  async addRecurringTransaction(data: RecurringTransaction): Promise<{ freshData: RecurringTransaction[] }> {
    console.log('📝 [SERVICE] Adding recurring transaction:', data);
    
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('❌ User not authenticated');

      this._validateData(data);

      // Remove 'id' field as it should only exist as document ID, not as a field
      const { id: _dataId, ...cleanedTransactionData } = data;
      if (_dataId) {
        console.warn('⚠️ [SERVICE] Stripping ID field from transaction data (will use auto-generated document ID)');
      }

      const dataToSave = {
        ...cleanedTransactionData,
        userId: currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const cleanedData = this._cleanData(dataToSave);
      
      const docRef = await this._getCollectionRef().add(cleanedData);
      console.log('✅ [SERVICE] Recurring transaction added:', docRef.id);

      // Fetch fresh data
      const freshData = await this.getAllRecurringTransactions();
      return { freshData };
    } catch (error: any) {
      console.error('❌ [SERVICE] Error adding recurring transaction:', error?.message);
      throw error;
    }
  }

  /**
   * ✅ 2️⃣ CẬP NHẬT GIAO DỊCH LẶP LẠI
   */
  async updateRecurringTransaction(id: string, data: Partial<RecurringTransaction>): Promise<{ freshData: RecurringTransaction[] }> {
    console.log('✏️ [SERVICE] Updating recurring transaction:', id, data);
    
    try {
      if (!auth().currentUser) throw new Error('❌ User not authenticated');
      if (!id) throw new Error('❌ ID is required');

      this._validateData(data, true); // Partial validation

      const dataToUpdate = {
        ...data,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const cleanedData = this._cleanData(dataToUpdate);

      await this._getCollectionRef().doc(id).update(cleanedData);
      console.log('✅ [SERVICE] Recurring transaction updated:', id);

      // Fetch fresh data
      const freshData = await this.getAllRecurringTransactions();
      return { freshData };
    } catch (error: any) {
      console.error('❌ [SERVICE] Error updating recurring transaction:', error?.message);
      throw error;
    }
  }

  /**
   * ✅ 3️⃣ XÓA GIAO DỊCH LẶP LẠI (SUPER DETAILED LOGGING)
   * Fix: 
   * 1. Ultra-verbose logging to catch exact failure point
   * 2. Multiple verification steps
   * 3. Detailed error reporting
   */
  async deleteRecurringTransaction(id: string): Promise<{ freshData: RecurringTransaction[] }> {
    console.log('\n========== 🗑️ DELETE START ==========');
    console.log('📝 [SERVICE] Document ID to delete:', id);
    
    try {
      const currentUser = auth().currentUser;
      console.log('👤 [SERVICE] Current user:', currentUser?.uid);
      
      if (!currentUser) throw new Error('❌ User not authenticated');
      if (!id) throw new Error('❌ ID is required');

      const collectionRef = this._getCollectionRef();
      const docRef = collectionRef.doc(id);
      console.log('📂 [SERVICE] Collection path: users/', currentUser.uid, '/recurringTransactions');
      console.log('📄 [SERVICE] Document ref path:', docRef.path);

      // STEP 0: Check if document exists BEFORE deletion
      console.log('\n📋 [SERVICE] STEP 0: Checking if document exists BEFORE deletion...');
      const docBeforeDelete = await docRef.get({ source: 'server' });
      console.log('   → Document exists before delete?', docBeforeDelete.exists());
      if (docBeforeDelete.exists()) {
        console.log('   → Document data:', docBeforeDelete.data());
      }

      // STEP 1: Send delete command
      console.log('\n🗑️ [SERVICE] STEP 1: Sending delete command to Firebase...');
      try {
        const deletePromise = docRef.delete();
        console.log('   → Delete promise created');
        await deletePromise;
        console.log('   ✅ Delete command COMPLETED (no error thrown)');
      } catch (firebaseDeleteError: any) {
        console.error('   ❌ Delete command FAILED with Firebase error!');
        console.error('   Code:', firebaseDeleteError?.code);
        console.error('   Message:', firebaseDeleteError?.message);
        console.error('   Full error:', firebaseDeleteError);
        throw new Error(`Firebase delete failed: ${firebaseDeleteError?.message || 'Unknown error'}`);
      }

      // STEP 2: Wait for propagation
      console.log('\n⏳ [SERVICE] STEP 2: Waiting 2000ms for Firestore propagation...');
      await new Promise((resolve: any) => setTimeout(() => resolve(null), 2000));
      console.log('   ✅ Wait complete');

      // STEP 3: Immediate verification - check if document STILL EXISTS
      console.log('\n🔍 [SERVICE] STEP 3: Immediate verification (check document exists)...');
      try {
        const docAfterDelete = await docRef.get({ source: 'server' });
        const stillExists = docAfterDelete.exists();
        console.log('   → Document still exists?', stillExists);
        
        if (stillExists) {
          console.error('   ❌ CRITICAL: Document STILL EXISTS after delete!');
          console.error('   → Document data:', docAfterDelete.data());
          console.error('   → This means delete() did NOT remove the document');
          throw new Error('DELETE FAILED: Document still in Firestore after delete()');
        } else {
          console.log('   ✅ VERIFIED: Document successfully removed from Firestore');
        }
      } catch (verifyError: any) {
        if (verifyError?.message?.includes('CRITICAL') || verifyError?.message?.includes('still in Firestore')) {
          throw verifyError;
        }
        console.error('   ❌ Error during verification:', verifyError?.message);
        throw new Error(`Verification failed: ${verifyError?.message}`);
      }

      // STEP 4: Fetch fresh list
      console.log('\n📖 [SERVICE] STEP 4: Fetching fresh list from server...');
      let freshData: RecurringTransaction[] = [];
      try {
        freshData = await this.getAllRecurringTransactions();
        console.log('   ✅ Fresh data fetched. Count:', freshData.length);
        console.log('   → IDs in list:', freshData.map(t => t.id).join(', '));
      } catch (fetchError: any) {
        console.error('   ❌ Error fetching fresh data:', fetchError?.message);
        throw new Error(`Failed to fetch fresh data: ${fetchError?.message}`);
      }

      // STEP 5: Verify ID not in list
      console.log('\n✔️ [SERVICE] STEP 5: Final verification (ID not in list)...');
      const isStillInList = freshData.some((t: any) => t.id === id);
      console.log('   → Is ID still in list?', isStillInList);
      
      if (isStillInList) {
        console.warn('   ⚠️ WARNING: ID still appears in freshData. Filtering out for safety.');
        freshData = freshData.filter((t: any) => t.id !== id);
        console.log('   ✅ Filtered. New count:', freshData.length);
      } else {
        console.log('   ✅ ID completely removed from list');
      }

      console.log('\n========== ✅ DELETE COMPLETE ==========\n');
      return { freshData };
      
    } catch (error: any) {
      console.error('\n========== ❌ DELETE FAILED ==========');
      console.error('Error message:', error?.message);
      console.error('Error code:', error?.code);
      console.error('Full error:', error);
      console.error('========== END ERROR ==========\n');
      throw error;
    }
  }

  /**
   * ✅ 4️⃣ LẤY TẤT CẢ GIAO DỊCH LẶP LẠI
   * FIX: Ensure doc.id takes priority over any data.id field to prevent ID override
   */
  async getAllRecurringTransactions(): Promise<RecurringTransaction[]> {
    // console.log('📖 [SERVICE] Fetching all recurring transactions'); 
    // Comment bớt log này nếu thấy quá spam console
    
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('❌ User not authenticated');

      // Query without orderBy to avoid Firestore composite index requirement initially
      const snapshot = await this._getCollectionRef()
        .get({ source: 'server' });

      const transactions: RecurringTransaction[] = snapshot.docs.map(doc => {
        const data = doc.data();
        // Remove 'id' field from data if it exists to avoid override
        const { id: _dataId, ...cleanedData } = data;
        if (_dataId && _dataId !== doc.id) {
          console.warn('⚠️ [SERVICE] Detected ID mismatch in data:', { documentId: doc.id, dataId: _dataId });
        }
        return {
          ...cleanedData,
          id: doc.id, // Always use document ID, not data.id
        } as RecurringTransaction;
      });

      // Sort by nextDue on client side
      transactions.sort((a, b) => {
        const dateA = new Date(a.nextDue).getTime();
        const dateB = new Date(b.nextDue).getTime();
        return dateA - dateB;
      });

      // console.log('✅ [SERVICE] Fetched', transactions.length, 'recurring transactions');
      return transactions;
    } catch (error: any) {
      console.error('❌ [SERVICE] Error fetching recurring transactions:', error?.message);
      throw error;
    }
  }

  /**
   * ✅ 5️⃣ LẤY GIAO DỊCH THEO ID
   * FIX: Ensure doc.id takes priority over any data.id field to prevent ID override
   */
  async getRecurringTransactionById(id: string): Promise<RecurringTransaction | null> {
    console.log('🔍 [SERVICE] Getting recurring transaction:', id);
    
    try {
      const doc = await this._getCollectionRef().doc(id).get({ source: 'server' });
      
      if (!doc.exists()) {
        console.warn('⚠️ [SERVICE] Recurring transaction not found:', id);
        return null;
      }

      const data = doc.data() || {};
      // Remove 'id' field from data if it exists to avoid override
      const { id: _dataId, ...cleanedData } = data as any;
      if (_dataId && _dataId !== doc.id) {
        console.warn('⚠️ [SERVICE] Detected ID mismatch in data:', { documentId: doc.id, dataId: _dataId });
      }
      const transaction = {
        ...cleanedData,
        id: doc.id, // Always use document ID, not data.id
      } as RecurringTransaction;
      console.log('✅ [SERVICE] Found recurring transaction:', id);
      return transaction;
    } catch (error: any) {
      console.error('❌ [SERVICE] Error getting recurring transaction:', error?.message);
      throw error;
    }
  }

  /**
   * ✅ 6️⃣ LẤY GIAO DỊCH THEO LOẠI
   * FIX: Ensure doc.id takes priority over any data.id field to prevent ID override
   */
  async getRecurringTransactionsByType(type: 'expense' | 'income'): Promise<RecurringTransaction[]> {
    console.log('🔍 [SERVICE] Getting recurring transactions by type:', type);
    
    try {
      const snapshot = await this._getCollectionRef()
        .where('type', '==', type)
        .get({ source: 'server' });

      const transactions: RecurringTransaction[] = snapshot.docs.map(doc => {
        const data = doc.data() || {};
        // Remove 'id' field from data if it exists to avoid override
        const { id: _dataId, ...cleanedData } = data as any;
        if (_dataId && _dataId !== doc.id) {
          console.warn('⚠️ [SERVICE] Detected ID mismatch in data:', { documentId: doc.id, dataId: _dataId });
        }
        return {
          ...cleanedData,
          id: doc.id, // Always use document ID, not data.id
        } as RecurringTransaction;
      });

      // Sort by nextDue on client side
      transactions.sort((a, b) => {
        const dateA = new Date(a.nextDue).getTime();
        const dateB = new Date(b.nextDue).getTime();
        return dateA - dateB;
      });

      console.log('✅ [SERVICE] Fetched', transactions.length, 'recurring', type, 'transactions');
      return transactions;
    } catch (error: any) {
      console.error('❌ [SERVICE] Error fetching recurring transactions by type:', error?.message);
      throw error;
    }
  }

  /**
   * ✅ 7️⃣ TOGGLE ACTIVE STATUS
   */
  async toggleRecurringTransactionActive(id: string, isActive: boolean): Promise<{ freshData: RecurringTransaction[] }> {
    console.log('🔄 [SERVICE] Toggling recurring transaction active:', id, isActive);
    
    try {
      return await this.updateRecurringTransaction(id, { isActive } as any);
    } catch (error: any) {
      console.error('❌ [SERVICE] Error toggling active:', error?.message);
      throw error;
    }
  }

  /**
   * ✅ 8️⃣ MARK AS PAID
   */
  async markRecurringTransactionAsPaid(id: string, lastPaid: string, nextDue: string): Promise<{ freshData: RecurringTransaction[] }> {
    console.log('💳 [SERVICE] Marking recurring transaction as paid:', id);
    
    try {
      return await this.updateRecurringTransaction(id, {
        lastPaid,
        nextDue,
      } as any);
    } catch (error: any) {
      console.error('❌ [SERVICE] Error marking as paid:', error?.message);
      throw error;
    }
  }
}

export default new RecurringTransactionService();