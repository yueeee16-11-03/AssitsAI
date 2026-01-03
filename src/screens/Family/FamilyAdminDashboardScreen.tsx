import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

export default function FamilyAdminDashboardScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  
  // Simulated user role - in real app, get from auth/store
  const userRole = 'owner'; // Can be 'owner', 'admin', 'member', 'child'
  const hasAdminAccess = userRole === 'owner' || userRole === 'admin';

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Check if user has admin access
  if (!hasAdminAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Tổng quan chi tiết</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.restrictedContainer}>
          <Icon name="lock" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.restrictedTitle}>Quyền hạn chế</Text>
          <Text style={styles.restrictedText}>
            Chỉ chủ nhóm và quản trị viên mới có quyền xem tổng quan chi tiết
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mock data for admin dashboard
  const adminStats = {
    totalIncome: 45000000,
    totalExpense: 18000000,
    totalSaving: 27000000,
    savingRate: 60,
    averageTransactionValue: 450000,
    highestSpender: 'Nguyễn Thị B',
    spendingTrend: '+15%',
  };

  const memberFinanceBreakdown = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      income: 15000000,
      expense: 5000000,
      saving: 10000000,
      spendingPercent: 33,
    },
    {
      id: '2',
      name: 'Nguyễn Thị B',
      income: 12000000,
      expense: 8000000,
      saving: 4000000,
      spendingPercent: 67,
    },
    {
      id: '3',
      name: 'Nguyễn Văn C',
      income: 10000000,
      expense: 4000000,
      saving: 6000000,
      spendingPercent: 40,
    },
    {
      id: '4',
      name: 'Nguyễn Thị D',
      income: 8000000,
      expense: 1000000,
      saving: 7000000,
      spendingPercent: 12,
    },
  ];

  const categoryAnalysis = [
    {
      id: '1',
      name: 'Ăn uống',
      totalAmount: 5000000,
      percentage: 28,
      trend: '+5%',
      icon: 'utensils',
    },
    {
      id: '2',
      name: 'Giao thông',
      totalAmount: 3500000,
      percentage: 19,
      trend: '-2%',
      icon: 'car',
    },
    {
      id: '3',
      name: 'Mua sắm',
      totalAmount: 5000000,
      percentage: 28,
      trend: '+12%',
      icon: 'shopping',
    },
    {
      id: '4',
      name: 'Giải trí',
      totalAmount: 2500000,
      percentage: 14,
      trend: '+8%',
      icon: 'gamepad-variant',
    },
    {
      id: '5',
      name: 'Khác',
      totalAmount: 2000000,
      percentage: 11,
      trend: '+1%',
      icon: 'dots-horizontal',
    },
  ];

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
          <Text style={styles.headerTitle}>Tổng quan chi tiết</Text>
          <Text style={styles.headerSubtitle}>Chỉ dành cho quản trị viên</Text>
        </View>
        <Icon name="shield-admin" size={28} color={theme.colors.secondary} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Overall Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thống kê chung</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Icon
                  name="cash-plus"
                  size={28}
                  color={theme.colors.secondary}
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>Thu nhập</Text>
                <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
                  ₫{(adminStats.totalIncome / 1000000).toFixed(1)}M
                </Text>
              </View>

              <View style={styles.statCard}>
                <Icon
                  name="cash-remove"
                  size={28}
                  color="#EF4444"
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>Chi tiêu</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  ₫{(adminStats.totalExpense / 1000000).toFixed(1)}M
                </Text>
              </View>

              <View style={styles.statCard}>
                <Icon
                  name="piggy-bank"
                  size={28}
                  color={theme.colors.primary}
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>Tiết kiệm</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  ₫{(adminStats.totalSaving / 1000000).toFixed(1)}M
                </Text>
              </View>

              <View style={styles.statCard}>
                <Icon
                  name="percent"
                  size={28}
                  color={theme.colors.primary}
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>Tỷ lệ tiết kiệm</Text>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {adminStats.savingRate}%
                </Text>
              </View>
            </View>
          </View>

          {/* Key Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin chính</Text>
            <View style={styles.insightCard}>
              <View style={styles.insightRow}>
                <Icon
                  name="trending-up"
                  size={24}
                  color={theme.colors.secondary}
                  style={styles.insightIcon}
                />
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Xu hướng chi tiêu</Text>
                  <Text style={styles.insightValue}>{adminStats.spendingTrend}</Text>
                </View>
              </View>
              <View style={styles.insightRow}>
                <Icon
                  name="account-tie"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.insightIcon}
                />
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Người chi tiêu nhiều nhất</Text>
                  <Text style={styles.insightValue}>{adminStats.highestSpender}</Text>
                </View>
              </View>
              <View style={styles.insightRow}>
                <Icon
                  name="calculator"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.insightIcon}
                />
                <View style={styles.insightContent}>
                  <Text style={styles.insightLabel}>Trung bình giao dịch</Text>
                  <Text style={styles.insightValue}>
                    ₫{(adminStats.averageTransactionValue / 1000000).toFixed(1)}M
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Member Finance Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiêu của thành viên</Text>
            {memberFinanceBreakdown.map((member) => (
              <Pressable
                key={member.id}
                style={styles.memberBreakdownCard}
                onPress={() => Alert.alert(member.name, `Chi tiêu: ${member.spendingPercent}%`)}
              >
                <View style={styles.memberBreakdownInfo}>
                  <Text style={styles.memberBreakdownName}>{member.name}</Text>
                  <View style={styles.memberBreakdownStats}>
                    <Text style={styles.memberBreakdownStat}>
                      ₫{(member.income / 1000000).toFixed(1)}M
                    </Text>
                    <Text style={styles.memberBreakdownSeparator}>→</Text>
                    <Text
                      style={[
                        styles.memberBreakdownStat,
                        { color: member.spendingPercent > 50 ? '#EF4444' : theme.colors.primary },
                      ]}
                    >
                      {member.spendingPercent}%
                    </Text>
                  </View>
                </View>
                <View style={styles.memberBreakdownProgress}>
                  <View
                    style={[
                      styles.memberBreakdownProgressFill,
                      {
                        width: `${member.spendingPercent}%`,
                        backgroundColor:
                          member.spendingPercent > 70
                            ? '#EF4444'
                            : member.spendingPercent > 50
                            ? '#FFD93D'
                            : theme.colors.secondary,
                      },
                    ]}
                  />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Category Analysis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phân tích danh mục</Text>
            {categoryAnalysis.map((category) => (
              <View key={category.id} style={styles.categoryAnalysisCard}>
                <View style={styles.categoryAnalysisHeader}>
                  <View style={styles.categoryAnalysisLeft}>
                    <Icon
                      name={category.icon}
                      size={24}
                      color={theme.colors.primary}
                      style={styles.categoryAnalysisIcon}
                    />
                    <View style={styles.categoryAnalysisInfo}>
                      <Text style={styles.categoryAnalysisName}>{category.name}</Text>
                      <Text style={styles.categoryAnalysisAmount}>
                        ₫{(category.totalAmount / 1000000).toFixed(1)}M
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryAnalysisRight}>
                    <Text style={styles.categoryAnalysisPercent}>{category.percentage}%</Text>
                    <Text
                      style={[
                        styles.categoryAnalysisTrend,
                        {
                          color: category.trend.startsWith('+') ? '#EF4444' : theme.colors.secondary,
                        },
                      ]}
                    >
                      {category.trend}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryAnalysisBar}>
                  <View
                    style={[
                      styles.categoryAnalysisBarFill,
                      { width: `${category.percentage}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
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
    },
    headerSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    spacer: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    restrictedContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    restrictedTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    restrictedText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      alignItems: 'center',
    },
    statIcon: {
      marginBottom: 8,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '800',
    },
    insightCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
    },
    insightIcon: {
      marginRight: 12,
    },
    insightContent: {
      flex: 1,
    },
    insightLabel: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    insightValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    memberBreakdownCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    memberBreakdownInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    memberBreakdownName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    memberBreakdownStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    memberBreakdownStat: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    memberBreakdownSeparator: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginHorizontal: 8,
    },
    memberBreakdownProgress: {
      height: 6,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    memberBreakdownProgressFill: {
      height: '100%',
      borderRadius: 3,
    },
    categoryAnalysisCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    categoryAnalysisHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    categoryAnalysisLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryAnalysisIcon: {
      marginRight: 12,
    },
    categoryAnalysisInfo: {
      flex: 1,
    },
    categoryAnalysisName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    categoryAnalysisAmount: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    categoryAnalysisRight: {
      alignItems: 'flex-end',
    },
    categoryAnalysisPercent: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    categoryAnalysisTrend: {
      fontSize: 12,
      fontWeight: '700',
    },
    categoryAnalysisBar: {
      height: 4,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      borderRadius: 2,
      overflow: 'hidden',
    },
    categoryAnalysisBarFill: {
      height: '100%',
      backgroundColor: theme.colors.secondary,
      borderRadius: 2,
    },
  });
