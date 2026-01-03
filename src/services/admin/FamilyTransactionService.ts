/**
 * FamilyTransactionService.ts
 * Service để quản lý giao dịch gia đình (fetch, filter, calculate)
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export type TransactionType = 'income' | 'expense';

export interface FamilyTransaction {
  id: string;
  familyId: string;
  userId: string;
  memberName: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: string;
  date: any; // Firestore timestamp
  description: string;
  note?: string;
  paymentMethod?: string;
  createdAt: any;
  updatedAt: any;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
}

class FamilyTransactionService {
  /**
   * HELPER: Lấy reference đến collection transactions của user cụ thể
   * Cấu trúc: /users/{userId}/transactions
   */
  private _getTransactionCollectionRef(userId: string) {
    if (!userId) {
      throw new Error('userId is required');
    }
    return firestore()
      .collection('users')
      .doc(userId)
      .collection('transactions');
  }

  /**
   * Lấy danh sách giao dịch gần đây của gia đình (tất cả user)
   */
  async getRecentTransactions(
    familyId: string,
    limit: number = 20
  ): Promise<FamilyTransaction[]> {
    try {
      if (!familyId) {
        throw new Error('familyId is required');
      }

      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Kiểm tra user có trong family không
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;
      const isMember =
        familyData.ownerId === currentUser.uid ||
        familyData.memberIds?.includes(currentUser.uid);

      if (!isMember) {
        throw new Error('You do not have permission to view these transactions');
      }

      // 🔍 Lấy danh sách members của family
      const memberSnapshots = await firestore()
        .collection('family_members')
        .where('familyId', '==', familyId)
        .get();

      // Map userId -> name (field trong family_members collection là 'name' chứ không phải 'memberName')
      const memberNameMap = new Map<string, string>();
      memberSnapshots.docs.forEach((doc) => {
        const data = doc.data() as any;
        memberNameMap.set(data.userId, data.name || 'Unknown');
      });

      const memberIds = Array.from(memberNameMap.keys());

      // 🔄 Lấy transactions của tất cả members
      let allTransactions: FamilyTransaction[] = [];

      for (const memberId of memberIds) {
        try {
          const txSnapshot = await this._getTransactionCollectionRef(memberId)
            .get({ source: 'server' }); // ← Luôn đọc từ server như TransactionService

          const memberTransactions = txSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            userId: memberId,
            memberName: memberNameMap.get(memberId) || 'Unknown', // ← Thêm memberName từ family_members
            familyId,
          } as FamilyTransaction));

          allTransactions = [...allTransactions, ...memberTransactions];
        } catch (error) {
          console.warn(`⚠️ Failed to fetch transactions for user ${memberId}:`, error);
          // Continue với user khác nếu user này bị lỗi
        }
      }

      // 📊 Sắp xếp theo date, lấy limit
      allTransactions.sort((a, b) => {
        const dateA = a.date?.toDate?.() || new Date(a.createdAt);
        const dateB = b.date?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      const result = allTransactions.slice(0, limit);

      console.log('✅ [FamilyTransactionService] Fetched recent transactions:', {
        familyId,
        memberCount: memberIds.length,
        totalTransactions: allTransactions.length,
        returnedCount: result.length,
        transactions: result.map((t) => ({
          id: t.id,
          userId: t.userId,
          memberName: t.memberName,
          type: t.type,
          amount: t.amount,
          date: t.date,
        })),
      });

      return result;
    } catch (error) {
      console.error('❌ [FamilyTransactionService] Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Lấy transactions của user cụ thể trong family
   */
  async getTransactionsByMember(
    familyId: string,
    userId: string,
    limit: number = 20
  ): Promise<FamilyTransaction[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      if (!userId || !familyId) {
        throw new Error('userId and familyId are required');
      }

      // Kiểm tra user thuộc family
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data() as any;
      const isMember =
        familyData.ownerId === currentUser.uid ||
        familyData.memberIds?.includes(currentUser.uid);

      if (!isMember) {
        throw new Error('You do not have permission to view these transactions');
      }

      // 🔍 Lấy transactions của user cụ thể từ /users/{userId}/transactions
      const txSnapshot = await this._getTransactionCollectionRef(userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get({ source: 'server' }); // ← Luôn từ server

      const transactions: FamilyTransaction[] = txSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        familyId,
      } as FamilyTransaction));

      console.log('✅ [FamilyTransactionService] Fetched transactions for member:', {
        familyId,
        userId,
        count: transactions.length,
      });

      return transactions;
    } catch (error) {
      console.error('❌ [FamilyTransactionService] Error fetching member transactions:', error);
      throw error;
    }
  }

  /**
   * Thêm giao dịch mới cho user
   * Note: Transactions được lưu tại /users/{userId}/transactions
   * Nhưng để dùng cho family, cần thêm familyId vào data
   */
  async addTransaction(
    familyId: string,
    userId: string,
    transaction: Omit<FamilyTransaction, 'id' | 'createdAt' | 'updatedAt' | 'familyId'>
  ): Promise<string> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Kiểm tra quyền - chỉ family owner hoặc chính user đó mới được add
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;
      const isOwnTransaction = userId === currentUser.uid;

      if (!isOwner && !isOwnTransaction) {
        throw new Error('You do not have permission to add this transaction');
      }

      const docRef = await this._getTransactionCollectionRef(userId).add({
        ...transaction,
        familyId, // ← Thêm familyId để tracking
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ [FamilyTransactionService] Transaction added:', {
        transactionId: docRef.id,
        userId,
        familyId,
      });

      return docRef.id;
    } catch (error) {
      console.error('❌ [FamilyTransactionService] Error adding transaction:', error);
      throw error;
    }
  }

  /**
   * Xóa giao dịch
   */
  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Chỉ user đó hoặc family owner mới được xóa
      if (currentUser.uid !== userId) {
        // TODO: Kiểm tra family owner
      }

      await this._getTransactionCollectionRef(userId)
        .doc(transactionId)
        .delete();

      console.log('✅ [FamilyTransactionService] Transaction deleted:', {
        transactionId,
        userId,
      });
    } catch (error) {
      console.error('❌ [FamilyTransactionService] Error deleting transaction:', error);
      throw error;
    }
  }

  /**
   * Cập nhật giao dịch
   */
  async updateTransaction(
    userId: string,
    transactionId: string,
    updates: Partial<FamilyTransaction>
  ): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Chỉ user đó mới được update giao dịch của mình
      if (currentUser.uid !== userId) {
        throw new Error('You do not have permission to update this transaction');
      }

      await this._getTransactionCollectionRef(userId)
        .doc(transactionId)
        .update({
          ...updates,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ [FamilyTransactionService] Transaction updated:', {
        transactionId,
        userId,
      });
    } catch (error) {
      console.error('❌ [FamilyTransactionService] Error updating transaction:', error);
      throw error;
    }
  }

  /**
   * Lấy tổng hợp giao dịch của family (tất cả members)
   */
  async getTransactionSummary(familyId: string): Promise<TransactionSummary> {
    try {
      if (!familyId) {
        throw new Error('familyId is required');
      }

      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Lấy tất cả transactions của family từ getRecentTransactions
      const allTransactions = await this.getRecentTransactions(familyId, 1000);

      const totalIncome = allTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = allTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const summary: TransactionSummary = {
        totalIncome,
        totalExpense,
        netAmount: totalIncome - totalExpense,
        transactionCount: allTransactions.length,
      };

      console.log('✅ [FamilyTransactionService] Transaction summary calculated:', {
        familyId,
        summary,
      });

      return summary;
    } catch (error) {
      console.error('❌ [FamilyTransactionService] Error calculating summary:', error);
      throw error;
    }
  }

  /**
   * Tạo giao dịch test (để test app)
   * Note: Test data được thêm vào /users/{currentUser.uid}/transactions
   */
  async createTestTransactions(familyId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const testTransactions = [
        {
          type: 'expense' as TransactionType,
          category: 'Ăn uống',
          amount: 250000,
          currency: 'VND',
          date: firestore.Timestamp.now(),
          description: 'Ăn trưa tại nhà hàng',
          memberName: currentUser.displayName || 'User',
        },
        {
          type: 'income' as TransactionType,
          category: 'Lương',
          amount: 15000000,
          currency: 'VND',
          date: firestore.Timestamp.now(),
          description: 'Lương tháng 12',
          memberName: currentUser.displayName || 'User',
        },
        {
          type: 'expense' as TransactionType,
          category: 'Giao thông',
          amount: 50000,
          currency: 'VND',
          date: firestore.Timestamp.now(),
          description: 'Xăng xe',
          memberName: currentUser.displayName || 'User',
        },
      ];

      for (const transaction of testTransactions) {
        await this._getTransactionCollectionRef(currentUser.uid).add({
          ...transaction,
          familyId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      console.log('✅ [FamilyTransactionService] Test transactions created for user:', {
        userId: currentUser.uid,
        familyId,
        count: testTransactions.length,
      });
    } catch (error) {
      console.error('❌ [FamilyTransactionService] Error creating test transactions:', error);
      throw error;
    }
  }

  /**
   * Format tiền tệ - Hiển thị VNĐ đầy đủ
   */
  formatCurrency(amount: number, decimals: number = 0): string {
    return `${new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)}`;
  }

  /**
   * Lấy icon theo loại giao dịch và danh mục
   */
  getTransactionIcon(type: TransactionType, category: string): string {
    const categoryLower = category.toLowerCase();
    
    // Income icons
    if (type === 'income') {
      const incomeIcons: { [key: string]: string } = {
        'lương': 'cash-multiple',
        'salary': 'cash-multiple',
        'bonus': 'gift',
        'thưởng': 'gift',
        'đầu tư': 'trending-up',
        'investment': 'trending-up',
        'kinh doanh': 'briefcase',
        'business': 'briefcase',
        'khác': 'cash',
      };
      return incomeIcons[categoryLower] || 'cash';
    }
    
    // Expense icons
    const expenseIcons: { [key: string]: string } = {
      'ăn uống': 'silverware-fork-knife',
      'food': 'silverware-fork-knife',
      'ăn trưa': 'silverware-fork-knife',
      'cơm': 'silverware-fork-knife',
      'giao thông': 'car',
      'transportation': 'car',
      'xăng': 'fuel',
      'xe máy': 'motorbike',
      'taxi': 'taxi',
      'mua sắm': 'shopping',
      'shopping': 'shopping',
      'quần áo': 'tshirt-crew',
      'clothes': 'tshirt-crew',
      'điện': 'flash',
      'utilities': 'flash',
      'nước': 'water',
      'internet': 'wifi',
      'điện thoại': 'phone',
      'phone': 'phone',
      'giải trí': 'gamepad-variant',
      'entertainment': 'gamepad-variant',
      'phim': 'movie',
      'game': 'gamepad-variant',
      'sức khỏe': 'hospital-box',
      'healthcare': 'hospital-box',
      'thuốc': 'pill',
      'medicine': 'pill',
      'bác sĩ': 'doctor',
      'doctor': 'doctor',
      'học': 'book',
      'education': 'book',
      'sách': 'book',
      'course': 'school',
      'khóa học': 'school',
      'nhà': 'home',
      'housing': 'home',
      'thuê nhà': 'home',
      'rent': 'home',
      'nợ': 'credit-card',
      'debt': 'credit-card',
      'vay': 'credit-card',
      'quà tặng': 'gift',
      'gift': 'gift',
      'từ thiện': 'heart',
      'charity': 'heart',
      'khác': 'receipt',
    };
    
    return expenseIcons[categoryLower] || 'receipt';
  }
}

export default new FamilyTransactionService();
