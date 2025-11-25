import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, any>;

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isDefault: boolean;
  transactionCount: number;
  totalAmount: number;
}

const CATEGORY_ICONS = [
  '🍔', '🛒', '⛽', '🏠', '💊', '🎬', '✈️', '🎓', '👕', '🚗',
  '📱', '💻', '🏃', '🎵', '📚', '🍕', '☕', '🍷', '🎮', '💇',
  '🔧', '💡', '🚰', '🏥', '🚌', '🏪', '🎪', '🎯', '🎨', '🧸'
];

const CATEGORY_COLORS = [
  '#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#14B8A6', '#F97316', '#84CC16', '#3B82F6', '#6366F1', '#8B5CF6'
];

const DEFAULT_CATEGORIES: Category[] = [
  // Expense categories
  { id: '1', name: 'Ăn uống', icon: '🍔', color: '#EF4444', type: 'expense', isDefault: true, transactionCount: 45, totalAmount: 3500000 },
  { id: '2', name: 'Mua sắm', icon: '🛒', color: '#8B5CF6', type: 'expense', isDefault: true, transactionCount: 28, totalAmount: 2800000 },
  { id: '3', name: 'Di chuyển', icon: '⛽', color: '#F59E0B', type: 'expense', isDefault: true, transactionCount: 32, totalAmount: 1200000 },
  { id: '4', name: 'Nhà ở', icon: '🏠', color: '#10B981', type: 'expense', isDefault: true, transactionCount: 12, totalAmount: 8000000 },
  { id: '5', name: 'Y tế', icon: '💊', color: '#EC4899', type: 'expense', isDefault: true, transactionCount: 8, totalAmount: 850000 },
  { id: '6', name: 'Giải trí', icon: '🎬', color: '#6366F1', type: 'expense', isDefault: true, transactionCount: 15, totalAmount: 650000 },
  
  // Income categories
  { id: '7', name: 'Lương', icon: '💰', color: '#10B981', type: 'income', isDefault: true, transactionCount: 12, totalAmount: 300000000 },
  { id: '8', name: 'Thưởng', icon: '🎁', color: '#F59E0B', type: 'income', isDefault: true, transactionCount: 3, totalAmount: 15000000 },
  { id: '9', name: 'Đầu tư', icon: '📈', color: '#6366F1', type: 'income', isDefault: true, transactionCount: 8, totalAmount: 25000000 },
  
  // Custom categories
  { id: '10', name: 'Cà phê', icon: '☕', color: '#84CC16', type: 'expense', isDefault: false, transactionCount: 67, totalAmount: 2010000 },
  { id: '11', name: 'Đi chợ', icon: '🥬', color: '#14B8A6', type: 'expense', isDefault: false, transactionCount: 23, totalAmount: 1850000 },
];

