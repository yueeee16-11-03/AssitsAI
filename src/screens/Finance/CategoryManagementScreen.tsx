import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { RootStackParamList } from '../../navigation/types';
import CategoryService, { Category, Transaction } from '../../services/CategoryService';

type Props = NativeStackScreenProps<RootStackParamList, any>;

export default function CategoryManagementScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = getStyles(theme);
  const TAB_BAR_HEIGHT = 70;
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categoryTransactions, setCategoryTransactions] = useState<{ [key: string]: Transaction[] }>({});

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Fetch categories from transactions
    fetchCategories();
  }, [fadeAnim]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await CategoryService.fetchCategoriesFromTransactions();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Lỗi', 'Không thể tải danh mục. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr}`;
  };

  const handleToggleCategory = async (category: Category) => {
    if (expandedCategoryId === category.id) {
      setExpandedCategoryId(null);
    } else {
      setExpandedCategoryId(category.id);
      
      // Fetch transactions if not already loaded
      if (!categoryTransactions[category.id]) {
        try {
          const transactions = await CategoryService.getTransactionsByCategory(category.name, category.type);
          setCategoryTransactions(prev => ({
            ...prev,
            [category.id]: transactions
          }));
        } catch (error) {
          console.error('Error loading transactions:', error);
          Alert.alert('Lỗi', 'Không thể tải giao dịch');
        }
      }
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    // TODO: Navigate to transaction edit screen
    Alert.alert(
      'Sửa giao dịch',
      `Sửa giao dịch: ${transaction.description}\nSố tiền: ${formatCurrency(transaction.amount)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đi đến chỉnh sửa', 
          onPress: () => {
            // navigation.navigate('EditTransaction', { transactionId: transaction.id });
            console.log('Edit transaction:', transaction.id);
          }
        }
      ]
    );
  };

  const handleDeleteTransaction = (transaction: Transaction, categoryId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa giao dịch này?\n\n${transaction.description}\n${formatCurrency(transaction.amount)}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await CategoryService.deleteTransaction(transaction.id);
              
              // Remove from local state
              setCategoryTransactions(prev => ({
                ...prev,
                [categoryId]: prev[categoryId].filter(t => t.id !== transaction.id)
              }));

              // Refresh categories to update counts
              await fetchCategories();
              
              Alert.alert('Thành công', 'Đã xóa giao dịch');
            } catch (error) {
              console.error('Error deleting transaction:', error);
              Alert.alert('Lỗi', 'Không thể xóa giao dịch');
            }
          }
        }
      ]
    );
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

  const renderCategoryCard = (category: Category) => {
    const isExpanded = expandedCategoryId === category.id;
    const transactions = categoryTransactions[category.id] || [];
    
    return (
    <View key={category.id} style={styles.categoryCardWrapper}>
      <View style={[styles.categoryCard, { borderLeftColor: category.color }]}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryInfo}>
            <View style={[styles.categoryIconContainer, { backgroundColor: `${category.color}20` }]}>
              <MaterialCommunityIcons name={category.icon} size={24} color={category.color} />
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
              <View style={styles.categoryTypeRow}>
                <MaterialCommunityIcons 
                  name={category.type === 'income' ? 'trending-up' : 'trending-down'} 
                  size={14} 
                  color={category.type === 'income' ? '#10B981' : '#EF4444'}
                />
                <Text style={[styles.categoryType, category.type === 'income' ? styles.incomeColor : styles.expenseColor]}>
                  {category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.categoryActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonView]}
              onPress={() => {
                Alert.alert(
                  category.name,
                  `Loại: ${category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}\n` +
                  `Số giao dịch: ${category.transactionCount}\n` +
                  `Tổng tiền: ${formatCurrency(category.totalAmount)}\n` +
                  `${category.isDefault ? '✓ Danh mục mặc định' : ''}`
                );
              }}
            >
              <MaterialCommunityIcons name="eye" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{category.transactionCount}</Text>
            <Text style={styles.statLabel}>Giao dịch</Text>
          </View>
          
          <View style={styles.statSeparator} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statAmount, category.type === 'income' ? styles.incomeColor : styles.expenseColor]}>
              {formatCurrency(category.totalAmount)}
            </Text>
            <Text style={styles.statLabel}>Tổng tiền</Text>
          </View>
        </View>

        {/* Dropdown Button */}
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => handleToggleCategory(category)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.colors.primary} 
          />
          <Text style={styles.dropdownButtonText}>
            {isExpanded ? 'Ẩn giao dịch' : `Xem ${category.transactionCount} giao dịch`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {isExpanded && (
        <View style={styles.transactionsContainer}>
          {transactions.length === 0 ? (
            <View style={styles.noTransactions}>
              <MaterialCommunityIcons name="file-document-outline" size={32} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.noTransactionsText}>Đang tải giao dịch...</Text>
            </View>
          ) : (
            transactions.map((transaction, index) => (
              <View 
                key={transaction.id} 
                style={[
                  styles.transactionItem,
                  index === transactions.length - 1 && styles.transactionItemLast
                ]}
              >
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionDescription}>
                    {transaction.description || 'Không có mô tả'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.date)}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    transaction.type === 'income' ? styles.incomeColor : styles.expenseColor
                  ]}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </Text>
                  <View style={styles.transactionActions}>
                    <TouchableOpacity
                      style={[styles.transactionActionButton, styles.transactionEditButton]}
                      onPress={() => handleEditTransaction(transaction)}
                    >
                      <MaterialCommunityIcons name="pencil" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.transactionActionButton, styles.transactionDeleteButton]}
                      onPress={() => handleDeleteTransaction(transaction, category.id)}
                    >
                      <MaterialCommunityIcons name="delete" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
  };

  const filteredCategories = getFilteredCategories();
  const stats = getCategoryStats();

  return (
    <SafeAreaView style={styles.container}>
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
      <ScrollView 
        style={styles.categoriesList} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }}
        refreshControl={
          <Animated.View>
            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải danh mục...</Text>
              </View>
            )}
          </Animated.View>
        }
        onScroll={(e) => {
          if (e.nativeEvent.contentOffset.y < -100 && !loading) {
            fetchCategories();
          }
        }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải danh mục từ giao dịch...</Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-open" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
            <Text style={styles.emptySubtext}>Tạo giao dịch để tự động tạo danh mục</Text>
          </View>
        ) : (
          filteredCategories.map(renderCategoryCard)
        )}
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>

      {/* Add Modal - Now just shows info */}
      {showAddModal && (
        <Modal
          visible={showAddModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowAddModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.infoModal}>
              <MaterialCommunityIcons name="information" size={48} color={theme.colors.primary} />
              <Text style={styles.infoTitle}>Danh mục tự động</Text>
              <Text style={styles.infoText}>
                Danh mục được tạo tự động từ các giao dịch của bạn. 
                {"\n\n"}
                Để thêm danh mục mới, hãy tạo giao dịch với danh mục đó.
              </Text>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.infoButtonText}>Đã hiểu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
    </Animated.View>
    </SafeAreaView>
  );
}

