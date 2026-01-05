/**
 * FamilyCategoryService.ts
 * Service để quản lý danh mục giao dịch của gia đình
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface FamilyCategory {
  id?: string;
  familyId: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault?: boolean;
  transactionCount?: number;
  totalAmount?: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface CategoryStats {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  count: number;
  total: number;
}

export interface FamilyTransaction {
  id: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  description?: string;
  date: any;
  createdAt: any;
  userId: string;
  userName?: string;
  walletId: string;
}

export interface UserCategoryGroup {
  userId: string;
  userName: string;
  userEmail?: string;
  categories: FamilyCategory[];
}

// Danh mục mặc định cho mỗi gia đình
const DEFAULT_CATEGORIES: Omit<FamilyCategory, 'familyId' | 'createdAt' | 'updatedAt'>[] = [
  // Income categories
  { name: 'Lương', type: 'income', icon: 'cash-multiple', color: '#38A3A5', isDefault: true },
  { name: 'Thưởng', type: 'income', icon: 'gift', color: '#FF6B9D', isDefault: true },
  { name: 'Đầu tư', type: 'income', icon: 'trending-up', color: '#6BCF7F', isDefault: true },
  { name: 'Kinh doanh', type: 'income', icon: 'briefcase', color: '#FFA500', isDefault: true },
  
  // Expense categories
  { name: 'Ăn uống', type: 'expense', icon: 'silverware-fork-knife', color: '#FF6B6B', isDefault: true },
  { name: 'Giao thông', type: 'expense', icon: 'car', color: '#4ECDC4', isDefault: true },
  { name: 'Mua sắm', type: 'expense', icon: 'shopping', color: '#FFD93D', isDefault: true },
  { name: 'Giải trí', type: 'expense', icon: 'gamepad-variant', color: '#95E1D3', isDefault: true },
  { name: 'Sức khỏe', type: 'expense', icon: 'hospital-box', color: '#FF85C0', isDefault: true },
  { name: 'Học', type: 'expense', icon: 'book', color: '#B5EAD7', isDefault: true },
  { name: 'Điện', type: 'expense', icon: 'flash', color: '#FFD6BA', isDefault: true },
  { name: 'Internet', type: 'expense', icon: 'wifi', color: '#C7CEEA', isDefault: true },
  { name: 'Nhà', type: 'expense', icon: 'home', color: '#E2A76F', isDefault: true },
  { name: 'Từ thiện', type: 'expense', icon: 'heart', color: '#FF69B4', isDefault: true },
];

class FamilyCategoryService {
  /**
   * Lấy reference đến collection categories của family
   */
  private _getCategoriesRef(familyId: string) {
    if (!familyId) {
      throw new Error('familyId is required');
    }
    return firestore()
      .collection('families')
      .doc(familyId)
      .collection('categories');
  }

  /**
   * Khởi tạo danh mục mặc định cho gia đình mới
   */
  async initializeDefaultCategories(familyId: string): Promise<void> {
    try {
      const batch = firestore().batch();
      const categoriesRef = this._getCategoriesRef(familyId);

      for (const category of DEFAULT_CATEGORIES) {
        const docRef = categoriesRef.doc();
        batch.set(docRef, {
          ...category,
          familyId,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      console.log('✅ [FamilyCategoryService] Default categories initialized for family:', familyId);
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error initializing default categories:', error);
      throw error;
    }
  }

  /**
   * Lấy tất cả danh mục của gia đình
   */
  async getFamilyCategories(familyId: string): Promise<FamilyCategory[]> {
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
        throw new Error('You do not have permission to view these categories');
      }

      // Lấy danh sách categories
      const snapshot = await this._getCategoriesRef(familyId)
        .orderBy('type')
        .orderBy('name')
        .get();

      // Nếu không có categories, khởi tạo danh mục mặc định
      if (snapshot.empty) {
        console.log('⚠️ [FamilyCategoryService] No categories found, initializing defaults...');
        await this.initializeDefaultCategories(familyId);
        return this.getFamilyCategories(familyId); // Gọi lại để lấy dữ liệu vừa tạo
      }

      const categories: FamilyCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as FamilyCategory));

      console.log('✅ [FamilyCategoryService] Fetched family categories:', {
        familyId,
        count: categories.length,
        categories: categories.map((c) => ({ id: c.id, name: c.name, type: c.type })),
      });

      return categories;
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Lấy danh mục theo loại (income/expense)
   */
  async getCategoriesByType(
    familyId: string,
    type: 'income' | 'expense'
  ): Promise<FamilyCategory[]> {
    try {
      const allCategories = await this.getFamilyCategories(familyId);
      return allCategories.filter((c) => c.type === type);
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error fetching categories by type:', error);
      throw error;
    }
  }

  /**
   * Thêm danh mục mới
   */
  async addCategory(
    familyId: string,
    category: Omit<FamilyCategory, 'id' | 'familyId' | 'createdAt' | 'updatedAt'>
  ): Promise<FamilyCategory> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Kiểm tra quyền (chỉ owner/admin)
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;

      if (!isOwner) {
        throw new Error('You do not have permission to add categories');
      }

      const docRef = await this._getCategoriesRef(familyId).add({
        ...category,
        familyId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      const newCategory: FamilyCategory = {
        id: docRef.id,
        ...category,
        familyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('✅ [FamilyCategoryService] Category added:', {
        categoryId: docRef.id,
        familyId,
        name: category.name,
      });

      return newCategory;
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error adding category:', error);
      throw error;
    }
  }

  /**
   * Cập nhật danh mục
   */
  async updateCategory(
    familyId: string,
    categoryId: string,
    updates: Partial<FamilyCategory>
  ): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Kiểm tra quyền
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;

      if (!isOwner) {
        throw new Error('You do not have permission to update categories');
      }

      // Không cho update danh mục mặc định
      const categoryDoc = await this._getCategoriesRef(familyId)
        .doc(categoryId)
        .get();

      if (categoryDoc.data()?.isDefault) {
        throw new Error('Cannot update default categories');
      }

      await this._getCategoriesRef(familyId)
        .doc(categoryId)
        .update({
          ...updates,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      console.log('✅ [FamilyCategoryService] Category updated:', {
        categoryId,
        familyId,
      });
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error updating category:', error);
      throw error;
    }
  }

  /**
   * Xóa danh mục
   */
  async deleteCategory(familyId: string, categoryId: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Kiểm tra quyền
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      const familyData = familyDoc.data() as any;
      const isOwner = familyData.ownerId === currentUser.uid;

      if (!isOwner) {
        throw new Error('You do not have permission to delete categories');
      }

      // Không cho xóa danh mục mặc định
      const categoryDoc = await this._getCategoriesRef(familyId)
        .doc(categoryId)
        .get();

      if (categoryDoc.data()?.isDefault) {
        throw new Error('Cannot delete default categories');
      }

      await this._getCategoriesRef(familyId)
        .doc(categoryId)
        .delete();

      console.log('✅ [FamilyCategoryService] Category deleted:', {
        categoryId,
        familyId,
      });
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error deleting category:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê danh mục (số giao dịch, tổng tiền)
   * Note: Cần fetch từ transactions collection
   */
  async getCategoryStats(familyId: string): Promise<CategoryStats[]> {
    try {
      const categories = await this.getFamilyCategories(familyId);

      // TODO: Tính tổng giao dịch và tiền từ FamilyTransactionService
      // Hiện tại trả về category data với count/total = 0
      const stats: CategoryStats[] = categories.map((c) => ({
        id: c.id || '',
        name: c.name,
        icon: c.icon,
        color: c.color,
        type: c.type,
        count: 0,
        total: 0,
      }));

      return stats;
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error getting category stats:', error);
      throw error;
    }
  }

  private extractCategoryName(category: string): string {
    return category.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  }

  private getCategoryIcon(categoryName: string): string {
    const name = categoryName.toLowerCase();
    if (name.includes('lương') || name.includes('salary')) return 'cash-multiple';
    if (name.includes('thưởng') || name.includes('bonus')) return 'gift';
    if (name.includes('đầu tư') || name.includes('invest')) return 'trending-up';
    if (name.includes('kinh doanh') || name.includes('business')) return 'briefcase';
    if (name.includes('ăn') || name.includes('food')) return 'silverware-fork-knife';
    if (name.includes('uống') || name.includes('drink') || name.includes('coffee')) return 'coffee';
    if (name.includes('xe') || name.includes('car') || name.includes('giao thông')) return 'car';
    if (name.includes('xăng') || name.includes('gas')) return 'gas-station';
    if (name.includes('mua') || name.includes('shop')) return 'shopping';
    if (name.includes('quần áo') || name.includes('clothes')) return 'hanger';
    if (name.includes('nhà') || name.includes('home')) return 'home';
    if (name.includes('điện') || name.includes('electric')) return 'flash';
    if (name.includes('nước') || name.includes('water')) return 'water';
    if (name.includes('internet') || name.includes('wifi')) return 'wifi';
    if (name.includes('điện thoại') || name.includes('phone')) return 'phone';
    if (name.includes('sức khỏe') || name.includes('health') || name.includes('bệnh viện')) return 'hospital-box';
    if (name.includes('thuốc') || name.includes('medicine')) return 'pill';
    if (name.includes('học') || name.includes('education')) return 'book';
    if (name.includes('trường') || name.includes('school')) return 'school';
    if (name.includes('giải trí') || name.includes('entertainment')) return 'gamepad-variant';
    if (name.includes('phim') || name.includes('movie')) return 'movie';
    if (name.includes('du lịch') || name.includes('travel')) return 'airplane';
    if (name.includes('từ thiện') || name.includes('charity')) return 'heart';
    if (name.includes('quà') || name.includes('gift')) return 'gift';
    return 'receipt';
  }

  private getCategoryColor(categoryName: string, type: 'income' | 'expense'): string {
    if (type === 'income') return '#10B981';
    const name = categoryName.toLowerCase();
    if (name.includes('ăn') || name.includes('food')) return '#FF6B6B';
    if (name.includes('xe') || name.includes('car')) return '#4ECDC4';
    if (name.includes('mua') || name.includes('shop')) return '#FFD93D';
    if (name.includes('giải trí')) return '#95E1D3';
    if (name.includes('sức khỏe')) return '#FF85C0';
    if (name.includes('học')) return '#B5EAD7';
    if (name.includes('điện')) return '#FFD6BA';
    if (name.includes('internet')) return '#C7CEEA';
    if (name.includes('nhà')) return '#E2A76F';
    if (name.includes('từ thiện')) return '#FF69B4';
    return '#6366F1';
  }

  async fetchFamilyCategoriesFromTransactions(familyId: string): Promise<FamilyCategory[]> {
    try {
      if (!familyId) throw new Error('familyId is required');
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      const walletsSnapshot = await firestore()
        .collection('families')
        .doc(familyId)
        .collection('sharedWallets')
        .get();

      if (walletsSnapshot.empty) {
        console.log('⚠️ [FamilyCategoryService] No shared wallets found');
        return [];
      }

      const categoryMap = new Map<string, FamilyCategory>();

      for (const walletDoc of walletsSnapshot.docs) {
        const transactionsSnapshot = await firestore()
          .collection('families')
          .doc(familyId)
          .collection('sharedWallets')
          .doc(walletDoc.id)
          .collection('transactions')
          .get();

        transactionsSnapshot.forEach((transDoc) => {
          const transaction = transDoc.data();
          const category = transaction.category;
          const type = transaction.type as 'income' | 'expense';
          const amount = transaction.amount || 0;

          if (category) {
            const cleanName = this.extractCategoryName(category);
            const key = `${cleanName}-${type}`;

            if (categoryMap.has(key)) {
              const existing = categoryMap.get(key)!;
              existing.transactionCount = (existing.transactionCount || 0) + 1;
              existing.totalAmount = (existing.totalAmount || 0) + amount;
            } else {
              categoryMap.set(key, {
                id: key,
                familyId,
                name: cleanName,
                type,
                icon: this.getCategoryIcon(cleanName),
                color: this.getCategoryColor(cleanName, type),
                transactionCount: 1,
                totalAmount: amount,
              });
            }
          }
        });
      }

      const categories = Array.from(categoryMap.values()).sort((a, b) => {
        return (b.transactionCount || 0) - (a.transactionCount || 0);
      });

      console.log('✅ [FamilyCategoryService] Fetched categories from transactions:', {
        familyId,
        count: categories.length,
      });

      return categories;
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error fetching categories from transactions:', error);
      throw error;
    }
  }

  async getTransactionsByCategory(
    familyId: string,
    categoryName: string,
    type: 'income' | 'expense'
  ): Promise<FamilyTransaction[]> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Lấy family data để có member info
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }
      
      const familyData = familyDoc.data();
      const familyMembers = familyData?.members || {};
      const ownerId = familyData?.ownerId;
      const memberIds = familyData?.memberIds || [];

      // Kiểm tra membership
      const isMember = ownerId === currentUser.uid || memberIds.includes(currentUser.uid);
      if (!isMember) {
        throw new Error('Bạn không phải thành viên của gia đình này');
      }

      // Tạo danh sách tất cả member IDs
      const allMemberIds = [ownerId, ...memberIds].filter((id, index, self) => 
        id && self.indexOf(id) === index
      );

      // Lấy transactions từ users/{userId}/transactions của từng member
      const transactionPromises = allMemberIds.map(async (userId) => {
        try {
          const transactionsSnapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .where('type', '==', type)
            .get();

          // Filter by category name
          const filteredDocs = transactionsSnapshot.docs.filter(doc => {
            const data = doc.data();
            const cleanCategory = this.extractCategoryName(data.category || '');
            return cleanCategory === categoryName;
          });

          // Get user info
          let userName = 'Unknown';
          if (userId === currentUser.uid) {
            userName = currentUser.displayName || currentUser.email || 'Bạn';
          } else if (userId === ownerId) {
            const memberInfo = familyMembers[userId];
            userName = memberInfo?.displayName || 'Chủ gia đình';
          } else if (familyMembers[userId]) {
            const memberInfo = familyMembers[userId];
            userName = memberInfo.displayName || memberInfo.email || `User ${userId.substring(0, 8)}`;
          } else {
            userName = `User ${userId.substring(0, 8)}`;
          }

          return filteredDocs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            userId,
            userName,
            walletId: userId, // Use userId as walletId for deletion
          }));
        } catch (txError: any) {
          console.error(`❌ Error fetching transactions for user ${userId}:`, txError);
          return [];
        }
      });

      const allTransactionsArrays = await Promise.all(transactionPromises);
      const allTransactions = allTransactionsArrays.flat();

      // Map to FamilyTransaction
      const transactions: FamilyTransaction[] = allTransactions.map((data: any) => ({
        id: data.id,
        amount: data.amount,
        category: data.category,
        type: data.type,
        description: data.description || data.note,
        date: data.date,
        createdAt: data.createdAt,
        userId: data.userId,
        userName: data.userName,
        walletId: data.walletId,
      }));

      // Sort by date descending
      transactions.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      console.log('✅ [FamilyCategoryService] Fetched transactions by category:', {
        familyId,
        categoryName,
        type,
        count: transactions.length,
      });

      return transactions;
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error fetching transactions by category:', error);
      throw error;
    }
  }

  async deleteTransaction(
    familyId: string,
    walletId: string,
    transactionId: string
  ): Promise<void> {
    try {
      // walletId ở đây là userId (đã set ở getTransactionsByCategory)
      const userId = walletId;
      
      await firestore()
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .doc(transactionId)
        .delete();

      console.log('✅ [FamilyCategoryService] Transaction deleted:', {
        familyId,
        userId,
        transactionId,
      });
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error deleting transaction:', error);
      throw error;
    }
  }

  async fetchFamilyCategoriesByUser(familyId: string): Promise<UserCategoryGroup[]> {
    try {
      if (!familyId) throw new Error('familyId is required');
      const currentUser = auth().currentUser;
      if (!currentUser) throw new Error('User not authenticated');

      // Lấy thông tin family trước
      const familyDoc = await firestore()
        .collection('families')
        .doc(familyId)
        .get();

      if (!familyDoc.exists) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data();
      const memberIds = familyData?.memberIds || [];
      const ownerId = familyData?.ownerId;
      const familyMembers = familyData?.members || {};

      // Kiểm tra xem user có phải là member không
      const isMember = ownerId === currentUser.uid || memberIds.includes(currentUser.uid);
      if (!isMember) {
        throw new Error('Bạn không phải thành viên của gia đình này');
      }

      // Tạo danh sách tất cả member IDs (bao gồm owner)
      const allMemberIds = [ownerId, ...memberIds].filter((id, index, self) => 
        id && self.indexOf(id) === index
      );

      console.log('📋 [FamilyCategoryService] Fetching transactions for members:', {
        familyId,
        memberCount: allMemberIds.length,
        memberIds: allMemberIds,
      });

      // Map để lưu categories và user info
      const userCategoriesMap = new Map<string, Map<string, FamilyCategory>>();
      const userInfoMap = new Map<string, { name: string; email?: string }>();

      // Helper function để lấy user info
      const getUserInfo = (userId: string): { name: string; email?: string } => {
        if (userInfoMap.has(userId)) {
          return userInfoMap.get(userId)!;
        }

        let userInfo: { name: string; email?: string };

        // Kiểm tra nếu là current user
        if (userId === currentUser.uid) {
          userInfo = {
            name: currentUser.displayName || currentUser.email || 'Bạn',
            email: currentUser.email || undefined,
          };
        }
        // Kiểm tra nếu là owner
        else if (userId === ownerId) {
          const memberInfo = familyMembers[userId];
          userInfo = {
            name: memberInfo?.displayName || 'Chủ gia đình',
            email: memberInfo?.email,
          };
        }
        // Kiểm tra trong family members
        else if (familyMembers[userId]) {
          const memberInfo = familyMembers[userId];
          userInfo = {
            name: memberInfo.displayName || memberInfo.email || `Thành viên ${memberIds.indexOf(userId) + 1}`,
            email: memberInfo.email,
          };
        }
        // Fallback
        else {
          userInfo = {
            name: `User ${userId.substring(0, 8)}`,
          };
        }

        userInfoMap.set(userId, userInfo);
        return userInfo;
      };

      // Lấy transactions từ users/{userId}/transactions của từng member
      // Family members có thể đọc transactions của nhau (via Firestore rules)
      const transactionPromises = allMemberIds.map(async (userId) => {
        try {
          const transactionsSnapshot = await firestore()
            .collection('users')
            .doc(userId)
            .collection('transactions')
            .get();

          console.log(`📊 [FamilyCategoryService] User ${userId}: ${transactionsSnapshot.size} transactions`);

          return {
            userId,
            transactions: transactionsSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                category: data.category,
                type: data.type,
                amount: data.amount,
                ...data,
              };
            }),
          };
        } catch (txError: any) {
          console.error(`❌ Error fetching transactions for user ${userId}:`, txError);
          // Nếu không có quyền truy cập transactions của user này, bỏ qua
          return { userId, transactions: [] };
        }
      });

      const userTransactionsArrays = await Promise.all(transactionPromises);

      // Process transactions của từng user
      for (const { userId, transactions } of userTransactionsArrays) {
        if (transactions.length === 0) continue;

        // Lấy user info
        getUserInfo(userId);

        // Khởi tạo Map cho user
        if (!userCategoriesMap.has(userId)) {
          userCategoriesMap.set(userId, new Map());
        }

        const userCategories = userCategoriesMap.get(userId)!;

        // Process từng transaction
        for (const txData of transactions) {
          const category = txData.category;
          const type = (txData.type || 'expense') as 'income' | 'expense';
          const amount = txData.amount || 0;

          if (!category) continue;

          const cleanName = this.extractCategoryName(category);
          const key = `${cleanName}-${type}`;

          if (userCategories.has(key)) {
            const existing = userCategories.get(key)!;
            existing.transactionCount = (existing.transactionCount || 0) + 1;
            existing.totalAmount = (existing.totalAmount || 0) + amount;
          } else {
            userCategories.set(key, {
              id: `${userId}-${key}`,
              familyId,
              name: cleanName,
              type,
              icon: this.getCategoryIcon(cleanName),
              color: this.getCategoryColor(cleanName, type),
              transactionCount: 1,
              totalAmount: amount,
            });
          }
        }
      }

      // Chuyển đổi Map thành array UserCategoryGroup
      const userGroups: UserCategoryGroup[] = [];
      
      userCategoriesMap.forEach((categoriesMap, userId) => {
        const userInfo = userInfoMap.get(userId);
        const categories = Array.from(categoriesMap.values()).sort((a, b) => {
          // Sort by transaction count desc, then by total amount desc
          const countDiff = (b.transactionCount || 0) - (a.transactionCount || 0);
          if (countDiff !== 0) return countDiff;
          return (b.totalAmount || 0) - (a.totalAmount || 0);
        });

        userGroups.push({
          userId,
          userName: userInfo?.name || 'Unknown User',
          userEmail: userInfo?.email,
          categories,
        });
      });

      // Sắp xếp: Owner trước, sau đó current user, sau đó theo tên
      userGroups.sort((a, b) => {
        if (a.userId === ownerId) return -1;
        if (b.userId === ownerId) return 1;
        if (a.userId === currentUser.uid) return -1;
        if (b.userId === currentUser.uid) return 1;
        return a.userName.localeCompare(b.userName, 'vi');
      });

      const totalTransactions = userGroups.reduce((sum, g) => 
        sum + g.categories.reduce((s, c) => s + (c.transactionCount || 0), 0), 0
      );

      console.log('✅ [FamilyCategoryService] Fetched categories by user:', {
        familyId,
        userCount: userGroups.length,
        totalCategories: userGroups.reduce((sum, g) => sum + g.categories.length, 0),
        totalTransactions,
      });

      return userGroups;
    } catch (error) {
      console.error('❌ [FamilyCategoryService] Error fetching categories by user:', error);
      throw error;
    }
  }
}

export default new FamilyCategoryService();
