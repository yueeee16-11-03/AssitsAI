import TransactionService from './TransactionService';
import { useTransactionStore } from '../store/transactionStore';

/**
 * TransactionHistoryService: Xử lý logic cho TransactionHistoryScreen
 * Responsibility: Grouping, formatting, filtering, delete/edit operations
 * * Architecture:
 * TransactionHistoryScreen → TransactionHistoryService → Store → TransactionService
 */

class TransactionHistoryServiceClass {

  /**
   * --------------------------------------------------------------------
   * 🚀 [SỬA LỖI] HÀM HELPER AN TOÀN ĐỂ XỬ LÝ DATE
   * --------------------------------------------------------------------
   * Luôn trả về một Date object HỢP LỆ hoặc NULL.
   * Xử lý cả 3 trường hợp: Firestore Timestamp, String, hoặc Date object.
   */
  _getSafeDate(dateObj) {
    try {
      // 1. Ưu tiên Firestore Timestamp (ví dụ: { seconds: 167..., nanoseconds: ... })
      if (dateObj && typeof dateObj.toDate === 'function') {
        const date = dateObj.toDate();
        // Kiểm tra xem date có hợp lệ không
        if (!isNaN(date.getTime())) return date;
      }
      
      // 2. Thử parse (nếu là string, number, hoặc Date object đã hỏng)
      if (dateObj) {
        const date = new Date(dateObj);
        // Kiểm tra xem date có hợp lệ không
        if (!isNaN(date.getTime())) return date;
      }

      // 3. Nếu là null, undefined, hoặc parse lỗi -> trả về null
      return null;
    } catch (error) {
      // Nếu có bất kỳ lỗi nào (ví dụ: new Date(null) ở một số môi trường)
      return null;
    }
  }