function getStyles(theme: any): any {
  const surface = theme.colors.surface;
  const primary = theme.colors.primary;
  const onSurface = theme.colors.onSurface;
  const onSurfaceVariant = theme.colors.onSurfaceVariant || '#9CA3AF';
  const outline = theme.colors.outline || 'rgba(0,0,0,0.06)';

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: surface,
    borderBottomWidth: 1,
    borderBottomColor: outline,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: onSurface,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: onSurface,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  statsCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'transparent',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsItem: {
    alignItems: 'center',
    flex: 1,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: onSurface,
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: onSurfaceVariant,
    fontWeight: '500',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: primary,
    borderColor: primary,
    shadowColor: primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: 13,
    color: onSurfaceVariant,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.dark ? 'rgba(255, 255, 255, 0.05)' : surface,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : outline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 24,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
    color: onSurface,
    marginRight: 8,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10B981',
  },
  categoryTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryType: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonView: {
    backgroundColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
  },
  incomeColor: { color: '#10B981' },
  expenseColor: { color: '#EF4444' },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
  },
  statItem: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: onSurface,
    marginBottom: 2,
  },
  statAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: onSurfaceVariant,
    fontWeight: '500',
  },
  statSeparator: {
    width: 1,
    height: 32,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : outline,
    marginHorizontal: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: surface,
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
    borderBottomColor: theme.dark ? 'rgba(255,255,255,0.1)' : outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: onSurface,
  },
  modalClose: {
    fontSize: 24,
    color: onSurfaceVariant,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: onSurface,
    marginBottom: 10,
  },
  formInput: {
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: onSurface,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'transparent',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  typeOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  typeIcon: {
    fontSize: 24,
  },
  typeLabel: {
    fontSize: 14,
    color: onSurfaceVariant,
    fontWeight: '600',
  },
  typeLabelActive: {
    color: onSurface,
    fontWeight: '700',
  },
  iconScrollView: {
    marginBottom: 8,
  },
  iconSelector: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionSelected: {
    borderWidth: 2,
  },
  iconText: {
    fontSize: 24,
  },
  colorSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: onSurface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  previewContainer: {
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: onSurface,
    marginBottom: 12,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
    borderLeftWidth: 4,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewIconText: {
    fontSize: 24,
  },
  previewDetails: {
    flex: 1,
  },
  previewName: {
    fontSize: 15,
    fontWeight: '700',
    color: onSurface,
    marginBottom: 6,
  },
  previewTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewType: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.dark ? 'rgba(255,255,255,0.1)' : outline,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : outline,
  },
  modalButtonPrimary: {
    backgroundColor: primary,
    shadowColor: primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '700',
    color: onSurface,
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: onSurfaceVariant,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: onSurface,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
  },
  infoModal: {
    margin: 20,
    backgroundColor: surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: onSurface,
    marginTop: 16,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: primary,
    borderRadius: 12,
  },
  infoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  categoryCardWrapper: {
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
    gap: 8,
  },
  dropdownButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: primary,
  },
  transactionsContainer: {
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -12,
    paddingTop: 4,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : outline,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : outline,
  },
  transactionItemLast: {
    borderBottomWidth: 0,
  },
  transactionLeft: {
    flex: 1,
    marginRight: 12,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: onSurface,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: onSurfaceVariant,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  transactionActions: {
    flexDirection: 'row',
    gap: 6,
  },
  transactionActionButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionEditButton: {
    backgroundColor: '#3B82F6',
  },
  transactionDeleteButton: {
    backgroundColor: '#EF4444',
  },
  noTransactions: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTransactionsText: {
    fontSize: 14,
    color: onSurfaceVariant,
    marginTop: 8,
  },
  });
}