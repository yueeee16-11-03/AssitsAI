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

      const now = new Date();
      const currentYear = year || now.getFullYear();
      const currentMonth = month || now.getMonth();

      // 1. Lấy tất cả budgets
      const budgets = await budgetApi.getBudgets();

      // 2. Lấy tất cả transactions
      const transactionsSnapshot = await firestore()
        .collection('users')
        .doc(currentUser.uid)
        .collection('transactions')
        .orderBy('date', 'desc')
        .get({ source: 'server' });

      const allTransactions: any[] = [];
      transactionsSnapshot.docs.forEach((doc: any) => {
        const data = doc.data();
        allTransactions.push({
          id: doc.id,
          type: data.type || '',
          categoryId: data.categoryId || '',
          category: data.category,
          amount: data.amount || 0,
          date: data.date,
          createdAt: data.createdAt,
        });
      });

      console.log('🔵 [SERVICE] Retrieved', allTransactions.length, 'transactions');

      // 3. Tính spent và predicted cho mỗi budget
      const budgetsWithSpending = budgets.map((budget: any): any => {
        // Lọc transactions của danh mục này
        const categoryTransactions: any[] = [];
        for (let i = 0; i < allTransactions.length; i++) {
          const t: any = allTransactions[i];
          if (t.categoryId === budget.categoryId && t.type === 'expense') {
            categoryTransactions.push(t);
          }
        }

        // Tính spent (tháng hiện tại)
        let spent = 0;
        for (let i = 0; i < categoryTransactions.length; i++) {
          const t: any = categoryTransactions[i];
          const txDate = t.date?.toDate?.() || t.createdAt?.toDate?.() || new Date(t.date || t.createdAt);
          if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
            spent += t.amount || 0;
          }
        }

        // Tính predicted (dựa trên trung bình của 3 tháng gần nhất)
        let predicted = spent;
        if (categoryTransactions.length > 0) {
          const last3Months = categoryTransactions.slice(0, 30); // Giả sử ~10 transactions/month
          let totalAmount = 0;
          for (let i = 0; i < last3Months.length; i++) {
            totalAmount += last3Months[i].amount || 0;
          }
          const avgMonthly = totalAmount / 3;
          predicted = Math.round(avgMonthly);
        }

        return {
          ...budget,
          spent: spent || 0,
          predicted: predicted || 0,
        };
      });

      console.log('✅ [SERVICE] Calculated spending for', budgetsWithSpending.length, 'budgets');
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
