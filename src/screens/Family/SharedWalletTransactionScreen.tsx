/**
 * SharedWalletTransactionScreen.tsx
 * Screen to view wallet transactions and user activity tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SharedWalletApi from '../../api/sharedWalletApi';
import { useFamilyStore } from '../../store/familyStore';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'SharedWalletTransaction'
>;

interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: any;
}

export default function SharedWalletTransactionScreen({
  navigation,
  route,
}: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const theme = useTheme();
  const styles = getStyles(theme);
  const { currentFamily } = useFamilyStore();

  const walletId = route.params?.walletId;
  const walletName = route.params?.walletName || 'Lịch sử giao dịch';

  const [fadeAnim] = useState(new Animated.Value(0));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'deposit' | 'withdraw' | 'transfer'>('all');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadTransactions = useCallback(async () => {
    if (!currentFamily?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy gia đình');
      return;
    }

    setLoading(true);
    try {
      const response = await SharedWalletApi.getTransactionHistory(
        currentFamily.id,
        walletId,
        100
      );

      if (response.success && response.transactions) {
        setTransactions(response.transactions);
      } else {
        Alert.alert('Lỗi', response.error || 'Không thể tải lịch sử giao dịch');
      }
    } catch (error: any) {
      console.error('Lỗi tải lịch sử:', error);
      Alert.alert('Lỗi', 'Lỗi tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  }, [currentFamily?.id, walletId]);

  useEffect(() => {
    if (currentFamily?.id && walletId) {
      loadTransactions();
    }
  }, [currentFamily?.id, walletId, loadTransactions]);

  const getFilteredTransactions = () => {
    if (selectedFilter === 'all') {
      return transactions;
    }
    return transactions.filter((t) => t.type === selectedFilter);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'cash-plus';
      case 'withdraw':
        return 'cash-minus';
      case 'transfer':
        return 'transfer';
      default:
        return 'cash';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return '#10B981';
      case 'withdraw':
        return '#EF4444';
      case 'transfer':
        return '#F59E0B';
      default:
        return theme.colors.primary;
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Nạp tiền';
      case 'withdraw':
        return 'Rút tiền';
      case 'transfer':
        return 'Chuyển tiền';
      default:
        return 'Giao dịch';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = new Date(date.seconds ? date.seconds * 1000 : date);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{walletName}</Text>
          <Text style={styles.headerSubtitle}>Lịch sử giao dịch</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(['all', 'deposit', 'withdraw', 'transfer'] as const).map((filter) => {
          const isActive = selectedFilter === filter;
          const activeBgColor =
            filter === 'deposit'
              ? getTransactionColor('deposit')
              : filter === 'withdraw'
              ? getTransactionColor('withdraw')
              : filter === 'transfer'
              ? getTransactionColor('transfer')
              : theme.colors.primary;

          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterBtn,
                isActive && { backgroundColor: activeBgColor, borderColor: activeBgColor },
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  isActive && styles.filterBtnTextActive,
                ]}
              >
                {filter === 'all'
                  ? 'Tất cả'
                  : filter === 'deposit'
                  ? 'Nạp'
                  : filter === 'withdraw'
                  ? 'Rút'
                  : 'Chuyển'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT + 120) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon
                  name="history"
                  size={48}
                  color={theme.colors.onSurfaceVariant}
                />
                <Text style={styles.emptyStateText}>Chưa có giao dịch nào</Text>
              </View>
            ) : (
              <View>
                {filteredTransactions.map((transaction, index) => (
                  <TouchableOpacity
                    key={transaction.id}
                    style={[
                      styles.transactionItem,
                      index === filteredTransactions.length - 1 && styles.transactionItemLast,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIcon,
                          {
                            backgroundColor: `${getTransactionColor(transaction.type)}20`,
                          },
                        ]}
                      >
                        <Icon
                          name={getTransactionIcon(transaction.type) as any}
                          size={20}
                          color={getTransactionColor(transaction.type)}
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionType}>
                          {getTransactionLabel(transaction.type)}
                        </Text>
                        <Text style={styles.transactionUser}>
                          👤 {transaction.userName}
                        </Text>
                        <Text style={styles.transactionTime}>
                          {formatDate(transaction.createdAt)}
                        </Text>
                        {transaction.description && (
                          <Text style={styles.transactionDesc}>
                            📝 {transaction.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          {
                            color: getTransactionColor(transaction.type),
                          },
                        ]}
                      >
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {(transaction.amount / 1000000).toFixed(1)}M
                      </Text>
                      <Text style={styles.balanceAfter}>
                        = {(transaction.balanceAfter / 1000000).toFixed(1)}M
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Spacer so users can scroll past the last transaction and see whitespace */}
            <View style={{ height: Math.max(80, insets.bottom + 80) }} />
          </Animated.View>
        </ScrollView>
      )}
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
      paddingTop: 48,
      paddingHorizontal: 16,
      paddingBottom: 16,
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
      marginRight: 12,
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.primary,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
    },
    filterBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    filterBtnActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    filterBtnTextActive: {
      color: theme.colors.onPrimary,
      fontWeight: '800',
    },
    content: {
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 300,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
    },
    emptyStateText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
    },
    transactionItemLast: {
      marginBottom: 0,
    },
    transactionLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginRight: 12,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionType: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    transactionUser: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    transactionTime: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    transactionDesc: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },
    transactionRight: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 2,
    },
    balanceAfter: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
  });
