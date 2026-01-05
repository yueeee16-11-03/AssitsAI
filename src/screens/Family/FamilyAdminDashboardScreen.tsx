import React, { useState, useCallback, useEffect } from 'react';
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
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from '../../store/familyStore';
import FamilyAdminService, { AdminDashboardData } from '../../services/admin/FamilyAdminService';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

// Color System - Professional palette
const COLORS = {
  primary: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
    alpha10: 'rgba(99, 102, 241, 0.1)',
    alpha20: 'rgba(99, 102, 241, 0.2)',
  },
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    alpha10: 'rgba(16, 185, 129, 0.1)',
    alpha20: 'rgba(16, 185, 129, 0.2)',
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    alpha10: 'rgba(245, 158, 11, 0.1)',
    alpha20: 'rgba(245, 158, 11, 0.2)',
  },
  danger: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    alpha10: 'rgba(239, 68, 68, 0.1)',
    alpha20: 'rgba(239, 68, 68, 0.2)',
  },
  info: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    alpha10: 'rgba(139, 92, 246, 0.1)',
    alpha20: 'rgba(139, 92, 246, 0.2)',
  },
  pink: {
    main: '#EC4899',
    light: '#F472B6',
    dark: '#DB2777',
    alpha10: 'rgba(236, 72, 153, 0.1)',
    alpha20: 'rgba(236, 72, 153, 0.2)',
  },
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
  },
};

