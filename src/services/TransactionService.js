import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AIDataParserService from './AIDataParserService';
import budgetApi from '../api/budgetApi';
import NotificationService from './NotificationService';

/**
 * TransactionService: Xử lý tất cả logic CRUD cho giao dịch
 * * ỔN ĐỊNH CAO: Mọi hàm CUD (Create, Update, Delete)
 * đều trả về "freshData" được fetch trực tiếp từ server
 * để đảm bảo Store luôn đồng bộ 100%.
 */

class TransactionService {

  /**
   * HELPER: Xóa tất cả field undefined (Firestore không chấp nhận)
   * ✅ PHIÊN BẢN GỐC: Chỉ xóa undefined ở cấp đầu, không ảnh hưởng đến nested objects
   */
  _cleanData(obj) {
    if (obj === undefined || obj === null) {
      return null;
    }
    // Chỉ lọc bỏ undefined ở cấp đầu - giữ các nested objects như date, createdAt
    const cleaned = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = obj[key];
      }
    }
    return cleaned;
  }

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

      // Step 1: Normalize + Validate
      // If caller omitted `type`, default to 'expense' to be safe (caller should still pass correct type)
      const normalizedData = { ...transactionData, type: transactionData.type || 'expense' };
      console.log('📝 [SERVICE] Normalized transaction data (type defaulted if missing):', normalizedData);

      this._validateTransactionData(normalizedData);

      // Step 2: Chuẩn bị dữ liệu
      let dataToSave = {
        ...normalizedData,
        userId: currentUser.uid,
        // ✅ FIX: Chỉ set createdAt/updatedAt nếu không có sẵn
        // transactionData đã có date từ createTransactionObject, chỉ cần createdAt/updatedAt server-side
        updatedAt: firestore.FieldValue.serverTimestamp(),
        isDeleted: false,
        // Nếu transactionData không có createdAt, mới set server timestamp
        ...(transactionData.createdAt ? {} : { createdAt: firestore.FieldValue.serverTimestamp() }),
      };
      
      console.log('📝 [SERVICE] dataToSave.date:', dataToSave.date);
      console.log('📝 [SERVICE] dataToSave.createdAt:', dataToSave.createdAt);
      
      // ✅ CLEAN DATA: Xóa tất cả field undefined trước khi lưu
      dataToSave = this._cleanData(dataToSave);
      console.log('✅ [SERVICE] Cleaned data:', dataToSave);
      console.log('✅ [SERVICE] Cleaned data.date:', dataToSave.date);
      console.log('✅ [SERVICE] Cleaned data.createdAt:', dataToSave.createdAt);

      // Step 3: Lưu vào Firestore
      const docRef = await this._getCollectionRef().add(dataToSave);
      console.log('✅ [SERVICE] Transaction added with ID:', docRef.id);

      // Step 4: Lấy lại toàn bộ dữ liệu mới nhất
      const freshTransactions = await this.getAllTransactions();

      // After adding a new expense, detect if this pushes the category over budget
      try {
        if (normalizedData.type === 'expense' && normalizedData.categoryId) {
          // Resolve transaction date used for month/year
          const txDate = dataToSave.date ? (dataToSave.date.toDate ? dataToSave.date.toDate() : new Date(dataToSave.date)) : new Date();
          const year = txDate.getFullYear();
          const month = txDate.getMonth();

          // Fetch budget for this category
          try {
            const budgetDoc = await budgetApi.getBudgetByCategory(String(normalizedData.categoryId));
            if (budgetDoc && typeof budgetDoc.budget === 'number' && budgetDoc.budget > 0) {
              // compute total spent for the same month from freshly fetched transactions
              const totalSpent = (freshTransactions || [])
                .filter(t => (t.type === 'expense') && (String(t.categoryId) === String(normalizedData.categoryId)))
                .reduce((s, t) => {
                  try {
                    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date || t.createdAt);
                    if (d.getFullYear() === year && d.getMonth() === month) return s + (parseInt(t.amount, 10) || 0);
                  } catch (e) {
                    return s;
                  }
                  return s;
                }, 0);

              const prevSpent = totalSpent - (parseInt(normalizedData.amount, 10) || 0);
              if (prevSpent <= budgetDoc.budget && totalSpent > budgetDoc.budget) {
                // Unique id so we don't duplicate the same overrun notification
                const notifId = `budget-overrun-${budgetDoc.id}-${year}-${month}`;
                const overAmount = totalSpent - budgetDoc.budget;
                await NotificationService.displayNotification({
                  id: notifId,
                  title: `Vượt ngân sách: ${budgetDoc.category || ''}`,
                  body: `Bạn đã chi vượt ${overAmount.toLocaleString('vi-VN')} VNĐ trong ${budgetDoc.category || 'danh mục'}. Xem chi tiết.`,
                  type: 'warning',
                  icon: 'alert-circle-outline',
                  actionRoute: 'BudgetPlanner',
                }).catch(() => {});
                console.log('TransactionService: created budget overrun notification', notifId);
              }
            }
          } catch (e) {
            console.warn('TransactionService: failed checking budget/notify', e?.message || e);
          }
        }
      } catch (e) {
        console.warn('TransactionService: post-add overrun check failed', e?.message || e);
      }

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
      // ✅ Amount is optional for note-style transactions (image-only or note-only)
      if (data.amount && data.amount <= 0) {
        throw new Error('❌ Amount must be greater than 0');
      }
      // ✅ CategoryId is optional for note-style transactions
      // Note-only transactions will use 'note-only' as categoryId
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
      const { 
        type, 
        amount, 
        categoryId, 
        categoryName, 
        description, 
        billImageUri,
        // 🤖 AI Processing fields
        totalAmount,
        items,
        category,
        processedText,
        rawOCRText,
        processingTime,
        hasAIProcessing,
      } = formData;
      
      if (!type || (type !== 'expense' && type !== 'income')) {
        throw new Error('❌ Invalid transaction type');
      }
      
      // ✅ For note-style: amount & categoryId are OPTIONAL
      // Only validate if provided
      if (amount && amount <= 0) {
        throw new Error('❌ Amount must be greater than 0');
      }
      
      if (!description || !description.trim()) {
        throw new Error('❌ Description is required');
      }

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 🤖 Parse AI data if available
      let aiParsedData = null;
      if (processedText && processedText.trim()) {
        try {
          aiParsedData = AIDataParserService.parseAIResult(processedText);
          console.log('✅ [SERVICE] Parsed AI data:', aiParsedData);
          // ✅ FIX: Chỉ dùng JSON.stringify cho aiParsedData (xóa undefined lồng bên trong)
          aiParsedData = JSON.parse(JSON.stringify(aiParsedData));
        } catch (parseError) {
          console.warn('⚠️ [SERVICE] Could not parse AI data:', parseError);
          // Don't fail, just keep aiParsedData null
        }
      }

      const transaction = {
        type,
        amount: amount ? parseInt(amount, 10) : (totalAmount || (aiParsedData?.totalAmount || 0)),  // Use AI amount if available
        description: description.trim(),
        category: category || categoryName || '📝 Ghi chú',      // Default category for note-only
        // Resolve categoryId: if caller left 'note-only' or omitted, map from name or fallback by type
        categoryId: this._resolveCategoryId(categoryId, category || categoryName, type),
        date: firestore.Timestamp.fromDate(now),
        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        billImageUri: billImageUri || null,
        createdAt: firestore.Timestamp.fromDate(now),
        // 🤖 AI Processing fields - ✅ LUÔN dùng null thay vì undefined
        totalAmount: totalAmount || (aiParsedData?.totalAmount || 0),
        items: items || (aiParsedData?.items || []),
        processedText: processedText || null,
        rawOCRText: rawOCRText || null,
        aiParsedData: aiParsedData || null,  // ✅ Thêm || null để tránh undefined
        hasAIProcessing: !!hasAIProcessing,
        processingTime: processingTime || 0,
        // Lưu ý: Không thêm 'id' ở đây
      };

      console.log('✅ [SERVICE] Transaction object created successfully:', transaction);
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

  /**
   * HELPER: Resolve categoryId when incoming data uses 'note-only' or missing id
   * Strategy:
   * - If a valid categoryId is provided (and not 'note-only'), return it
   * - Else try to map from category name (or categoryName) using a small default map
   * - Fallback: if type==='income' => default to '7' (Lương), else default to '1' (Ăn uống)
   */
  _resolveCategoryId(providedCategoryId, categoryNameOrLabel, type = 'expense') {
    try {
      if (providedCategoryId && providedCategoryId !== 'note-only') return providedCategoryId;

      const removeDiacritics = (str = '') =>
        str
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[\u0300-\u036f]/g, '');

      const name = (categoryNameOrLabel || '').toString();
      const normalized = removeDiacritics(name).toLowerCase().trim();

      // Minimal mapping based on default categories in CategoryManagementScreen
      const map = {
        'an uong': '1',
        'ăn uống': '1',
        'mua sam': '2',
        'mua sắm': '2',
        'di chuyen': '3',
        'di chuyển': '3',
        'nha o': '4',
        'nhà ở': '4',
        'y te': '5',
        'y tế': '5',
        'giai tri': '6',
        'giải trí': '6',
        'luong': '7',
        'lương': '7',
        'thuong': '8',
        'thưởng': '8',
        'dau tu': '9',
        'đầu tư': '9',
        'ca phe': '10',
        'cà phê': '10',
        'di cho': '11',
        'đi chợ': '11',
      };

      // Exact match
      if (map[normalized]) return map[normalized];

      // Partial includes match
      for (const key in map) {
        if (normalized.includes(key)) return map[key];
      }

      // Fallback by type
      return type === 'income' ? '7' : '1';
    } catch (e) {
      console.warn('⚠️ [SERVICE] _resolveCategoryId failed:', e);
      return type === 'income' ? '7' : '1';
    }
  }
}

// Export singleton instance
export default new TransactionService();