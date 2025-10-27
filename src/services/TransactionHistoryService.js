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
   * Format full datetime: "HH:MM, DD/MM/YYYY"
   * @param {any} dateObj - Firestore Timestamp hoặc Date object
   * @returns {string} Formatted full datetime
   * * Example: "14:30, 26/10/2025"
   */
  formatFullDateTime(dateObj) {
    console.log('📅 [HISTORY-SERVICE] Formatting full datetime:', dateObj);
    try {
      const date = dateObj?.toDate?.() || new Date(dateObj);
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
    try {
      const date = dateObj?.toDate?.() || new Date(dateObj);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dateString = `${day}/${month}/${year}`;

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
   * * Example:
   * {
   * "Hôm nay": [{...}, {...}],
   * "Hôm qua": [{...}],
   * "20/10/2025": [{...}]
   * }
   */
  groupTransactionsByDate(transactions) {
    console.log('📊 [HISTORY-SERVICE] Grouping transactions by date. Count:', transactions.length);
    
    try {
      const grouped = {};

      transactions.forEach((transaction) => {
        const date = transaction.date || transaction.createdAt;
        const dateKey = this.formatDate(date);

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
      '4': '🎮',   // Giải trí
      '5': '💊',   // Sức khỏe
      '6': '📚',   // Giáo dục
      '7': '🏠',   // Nhà cửa
      '8': '📦',   // Khác (expense)
      '9': '💼',   // Lương
      '10': '🎁',  // Thưởng
      '11': '📈',  // Đầu tư
      '12': '💰',  // Khác (income)
    };
    return emojiMap[categoryId] || '💳';
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
          .reduce((sum, t) => sum + t.amount, 0),
        income: transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
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
   * @param {string} transactionId - Transaction ID to delete
   * @param {Transaction} transaction - Transaction object (for display in confirmation)
   * @returns {Promise<boolean>} true if deleted, false if cancelled
   * * Usage:
   * const deleted = await TransactionHistoryService.deleteTransaction(id, transaction);
   * if (deleted) {
   * // Show success message
   * }
   */
  async deleteTransaction(transactionId, transaction) {
    console.log('🗑️ [HISTORY-SERVICE] Deleting transaction:', transactionId);
    
    return new Promise((resolve) => {
      // This function returns a promise that needs to be confirmed from UI
      // The actual deletion logic is handled in the screen component
      resolve(true);
    });
  }

  /**
   * 🔄 Xoá giao dịch - Internal implementation
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} { success: boolean, message: string }
   */
  async performDelete(transactionId) {
    console.log('⚠️ [HISTORY-SERVICE] Performing delete for:', transactionId);
    
    try {
      // ----- BẮT ĐẦU SỬA LỖI -----
      // Lấy hàm xóa từ Store
      const deleteTransactionFromStore = useTransactionStore.getState().deleteTransaction;
      
      // ✅ ĐÚNG: Chỉ gọi Store. Store sẽ gọi Service và đồng bộ state.
      await deleteTransactionFromStore(transactionId);
      // ----- KẾT THÚC SỬA LỖI -----

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
   * ✏️ Chuẩn bị dữ liệu để edit (có thể thêm logic nếu cần)
   * @param {Transaction} transaction - Transaction to edit
   * @returns {Transaction} Transaction object for editing
   */
  prepareForEdit(transaction) {
    console.log('✏️ [HISTORY-SERVICE] Preparing transaction for edit:', transaction.id);
    
    try {
      // Có thể thêm logic transform dữ liệu cho edit form
      return {
        ...transaction,
        // Thêm computed fields nếu cần
      };
    } catch (error) {
      console.error('❌ [HISTORY-SERVICE] Error preparing for edit:', error);
      return transaction;
    }
  }

  /**
   * 🔍 Lọc giao dịch theo type (expense/income)
   * @param {Array} transactions - Danh sách giao dịch
   * @param {string} type - 'expense' or 'income'
   * @returns {Array} Filtered transactions
   */
  filterByType(transactions, type) {
    console.log('🔍 [HISTORY-SERVICE] Filtering by type:', type);
    return transactions.filter(t => t.type === type);
  }

  /**
   * 🔍 Lọc giao dịch theo danh mục
   * @param {Array} transactions - Danh sách giao dịch
   * @param {string} categoryId - Category ID
   * @returns {Array} Filtered transactions
   */
  filterByCategory(transactions, categoryId) {
    console.log('🔍 [HISTORY-SERVICE] Filtering by category:', categoryId);
    return transactions.filter(t => t.categoryId === categoryId);
  }

  /**
   * 🔍 Lọc giao dịch theo khoảng ngày
   * @param {Array} transactions - Danh sách giao dịch
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Filtered transactions
   */
  filterByDateRange(transactions, startDate, endDate) {
    console.log('🔍 [HISTORY-SERVICE] Filtering by date range:', startDate, '-', endDate);
    
    return transactions.filter(transaction => {
      const date = transaction.date?.toDate?.() || new Date(transaction.date);
      return date >= startDate && date <= endDate;
    });
  }

  /**
   * 🔍 Tìm giao dịch theo keyword
   * @param {Array} transactions - Danh sách giao dịch
   * @param {string} keyword - Search keyword
   * @returns {Array} Filtered transactions
   */
  searchTransactions(transactions, keyword) {
    console.log('🔍 [HISTORY-SERVICE] Searching for:', keyword);
    
    if (!keyword.trim()) {
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
   * @param {Array} transactions - Danh sách giao dịch
   * @returns {Object} Statistics
   */
  getStatistics(transactions) {
    console.log('📊 [HISTORY-SERVICE] Calculating statistics for', transactions.length, 'transactions');
    
    try {
      const expenses = transactions.filter(t => t.type === 'expense');
      const incomes = transactions.filter(t => t.type === 'income');

      const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
      const totalTransactions = expenses.length + incomes.length;

      const stats = {
        totalTransactions,
        totalExpenses,
        totalIncome,
        netAmount: totalIncome - totalExpenses,
        averageTransaction: totalTransactions > 0 ? (totalExpenses + totalIncome) / totalTransactions : 0,
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
   * @returns {Promise<Array>} Fresh transactions from Store
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
   * @param {Array} transactions - Danh sách giao dịch
   * @returns {Array} Sorted transactions
   */
  sortByAmountDesc(transactions) {
    console.log('📅 [HISTORY-SERVICE] Sorting transactions by amount descending');
    return [...transactions].sort((a, b) => b.amount - a.amount);
  }

  /**
   * ⏰ Format time từ Timestamp to HH:MM format
   * @param {any} dateObj - Firestore Timestamp hoặc Date object
   * @returns {string} Formatted time (HH:MM)
   * * Example: "14:30"
   */
  formatTime(dateObj) {
    console.log('⏰ [HISTORY-SERVICE] Formatting time:', dateObj);
    try {
      const date = dateObj?.toDate?.() || new Date(dateObj);
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
      const dateA = a.date || a.createdAt;
      const dateB = b.date || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });
  }
}

// Export singleton instance
const TransactionHistoryService = new TransactionHistoryServiceClass();
export default TransactionHistoryService;