import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/**
 * TransactionService: Xử lý tất cả logic CRUD cho giao dịch
 * * ỔN ĐỊNH CAO: Mọi hàm CUD (Create, Update, Delete)
 * đều trả về "freshData" được fetch trực tiếp từ server
 * để đảm bảo Store luôn đồng bộ 100%.
 */

class TransactionService {

  /**
   * --------------------------------------------------------------------
   * PRIVATE HELPER: Lấy tham chiếu (ref) đến collection
   * --------------------------------------------------------------------
   */
  _getCollectionRef() {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('❌ User not authenticated');
    }
    return firestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('transactions');
  }

  /**
   * --------------------------------------------------------------------
   * 4️⃣ (HELPER) LẤY TẤT CẢ GIAO DỊCH (ĐÃ SỬA LỖI ID)
   * --------------------------------------------------------------------
   */
  async getAllTransactions() {
    console.log('📋 [SERVICE] Fetching all transactions from server...');
    
    try {
      if (!auth().currentUser) {
        throw new Error('❌ User not authenticated');
      }

      // CRITICAL: get({ source: 'server' }) buộc đọc từ server,
      // bypass (bỏ qua) cache, đảm bảo dữ liệu luôn mới nhất.
      const snapshot = await this._getCollectionRef()
        .orderBy('createdAt', 'desc')
        .get({ source: 'server' }); 

      // ----- BẮT ĐẦU SỬA LỖI -----
      // Di chuyển `id: doc.id` xuống cuối cùng
      // để ghi đè lên bất kỳ trường 'id' nào bên trong doc.data()
      const transactions = snapshot.docs.map(doc => ({
        ...doc.data(), // Lấy dữ liệu (có thể chứa 'id' giả)
        id: doc.id,     // Ghi đè bằng ID thật
      }));
      // ----- KẾT THÚC SỬA LỖI -----

      console.log('✅ [SERVICE] Fetched', transactions.length, 'transactions');
      return transactions;

    } catch (error) {
      console.error('❌ [SERVICE] Error fetching transactions:', error.message);
      throw error;
    }
  }


  /**
   * --------------------------------------------------------------------
   * 1️⃣ THÊM GIAO DỊCH MỚI
   * Logic: Thêm → Fetch lại toàn bộ → Trả về { freshData }
   * --------------------------------------------------------------------
   */
  async addTransaction(transactionData) {
    console.log('📝 [SERVICE] Starting addTransaction:', transactionData);
    
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('❌ User not authenticated');
      }

      // Step 1: Validate (Hàm _validateTransactionData của bạn)
      this._validateTransactionData(transactionData); 

      // Step 2: Chuẩn bị dữ liệu
      const dataToSave = {
        ...transactionData,
        userId: currentUser.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
        isDeleted: false,
      };

      // Step 3: Lưu vào Firestore
      const docRef = await this._getCollectionRef().add(dataToSave);
      console.log('✅ [SERVICE] Transaction added with ID:', docRef.id);

      // Step 4: Lấy lại toàn bộ dữ liệu mới nhất
      const freshTransactions = await this.getAllTransactions();

      return {
        success: true,
        newTransactionId: docRef.id,
        freshData: freshTransactions, // Trả về dữ liệu mới
      };

    } catch (error) {
      console.error('❌ [SERVICE] Error adding transaction:', error.message);
      throw error;
    }
  }

  /**
   * --------------------------------------------------------------------
   * 2️⃣ CẬP NHẬT GIAO DỊCH
   * Logic: Sửa → Fetch lại toàn bộ → Trả về { freshData }
   * --------------------------------------------------------------------
   */
  async updateTransaction(transactionId, updateData) {
    console.log('✏️ [SERVICE] Starting updateTransaction:', transactionId);
    
    try {
      if (!auth().currentUser) throw new Error('❌ User not authenticated');
      if (!transactionId) throw new Error('❌ Transaction ID is required');

      // Step 1: Validate
      this._validateTransactionData(updateData, true); // true = partial update

      // Step 2: Chuẩn bị dữ liệu
      const dataToUpdate = {
        ...updateData,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // Step 3: Update Firestore
      await this._getCollectionRef().doc(transactionId).update(dataToUpdate);
      console.log('✅ [SERVICE] Transaction updated');

      // Step 4: Lấy lại toàn bộ dữ liệu mới nhất
      const freshTransactions = await this.getAllTransactions();

      return {
        success: true,
        updatedId: transactionId,
        freshData: freshTransactions, // Trả về dữ liệu mới
      };

    } catch (error) {
      console.error('❌ [SERVICE] Error updating transaction:', error.message);
      throw error;
    }
  }

  /**
   * --------------------------------------------------------------------
   * 3️⃣ XÓA GIAO DỊCH
   * Logic: Xóa → Fetch lại toàn bộ → Trả về { freshData }
   * --------------------------------------------------------------------
   */
  async deleteTransaction(transactionId) {
    console.log('🗑️ [SERVICE] Starting deleteTransaction:', transactionId);
    
    try {
      if (!auth().currentUser) throw new Error('❌ User not authenticated');
      if (!transactionId) throw new Error('❌ Transaction ID is required');

      // Step 1: Delete from Firestore
      await this._getCollectionRef().doc(transactionId).delete();
      console.log('✅ [SERVICE] Transaction deleted from Firestore');

      // Step 2: Lấy lại toàn bộ dữ liệu
      const freshTransactions = await this.getAllTransactions();
      
      console.log('✅ [SERVICE] Delete completed. Remaining count:', freshTransactions.length);
      
      return {
        success: true,
        deletedId: transactionId,
        freshData: freshTransactions, // Trả về dữ liệu mới
      };

    } catch (error) {
      console.error('❌ [SERVICE] Error deleting transaction:', error.message);
      throw error;
    }
  }

  /**
   * --------------------------------------------------------------------
   * CÁC HÀM KHÁC (Giữ nguyên các hàm helper của bạn)
   * --------------------------------------------------------------------
   */

  _validateTransactionData(data, isPartial = false) {
    if (!isPartial) {
      if (!data.type || (data.type !== 'expense' && data.type !== 'income')) {
        throw new Error('❌ Invalid transaction type');
      }
      if (!data.amount || data.amount <= 0) {
        throw new Error('❌ Amount must be greater than 0');
      }
      if (!data.categoryId) {
        throw new Error('❌ Category is required');
      }
      if (!data.description) {
        throw new Error('❌ Description is required');
      }
    }
    return true;
  }
  
  // (Các hàm helper khác của bạn)
  
  async getTransactionsByType(type) {
    console.log('📋 [SERVICE] Fetching transactions by type:', type);
    
    try {
      const transactions = await this.getAllTransactions();
      const filtered = transactions.filter(t => t.type === type);
      
      console.log(`✅ [SERVICE] Found ${filtered.length} ${type} transactions`);
      return filtered;

    } catch (error) {
      console.error(`❌ [SERVICE] Error fetching ${type} transactions:`, error.message);
      throw error;
    }
  }

  async getTransactionsByCategory(categoryId) {
    console.log('📋 [SERVICE] Fetching transactions by category:', categoryId);
    
    try {
      const transactions = await this.getAllTransactions();
      const filtered = transactions.filter(t => t.categoryId === categoryId);
      
      console.log(`✅ [SERVICE] Found ${filtered.length} transactions in category ${categoryId}`);
      return filtered;

    } catch (error) {
      console.error('❌ [SERVICE] Error fetching transactions by category:', error.message);
      throw error;
    }
  }

  async getMonthlyTotal(type = 'expense', month = null, year = null) {
    console.log('💰 [SERVICE] Calculating monthly total for', type);
    
    try {
      const now = new Date();
      const currentMonth = month || now.getMonth() + 1;
      const currentYear = year || now.getFullYear();

      const transactions = await this.getTransactionsByType(type);

      const total = transactions
        .filter(t => {
          const date = t.date?.toDate?.() || t.createdAt?.toDate?.() || new Date(t.date) || new Date(t.createdAt);
          return date.getFullYear() === currentYear && date.getMonth() === currentMonth - 1;
        })
        .reduce((sum, t) => sum + (parseInt(t.amount, 10) || 0), 0);

      console.log(`✅ [SERVICE] Monthly ${type} total:`, total);
      return total;

    } catch (error) {
      console.error('❌ [SERVICE] Error calculating monthly total:', error.message);
      throw error;
    }
  }
  
  createTransactionObject(formData) {
    console.log('🔧 [SERVICE] Creating transaction object from form data:', formData);
    
    try {
      const { type, amount, categoryId, categoryName, description, billImageUri } = formData;
      
      if (!type || (type !== 'expense' && type !== 'income')) {
        throw new Error('❌ Invalid transaction type');
      }
      if (!amount || amount <= 0) {
        throw new Error('❌ Amount must be greater than 0');
      }
      if (!categoryId) {
        throw new Error('❌ Category is required');
      }
      if (!description || !description.trim()) {
        throw new Error('❌ Description is required');
      }

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      const transaction = {
        type,
        amount: parseInt(amount, 10),
        description: description.trim(),
        category: categoryName,
        categoryId,
        date: firestore.Timestamp.fromDate(now),
        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        billImageUri: billImageUri || null,
        createdAt: firestore.Timestamp.fromDate(now),
        // Lưu ý: Không thêm 'id' ở đây
      };

      console.log('✅ [SERVICE] Transaction object created successfully');
      return transaction;
    } catch (error) {
      console.error('❌ [SERVICE] Error creating transaction object:', error.message);
      throw error;
    }
  }

  formatAmount(text) {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned) {
      return parseInt(cleaned, 10).toLocaleString('vi-VN');
    }
    return '';
  }

  getCategoryName(categoryId, categories) {
    try {
      const category = categories.find(cat => cat.id === categoryId);
      return category?.name || 'Khác';
    } catch (error) {
      console.error('❌ [SERVICE] Error getting category name:', error.message);
      return 'Khác';
    }
  }

  _formatDate(dateObj) {
    try {
      const date = dateObj?.toDate?.() || new Date(dateObj);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Invalid date';
    }
  }
}

// Export singleton instance
export default new TransactionService();