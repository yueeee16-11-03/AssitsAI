import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AIDataParserService from './AIDataParserService';

/**
 * IncomeService: Xử lý tất cả logic CRUD cho thu nhập (income)
 * * ỖN ĐỊNH CAO: Mọi hàm CUD (Create, Update, Delete)
 * đều trả về "freshData" được fetch trực tiếp từ server
 * để đảm bảo Store luôn đồng bộ 100%.
 * 
 * 🟢 KHÁC VỚI TransactionService: 
 * - Type LUÔN là 'income' (CỘNG tiền)
 * - Amount LUÔN dương (income)
 */

class IncomeService {

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
   * PRIVATE HELPER: Lấy tham chiếu (ref) đến collection transactions
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
   * 📋 LẤY TẤT CẢ THU NHẬP
   */
  async getAllIncomes() {
    console.log('💰 [INCOME SERVICE] Fetching all incomes from server...');
    
    try {
      if (!auth().currentUser) {
        throw new Error('❌ User not authenticated');
      }

      const snapshot = await this._getCollectionRef()
        .where('type', '==', 'income')
        .orderBy('createdAt', 'desc')
        .get({ source: 'server' });

      const incomes = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      console.log('✅ [INCOME SERVICE] Fetched', incomes.length, 'incomes');
      return incomes;

    } catch (error) {
      console.error('❌ [INCOME SERVICE] Error fetching incomes:', error.message);
      throw error;
    }
  }

  /**
   * 🟢 THÊM THU NHẬP MỚI
   * Logic: Thêm → Fetch lại toàn bộ → Trả về { freshData }
   * 
   * ✅ CỘNG tiền vào balance
   */
  async addIncome(incomeData) {
    console.log('📝 [INCOME SERVICE] Starting addIncome:', incomeData);
    
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('❌ User not authenticated');
      }

      // Step 1: Validate
      this._validateIncomeData(incomeData);

      // Step 2: Chuẩn bị dữ liệu (FORCE type = 'income')
      console.log('📝 [INCOME SERVICE] incomeData.type BEFORE FORCE:', incomeData.type);
      let dataToSave = {
        ...incomeData,
        type: 'income', // 🟢 FORCE: Income type
        userId: currentUser.uid,
        // ✅ FIX: Chỉ set createdAt/updatedAt nếu không có sẵn
        // incomeData đã có date từ createIncomeObject, chỉ cần createdAt/updatedAt server-side
        updatedAt: firestore.FieldValue.serverTimestamp(),
        isDeleted: false,
        // Nếu incomeData không có createdAt, mới set server timestamp
        ...(incomeData.createdAt ? {} : { createdAt: firestore.FieldValue.serverTimestamp() }),
      };
      
      console.log('📝 [INCOME SERVICE] dataToSave.type AFTER FORCE:', dataToSave.type);
      console.log('📝 [INCOME SERVICE] dataToSave.date:', dataToSave.date);
      console.log('📝 [INCOME SERVICE] dataToSave.createdAt:', dataToSave.createdAt);
      
      // ✅ CLEAN DATA: Xóa tất cả field undefined trước khi lưu
      dataToSave = this._cleanData(dataToSave);
      console.log('✅ [INCOME SERVICE] Cleaned data:', dataToSave);
      console.log('✅ [INCOME SERVICE] Cleaned data.type:', dataToSave.type);
      console.log('✅ [INCOME SERVICE] Cleaned data.date:', dataToSave.date);
      console.log('✅ [INCOME SERVICE] Cleaned data.createdAt:', dataToSave.createdAt);

      // Step 3: Lưu vào Firestore
      const docRef = await this._getCollectionRef().add(dataToSave);
      console.log('✅ [INCOME SERVICE] Income added with ID:', docRef.id);

      // Step 4: Lấy lại toàn bộ dữ liệu mới nhất (ALL transactions, not just income)
      const freshTransactions = await this._getAllTransactions();
      
      console.log('🔄 [INCOME SERVICE] Fresh transactions count:', freshTransactions.length);
      console.log('🔄 [INCOME SERVICE] Checking fresh transactions for type field:');
      freshTransactions.slice(0, 5).forEach((t, idx) => {
        console.log(`   Transaction ${idx}: id=${t.id}, type=${t.type}, amount=${t.amount}, date=${t.date}`);
      });

