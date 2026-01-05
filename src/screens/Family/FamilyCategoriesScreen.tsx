import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { useFamilyStore } from '../../store/familyStore';
import FamilyCategoryService, { 
  FamilyCategory,
  FamilyTransaction,
  UserCategoryGroup 
} from '../../services/admin/FamilyCategoryService';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyCategories'>;

type FilterType = 'all' | 'income' | 'expense';

// Color constants
const COLORS = {
  income: '#10B981',
  expense: '#EF4444',
  transactions: '#6366F1',
  white: '#fff',
  incomeBg: '#10B98110',
  expenseBg: '#EF444410',
} as const;

export default function FamilyCategoriesScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { currentFamily } = useFamilyStore();

  // State
  const [userGroups, setUserGroups] = useState<UserCategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Transaction dropdown state
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categoryTransactions, setCategoryTransactions] = useState<Map<string, FamilyTransaction[]>>(
    new Map()
  );
  const [loadingTransactions, setLoadingTransactions] = useState<string | null>(null);

  // Info modal
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Fetch categories from transactions grouped by user
  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      if (!currentFamily?.id) {
        setError('Không tìm thấy gia đình');
        setLoading(false);
        return;
      }

      // Kiểm tra quyền: chỉ owner mới được xem
      const currentUser = auth().currentUser;
      const isOwner = currentFamily.ownerId === currentUser?.uid;

      if (!isOwner) {
        setError('Chỉ chủ gia đình mới có quyền truy cập chức năng này');
        setLoading(false);
        return;
      }

      const data = await FamilyCategoryService.fetchFamilyCategoriesByUser(
        currentFamily.id
      );
      
      setUserGroups(data);
      console.log('✅ [FamilyCategoriesScreen] Categories loaded:', {
        userCount: data.length,
        totalCategories: data.reduce((sum, g) => sum + g.categories.length, 0),
      });
    } catch (err) {
      console.error('❌ [FamilyCategoriesScreen] Error fetching categories:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải danh mục';
      setError(errorMessage);
      
      // Show alert for critical errors
      if (errorMessage.includes('not authenticated') || errorMessage.includes('permission')) {
        Alert.alert('❌ Lỗi truy cập', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [currentFamily?.id, currentFamily?.ownerId]);

  // Handle toggle category to show/hide transactions
  const handleToggleCategory = useCallback(async (category: FamilyCategory) => {
    if (!currentFamily?.id) {
      Alert.alert('⚠️ Lỗi', 'Không tìm thấy thông tin gia đình');
      return;
    }

    const categoryId = category.id!;

    // Toggle collapse if already expanded
    if (expandedCategoryId === categoryId) {
      setExpandedCategoryId(null);
      return;
    }

    // Expand if transactions already loaded
    if (categoryTransactions.has(categoryId)) {
      setExpandedCategoryId(categoryId);
      return;
    }

    // Fetch transactions
    try {
      setLoadingTransactions(categoryId);
      console.log('🔄 [FamilyCategoriesScreen] Fetching transactions for category:', {
        categoryId,
        categoryName: category.name,
        type: category.type,
      });

      const transactions = await FamilyCategoryService.getTransactionsByCategory(
        currentFamily.id,
        category.name,
        category.type
      );

      setCategoryTransactions((prev) => new Map(prev).set(categoryId, transactions));
      setExpandedCategoryId(categoryId);
      
      console.log('✅ [FamilyCategoriesScreen] Transactions loaded:', {
        categoryId,
        count: transactions.length,
      });
    } catch (err) {
      console.error('❌ [FamilyCategoriesScreen] Error fetching transactions:', err);
      Alert.alert(
        '❌ Lỗi',
        err instanceof Error ? err.message : 'Không thể tải giao dịch'
      );
    } finally {
      setLoadingTransactions(null);
    }
  }, [currentFamily?.id, expandedCategoryId, categoryTransactions]);

  // Handle delete transaction
  const handleDeleteTransaction = useCallback((transaction: FamilyTransaction, categoryId: string) => {
    const transactionDesc = transaction.description || 'Không có mô tả';
    const userName = transaction.userName || 'Unknown';
    
    Alert.alert(
      '🗑️ Xóa giao dịch',
      `Bạn có chắc muốn xóa giao dịch "${transactionDesc}" của ${userName}?\n\nHành động này không thể hoàn tác.`,
      [
        { 
          text: 'Hủy', 
          style: 'cancel' 
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            if (!currentFamily?.id) {
              Alert.alert('❌ Lỗi', 'Không tìm thấy thông tin gia đình');
              return;
            }

            try {
              console.log('🗑️ [FamilyCategoriesScreen] Deleting transaction:', {
                transactionId: transaction.id,
                walletId: transaction.walletId,
                categoryId,
              });

              await FamilyCategoryService.deleteTransaction(
                currentFamily.id,
                transaction.walletId,
                transaction.id
              );

              // Cập nhật UI: xóa transaction khỏi list
              const updatedTransactions = (categoryTransactions.get(categoryId) || []).filter(
                (t) => t.id !== transaction.id
              );
              setCategoryTransactions((prev) => new Map(prev).set(categoryId, updatedTransactions));

              // Refresh categories để cập nhật số lượng
              await fetchCategories();

              console.log('✅ [FamilyCategoriesScreen] Transaction deleted successfully');
              Alert.alert('✅ Thành công', 'Đã xóa giao dịch');
            } catch (err: any) {
              console.error('❌ [FamilyCategoriesScreen] Error deleting transaction:', err);
              Alert.alert(
                '❌ Lỗi', 
                err.message || 'Không thể xóa giao dịch. Vui lòng thử lại.'
              );
            }
          },
        },
      ]
    );
  }, [currentFamily?.id, categoryTransactions, fetchCategories]);

  // Format date
  const formatDate = useCallback((date: any): string => {
    try {
      const dateObj = date?.toDate ? date.toDate() : new Date(date);
      if (isNaN(dateObj.getTime())) return 'N/A';
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} • ${hours}:${minutes}`;
    } catch {
      return 'N/A';
    }
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    try {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(amount);
    } catch {
      return `${amount.toLocaleString('vi-VN')} ₫`;
    }
  }, []);

  // Initial load
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setCategoryTransactions(new Map());
    setExpandedCategoryId(null);
    
    console.log('🔄 [FamilyCategoriesScreen] Refreshing categories...');
    
    try {
      await fetchCategories();
    } catch (err) {
      console.error('❌ [FamilyCategoriesScreen] Error refreshing categories:', err);
      Alert.alert('⚠️ Lỗi', 'Không thể làm mới dữ liệu');
    } finally {
      setRefreshing(false);
    }
  }, [fetchCategories]);

  // Get filtered user groups - Memoized
  const filteredUserGroups = useMemo((): UserCategoryGroup[] => {
    if (filterType === 'all') return userGroups;
    
    return userGroups
      .map(group => ({
        ...group,
        categories: group.categories.filter(c => c.type === filterType)
      }))
      .filter(group => group.categories.length > 0);
  }, [userGroups, filterType]);

  // Calculate stats - Memoized
  const stats = useMemo(() => {
    const allCategories = userGroups.flatMap(g => g.categories);
    const total = allCategories.length;
    const income = allCategories.filter((c) => c.type === 'income').length;
    const expense = allCategories.filter((c) => c.type === 'expense').length;
    const totalTransactions = allCategories.reduce((sum, c) => sum + (c.transactionCount || 0), 0);

    return { total, income, expense, totalTransactions };
  }, [userGroups]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Quản trị danh mục</Text>
          <Text style={styles.headerSubtitle}>
            {currentFamily?.ownerId === auth().currentUser?.uid ? 'Chủ gia đình' : 'Thành viên'}
          </Text>
        </View>
        <Pressable
          style={styles.infoButton}
          onPress={() => setShowInfoModal(true)}
        >
          <Icon name="information" size={24} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 160 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Đang tải danh mục từ giao dịch gia đình...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={fetchCategories}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
                Thử lại
              </Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Icon name="format-list-bulleted" size={20} color={theme.colors.primary} />
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Danh mục</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="trending-up" size={20} color={COLORS.income} />
                  <Text style={[styles.statValue, styles.incomeColor]}>{stats.income}</Text>
                  <Text style={styles.statLabel}>Thu</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="trending-down" size={20} color={COLORS.expense} />
                  <Text style={[styles.statValue, styles.expenseColor]}>{stats.expense}</Text>
                  <Text style={styles.statLabel}>Chi</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="swap-horizontal" size={20} color={COLORS.transactions} />
                  <Text style={[styles.statValue, styles.transactionsColor]}>{stats.totalTransactions}</Text>
                  <Text style={styles.statLabel}>Giao dịch</Text>
                </View>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterTabs}>
              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filterType === 'all' && [styles.filterTabActive, { backgroundColor: theme.colors.primary }],
                ]}
                onPress={() => setFilterType('all')}
              >
                <Text style={[
                  styles.filterTabText,
                  filterType === 'all' && styles.filterTabTextActive,
                ]}>
                  Tất cả ({stats.total})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filterType === 'income' && [styles.filterTabActive, { backgroundColor: '#10B981' }],
                ]}
                onPress={() => setFilterType('income')}
              >
                <Icon 
                  name="trending-up" 
                  size={16} 
                  color={filterType === 'income' ? COLORS.white : COLORS.income} 
                />
                <Text style={[
                  styles.filterTabText,
                  filterType === 'income' ? styles.filterTabTextActive : styles.incomeColor,
                ]}>
                  Thu ({stats.income})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterTab,
                  filterType === 'expense' && [styles.filterTabActive, { backgroundColor: '#EF4444' }],
                ]}
                onPress={() => setFilterType('expense')}
              >
                <Icon 
                  name="trending-down" 
                  size={16} 
                  color={filterType === 'expense' ? COLORS.white : COLORS.expense} 
                />
                <Text style={[
                  styles.filterTabText,
                  filterType === 'expense' ? styles.filterTabTextActive : styles.expenseColor,
                ]}>
                  Chi ({stats.expense})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Categories by User */}
            {filteredUserGroups.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon
                  name="inbox-outline"
                  size={48}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  Chưa có danh mục nào
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
                  Tạo giao dịch gia đình để tự động tạo danh mục
                </Text>
              </View>
            ) : (
              filteredUserGroups.map((userGroup) => (
                <View key={userGroup.userId} style={styles.userSection}>
                  {/* User Header */}
                  <View style={styles.userHeader}>
                    <View style={styles.userAvatar}>
                      <Icon name="account" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
                        {userGroup.userName}
                      </Text>
                      {userGroup.userEmail && (
                        <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>
                          {userGroup.userEmail}
                        </Text>
                      )}
                    </View>
                    <View style={styles.userStats}>
                      <Text style={[styles.userCategoryCount, { color: theme.colors.primary }]}>
                        {userGroup.categories.length} danh mục
                      </Text>
                    </View>
                  </View>

                  {/* User Categories */}
                  <View style={styles.categoriesGrid}>
                    {userGroup.categories.map((category) => (
                      <View key={category.id}>
                        <Pressable
                          style={[styles.categoryCard, { borderLeftColor: category.color }]}
                          onPress={() => handleToggleCategory(category)}
                        >
                          <View
                            style={[
                              styles.categoryIcon,
                              { backgroundColor: `${category.color}20` },
                            ]}
                          >
                            <Icon name={category.icon} size={32} color={category.color} />
                          </View>
                          <View style={styles.categoryInfo}>
                            <Text style={[styles.categoryName, { color: theme.colors.primary }]}>
                              {category.name}
                            </Text>
                            <View style={styles.categoryRow}>
                              <View style={[
                                styles.typeBadge,
                                category.type === 'income' ? styles.typeBadgeIncome : styles.typeBadgeExpense
                              ]}>
                                <Icon
                                  name={category.type === 'income' ? 'trending-up' : 'trending-down'}
                                  size={12}
                                  color={category.type === 'income' ? '#10B981' : '#EF4444'}
                                />
                                <Text style={[
                                  styles.typeBadgeText,
                                  category.type === 'income' ? styles.incomeColor : styles.expenseColor
                                ]}>
                                  {category.type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                                </Text>
                              </View>
                              <Text style={[styles.categoryStats, { color: theme.colors.onSurfaceVariant }]}>
                                {category.transactionCount || 0} giao dịch • {formatCurrency(category.totalAmount || 0)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.categoryActions}>
                            {loadingTransactions === category.id ? (
                              <ActivityIndicator size="small" color={theme.colors.primary} />
                            ) : (
                              <View style={styles.expandButton}>
                                <Text style={[styles.expandText, { color: theme.colors.primary }]}>
                                  {expandedCategoryId === category.id ? 'Ẩn' : 'Xem'} {category.transactionCount || 0}
                                </Text>
                                <Icon
                                  name={expandedCategoryId === category.id ? 'chevron-up' : 'chevron-down'}
                                  size={20}
                                  color={theme.colors.primary}
                                />
                              </View>
                            )}
                          </View>
                        </Pressable>

                        {/* Transaction List */}
                        {expandedCategoryId === category.id && categoryTransactions.has(category.id!) && (
                          <View style={styles.transactionList}>
                            {(categoryTransactions.get(category.id!) || []).map((transaction) => (
                              <View key={transaction.id} style={styles.transactionItem}>
                                <View style={styles.transactionInfo}>
                                  <Text style={[styles.transactionDesc, { color: theme.colors.onSurface }]}>
                                    {transaction.description || 'Không có mô tả'}
                                  </Text>
                                  <View style={styles.transactionMeta}>
                                    <Icon name="account" size={14} color={theme.colors.onSurfaceVariant} />
                                    <Text style={[styles.transactionUser, { color: theme.colors.onSurfaceVariant }]}>
                                      {transaction.userName}
                                    </Text>
                                    <Text style={[styles.transactionDot, { color: theme.colors.onSurfaceVariant }]}>
                                      •
                                    </Text>
                                    <Text style={[styles.transactionDate, { color: theme.colors.onSurfaceVariant }]}>
                                      {formatDate(transaction.date)}
                                    </Text>
                                  </View>
                                </View>
                                <View style={styles.transactionRight}>
                                  <Text style={[
                                    styles.transactionAmount,
                                    transaction.type === 'income' ? styles.incomeColor : styles.expenseColor
                                  ]}>
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                                  </Text>
                                  <TouchableOpacity
                                    style={styles.deleteTransactionButton}
                                    onPress={() => handleDeleteTransaction(transaction, category.id!)}
                                  >
                                    <Icon name="delete" size={18} color="#EF4444" />
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}

            {/* Bottom spacer so scrolling to the end shows whitespace */}
            <View style={styles.bottomSpacer} />

          </Animated.View>
        )}
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowInfoModal(false)}
        >
          <Pressable style={[styles.infoModalContent, { backgroundColor: theme.colors.surface }]}>
            <Icon name="information" size={48} color={theme.colors.primary} />
            <Text style={[styles.infoModalTitle, { color: theme.colors.onSurface }]}>
              Quản trị danh mục gia đình
            </Text>
            <Text style={[styles.infoModalText, { color: theme.colors.onSurfaceVariant }]}>
              🔒 <Text style={styles.boldText}>Chỉ dành cho Chủ gia đình</Text>
              {'\n\n'}
              📊 <Text style={styles.semiBoldText}>Danh mục tự động:</Text> Danh mục được AI tạo tự động từ giao dịch của các thành viên. Bạn không thể thêm/sửa/xóa danh mục.
              {'\n\n'}
              👥 <Text style={styles.semiBoldText}>Quản lý giao dịch:</Text> Xem danh mục và giao dịch của từng thành viên. Bạn có thể xóa giao dịch nếu cần.
              {'\n\n'}
              🔄 <Text style={styles.semiBoldText}>Tự động cập nhật:</Text> Khi thành viên tạo giao dịch mới, danh mục sẽ tự động xuất hiện hoặc cập nhật.
            </Text>
            <TouchableOpacity
              style={[styles.infoModalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={styles.infoModalButtonText}>Đã hiểu</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0, 137, 123, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    headerTitleContainer: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    headerSubtitle: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    infoButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0, 137, 123, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    loadingText: {
      fontSize: 14,
      marginTop: 12,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 14,
      marginTop: 12,
      textAlign: 'center',
      fontWeight: '500',
    },
    retryButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
    },
    retryButtonText: {
      fontWeight: '700',
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      width: '100%',
    },
    emptyText: {
      fontSize: 14,
      marginTop: 12,
      fontWeight: '500',
    },
    emptySubtext: {
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    statsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    filterTabs: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    filterTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
      gap: 6,
    },
    filterTabActive: {
      backgroundColor: theme.colors.primary,
    },
    filterTabText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    filterTabTextActive: {
      color: '#fff',
    },
    bottomSpacer: {
      height: 120,
    },
    userSection: {
      marginBottom: 24,
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    userAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 137, 123, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 12,
      fontWeight: '500',
    },
    userStats: {
      alignItems: 'flex-end',
    },
    userCategoryCount: {
      fontSize: 13,
      fontWeight: '700',
    },
    categoriesGrid: {
      flexDirection: 'column',
      gap: 12,
    },
    categoryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      borderLeftWidth: 4,
      borderTopColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
      borderTopWidth: 1,
    },
    categoryIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      flexShrink: 0,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    typeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    typeBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    categoryStats: {
      fontSize: 11,
      fontWeight: '500',
    },
    categoryActions: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      marginLeft: 8,
    },
    expandButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    expandText: {
      fontSize: 11,
      fontWeight: '600',
    },
    transactionList: {
      marginTop: 8,
      marginLeft: 12,
      marginRight: 12,
      marginBottom: 12,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
      borderRadius: 12,
      overflow: 'hidden',
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
    },
    transactionInfo: {
      flex: 1,
      marginRight: 12,
    },
    transactionDesc: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 4,
    },
    transactionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    transactionUser: {
      fontSize: 11,
      fontWeight: '500',
    },
    transactionDot: {
      fontSize: 11,
    },
    transactionDate: {
      fontSize: 11,
      fontWeight: '500',
    },
    transactionRight: {
      alignItems: 'flex-end',
      gap: 8,
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: '700',
    },
    deleteTransactionButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: '#FEF2F2',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    infoModalContent: {
      width: '85%',
      maxWidth: 400,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    infoModalTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginTop: 16,
      marginBottom: 12,
      textAlign: 'center',
    },
    infoModalText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      marginBottom: 24,
    },
    infoModalButton: {
      width: '100%',
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    infoModalButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    // Color styles
    incomeColor: {
      color: COLORS.income,
    },
    expenseColor: {
      color: COLORS.expense,
    },
    transactionsColor: {
      color: COLORS.transactions,
    },
    typeBadgeIncome: {
      backgroundColor: COLORS.incomeBg,
    },
    typeBadgeExpense: {
      backgroundColor: COLORS.expenseBg,
    },
    // Font weight styles
    boldText: {
      fontWeight: '700',
    },
    semiBoldText: {
      fontWeight: '600',
    },
  });