export default function CategoryManagementScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  
  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('🍔');
  const [categoryColor, setCategoryColor] = useState('#6366F1');
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const resetForm = () => {
    setCategoryName('');
    setCategoryIcon('🍔');
    setCategoryColor('#6366F1');
    setCategoryType('expense');
    setEditingCategory(null);
  };

  const handleAddCategory = () => {
    if (!categoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    const newCategory: Category = {
      id: Date.now().toString(),
      name: categoryName.trim(),
      icon: categoryIcon,
      color: categoryColor,
      type: categoryType,
      isDefault: false,
      transactionCount: 0,
      totalAmount: 0,
    };

    if (editingCategory) {
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id 
          ? { ...newCategory, id: editingCategory.id, transactionCount: editingCategory.transactionCount, totalAmount: editingCategory.totalAmount }
          : cat
      ));
    } else {
      setCategories(prev => [...prev, newCategory]);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      Alert.alert(
        'Danh mục mặc định',
        'Bạn chỉ có thể chỉnh sửa tên và màu sắc của danh mục mặc định',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Chỉnh sửa', onPress: () => openEditModal(category) }
        ]
      );
    } else {
      openEditModal(category);
    }
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryIcon(category.icon);
    setCategoryColor(category.color);
    setCategoryType(category.type);
    setShowAddModal(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    
    if (!category) return;

    if (category.isDefault) {
      Alert.alert('Lỗi', 'Không thể xóa danh mục mặc định');
      return;
    }

    if (category.transactionCount > 0) {
      Alert.alert(
        'Xác nhận xóa',
        `Danh mục "${category.name}" đang có ${category.transactionCount} giao dịch. Bạn có chắc chắn muốn xóa?`,
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Xóa',
            style: 'destructive',
            onPress: () => setCategories(prev => prev.filter(c => c.id !== categoryId))
          }
        ]
      );
    } else {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => {
      if (filterType === 'all') return true;
      return cat.type === filterType;
    }).sort((a, b) => {
      // Sort: default categories first, then by transaction count
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return b.transactionCount - a.transactionCount;
    });
  };

  const getCategoryStats = () => {
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const incomeCategories = categories.filter(c => c.type === 'income');
    const totalTransactions = categories.reduce((sum, c) => sum + c.transactionCount, 0);

    return {
      total: categories.length,
      expense: expenseCategories.length,
      income: incomeCategories.length,
      transactions: totalTransactions,
    };
  };

  const renderCategoryCard = (category: Category) => (
    <View key={category.id} style={[styles.categoryCard, { borderLeftColor: category.color }]}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}20` }]}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
          </View>
          <View style={styles.categoryDetails}>
            <View style={styles.categoryNameRow}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Mặc định</Text>
                </View>
              )}
            </View>
            <Text style={[styles.categoryType, { color: category.type === 'income' ? '#10B981' : '#6B7280' }]}>
              {category.type === 'income' ? '📥 Thu nhập' : '📤 Chi tiêu'}
            </Text>
          </View>
        </View>

        <View style={styles.categoryActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#6366F1' }]}
            onPress={() => handleEditCategory(category)}
          >
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          
          {!category.isDefault && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => handleDeleteCategory(category.id)}
            >
              <Text style={styles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.categoryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{category.transactionCount}</Text>
          <Text style={styles.statLabel}>Giao dịch</Text>
        </View>
        
        <View style={styles.statSeparator} />
        
        <View style={styles.statItem}>
          <Text style={[styles.statAmount, { color: category.type === 'income' ? '#10B981' : '#FFFFFF' }]}>
            {formatCurrency(category.totalAmount)}
          </Text>
          <Text style={styles.statLabel}>Tổng tiền</Text>
        </View>
      </View>
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên danh mục *</Text>
              <TextInput
                style={styles.formInput}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Ví dụ: Cà phê, Đi chợ, Làm thêm..."
                placeholderTextColor="#6B7280"
              />
            </View>

            {(!editingCategory || !editingCategory.isDefault) && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Loại danh mục *</Text>
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      categoryType === 'expense' && styles.typeOptionSelected
                    ]}
                    onPress={() => setCategoryType('expense')}
                  >
                    <Text style={styles.typeIcon}>📤</Text>
                    <Text style={styles.typeLabel}>Chi tiêu</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeOption,
                      categoryType === 'income' && styles.typeOptionSelected
                    ]}
                    onPress={() => setCategoryType('income')}
                  >
                    <Text style={styles.typeIcon}>📥</Text>
                    <Text style={styles.typeLabel}>Thu nhập</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Biểu tượng</Text>
              <View style={styles.iconSelector}>
                {CATEGORY_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      categoryIcon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => setCategoryIcon(icon)}
                  >
                    <Text style={styles.iconText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Màu sắc</Text>
              <View style={styles.colorSelector}>
                {CATEGORY_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      categoryColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setCategoryColor(color)}
                  />
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Xem trước:</Text>
              <View style={[styles.previewCard, { borderLeftColor: categoryColor }]}>
                <View style={[styles.previewIcon, { backgroundColor: `${categoryColor}20` }]}>
                  <Text style={styles.previewIconText}>{categoryIcon}</Text>
                </View>
                <View>
                  <Text style={styles.previewName}>{categoryName || 'Tên danh mục'}</Text>
                  <Text style={[styles.previewType, { color: categoryType === 'income' ? '#10B981' : '#6B7280' }]}>
                    {categoryType === 'income' ? '📥 Thu nhập' : '📤 Chi tiêu'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleAddCategory}
            >
              <Text style={styles.modalButtonTextPrimary}>
                {editingCategory ? 'Cập nhật' : 'Thêm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const filteredCategories = getFilteredCategories();
  const stats = getCategoryStats();

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý danh mục</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{stats.total}</Text>
            <Text style={styles.statsLabel}>Tổng danh mục</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{stats.expense}</Text>
            <Text style={styles.statsLabel}>Chi tiêu</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{stats.income}</Text>
            <Text style={styles.statsLabel}>Thu nhập</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{stats.transactions}</Text>
            <Text style={styles.statsLabel}>Giao dịch</Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
            Tất cả ({stats.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'expense' && styles.filterTabActive]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterTabText, filterType === 'expense' && styles.filterTabTextActive]}>
            Chi tiêu ({stats.expense})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'income' && styles.filterTabActive]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterTabText, filterType === 'income' && styles.filterTabTextActive]}>
            Thu nhập ({stats.income})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      <ScrollView style={styles.categoriesList} showsVerticalScrollIndicator={false}>
        {filteredCategories.map(renderCategoryCard)}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Add Modal */}
      {renderAddModal()}

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#111827',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: 'bold',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
  },
  filterTabText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  categoryType: {
    fontSize: 12,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statSeparator: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
  },
  bottomSpace: {
    height: 100,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1D3A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalClose: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  iconSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  iconText: {
    fontSize: 20,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFFFFF',
  },
  previewContainer: {
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftWidth: 4,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewIconText: {
    fontSize: 18,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  previewType: {
    fontSize: 11,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonPrimary: {
    backgroundColor: '#6366F1',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  decorativeCircle1: {
    width: 200,
    height: 200,
    backgroundColor: '#6366F1',
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    width: 150,
    height: 150,
    backgroundColor: '#EC4899',
    bottom: -75,
    left: -75,
  },
});