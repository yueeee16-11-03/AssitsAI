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
}

export default new FamilyCategoryService();
