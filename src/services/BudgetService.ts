import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import budgetApi from '../api/budgetApi';

/**
 * BudgetService: Business logic cho ngân sách
 * 
 * Responsibilities:
 * - Fetch budgets từ Firestore
 * - Tính toán chi tiêu cho mỗi danh mục
 * - Tính toán dự đoán
 * - CRUD operations
 */

interface BudgetItem {
  id: string;
  categoryId: string;
  category: string;
  icon: string;
  budget: number;
  color: string;
  spent?: number;
  predicted?: number;
  createdAt?: any;
  updatedAt?: any;
  isActive?: boolean;
}

class BudgetService {
  /**
   * Lấy tất cả ngân sách với tính toán chi tiêu
   */
  async getAllBudgetsWithSpending(year?: number, month?: number) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const currentYear = typeof year === 'number' ? year : new Date().getFullYear();
      const currentMonth = typeof month === 'number' ? month : new Date().getMonth();

      // 1. Lấy tất cả budgets (pass year/month so API can optionally use it)
      console.log(`🔎 [SERVICE] getAllBudgetsWithSpending for ${currentYear}-${currentMonth}`);
      const budgets = await budgetApi.getBudgets(currentYear, currentMonth);
      console.log(`   API returned ${budgets.length} budgets`);

      // 2. Lấy tất cả transactions (không filter theo date, vì date range queries cần index)
      let allTransactions: any[] = [];
      try {
        const transactionsSnapshot = await firestore()
          .collection('users')
          .doc(currentUser.uid)
          .collection('transactions')
          .orderBy('createdAt', 'desc')
          .get({ source: 'server' });

        transactionsSnapshot.docs.forEach((doc: any) => {
          const data = doc.data();
          allTransactions.push({
            id: doc.id,
            type: data.type || 'expense',
            categoryId: (data.categoryId || '').toString(),  // Convert to string for comparison
            category: data.category,
            amount: data.amount || 0,
            date: data.date,
            createdAt: data.createdAt,
          });
        });

        console.log('🔵 [SERVICE] Retrieved', allTransactions.length, 'transactions from Firestore');
        if (allTransactions.length > 0) {
          console.log('   Sample tx:', { categoryId: allTransactions[0].categoryId, type: allTransactions[0].type, amount: allTransactions[0].amount });
        }
      } catch (txError) {
        console.warn('⚠️ [SERVICE] Could not fetch transactions (may need Firestore index):', (txError as Error).message);
        // Tiếp tục với budgets rỗng
        allTransactions = [];
      }

      // Helper: Safely convert Firestore Timestamp to Date
      const toDate = (field: any): Date => {
        if (!field) return new Date();
        if (typeof field.toDate === 'function') return field.toDate();
        if (field instanceof Date) return field;
        return new Date(field);
      };

      // 3. Tính spent cho mỗi budget (chỉ tính từ transactions của tháng hiện tại)
      const budgetsWithSpending = budgets.map((budget: any): any => {
        // Lọc transactions của danh mục này và tháng hiện tại
        let spent = 0;
        for (let i = 0; i < allTransactions.length; i++) {
          const t: any = allTransactions[i];
          // ✅ FIX: Compare categoryId as strings, check type
          if ((t.categoryId === budget.categoryId || t.categoryId === String(budget.categoryId)) && t.type === 'expense') {
            // Convert date để so sánh
            const txDate = toDate(t.date || t.createdAt);
            if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
              spent += t.amount || 0;
            }
          }
        }

        // Predicted = spent (vì chỉ có dữ liệu tháng hiện tại)
        const predicted = spent;

        return {
          ...budget,
          spent: spent || 0,
          predicted: predicted || 0,
        };
      });

      console.log('✅ [SERVICE] Calculated spending for', budgetsWithSpending.length, 'budgets');
      if (budgetsWithSpending.length > 0) {
        console.log('   Budget details:', budgetsWithSpending.map(b => `[${b.id}: ${b.category} spent=${b.spent}, budget=${b.budget}]`).join('; '));
      }
      return budgetsWithSpending;
    } catch (error) {
      console.error('❌ [SERVICE] Error getting budgets with spending:', error);
      throw error;
    }
  }

  /**
   * Thêm ngân sách mới
   */
  async addBudget(budgetData: Omit<BudgetItem, 'id'>) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('🔵 [SERVICE] Adding budget:', budgetData);

      const result = await budgetApi.addBudget(budgetData);

      console.log('✅ [SERVICE] Budget added:', result.id);
      return result;
    } catch (error) {
      console.error('❌ [SERVICE] Error adding budget:', error);
      throw error;
    }
  }

  /**
   * Cập nhật ngân sách
   */
  async updateBudget(budgetId: string, updateData: Partial<BudgetItem>) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('🔵 [SERVICE] Updating budget:', budgetId, updateData);

      await budgetApi.updateBudget(budgetId, updateData);

      console.log('✅ [SERVICE] Budget updated:', budgetId);
      return true;
    } catch (error) {
      console.error('❌ [SERVICE] Error updating budget:', error);
      throw error;
    }
  }

  /**
   * Xóa ngân sách
   */
  async deleteBudget(budgetId: string) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      console.log('🔵 [SERVICE] Deleting budget:', budgetId);

      await budgetApi.deleteBudget(budgetId);

      console.log('✅ [SERVICE] Budget deleted:', budgetId);
      return true;
    } catch (error) {
      console.error('❌ [SERVICE] Error deleting budget:', error);
      throw error;
    }
  }

  /**
   * Lấy tổng chi tiêu theo danh mục trong tháng
   */
  async getCategorySpending(
    categoryId: string,
    year?: number,
    month?: number
  ) {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Người dùng chưa đăng nhập');
      }

      const now = new Date();
      const currentYear = year || now.getFullYear();
      const currentMonth = month || now.getMonth();

      const snapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .where('categoryId', '==', categoryId)
        .where('type', '==', 'expense')
        .get({ source: 'server' });

      const transactions = snapshot.docs.map(doc => doc.data());

      const spending = transactions
        .filter(t => {
          const txDate = t.date?.toDate?.() || t.createdAt?.toDate?.() || new Date(t.date || t.createdAt);
          return (
            txDate.getFullYear() === currentYear &&
            txDate.getMonth() === currentMonth
          );
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      console.log(`✅ [SERVICE] Category spending for ${categoryId}:`, spending);
      return spending || 0;
    } catch (error) {
      console.error('❌ [SERVICE] Error getting category spending:', error);
      throw error;
    }
  }

  /**
   * Kiểm tra nếu vượt ngân sách
   */
  isOverBudget(spent: number, budget: number, predicted: number) {
    return spent > budget || predicted > budget;
  }

  /**
   * Tính phần trăm sử dụng ngân sách
   */
  getPercentage(spent: number, budget: number) {
    return Math.min((spent / budget) * 100, 100);
  }

  /**
   * Tính tổng tất cả ngân sách
   */
  getTotalBudget(budgets: BudgetItem[]) {
    return budgets.reduce((sum, item) => sum + (item.budget || 0), 0);
  }

  /**
   * Tính tổng chi tiêu
   */
  getTotalSpent(budgets: BudgetItem[]) {
    return budgets.reduce((sum, item) => sum + (item.spent || 0), 0);
  }

  /**
   * Tính tổng dự kiến
   */
  getTotalPredicted(budgets: BudgetItem[]) {
    return budgets.reduce((sum, item) => sum + (item.predicted || 0), 0);
  }
}

export default new BudgetService();