      return {
        success: true,
        newIncomeId: docRef.id,
        freshData: freshTransactions, // Trả về ALL transactions để store cập nhật
      };

    } catch (error) {
      console.error('❌ [INCOME SERVICE] Error adding income:', error.message);
      throw error;
    }
  }

  /**
   * ✏️ CẬP NHẬT THU NHẬP
   * Logic: Sửa → Fetch lại toàn bộ → Trả về { freshData }
   */
  async updateIncome(incomeId, updateData) {
    console.log('✏️ [INCOME SERVICE] Starting updateIncome:', incomeId);
    
    try {
      if (!auth().currentUser) throw new Error('❌ User not authenticated');
      if (!incomeId) throw new Error('❌ Income ID is required');

      // Step 1: Validate (partial update)
      this._validateIncomeData(updateData, true);

      // Step 2: Chuẩn bị dữ liệu
      const dataToUpdate = {
        ...updateData,
        type: 'income', // 🟢 FORCE: Income type
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // Step 3: Update Firestore
      await this._getCollectionRef().doc(incomeId).update(dataToUpdate);
      console.log('✅ [INCOME SERVICE] Income updated');

      // Step 4: Lấy lại toàn bộ dữ liệu mới nhất
      const freshTransactions = await this._getAllTransactions();

      return {
        success: true,
        updatedId: incomeId,
        freshData: freshTransactions,
      };

    } catch (error) {
      console.error('❌ [INCOME SERVICE] Error updating income:', error.message);
      throw error;
    }
  }

  /**
   * 🗑️ XÓA THU NHẬP
   * Logic: Xóa → Fetch lại toàn bộ → Trả về { freshData }
   */
  async deleteIncome(incomeId) {
    console.log('🗑️ [INCOME SERVICE] Starting deleteIncome:', incomeId);
    
    try {
      if (!auth().currentUser) throw new Error('❌ User not authenticated');
      if (!incomeId) throw new Error('❌ Income ID is required');

      // Step 1: Delete from Firestore
      await this._getCollectionRef().doc(incomeId).delete();
      console.log('✅ [INCOME SERVICE] Income deleted from Firestore');

      // Step 2: Lấy lại toàn bộ dữ liệu
      const freshTransactions = await this._getAllTransactions();
      
      console.log('✅ [INCOME SERVICE] Delete completed. Remaining count:', freshTransactions.length);
      
      return {
        success: true,
        deletedId: incomeId,
        freshData: freshTransactions,
      };

    } catch (error) {
      console.error('❌ [INCOME SERVICE] Error deleting income:', error.message);
      throw error;
    }
  }

  /**
   * 📋 PRIVATE: LẤY TẤT CẢ TRANSACTIONS (để update store)
   */
  async _getAllTransactions() {
    try {
      const snapshot = await this._getCollectionRef()
        .orderBy('createdAt', 'desc')
        .get({ source: 'server' });

      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`📄 [INCOME SERVICE] Raw Firebase doc: id=${doc.id}, type=${data.type}, hasTypeField=${!!data.type}`);
        return {
          ...data,
          id: doc.id,
        };
      });
      
      console.log('✅ [INCOME SERVICE] _getAllTransactions returned', transactions.length, 'transactions');
      return transactions;
    } catch (error) {
      console.error('❌ [INCOME SERVICE] Error fetching all transactions:', error.message);
      throw error;
    }
  }

  /**
   * ✅ VALIDATE INCOME DATA
   */
  _validateIncomeData(data, isPartial = false) {
    if (!isPartial) {
      // Description REQUIRED
      if (!data.description || !data.description.trim()) {
        throw new Error('❌ Income description is required');
      }
      
      // Amount is OPTIONAL (default to 0 if not provided)
      if (data.amount && data.amount < 0) {
        throw new Error('❌ Income amount cannot be negative');
      }
    }
    
    // Nếu có amount khi update, cũng phải valid
    if (data.amount && data.amount < 0) {
      throw new Error('❌ Income amount cannot be negative');
    }
    
    return true;
  }

  /**
   * 🔧 TẠO INCOME OBJECT TỪ FORM DATA
   * 
   * ✅ LOGIC CỘNG TIỀN:
   * - Amount OPTIONAL (default 0)
   * - Type luôn là 'income'
   */
  createIncomeObject(formData) {
    console.log('🔧 [INCOME SERVICE] Creating income object from form data:', formData);
    
    try {
      const { 
        amount, 
        categoryId, 
        categoryName, 
        description, 
        billImageUri,
        // 🤖 AI Processing fields
        processedText,
        rawOCRText,
        processingTime,
        hasAIProcessing,
      } = formData;
      
      // VALIDATE: Description REQUIRED
      if (!description || !description.trim()) {
        throw new Error('❌ Income description is required');
      }

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 🤖 Parse AI data if available
      let aiParsedData = null;
      if (processedText && processedText.trim()) {
        try {
          aiParsedData = AIDataParserService.parseAIResult(processedText);
          console.log('✅ [INCOME SERVICE] Parsed AI data:', aiParsedData);
          // ✅ FIX: Chỉ dùng JSON.stringify cho aiParsedData (xóa undefined lồng bên trong)
          aiParsedData = JSON.parse(JSON.stringify(aiParsedData));
        } catch (parseError) {
          console.warn('⚠️ [INCOME SERVICE] Could not parse AI data:', parseError);
        }
      }

      // 🟢 CỘNG TIỀN: Lấy amount từ nhập tay HOẶC từ AI
      const income = {
        type: 'income', // 🟢 FORCE: Income type
        amount: amount ? parseInt(amount, 10) : (aiParsedData?.totalAmount || 0), // ✅ LẤY TỪ AI NẾU KHÔNG NHẬP TAY
        description: description.trim(),
        category: categoryName || '💰 Thu nhập',      // Default category for income
        // Resolve categoryId: map 'note-only' or missing id to a real id (fallback to '7' = Lương)
        categoryId: this._resolveCategoryId ? this._resolveCategoryId(categoryId, categoryName, 'income') : (categoryId || '7'),
        date: firestore.Timestamp.fromDate(now),
        time: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
        billImageUri: billImageUri || null,
        createdAt: firestore.Timestamp.fromDate(now),
        // 🤖 AI Processing fields
        processedText: processedText || null,
        rawOCRText: rawOCRText || null,
        aiParsedData: aiParsedData || null,
        hasAIProcessing: !!hasAIProcessing,
        processingTime: processingTime || 0,
      };

      console.log('✅ [INCOME SERVICE] Income object created successfully:', income);
      return income;
    } catch (error) {
      console.error('❌ [INCOME SERVICE] Error creating income object:', error.message);
      throw error;
    }
  }

  /**
   * 💰 HELPER: Format amount
   */
  formatAmount(text) {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned) {
      return parseInt(cleaned, 10).toLocaleString('vi-VN');
    }
    return '';
  }

  /**
   * 📅 HELPER: Format date
   */
  _formatDate(dateObj) {
    try {
      const date = dateObj?.toDate?.() || new Date(dateObj);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Invalid date';
    }
  }

  /**
   * HELPER: Resolve categoryId for income (same strategy as TransactionService)
   */
  _resolveCategoryId(providedCategoryId, categoryNameOrLabel, type = 'income') {
    try {
      if (providedCategoryId && providedCategoryId !== 'note-only') return providedCategoryId;

      const removeDiacritics = (str = '') =>
        str
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .replace(/[\u0300-\u036f]/g, '');

      const name = (categoryNameOrLabel || '').toString();
      const normalized = removeDiacritics(name).toLowerCase().trim();

      const map = {
        'luong': '7',
        'lương': '7',
        'thuong': '8',
        'thưởng': '8',
        'dau tu': '9',
        'đầu tư': '9',
      };

      if (map[normalized]) return map[normalized];
      for (const key in map) {
        if (normalized.includes(key)) return map[key];
      }

      return type === 'income' ? '7' : '1';
    } catch (e) {
      console.warn('⚠️ [INCOME SERVICE] _resolveCategoryId failed:', e);
      return type === 'income' ? '7' : '1';
    }
  }

  /**
   * 💵 Tính tổng thu nhập trong tháng
   */
  async getMonthlyIncome(month = null, year = null) {
    console.log('💰 [INCOME SERVICE] Calculating monthly income');
    
    try {
      const now = new Date();
      const currentMonth = month || now.getMonth() + 1;
      const currentYear = year || now.getFullYear();

      const incomes = await this.getAllIncomes();

      const total = incomes
        .filter(t => {
          const date = t.date?.toDate?.() || t.createdAt?.toDate?.() || new Date(t.date) || new Date(t.createdAt);
          return date.getFullYear() === currentYear && date.getMonth() === currentMonth - 1;
        })
        .reduce((sum, t) => sum + (parseInt(t.amount, 10) || 0), 0);

      console.log(`✅ [INCOME SERVICE] Monthly income total:`, total);
      return total;

    } catch (error) {
      console.error('❌ [INCOME SERVICE] Error calculating monthly income:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
export default new IncomeService();