  /**
   * Format full datetime: "HH:MM, DD/MM/YYYY"
   * @param {any} dateObj - Firestore Timestamp hoặc Date object
   * @returns {string} Formatted full datetime
   * * Example: "14:30, 26/10/2025"
   */
  formatFullDateTime(dateObj) {
    console.log('📅 [HISTORY-SERVICE] Formatting full datetime:', dateObj);
    
    // ✅ SỬA LỖI: Dùng _getSafeDate
    const date = this._getSafeDate(dateObj);
    if (!date) {
      return '--:--, --/--/----'; // Trả về giá trị rỗng an toàn
    }

    try {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${hours}:${minutes}, ${day}/${month}/${year}`;
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error formatting full datetime:', error);
      return '--:--, --/--/----';
    }
  }

  /**
   * 📅 Format ngày với year cho "Hôm nay" và "Hôm qua"
   * @param {any} dateObj - Firestore Timestamp hoặc Date object
   * @returns {string} Formatted date string
   */
  formatDate(dateObj) {
    console.log('📅 [HISTORY-SERVICE] Formatting date:', dateObj);
    
    // ✅ SỬA LỖI: Dùng _getSafeDate
    const date = this._getSafeDate(dateObj);

    // ✅ SỬA LỖI: Nếu ngày không hợp lệ, trả về một key an toàn
    if (!date) {
      console.warn('⚠️ [HISTORY-SERVICE] Invalid date found, grouping as "Không xác định"');
      return 'Không xác định';
    }

    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateString = `${day}/${month}/${year}`;

      // So sánh an toàn (chỉ so sánh date parts)
      if (date.toDateString() === today.toDateString()) {
        return `Hôm nay (${dateString})`;
      } else if (date.toDateString() === yesterday.toDateString()) {
        return `Hôm qua (${dateString})`;
      } else {
        return dateString;
      }
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error formatting date:', error);
      return 'Không xác định';
    }
  }

  /**
   * 🎯 Nhóm giao dịch theo ngày
   * @param {Array} transactions - Danh sách giao dịch
   * @returns {Object} Grouped transactions by date key
   */
  groupTransactionsByDate(transactions) {
    console.log('📊 [HISTORY-SERVICE] Grouping transactions by date. Count:', transactions.length);
    
    try {
      const grouped = {};

      transactions.forEach((transaction) => {
        // ✅ SỬA LỖI: Ưu tiên `date` (vì nó là ngày giao dịch)
        // sau đó mới tới `createdAt` (ngày tạo).
        const dateObj = transaction.date || transaction.createdAt;
        
        // ✅ SỬA LỖI: Hàm formatDate đã an toàn
        // Nó sẽ trả về "Không xác định" nếu dateObj là null/undefined
        const dateKey = this.formatDate(dateObj); 

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(transaction);
      });

      console.log('✅ [HISTORY-SERVICE] Grouped into', Object.keys(grouped).length, 'date groups');
      return grouped;
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error grouping transactions:', error);
      return {};
    }
  }

  /**
   * 😊 Lấy emoji của danh mục từ categoryId
   * @param {string} categoryId - Category ID
   * @returns {string} Emoji character
   */
  getCategoryEmoji(categoryId) {
    const emojiMap = {
      '1': '🍔',   // Ăn uống
      '2': '🚗',   // Di chuyển
      '3': '🛍️',  // Mua sắm
      '4.': '🎮',   // Giải trí
      '5': '💊',   // Sức khỏe
      '6': '📚',   // Giáo dục
      '7': '🏠',   // Nhà cửa
      '8': '📦',   // Khác (expense)
      '9': '💼',   // Lương
      '10': '🎁',  // Thưởng
      '11': '📈',  // Đầu tư
      '12': '💰',  // Khác (income)
      // Thêm các category mặc định từ service
      'note-only': '📝',
      'income-general': '💰',
    };
    return emojiMap[categoryId] || '💳'; // Fallback
  }

  /**
   * 💰 Tính tổng chi tiêu/thu nhập theo ngày
   * @param {Array} transactions - Danh sách giao dịch trong ngày
   * @returns {Object} { expenses: number, income: number }
   */
  calculateDailySummary(transactions) {
    console.log('🧮 [HISTORY-SERVICE] Calculating daily summary for', transactions.length, 'transactions');
    
    try {
      const summary = {
        expenses: transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0), // Thêm (|| 0)
        income: transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0), // Thêm (|| 0)
      };

      console.log('✅ [HISTORY-SERVICE] Daily summary:', summary);
      return summary;
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error calculating summary:', error);
      return { expenses: 0, income: 0 };
    }
  }

  /**
   * 🗑️ Xóa giao dịch với confirmation + Store update
   * (Hàm này hiện đang được xử lý logic ở Screen, giữ lại cho tương thích)
   */
  async deleteTransaction(transactionId, transaction) {
    console.log('🗑️ [HISTORY-SERVICE] Deleting transaction:', transactionId);
    
    return new Promise((resolve) => {
      // The actual deletion logic is handled in the screen component
      resolve(true);
    });
  }

  /**
   * 🔄 Xoá giao dịch - Internal implementation
   * (Đã sửa lỗi: Logic này nên ở trong Screen, nhưng giữ lại)
   */
  async performDelete(transactionId) {
    console.log('⚠️ [HISTORY-SERVICE] Performing delete for:', transactionId);
    
    try {
      const deleteTransactionFromStore = useTransactionStore.getState().deleteTransaction;
      await deleteTransactionFromStore(transactionId);

      console.log('✅ [HISTORY-SERVICE] Transaction deleted successfully via Store');
      return {
        success: true,
        message: 'Đã xóa giao dịch',
        deletedId: transactionId,
      };
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error deleting transaction:', error.message);
      return {
        success: false,
        message: error.message || 'Không thể xóa giao dịch',
      };
    }
  }

  /**
   * ✏️ Chuẩn bị dữ liệu để edit
   */
  prepareForEdit(transaction) {
    console.log('✏️ [HISTORY-SERVICE] Preparing transaction for edit:', transaction.id);
    
    try {
      return {
        ...transaction,
      };
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error preparing for edit:', error);
      return transaction;
    }
  }

  /**
   * 🔍 Lọc giao dịch theo type (expense/income)
   */
  filterByType(transactions, type) {
    console.log('🔍 [HISTORY-SERVICE] Filtering by type:', type);
    return transactions.filter(t => t.type === type);
  }

  /**
   * 🔍 Lọc giao dịch theo danh mục
   */
  filterByCategory(transactions, categoryId) {
    console.log('🔍 [HISTORY-SERVICE] Filtering by category:', categoryId);
    return transactions.filter(t => t.categoryId === categoryId);
  }

  /**
   * 🔍 Lọc giao dịch theo khoảng ngày
   */
  filterByDateRange(transactions, startDate, endDate) {
    console.log('🔍 [HISTORY-SERVICE] Filtering by date range:', startDate, '-', endDate);
    
    // Đảm bảo startDate và endDate là Date objects hợp lệ
    const start = this._getSafeDate(startDate);
    const end = this._getSafeDate(endDate);

    if (!start || !end) {
      console.warn("⚠️ [HISTORY-SERVICE] Invalid date range provided for filtering.");
      return transactions;
    }

    return transactions.filter(transaction => {
      // ✅ SỬA LỖI: Dùng _getSafeDate
      const date = this._getSafeDate(transaction.date || transaction.createdAt);
      if (!date) return false; // Không bao gồm giao dịch không có ngày
      return date >= start && date <= end;
    });
  }

  /**
   * 🔍 Tìm giao dịch theo keyword
   */
  searchTransactions(transactions, keyword) {
    console.log('🔍 [HISTORY-SERVICE] Searching for:', keyword);
    
    if (!keyword || !keyword.trim()) {
      return transactions;
    }

    const lowerKeyword = keyword.toLowerCase();
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(lowerKeyword) ||
      t.category?.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 📊 Lấy thống kê giao dịch
   */
  getStatistics(transactions) {
    console.log('📊 [HISTORY-SERVICE] Calculating statistics for', transactions.length, 'transactions');
    
    try {
      const expenses = this.filterByType(transactions, 'expense');
      const incomes = this.filterByType(transactions, 'income');

      const totalExpenses = expenses.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalIncome = incomes.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalTransactions = transactions.length;

      const stats = {
        totalTransactions,
        totalExpenses,
        totalIncome,
        netAmount: totalIncome - totalExpenses,
        averageTransaction: totalTransactions > 0 
          ? (totalExpenses + totalIncome) / totalTransactions 
          : 0,
        expenseCount: expenses.length,
        incomeCount: incomes.length,
      };

      console.log('✅ [HISTORY-SERVICE] Statistics calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error calculating statistics:', error);
      return {
        totalTransactions: 0,
        totalExpenses: 0,
        totalIncome: 0,
        netAmount: 0,
        averageTransaction: 0,
        expenseCount: 0,
        incomeCount: 0,
      };
    }
  }

  /**
   * 🔄 Làm mới dữ liệu giao dịch từ Store
   */
  async refreshTransactions() {
    console.log('🔄 [HISTORY-SERVICE] Refreshing transactions from Store');
    
    try {
      const fetchTransactions = useTransactionStore.getState().fetchTransactions;
      await fetchTransactions();
      
      const transactions = useTransactionStore.getState().transactions;
      console.log('✅ [HISTORY-SERVICE] Refreshed', transactions.length, 'transactions');
      return transactions;
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error refreshing transactions:', error);
      throw error;
    }
  }

  /**
   * 📅 Sắp xếp giao dịch theo số tiền (cao nhất trước)
   */
  sortByAmountDesc(transactions) {
    console.log('📅 [HISTORY-SERVICE] Sorting transactions by amount descending');
    return [...transactions].sort((a, b) => (b.amount || 0) - (a.amount || 0));
  }

  /**
   * ⏰ Format time từ Timestamp to HH:MM format
   * @param {any} dateObj - Firestore Timestamp hoặc Date object
   * @returns {string} Formatted time (HH:MM)
   * * Example: "14:30"
   */
  formatTime(dateObj) {
    console.log('⏰ [HISTORY-SERVICE] Formatting time:', dateObj);
    
    // ✅ SỬA LỖI: Dùng _getSafeDate
    const date = this._getSafeDate(dateObj);
    if (!date) {
      return '--:--';
    }

    try {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error formatting time:', error);
      return '--:--';
    }
  }

  /**
   * 📅 Sắp xếp giao dịch theo ngày (mới nhất trước)
   * @param {Array} transactions - Danh sách giao dịch
   * @returns {Array} Sorted transactions
   */
  sortByDateDesc(transactions) {
    console.log('📅 [HISTORY-SERVICE] Sorting transactions by date descending');
    
    return [...transactions].sort((a, b) => {
      // ✅ SỬA LỖI: Dùng _getSafeDate
      // Gán ngày không hợp lệ là 0 để chúng bị đẩy xuống cuối
      const dateA = this._getSafeDate(a.date || a.createdAt)?.getTime() || 0;
      const dateB = this._getSafeDate(b.date || b.createdAt)?.getTime() || 0;
      
      return dateB - dateA;
    });
  }
}

// Export singleton instance
const TransactionHistoryService = new TransactionHistoryServiceClass();
export default TransactionHistoryService;