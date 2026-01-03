import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from '../../store/familyStore';
import FamilyTransactionService, { FamilyTransaction } from '../../services/admin/FamilyTransactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

export default function FamilyTransactionsScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { currentFamily } = useFamilyStore();

  // State management
  const [transactions, setTransactions] = useState<FamilyTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FamilyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Fetch transactions
  const fetchTransactions = React.useCallback(async () => {
    try {
      setError(null);
      if (!currentFamily?.id) {
        setError('Không tìm thấy gia đình');
        setLoading(false);
        return;
      }

      const data = await FamilyTransactionService.getRecentTransactions(
        currentFamily.id,
        50
      );
      setTransactions(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tải dữ liệu giao dịch'
      );
      setLoading(false);
    }
  }, [currentFamily?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.memberName.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, filterType]);

  // Initial load
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentFamily?.id) {
        const data = await FamilyTransactionService.getRecentTransactions(
          currentFamily.id,
          50
        );
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error refreshing transactions:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate totals (kept for future use)
  // const totalIncome = filteredTransactions
  //   .filter((t) => t.type === 'income')
  //   .reduce((sum, t) => sum + t.amount, 0);

  // const totalExpense = filteredTransactions
  //   .filter((t) => t.type === 'expense')
  //   .reduce((sum, t) => sum + t.amount, 0);

  // Format date
  const formatDate = (date: any): string => {
    try {
      if (!date) return 'N/A';
      const dateObj = date.toDate?.() || new Date(date);
      return dateObj.toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  // Get transaction icon background color
  const getTransactionIconBg = (type: 'income' | 'expense'): string => {
    return type === 'income'
      ? `${theme.colors.secondary}20`
      : 'rgba(239, 68, 68, 0.2)';
  };

  // Get transaction icon color
  const getTransactionIconColor = (type: 'income' | 'expense'): string => {
    return type === 'income' ? theme.colors.secondary : '#EF4444';
  };

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
        <Text style={styles.headerTitle}>Giao dịch</Text>
        <View style={styles.spacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
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
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Đang tải dữ liệu...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon
              name="alert-circle"
              size={48}
              color={theme.colors.error}
            />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={fetchTransactions}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
                Thử lại
              </Text>
            </Pressable>
            <Pressable
              style={[styles.retryButton, styles.testDataButton]}
              onPress={async () => {
                try {
                  if (currentFamily?.id) {
                    await FamilyTransactionService.createTestTransactions(currentFamily.id);
                    Alert.alert('Thành công', 'Đã tạo dữ liệu test. Hãy thử lại.');
                    await fetchTransactions();
                  }
                } catch {
                  Alert.alert('Lỗi', 'Không thể tạo dữ liệu test');
                }
              }}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.onSecondary }]}>
                Tạo dữ liệu test
              </Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Search & Filter Section */}
            <View style={styles.searchSection}>
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Icon
                  name="magnify"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.searchIcon}
                />
                <Text
                  style={[styles.searchInput, {
                    color: searchQuery ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  }]}
                  onPress={() => Alert.prompt(
                    'Tìm kiếm giao dịch',
                    'Nhập tên, danh mục hoặc thành viên',
                    [
                      { text: 'Hủy', onPress: () => setSearchQuery(''), style: 'cancel' },
                      { text: 'Tìm', onPress: (text: string = '') => setSearchQuery(text) }
                    ],
                    'plain-text',
                    searchQuery
                  )}
                >
                  {searchQuery || 'Tìm kiếm...'}
                </Text>
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Icon name="close" size={20} color={theme.colors.primary} />
                  </Pressable>
                ) : null}
              </View>

              {/* Filter Buttons */}
              <View style={styles.filterButtons}>
                <Pressable
                  style={[
                    styles.filterButton,
                    filterType === 'all' && styles.filterButtonActive,
                    {
                      backgroundColor: filterType === 'all' 
                        ? theme.colors.primary 
                        : theme.colors.surface,
                      borderColor: filterType === 'all'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                    }
                  ]}
                  onPress={() => setFilterType('all')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: filterType === 'all' ? theme.colors.onPrimary : theme.colors.primary }
                  ]}>
                    Tất cả
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,
                    filterType === 'income' && styles.filterButtonActive,
                    {
                      backgroundColor: filterType === 'income' 
                        ? theme.colors.secondary 
                        : theme.colors.surface,
                      borderColor: filterType === 'income'
                        ? theme.colors.secondary
                        : theme.colors.onSurfaceVariant,
                    }
                  ]}
                  onPress={() => setFilterType('income')}
                >
                  <Icon 
                    name="plus-circle"
                    size={16}
                    color={filterType === 'income' ? theme.colors.onSecondary : theme.colors.secondary}
                    style={styles.filterIcon}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    { color: filterType === 'income' ? theme.colors.onSecondary : theme.colors.secondary }
                  ]}>
                    Thu nhập
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,
                    filterType === 'expense' && styles.filterButtonActive,
                    filterType === 'expense' 
                      ? styles.filterButtonExpenseActive
                      : styles.filterButtonExpenseInactive
                  ]}
                  onPress={() => setFilterType('expense')}
                >
                  <Icon 
                    name="minus-circle"
                    size={16}
                    color={filterType === 'expense' ? '#FFF' : '#EF4444'}
                    style={styles.filterIcon}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    filterType === 'expense' 
                      ? styles.filterButtonExpenseText
                      : styles.filterButtonExpenseTextInactive
                  ]}>
                    Chi tiêu
                  </Text>
                </Pressable>
              </View>

              {/* Summary - Only show when no filter applied */}
              {/* REMOVED: Summary card không hiển thị nữa */}
            </View>

            {/* Transactions List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Giao dịch ({filteredTransactions.length})
              </Text>
              {filteredTransactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon
                    name="file-document-outline"
                    size={48}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    {searchQuery || filterType !== 'all' 
                      ? 'Không tìm thấy giao dịch phù hợp'
                      : 'Chưa có giao dịch nào'}
                  </Text>
                </View>
              ) : (
                filteredTransactions.map((transaction) => (
                  <Pressable
                    key={transaction.id}
                    style={styles.transactionCard}
                    onPress={() =>
                      Alert.alert(
                        'Chi tiết giao dịch',
                        `${transaction.description}\n\nThành viên: ${transaction.memberName}\nDanh mục: ${transaction.category}`
                      )
                    }
                  >
                    <View
                      style={[
                        styles.transactionIcon,
                        { backgroundColor: getTransactionIconBg(transaction.type) },
                      ]}
                    >
                      <Icon
                        name={FamilyTransactionService.getTransactionIcon(
                          transaction.type,
                          transaction.category
                        )}
                        size={24}
                        color={getTransactionIconColor(transaction.type)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionCategory}>
                        {transaction.category}
                      </Text>
                      <Text style={styles.transactionMember}>
                        👤 {transaction.memberName}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getTransactionIconColor(transaction.type) },
                      ]}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {FamilyTransactionService.formatCurrency(transaction.amount)}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>
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
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    spacer: {
      width: 40,
    },
    content: {
      flex: 1,
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
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 14,
      marginTop: 12,
      fontWeight: '500',
    },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '800',
    },
    summaryDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0, 137, 123, 0.15)',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionCategory: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    transactionMember: {
      fontSize: 12,
      color: theme.colors.onSurface,
      marginBottom: 2,
      fontWeight: '500',
    },
    transactionDate: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    retryButtonText: {
      fontWeight: '700',
    },
    testDataButton: {
      marginTop: 8,
      backgroundColor: theme.colors.secondary,
    },
    searchSection: {
      marginBottom: 20,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },
    filterButtons: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    filterButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
    },
    filterButtonActive: {
      borderWidth: 0,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    filterIcon: {
      marginRight: 6,
    },
    filterButtonExpenseActive: {
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
      borderWidth: 0,
    },
    filterButtonExpenseInactive: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.onSurfaceVariant,
      borderWidth: 1.5,
    },
    filterButtonExpenseText: {
      color: '#FFF',
    },
    filterButtonExpenseTextInactive: {
      color: '#EF4444',
    },
  });