export default function FamilyAdminDashboardScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { currentFamily } = useFamilyStore();
  
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [showAllTransactions, setShowAllTransactions] = useState(false); // Debug mode
  const [todayTransactionsExpanded, setTodayTransactionsExpanded] = useState(false); // Dropdown state

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    console.log('🔍 [AdminDashboard] Starting fetchData...');
    console.log('📋 [AdminDashboard] currentFamily:', currentFamily);
    
    if (!currentFamily?.id) {
      console.log('⚠️ [AdminDashboard] No currentFamily found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔑 [AdminDashboard] Checking admin access for family:', currentFamily.id);
      
      // Check admin access
      const access = await FamilyAdminService.hasAdminAccess(currentFamily.id);
      console.log('✅ [AdminDashboard] Admin access result:', access);
      setHasAccess(access);

      if (!access) {
        console.log('❌ [AdminDashboard] User does not have admin access');
        setLoading(false);
        return;
      }

      // Get dashboard data
      console.log('📊 [AdminDashboard] Fetching dashboard data...');
      const data = await FamilyAdminService.getDashboardData(
        currentFamily.id, 
        !showAllTransactions
      );
      console.log('✅ [AdminDashboard] Dashboard data received:', {
        hasData: !!data,
        stats: data?.stats,
      });
      setDashboardData(data);
    } catch (error: any) {
      console.error('❌ [AdminDashboard] Error fetching admin dashboard:', error);
      console.error('❌ [AdminDashboard] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      Alert.alert('Lỗi', error.message || 'Không thể tải dữ liệu');
    } finally {
      console.log('🏁 [AdminDashboard] Fetch completed, loading:', false);
      setLoading(false);
    }
  }, [currentFamily, showAllTransactions]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    fetchData();
  }, [fadeAnim, fetchData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Handle export report
  const handleExportReport = useCallback(async () => {
    if (!currentFamily?.id) return;

    try {
      const report = await FamilyAdminService.exportAdminReport(currentFamily.id);
      await Share.share({
        message: `Báo cáo quản trị gia đình ${currentFamily.name}\n\n${report}`,
        title: 'Admin Report',
      });
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xuất báo cáo');
    }
  }, [currentFamily]);

  // Format currency
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0₫';
    if (amount === 0) return '0₫';
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return `${(absAmount / 1000000).toFixed(1)}M`;
    }
    if (absAmount >= 1000) {
      return `${(absAmount / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absAmount);
  };

  // Format full currency for alerts
  const formatFullCurrency = (amount: number | undefined | null) => {
    if (amount === null || amount === undefined || isNaN(amount)) return '0₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Đang tải dữ liệu...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if user has admin access
  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Tổng quan quản trị</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.restrictedContainer}>
          <View style={styles.restrictedIconContainer}>
            <Icon name="shield-lock" size={72} color={COLORS.danger.main} />
          </View>
          <Text style={styles.restrictedTitle}>Quyền hạn chế</Text>
          <Text style={styles.restrictedText}>
            Chỉ chủ gia đình và quản trị viên mới có quyền xem tổng quan chi tiết
          </Text>
          <Pressable
            style={styles.restrictedButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color={COLORS.neutral.white} />
            <Text style={styles.restrictedButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Tổng quan quản trị</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Không thể tải dữ liệu
          </Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { stats } = dashboardData;

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
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tổng quan quản trị</Text>
          <Text style={styles.headerSubtitle}>
            {showAllTransactions ? '📅 Tất cả giao dịch' : `Cập nhật: ${new Date().toLocaleDateString('vi-VN')}`}
          </Text>
        </View>
        <Pressable 
          style={[styles.exportButton, showAllTransactions && styles.exportButtonActive]} 
          onPress={() => {
            setShowAllTransactions(!showAllTransactions);
            Alert.alert(
              'Chế độ xem',
              showAllTransactions 
                ? 'Đã chuyển sang xem giao dịch tháng này' 
                : 'Đã chuyển sang xem tất cả giao dịch',
            );
          }}
        >
          <Icon name={showAllTransactions ? "calendar-month" : "calendar-clock"} size={20} color={COLORS.primary.main} />
        </Pressable>
        <Pressable style={styles.exportButton} onPress={handleExportReport}>
          <Icon name="download" size={20} color={COLORS.primary.main} />
        </Pressable>
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
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Hero Stats Card */}
          <View style={[styles.heroCard, theme.dark && styles.heroCardDark]}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIconContainer}>
                <Icon name="chart-box" size={32} color={COLORS.neutral.white} />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>Tổng quan tài chính</Text>
                <Text style={styles.heroSubtitle}>
                  Hôm nay: {stats.todayTransactionCount} giao dịch
                </Text>
              </View>
            </View>

            <View style={styles.heroStatsGrid}>
              <View style={styles.heroStatItem}>
                <Icon name="trending-up" size={20} color={COLORS.success.light} />
                <Text style={styles.heroStatLabel}>Thu nhập</Text>
                <Text style={[styles.heroStatValue, { color: COLORS.success.light }]}>
                  {formatCurrency(stats.todayIncome)}
                </Text>
              </View>

              <View style={styles.heroStatItem}>
                <Icon name="trending-down" size={20} color={COLORS.danger.light} />
                <Text style={styles.heroStatLabel}>Chi tiêu</Text>
                <Text style={[styles.heroStatValue, { color: COLORS.danger.light }]}>
                  {formatCurrency(stats.todayExpense)}
                </Text>
              </View>

              <View style={styles.heroStatItem}>
                <Icon name="wallet" size={20} color={COLORS.warning.light} />
                <Text style={styles.heroStatLabel}>Tiết kiệm</Text>
                <Text style={[styles.heroStatValue, { color: COLORS.warning.light }]}>
                  {formatCurrency(stats.todaySaving)}
                </Text>
              </View>
            </View>

            <View style={styles.savingRateContainer}>
              <Text style={styles.savingRateLabel}>Tỷ lệ tiết kiệm hôm nay</Text>
              <Text style={[
                styles.savingRateValue,
                {
                  color: (stats?.todaySavingRate ?? 0) < 0
                    ? COLORS.danger.light
                    : COLORS.neutral.white,
                },
              ]}>
                {stats?.todaySavingRate ?? 0}%
              </Text>
              <View style={styles.savingRateBar}>
                <View
                  style={[
                    styles.savingRateBarFill,
                    {
                      width: `${Math.min(Math.max(stats?.todaySavingRate ?? 0, 0), 100)}%`,
                      backgroundColor:
                        (stats?.todaySavingRate ?? 0) >= 50
                          ? COLORS.success.main
                          : (stats?.todaySavingRate ?? 0) >= 30
                          ? COLORS.warning.main
                          : (stats?.todaySavingRate ?? 0) >= 0
                          ? COLORS.danger.main
                          : 'transparent',
                    },
                  ]}
                />
              </View>
              {(stats?.todaySavingRate ?? 0) < 0 && (
                <Text style={styles.savingWarning}>
                  ⚠️ Chi tiêu vượt thu nhập hôm nay
                </Text>
              )}
            </View>
          </View>

          {/* Key Insights */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="lightbulb" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Thông tin quan trọng</Text>
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightRow}>
                <View style={[styles.insightIconContainer, styles.insightIconPrimary]}>
                  <Icon name="account-star" size={24} color={COLORS.primary.main} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Người chi nhiều nhất hôm nay</Text>
                  <Text style={styles.insightValue}>
                    {stats.highestSpenderToday || 'Chưa có dữ liệu'}
                  </Text>
                  {stats.highestSpenderTodayAmount > 0 && (
                    <Text style={styles.insightSubValue}>
                      {formatFullCurrency(stats.highestSpenderTodayAmount)}
                    </Text>
                  )}
                </View>
              </View>

              <Pressable 
                style={styles.insightRow}
                onPress={() => {
                  if (stats.todayTransactionCount > 0) {
                    setTodayTransactionsExpanded(!todayTransactionsExpanded);
                  }
                }}
              >
                <View style={[styles.insightIconContainer, styles.insightIconSuccess]}>
                  <Icon name="calculator" size={24} color={COLORS.success.main} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>TB giao dịch hôm nay</Text>
                  <Text style={styles.insightValue}>
                    {(stats?.averageTransactionValueToday ?? 0) > 0 
                      ? formatFullCurrency(stats.averageTransactionValueToday)
                      : 'Chưa có giao dịch'
                    }
                  </Text>
                  {stats.todayTransactionCount > 0 && (
                    <Text style={styles.insightSubValue}>
                      {stats.todayTransactionCount} giao dịch
                    </Text>
                  )}
                </View>
                {stats.todayTransactionCount > 0 && (
                  <Icon 
                    name={todayTransactionsExpanded ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                )}
              </Pressable>

              {/* Expanded Today Transactions */}
              {todayTransactionsExpanded && stats.todayTransactionCount > 0 && (
                <View style={styles.todayTransactionsDropdown}>
                  {dashboardData?.todayTransactions.map((tx, index) => (
                    <View 
                      key={tx.id} 
                      style={[
                        styles.todayTransactionItem,
                        index === dashboardData.todayTransactions.length - 1 && styles.todayTransactionItemLast
                      ]}
                    >
                      <View style={styles.todayTransactionLeft}>
                        <View style={[
                          styles.todayTransactionTypeIcon,
                          {
                            backgroundColor: tx.type?.toLowerCase().includes('income') 
                              ? COLORS.success.alpha10 
                              : COLORS.danger.alpha10
                          }
                        ]}>
                          <Icon 
                            name={tx.type?.toLowerCase().includes('income') ? "trending-up" : "trending-down"} 
                            size={16} 
                            color={tx.type?.toLowerCase().includes('income') ? COLORS.success.main : COLORS.danger.main} 
                          />
                        </View>
                        <View style={styles.todayTransactionInfo}>
                          <Text style={styles.todayTransactionCategory}>
                            {tx.category || 'Khác'}
                          </Text>
                          <Text style={styles.todayTransactionUser}>
                            {tx.memberName}
                          </Text>
                          {tx.description && (
                            <Text style={styles.todayTransactionDescription} numberOfLines={1}>
                              {tx.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.todayTransactionRight}>
                        <Text style={[
                          styles.todayTransactionAmount,
                          {
                            color: tx.type?.toLowerCase().includes('income') 
                              ? COLORS.success.main 
                              : COLORS.danger.main
                          }
                        ]}>
                          {tx.type?.toLowerCase().includes('income') ? '+' : '-'}{formatFullCurrency(Math.abs(tx.amount))}
                        </Text>
                        <Text style={styles.todayTransactionTime}>
                          {new Date(tx.date?.toDate?.() || tx.createdAt?.toDate?.() || new Date()).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.insightRow}>
                <View style={[styles.insightIconContainer, styles.insightIconWarning]}>
                  <Icon name="chart-line" size={24} color={COLORS.warning.main} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Xu hướng chi tiêu</Text>
                  <Text
                    style={[
                      styles.insightValue,
                      {
                        color: (stats?.spendingTrend ?? '').startsWith('+')
                          ? COLORS.danger.main
                          : (stats?.spendingTrend ?? '').startsWith('-')
                          ? COLORS.success.main
                          : (stats?.spendingTrend === 'Mới' || stats?.spendingTrend === '0%')
                          ? theme.colors.onSurfaceVariant
                          : theme.colors.primary,
                      },
                    ]}
                  >
                    {stats?.spendingTrend || 'Chưa có dữ liệu'}
                  </Text>
                </View>
              </View>

              <View style={[styles.insightRow, styles.insightRowLast]}>
                <View style={[styles.insightIconContainer, styles.insightIconPink]}>
                  <Icon name="piggy-bank" size={24} color={COLORS.pink.main} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Sử dụng ngân sách</Text>
                  <Text
                    style={[
                      styles.insightValue,
                      {
                        color:
                          (stats?.budgetUsage ?? 0) === 0
                            ? theme.colors.onSurfaceVariant
                            : (stats?.budgetUsage ?? 0) > 100
                            ? COLORS.danger.main
                            : (stats?.budgetUsage ?? 0) > 80
                            ? COLORS.warning.main
                            : COLORS.success.main,
                      },
                    ]}
                  >
                    {(stats?.budgetUsage ?? 0) > 0 ? `${stats.budgetUsage}%` : 'Chưa đặt ngân sách'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: 16,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryButtonText: {
      color: COLORS.neutral.white,
      fontSize: 14,
      fontWeight: '700',
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
    headerContent: {
      flex: 1,
      marginLeft: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      fontWeight: '500',
    },
    exportButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.primary.alpha10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    exportButtonActive: {
      backgroundColor: COLORS.primary.alpha20,
      borderWidth: 2,
      borderColor: COLORS.primary.main,
    },
    spacer: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
    },
    // Restricted Access
    restrictedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: 20,
    },
    restrictedIconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: COLORS.danger.alpha10,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.danger.main,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    restrictedTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.primary,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    restrictedText: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 22,
      fontWeight: '500',
    },
    restrictedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 16,
      marginTop: 12,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    restrictedButtonText: {
      color: COLORS.neutral.white,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    // Hero Card
    heroCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      padding: 20,
      marginBottom: 16,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    heroCardDark: {
      backgroundColor: theme.dark ? COLORS.neutral.gray800 : theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    heroIconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.neutral.white,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    heroInfo: {
      flex: 1,
      marginLeft: 16,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: COLORS.neutral.white,
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    heroSubtitle: {
      fontSize: 14,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: 0.2,
    },
    heroStatsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    heroStatItem: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 14,
      padding: 12,
      alignItems: 'center',
      gap: 4,
    },
    heroStatLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    heroStatValue: {
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.2,
      textAlign: 'center',
    },
    savingRateContainer: {
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.25)',
    },
    savingRateLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 8,
      letterSpacing: 0.2,
    },
    savingRateValue: {
      fontSize: 28,
      fontWeight: '800',
      color: COLORS.neutral.white,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    savingRateBar: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    savingRateBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    savingWarning: {
      fontSize: 11,
      fontWeight: '600',
      color: COLORS.danger.light,
      marginTop: 8,
      textAlign: 'center',
    },
    // Sections
    section: {
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: 0.3,
    },
    // Insight Card
    insightCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
      shadowColor: theme.dark ? COLORS.neutral.white : COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.05 : 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : COLORS.neutral.gray100,
    },
    insightRowLast: {
      borderBottomWidth: 0,
    },
    insightIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    insightIconPrimary: {
      backgroundColor: COLORS.primary.alpha10,
    },
    insightIconSuccess: {
      backgroundColor: COLORS.success.alpha10,
    },
    insightIconWarning: {
      backgroundColor: COLORS.warning.alpha10,
    },
    insightIconPink: {
      backgroundColor: COLORS.pink.alpha10,
    },
    insightContent: {
      flex: 1,
    },
    insightLabel: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
      fontWeight: '600',
      letterSpacing: 0.1,
    },
    insightValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: 0.2,
    },
    insightSubValue: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      letterSpacing: 0.1,
    },
    // Today Transactions Dropdown
    todayTransactionsDropdown: {
      marginTop: 8,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : COLORS.neutral.gray50,
      borderRadius: 12,
      padding: 8,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : COLORS.neutral.gray200,
    },
    todayTransactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : COLORS.neutral.gray200,
    },
    todayTransactionItemLast: {
      borderBottomWidth: 0,
    },
    todayTransactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    todayTransactionTypeIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    todayTransactionInfo: {
      flex: 1,
    },
    todayTransactionCategory: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 2,
      letterSpacing: 0.1,
    },
    todayTransactionUser: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    todayTransactionDescription: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    todayTransactionRight: {
      alignItems: 'flex-end',
    },
    todayTransactionAmount: {
      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.2,
      marginBottom: 2,
    },
    todayTransactionTime: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    // Empty State
    emptyState: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 40,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
      borderStyle: 'dashed',
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 12,
      fontWeight: '600',
    },
    // Member Cards
    memberCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
      shadowColor: theme.dark ? COLORS.neutral.white : COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.05 : 0.08,
      shadowRadius: 12,
      elevation: 3,
      position: 'relative',
    },
    memberCardPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    },
    memberHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    memberLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    memberAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    memberInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    memberName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 4,
      letterSpacing: 0.1,
      lineHeight: 18,
    },
    memberMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    memberTransactions: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      letterSpacing: 0.1,
      lineHeight: 14,
    },
    memberRight: {
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      paddingBottom: 1,
    },
    memberAmountContainer: {
      alignItems: 'flex-end',
      gap: 4,
    },
    memberAmount: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.onSurface,
      letterSpacing: 0.2,
      lineHeight: 18,
    },
    memberPercent: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    memberProgress: {
      height: 8,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : COLORS.neutral.gray200,
      borderRadius: 4,
      overflow: 'hidden',
    },
    memberProgressFill: {
      height: '100%',
      borderRadius: 4,
    },
    topSpenderBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: COLORS.warning.alpha10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    topSpenderText: {
      fontSize: 10,
      fontWeight: '700',
      color: COLORS.warning.main,
      letterSpacing: 0.2,
    },
    // Category Cards
    categoryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
      shadowColor: theme.dark ? COLORS.neutral.white : COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.05 : 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    categoryCardPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    categoryAmount: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    categoryRight: {
      alignItems: 'flex-end',
    },
    categoryPercent: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    categoryTrend: {
      fontSize: 12,
      fontWeight: '700',
    },
    categoryBar: {
      height: 6,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : COLORS.neutral.gray200,
      borderRadius: 3,
      overflow: 'hidden',
    },
    categoryBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    // Member Category Group
    memberCategoryGroup: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
    },
    memberCategoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : COLORS.neutral.gray200,
    },
    memberCategoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    memberCategoryAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    memberCategoryInfo: {
      flex: 1,
    },
    memberCategoryName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
      letterSpacing: 0.2,
    },
    memberCategoryTotal: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    // Period Selector
    periodSelector: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 10,
    },
    periodButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderRadius: 10,
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
    },
    periodButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    periodButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.1,
    },
    periodButtonTextActive: {
      color: COLORS.neutral.white,
    },
    periodLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
      textAlign: 'center',
    },
  });
