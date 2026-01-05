import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isDefault: boolean;
  transactionCount: number;
  totalAmount: number;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  description: string;
  date: any;
  createdAt: any;
}

class CategoryService {
  /**
   * Extract icon from category string (removes emoji/icon prefix)
   */
  private extractCategoryName(categoryString: string): string {
    // Remove emoji and extra spaces
    return categoryString
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
      .trim();
  }

  /**
   * Map category name to icon
   */
  private getCategoryIcon(categoryName: string, type: 'income' | 'expense'): string {
    const lowerName = categoryName.toLowerCase();
    
    // Income categories
    if (type === 'income') {
      if (lowerName.includes('lương') || lowerName.includes('salary')) return 'cash';
      if (lowerName.includes('thưởng') || lowerName.includes('bonus')) return 'gift';
      if (lowerName.includes('đầu tư') || lowerName.includes('invest')) return 'chart-line';
      if (lowerName.includes('bán') || lowerName.includes('sell')) return 'sale';
      return 'cash-plus';
    }
    
    // Expense categories
    if (lowerName.includes('ăn') || lowerName.includes('uống') || lowerName.includes('food')) return 'food';
    if (lowerName.includes('mua') || lowerName.includes('sắm') || lowerName.includes('shop')) return 'cart';
    if (lowerName.includes('xăng') || lowerName.includes('xe') || lowerName.includes('gas')) return 'gas-station';
    if (lowerName.includes('nhà') || lowerName.includes('thuê') || lowerName.includes('house')) return 'home';
    if (lowerName.includes('y tế') || lowerName.includes('thuốc') || lowerName.includes('health')) return 'pill';
    if (lowerName.includes('giải trí') || lowerName.includes('vui') || lowerName.includes('entertainment')) return 'movie';
    if (lowerName.includes('cà phê') || lowerName.includes('coffee')) return 'coffee';
    if (lowerName.includes('chợ') || lowerName.includes('market')) return 'basket';
    if (lowerName.includes('điện') || lowerName.includes('nước') || lowerName.includes('utility')) return 'lightning-bolt';
    if (lowerName.includes('học') || lowerName.includes('education')) return 'school';
    if (lowerName.includes('du lịch') || lowerName.includes('travel')) return 'airplane';
    if (lowerName.includes('quần áo') || lowerName.includes('clothes')) return 'tshirt-crew';
    if (lowerName.includes('tiết kiệm') || lowerName.includes('ghi chú') || lowerName.includes('saving')) return 'piggy-bank';
    
    return 'receipt';
  }

  /**
   * Map category to color based on type and name
   */
  private getCategoryColor(categoryName: string, type: 'income' | 'expense'): string {
    const lowerName = categoryName.toLowerCase();
    
    if (type === 'income') return '#10B981'; // Green for income
    
    // Expense colors
    if (lowerName.includes('ăn') || lowerName.includes('food')) return '#EF4444';
    if (lowerName.includes('mua') || lowerName.includes('shop')) return '#8B5CF6';
    if (lowerName.includes('xăng') || lowerName.includes('gas')) return '#F59E0B';
    if (lowerName.includes('nhà')) return '#10B981';
    if (lowerName.includes('y tế')) return '#EC4899';
    if (lowerName.includes('giải trí')) return '#6366F1';
    if (lowerName.includes('cà phê')) return '#84CC16';
    if (lowerName.includes('chợ')) return '#14B8A6';
    
    return '#6366F1';
  }

  /**
   * Fetch all categories from user's transactions
   */
  async fetchCategoriesFromTransactions(): Promise<Category[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        console.log('No user logged in');
        return [];
      }

      const userId = currentUser.uid;
      
      // Fetch all transactions for the user
      const transactionsSnapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .get();

      if (transactionsSnapshot.empty) {
        console.log('No transactions found');
        return [];
      }

      // Map to store category data
      const categoryMap = new Map<string, {
        name: string;
        type: 'income' | 'expense';
        transactionCount: number;
        totalAmount: number;
      }>();

      // Process each transaction
      transactionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const category = data.category;
        const type = data.type || 'expense';
        const amount = data.amount || 0;

        if (!category) return;

        const categoryName = this.extractCategoryName(category);
        const key = `${categoryName}_${type}`;

        if (categoryMap.has(key)) {
          const existing = categoryMap.get(key)!;
          existing.transactionCount += 1;
          existing.totalAmount += amount;
        } else {
          categoryMap.set(key, {
            name: categoryName,
            type: type,
            transactionCount: 1,
            totalAmount: amount,
          });
        }
      });

      // Convert map to array of Category objects
      const categories: Category[] = Array.from(categoryMap.entries()).map(([key, data]) => ({
        id: key,
        name: data.name,
        icon: this.getCategoryIcon(data.name, data.type),
        color: this.getCategoryColor(data.name, data.type),
        type: data.type,
        isDefault: false,
        transactionCount: data.transactionCount,
        totalAmount: data.totalAmount,
      }));

      // Sort by transaction count (most used first)
      categories.sort((a, b) => b.transactionCount - a.transactionCount);

      return categories;
    } catch (error) {
      console.error('Error fetching categories from transactions:', error);
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  getCategoryStats(categories: Category[]) {
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');
    const totalTransactions = categories.reduce((sum, c) => sum + c.transactionCount, 0);
    const totalExpense = expenseCategories.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalIncome = incomeCategories.reduce((sum, c) => sum + c.totalAmount, 0);

    return {
      total: categories.length,
      expense: expenseCategories.length,
      income: incomeCategories.length,
      transactions: totalTransactions,
      totalExpense,
      totalIncome,
    };
  }

  /**
   * Get all transactions for a specific category
   */
  async getTransactionsByCategory(categoryName: string, categoryType: 'expense' | 'income'): Promise<Transaction[]> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) return [];

      const snapshot = await firestore()
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .where('type', '==', categoryType)
        .get();

      const transactions: Transaction[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const cleanCategoryName = this.extractCategoryName(data.category || '');
        
        // Match transactions by category name and type
        if (cleanCategoryName.toLowerCase() === categoryName.toLowerCase()) {
          transactions.push({
            id: doc.id,
            amount: data.amount || 0,
            category: data.category || '',
            type: data.type || 'expense',
            description: data.description || data.note || '',
            date: data.date,
            createdAt: data.createdAt,
          });
        }
      });

      // Sort by date descending (newest first) in memory
      transactions.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate().getTime() : new Date(a.date).getTime();
        const dateB = b.date?.toDate ? b.date.toDate().getTime() : new Date(b.date).getTime();
        return dateB - dateA;
      });

      return transactions;
    } catch (error) {
      console.error('Error fetching transactions by category:', error);
      return [];
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      const userId = auth().currentUser?.uid;
      if (!userId) throw new Error('User not authenticated');

      await firestore()
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .doc(transactionId)
        .delete();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }
}

export default new CategoryService();
