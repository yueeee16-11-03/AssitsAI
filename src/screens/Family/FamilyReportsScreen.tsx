import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyReports } from '../../hooks/useFamilyReports';
import { useFamilyStore } from '../../store/familyStore';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, TYPOGRAPHY } from '../../constants/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyReports'>;
type TabType = 'overview' | 'trend' | 'category' | 'member';

export default function FamilyReportsScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const insets = useSafeAreaInsets();
  const { currentFamily } = useFamilyStore();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Sử dụng custom hook
  const {
    monthlyStats,
    trends,
    categoryBreakdown,
    memberReports,
    loading,
    error,
    fetchMonthlyStats,
    fetchTrends,
    fetchCategoryBreakdown,
    fetchMemberReports,
    refreshAll,
  } = useFamilyReports(currentFamily?.id || null);

  // Animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Fetch data when month/year changes
  useEffect(() => {
    if (currentFamily?.id) {
      fetchMonthlyStats(selectedMonth, selectedYear);
      fetchCategoryBreakdown(selectedMonth, selectedYear);
      fetchMemberReports(selectedMonth, selectedYear);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear, currentFamily?.id]);

  // Fetch trends on mount
  useEffect(() => {
    if (currentFamily?.id) {
      fetchTrends(6);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFamily?.id]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return `${Math.round(amount)}`;
  };

  const formatFullCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Month navigation
  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    const now = new Date();
    const isCurrentMonth =
      selectedMonth === now.getMonth() + 1 && selectedYear === now.getFullYear();

    if (!isCurrentMonth) {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    }
  };

  // Tab change handler
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Export report handler
  const handleExportReport = async () => {
    try {
      if (!monthlyStats) {
        Alert.alert('Thông báo', 'Chưa có dữ liệu để xuất báo cáo');
        return;
      }

      const reportText = `
📊 BÁO CÁO TÀI CHÍNH GIA ĐÌNH
${getMonthName(selectedMonth)} ${selectedYear}
━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 TỔNG QUAN
• Thu nhập: ${formatFullCurrency(monthlyStats.totalIncome)}
• Chi tiêu: ${formatFullCurrency(monthlyStats.totalExpense)}
• Tiết kiệm: ${formatFullCurrency(monthlyStats.totalSaving)}
• Tỷ lệ tiết kiệm: ${monthlyStats.savingRate.toFixed(1)}%
• Số giao dịch: ${monthlyStats.transactionCount}
• Trung bình/ngày: ${formatFullCurrency(monthlyStats.averageDaily)}

📈 CHI TIÊU THEO DANH MỤC
${categoryBreakdown
  .filter(c => c.type === 'expense')
  .slice(0, 5)
  .map((cat, idx) => `${idx + 1}. ${cat.categoryName}: ${formatFullCurrency(cat.total)} (${cat.percentage}%)`)
  .join('\n')}

👥 THÀNH VIÊN
${memberReports
  .map(m => `• ${m.userName}: Thu ${formatCurrency(m.totalIncome)} - Chi ${formatCurrency(m.totalExpense)}`)
  .join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━
Xuất báo cáo từ Assist App
      `;

      await Share.share({
        message: reportText,
        title: `Báo cáo tài chính ${getMonthName(selectedMonth)} ${selectedYear}`,
      });
    } catch (exportError) {
      console.error('Export error:', exportError);
      Alert.alert('Lỗi', 'Không thể xuất báo cáo. Vui lòng thử lại.');
    }
  };

  // Get month name
  const getMonthName = (month: number): string => {
    const months = [
      'Tháng 1',
      'Tháng 2',
      'Tháng 3',
      'Tháng 4',
      'Tháng 5',
      'Tháng 6',
      'Tháng 7',
      'Tháng 8',
      'Tháng 9',
      'Tháng 10',
      'Tháng 11',
      'Tháng 12',
    ];
    return months[month - 1] || '';
  };

  // Handle category card press
  const handleCategoryPress = (categoryName: string, categoryType: 'income' | 'expense') => {
    Alert.alert(
      categoryName,
      `Xem chi tiết giao dịch của danh mục này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xem chi tiết',
          onPress: () => {
            // TODO: Navigate to category details screen
            console.log('Navigate to category:', categoryName, categoryType);
          },
        },
      ]
    );
  };

  // Handle member card press
  const handleMemberPress = (memberId: string, memberName: string) => {
    Alert.alert(
      memberName,
      `Xem chi tiết giao dịch của thành viên này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xem chi tiết',
          onPress: () => {
            // TODO: Navigate to member transaction details
            console.log('Navigate to member:', memberId, memberName);
          },
        },
      ]
    );
  };

  // Render overview tab
  const renderOverview = () => {
    if (!monthlyStats) return null;

    const savingColor =
      monthlyStats.totalSaving >= 0 ? COLORS.success.main : COLORS.error.main;
    const savingIcon =
      monthlyStats.totalSaving >= 0 ? 'trending-up' : 'trending-down';

    return (
      <Animated.View
        style={[
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Hero Card */}
        <LinearGradient
          colors={[...COLORS.primary.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <Icon name="wallet" size={32} color={COLORS.white} />
            <Text style={styles.heroTitle}>Tổng quan tài chính</Text>
          </View>

          <View style={styles.heroMainStat}>
            <Text style={styles.heroMainLabel}>Số dư tháng này</Text>
            <Text style={styles.heroMainValue}>
              {formatFullCurrency(monthlyStats.totalSaving)}
            </Text>
            <View style={styles.heroBadge}>
              <Icon name={savingIcon} size={16} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>
                {monthlyStats.savingRate.toFixed(1)}% tỷ lệ tiết kiệm
              </Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Icon name="arrow-down-circle" size={20} color="#FFFFFF" />
              <Text style={styles.heroStatLabel}>Thu nhập</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(monthlyStats.totalIncome)}
              </Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <Icon name="arrow-up-circle" size={20} color="#FFFFFF" />
              <Text style={styles.heroStatLabel}>Chi tiêu</Text>
              <Text style={styles.heroStatValue}>
                {formatCurrency(monthlyStats.totalExpense)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats Grid */}
        <View style={styles.quickStatsGrid}>
          <View style={styles.quickStatCard}>
            <View
              style={[styles.quickStatIcon, styles.quickStatIconRed]}
            >
              <Icon name="receipt" size={24} color={COLORS.category.food} />
            </View>
            <Text style={styles.quickStatValue}>
              {monthlyStats.transactionCount}
            </Text>
            <Text style={styles.quickStatLabel}>Giao dịch</Text>
          </View>

          <View style={styles.quickStatCard}>
            <View
              style={[styles.quickStatIcon, styles.quickStatIconTeal]}
            >
              <Icon name="calendar-today" size={24} color={COLORS.category.transport} />
            </View>
            <Text style={styles.quickStatValue}>
              {formatCurrency(monthlyStats.averageDaily)}
            </Text>
            <Text style={styles.quickStatLabel}>TB/Ngày</Text>
          </View>

          <View style={styles.quickStatCard}>
            <View
              style={[
                styles.quickStatIcon,
                { backgroundColor: savingColor + '20' },
              ]}
            >
              <Icon name="piggy-bank" size={24} color={savingColor} />
            </View>
            <Text style={[styles.quickStatValue, { color: savingColor }]}>
              {formatCurrency(Math.abs(monthlyStats.totalSaving))}
            </Text>
            <Text style={styles.quickStatLabel}>
              {monthlyStats.totalSaving >= 0 ? 'Tiết kiệm' : 'Thâm hụt'}
            </Text>
          </View>
        </View>

        {/* Top Categories Preview */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh mục chi tiêu hàng đầu</Text>
              <Pressable onPress={() => handleTabChange('category')}>
                <Text style={styles.sectionLink}>Xem tất cả</Text>
              </Pressable>
            </View>
            {categoryBreakdown
              .filter((c) => c.type === 'expense')
              .slice(0, 3)
              .map((category, index) => (
                <View key={index} style={styles.categoryPreviewCard}>
                  <View
                    style={[
                      styles.categoryPreviewIcon,
                      { backgroundColor: category.color + '20' },
                    ]}
                  >
                    <Icon name={category.icon} size={20} color={category.color} />
                  </View>
                  <View style={styles.categoryPreviewInfo}>
                    <Text style={styles.categoryPreviewName}>
                      {category.categoryName}
                    </Text>
                    <View style={styles.categoryPreviewBar}>
                      <View
                        style={[
                          styles.categoryPreviewProgress,
                          {
                            backgroundColor: category.color,
                            width: `${category.percentage}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.categoryPreviewStats}>
                    <Text style={styles.categoryPreviewAmount}>
                      {formatCurrency(category.total)}
                    </Text>
                    <Text style={styles.categoryPreviewPercent}>
                      {category.percentage}%
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        )}
      </Animated.View>
    );
  };

  // Render trend tab
  const renderTrend = () => {
    if (trends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="chart-line" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyStateText}>Chưa có dữ liệu xu hướng</Text>
        </View>
      );
    }

    const maxValue = Math.max(
      ...trends.map((t) => Math.max(t.totalIncome, t.totalExpense))
    );

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.trendChart}>
          <Text style={styles.chartTitle}>Xu hướng 6 tháng gần đây</Text>

          {/* Chart */}
          <View style={styles.chartContainer}>
            {trends.map((trend, index) => {
              const incomeHeight = (trend.totalIncome / maxValue) * 150;
              const expenseHeight = (trend.totalExpense / maxValue) * 150;

              return (
                <View key={index} style={styles.chartBar}>
                  <View style={styles.chartBars}>
                    <View
                      style={[
                        styles.chartBarIncome,
                        { height: incomeHeight || 2 },
                      ]}
                    />
                    <View
                      style={[
                        styles.chartBarExpense,
                        { height: expenseHeight || 2 },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{trend.month}</Text>
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotIncome]} />
              <Text style={styles.legendText}>Thu nhập</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotExpense]} />
              <Text style={styles.legendText}>Chi tiêu</Text>
            </View>
          </View>
        </View>

        {/* Trend Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết từng tháng</Text>
          {trends.map((trend, index) => (
            <View key={index} style={styles.trendCard}>
              <View style={styles.trendCardHeader}>
                <Text style={styles.trendCardMonth}>{trend.monthYear}</Text>
                <View
                  style={[
                    styles.trendCardBadge,
                    trend.savingRate >= 0
                      ? styles.trendCardBadgePositive
                      : styles.trendCardBadgeNegative,
                  ]}
                >
                  <Text
                    style={[
                      styles.trendCardBadgeText,
                      trend.savingRate >= 0
                        ? styles.trendCardBadgeTextPositive
                        : styles.trendCardBadgeTextNegative,
                    ]}
                  >
                    {trend.savingRate >= 0 ? '+' : ''}
                    {trend.savingRate.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View style={styles.trendCardStats}>
                <View style={styles.trendCardStat}>
                  <Icon name="arrow-down" size={16} color={COLORS.success.main} />
                  <Text style={styles.trendCardStatValue}>
                    {formatCurrency(trend.totalIncome)}
                  </Text>
                </View>
                <View style={styles.trendCardStat}>
                  <Icon name="arrow-up" size={16} color={COLORS.error.main} />
                  <Text style={styles.trendCardStatValue}>
                    {formatCurrency(trend.totalExpense)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Render category tab
  const renderCategory = () => {
    if (categoryBreakdown.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon name="chart-pie" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyStateText}>Chưa có dữ liệu danh mục</Text>
        </View>
      );
    }

    const expenses = categoryBreakdown.filter((c) => c.type === 'expense');
    const incomes = categoryBreakdown.filter((c) => c.type === 'income');

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Expenses */}
        {expenses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
            {expenses.map((category, index) => (
              <Pressable 
                key={index} 
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.categoryName, 'expense')}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category.color + '20' },
                  ]}
                >
                  <Icon name={category.icon} size={28} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.categoryName}</Text>
                  <Text style={styles.categoryCount}>
                    {category.count} giao dịch
                  </Text>
                  <View style={styles.categoryBar}>
                    <View
                      style={[
                        styles.categoryProgress,
                        {
                          backgroundColor: category.color,
                          width: `${category.percentage}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryAmount}>
                    {formatCurrency(category.total)}
                  </Text>
                  <Text
                    style={[
                      styles.categoryPercent,
                      { color: category.color },
                    ]}
                  >
                    {category.percentage}%
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Incomes */}
        {incomes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thu nhập theo nguồn</Text>
            {incomes.map((category, index) => (
              <Pressable 
                key={index} 
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.categoryName, 'income')}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: category.color + '20' },
                  ]}
                >
                  <Icon name={category.icon} size={28} color={category.color} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.categoryName}</Text>
                  <Text style={styles.categoryCount}>
                    {category.count} giao dịch
                  </Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={[styles.categoryAmount, styles.categoryAmountIncome]}>
                    {formatCurrency(category.total)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  // Render member tab
  const renderMember = () => {
    if (memberReports.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Icon
            name="account-multiple"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.emptyStateText}>Chưa có dữ liệu thành viên</Text>
        </View>
      );
    }

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Báo cáo thành viên</Text>
          {memberReports.map((member, index) => {
            const netColor = member.netBalance >= 0 ? COLORS.success.main : COLORS.error.main;
            return (
              <Pressable 
                key={index} 
                style={styles.memberCard}
                onPress={() => handleMemberPress(member.userId, member.userName)}
              >
                <View style={styles.memberHeader}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {member.userName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberHeaderInfo}>
                    <Text style={styles.memberName}>{member.userName}</Text>
                    {member.userEmail && (
                      <Text style={styles.memberEmail}>{member.userEmail}</Text>
                    )}
                  </View>
                  <View style={[styles.memberBadge, { backgroundColor: netColor + '20' }]}>
                    <Icon
                      name={member.netBalance >= 0 ? 'trending-up' : 'trending-down'}
                      size={16}
                      color={netColor}
                    />
                  </View>
                </View>

                <View style={styles.memberStats}>
                  <View style={styles.memberStat}>
                    <Icon name="arrow-down-circle" size={18} color={COLORS.success.main} />
                    <View>
                      <Text style={styles.memberStatLabel}>Thu nhập</Text>
                      <Text style={[styles.memberStatValue, styles.memberStatValueIncome]}>
                        {formatCurrency(member.totalIncome)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.memberStat}>
                    <Icon name="arrow-up-circle" size={18} color={COLORS.error.main} />
                    <View>
                      <Text style={styles.memberStatLabel}>Chi tiêu</Text>
                      <Text style={[styles.memberStatValue, styles.memberStatValueExpense]}>
                        {formatCurrency(member.totalExpense)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.memberStat}>
                    <Icon name="scale-balance" size={18} color={netColor} />
                    <View>
                      <Text style={styles.memberStatLabel}>Cân bằng</Text>
                      <Text style={[styles.memberStatValue, { color: netColor }]}>
                        {formatCurrency(Math.abs(member.netBalance))}
                      </Text>
                    </View>
                  </View>
                </View>

                {member.topCategories.length > 0 && (
                  <View style={styles.memberCategories}>
                    <Text style={styles.memberCategoriesTitle}>
                      Danh mục chi tiêu hàng đầu
                    </Text>
                    {member.topCategories.map((cat, catIndex) => (
                      <View key={catIndex} style={styles.memberCategoryItem}>
                        <Icon name={cat.icon} size={16} color={cat.color} />
                        <Text style={styles.memberCategoryName}>
                          {cat.categoryName}
                        </Text>
                        <Text style={styles.memberCategoryAmount}>
                          {formatCurrency(cat.total)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Báo cáo gia đình</Text>
        <Pressable
          style={styles.exportButton}
          onPress={handleExportReport}
        >
          <Icon name="share-variant" size={24} color={theme.colors.primary} />
        </Pressable>
      </View>

      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <Pressable
          style={styles.monthArrow}
          onPress={handlePreviousMonth}
        >
          <Icon name="chevron-left" size={24} color={theme.colors.primary} />
        </Pressable>
        <Pressable
          style={styles.monthDisplay}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.monthText}>
            {getMonthName(selectedMonth)} {selectedYear}
          </Text>
          <Icon name="calendar" size={20} color={theme.colors.primary} />
        </Pressable>
        <Pressable
          style={[
            styles.monthArrow,
            selectedMonth === new Date().getMonth() + 1 &&
              selectedYear === new Date().getFullYear() &&
              styles.monthArrowDisabled,
          ]}
          onPress={handleNextMonth}
        >
          <Icon
            name="chevron-right"
            size={24}
            color={
              selectedMonth === new Date().getMonth() + 1 &&
              selectedYear === new Date().getFullYear()
                ? theme.colors.onSurfaceVariant
                : theme.colors.primary
            }
          />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => handleTabChange('overview')}
        >
          <Icon
            name="view-dashboard"
            size={22}
            color={
              activeTab === 'overview'
                ? COLORS.white
                : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'overview' && styles.tabTextActive,
            ]}
          >
            Tổng quan
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'trend' && styles.tabActive]}
          onPress={() => handleTabChange('trend')}
        >
          <Icon
            name="chart-line"
            size={22}
            color={
              activeTab === 'trend'
                ? COLORS.white
                : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'trend' && styles.tabTextActive,
            ]}
          >
            Xu hướng
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'category' && styles.tabActive]}
          onPress={() => handleTabChange('category')}
        >
          <Icon
            name="chart-pie"
            size={22}
            color={
              activeTab === 'category'
                ? COLORS.white
                : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'category' && styles.tabTextActive,
            ]}
          >
            Danh mục
          </Text>
        </Pressable>

        <Pressable
          style={[styles.tab, activeTab === 'member' && styles.tabActive]}
          onPress={() => handleTabChange('member')}
        >
          <Icon
            name="account-group"
            size={22}
            color={
              activeTab === 'member'
                ? COLORS.white
                : theme.colors.onSurfaceVariant
            }
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'member' && styles.tabTextActive,
            ]}
          >
            Thành viên
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshAll}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Loading State */}
        {loading && !monthlyStats && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}
            >
              Đang tải báo cáo...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={64} color={COLORS.error.main} />
            <Text
              style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}
            >
              {error}
            </Text>
            <Pressable
              style={[
                styles.retryButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={refreshAll}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </Pressable>
          </View>
        )}

        {/* Tab Content */}
        {!loading && !error && (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'trend' && renderTrend()}
            {activeTab === 'category' && renderCategory()}
            {activeTab === 'member' && renderMember()}
          </>
        )}
      </ScrollView>

      {/* Month/Year Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable 
            style={styles.datePickerModal}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tháng & năm</Text>
              <Pressable 
                style={styles.modalCloseButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Icon name="close" size={24} color={theme.colors.onSurface} />
              </Pressable>
            </View>

            {/* Year Selector */}
            <View style={styles.yearSelector}>
              <Text style={styles.pickerLabel}>Năm</Text>
              <View style={styles.yearPicker}>
                <Pressable
                  style={styles.yearButton}
                  onPress={() => setSelectedYear(selectedYear - 1)}
                >
                  <Icon name="chevron-left" size={28} color={theme.colors.primary} />
                </Pressable>
                <Text style={styles.yearText}>{selectedYear}</Text>
                <Pressable
                  style={styles.yearButton}
                  onPress={() => {
                    const currentYear = new Date().getFullYear();
                    if (selectedYear < currentYear) {
                      setSelectedYear(selectedYear + 1);
                    }
                  }}
                  disabled={selectedYear >= new Date().getFullYear()}
                >
                  <Icon 
                    name="chevron-right" 
                    size={28} 
                    color={selectedYear >= new Date().getFullYear() 
                      ? theme.colors.onSurfaceVariant 
                      : theme.colors.primary
                    } 
                  />
                </Pressable>
              </View>
            </View>

            {/* Month Grid */}
            <View style={styles.monthGrid}>
              <Text style={styles.pickerLabel}>Tháng</Text>
              <View style={styles.monthsContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                  const isCurrentMonth = month === new Date().getMonth() + 1 && 
                                        selectedYear === new Date().getFullYear();
                  const isFutureMonth = selectedYear === new Date().getFullYear() && 
                                       month > new Date().getMonth() + 1;
                  const isSelected = month === selectedMonth;

                  return (
                    <Pressable
                      key={month}
                      style={[
                        styles.monthButton,
                        isSelected && styles.monthButtonSelected,
                        isFutureMonth && styles.monthButtonDisabled,
                      ]}
                      onPress={() => {
                        if (!isFutureMonth) {
                          setSelectedMonth(month);
                        }
                      }}
                      disabled={isFutureMonth}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          isSelected && styles.monthButtonTextSelected,
                          isFutureMonth && styles.monthButtonTextDisabled,
                        ]}
                      >
                        T{month}
                      </Text>
                      {isCurrentMonth && (
                        <View style={styles.currentMonthDot} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonTextConfirm}>Xác nhận</Text>
              </Pressable>
            </View>
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
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? COLORS.transparent.white[5]
        : COLORS.transparent.black[5],
      backgroundColor: theme.colors.surface,
      elevation: 2,
      shadowColor: COLORS.neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.dark
        ? COLORS.transparent.white[8]
        : COLORS.primary.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: TYPOGRAPHY.fontSize['2xl'],
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
      color: theme.colors.primary,
      letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
    exportButton: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.dark
        ? COLORS.transparent.white[8]
        : COLORS.primary.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? COLORS.transparent.white[5]
        : COLORS.transparent.black[5],
    },
    monthArrow: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark
        ? COLORS.transparent.white[5]
        : COLORS.transparent.black[3],
    },
    monthArrowDisabled: {
      opacity: 0.3,
    },
    monthDisplay: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      backgroundColor: theme.dark
        ? COLORS.transparent.white[5]
        : COLORS.primary.background,
    },
    monthText: {
      fontSize: TYPOGRAPHY.fontSize.lg,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: theme.colors.primary,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 10,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? COLORS.transparent.white[5]
        : COLORS.transparent.black[5],
    },
    tab: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 14,
      marginHorizontal: 1,
      backgroundColor: 'transparent',
    },
    tabActive: {
      backgroundColor: theme.dark
        ? COLORS.primary.dark
        : COLORS.primary.main,
      borderWidth: 0,
      elevation: 3,
      shadowColor: COLORS.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    tabText: {
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    tabTextActive: {
      color: COLORS.white,
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    // Hero Card
    heroCard: {
      borderRadius: 24,
      padding: 28,
      marginBottom: 24,
      elevation: 4,
      shadowColor: COLORS.neutral[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    heroTitle: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
      color: COLORS.white,
      letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
    heroMainStat: {
      alignItems: 'center',
      marginBottom: 24,
    },
    heroMainLabel: {
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.transparent.white[90],
      marginBottom: 8,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    heroMainValue: {
      fontSize: TYPOGRAPHY.fontSize['5xl'],
      fontWeight: TYPOGRAPHY.fontWeight.black,
      color: COLORS.white,
      marginBottom: 12,
      letterSpacing: TYPOGRAPHY.letterSpacing.wider,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: COLORS.transparent.white[20],
    },
    heroBadgeText: {
      fontSize: TYPOGRAPHY.fontSize.sm + 1,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: COLORS.white,
    },
    heroStats: {
      flexDirection: 'row',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: COLORS.transparent.white[20],
    },
    heroStatItem: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    heroStatDivider: {
      width: 1,
      backgroundColor: COLORS.transparent.white[20],
      marginHorizontal: 12,
    },
    heroStatLabel: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      color: COLORS.transparent.white[85],
      fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    heroStatValue: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
      color: COLORS.white,
    },
    // Quick Stats Grid
    quickStatsGrid: {
      flexDirection: 'row',
      gap: 14,
      marginBottom: 24,
    },
    quickStatCard: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 18,
      alignItems: 'center',
      elevation: 2,
      shadowColor: COLORS.neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: theme.dark
        ? COLORS.transparent.white[8]
        : COLORS.transparent.black[5],
    },
    quickStatIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    quickStatIconRed: {
      backgroundColor: COLORS.category.food + '20',
    },
    quickStatIconTeal: {
      backgroundColor: COLORS.category.transport + '20',
    },
    quickStatValue: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
      color: theme.colors.primary,
      marginBottom: 4,
    },
    quickStatLabel: {
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: theme.colors.onSurfaceVariant,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      textAlign: 'center',
    },
    // Section
    section: {
      marginBottom: 24,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
      color: theme.colors.primary,
      letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
    sectionLink: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: theme.colors.secondary,
    },
    // Category Preview
    categoryPreviewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
    },
    categoryPreviewIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    categoryPreviewInfo: {
      flex: 1,
      marginRight: 12,
    },
    categoryPreviewName: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 6,
    },
    categoryPreviewBar: {
      height: 6,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    categoryPreviewProgress: {
      height: '100%',
      borderRadius: 3,
    },
    categoryPreviewStats: {
      alignItems: 'flex-end',
    },
    categoryPreviewAmount: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    categoryPreviewPercent: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    // Trend Chart
    trendChart: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 20,
    },
    chartContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 180,
      paddingHorizontal: 10,
      marginBottom: 20,
    },
    chartBar: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    chartBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 4,
      marginBottom: 8,
    },
    chartBarIncome: {
      width: 8,
      backgroundColor: COLORS.success.main,
      borderRadius: 4,
      minHeight: 2,
    },
    chartBarExpense: {
      width: 8,
      backgroundColor: COLORS.error.main,
      borderRadius: 4,
      minHeight: 2,
    },
    chartLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 32,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendDotIncome: {
      backgroundColor: COLORS.success.main,
    },
    legendDotExpense: {
      backgroundColor: COLORS.error.main,
    },
    legendText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    // Trend Card
    trendCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
    },
    trendCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    trendCardMonth: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    trendCardBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    trendCardBadgePositive: {
      backgroundColor: COLORS.success.background,
    },
    trendCardBadgeNegative: {
      backgroundColor: COLORS.error.background,
    },
    trendCardBadgeText: {
      fontSize: TYPOGRAPHY.fontSize.sm + 1,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    trendCardBadgeTextPositive: {
      color: COLORS.success.main,
    },
    trendCardBadgeTextNegative: {
      color: COLORS.error.main,
    },
    trendCardStats: {
      flexDirection: 'row',
      gap: 20,
    },
    trendCardStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    trendCardStatValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    // Category Card
    categoryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
    },
    categoryIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    categoryInfo: {
      flex: 1,
      marginRight: 12,
    },
    categoryName: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    categoryCount: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
      fontWeight: '500',
    },
    categoryBar: {
      height: 6,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
      borderRadius: 3,
      overflow: 'hidden',
    },
    categoryProgress: {
      height: '100%',
      borderRadius: 3,
    },
    categoryStats: {
      alignItems: 'flex-end',
    },
    categoryAmount: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    categoryAmountIncome: {
      color: COLORS.success.main,
    },
    categoryPercent: {
      fontSize: 14,
      fontWeight: '700',
    },
    // Member Card
    memberCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    memberHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
      paddingBottom: 18,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
    },
    memberAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    memberAvatarText: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    memberHeaderInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    memberEmail: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    memberBadge: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    memberStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    memberStatLabel: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    memberStatValue: {
      fontSize: 14,
      fontWeight: '800',
    },
    memberStatValueIncome: {
      color: COLORS.success.main,
    },
    memberStatValueExpense: {
      color: COLORS.error.main,
    },
    memberCategories: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.05)',
    },
    memberCategoriesTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
    },
    memberCategoryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      gap: 10,
    },
    memberCategoryName: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    memberCategoryAmount: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    // States
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    loadingText: {
      fontSize: 15,
      marginTop: 16,
      fontWeight: '600',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 15,
      marginTop: 16,
      textAlign: 'center',
      fontWeight: '600',
    },
    retryButton: {
      marginTop: 24,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 15,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 80,
    },
    emptyStateText: {
      fontSize: 15,
      marginTop: 16,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    // Date Picker Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    datePickerModal: {
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      padding: 24,
      width: '100%',
      maxWidth: 400,
      elevation: 8,
      shadowColor: COLORS.neutral[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    modalTitle: {
      fontSize: TYPOGRAPHY.fontSize['2xl'],
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
      color: theme.colors.primary,
    },
    modalCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark
        ? COLORS.transparent.white[8]
        : COLORS.transparent.black[5],
    },
    pickerLabel: {
      fontSize: TYPOGRAPHY.fontSize.sm,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: TYPOGRAPHY.letterSpacing.wide,
    },
    yearSelector: {
      marginBottom: 24,
    },
    yearPicker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.dark
        ? COLORS.transparent.white[5]
        : COLORS.transparent.black[3],
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    yearButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark
        ? COLORS.transparent.white[8]
        : COLORS.white,
    },
    yearText: {
      fontSize: TYPOGRAPHY.fontSize['3xl'],
      fontWeight: TYPOGRAPHY.fontWeight.black,
      color: theme.colors.primary,
    },
    monthGrid: {
      marginBottom: 24,
    },
    monthsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    monthButton: {
      width: '22%',
      aspectRatio: 1.5,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? COLORS.transparent.white[5]
        : COLORS.transparent.black[3],
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    monthButtonSelected: {
      backgroundColor: theme.colors.primary,
      elevation: 3,
      shadowColor: COLORS.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    monthButtonDisabled: {
      opacity: 0.3,
    },
    monthButtonText: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    monthButtonTextSelected: {
      color: COLORS.white,
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
    },
    monthButtonTextDisabled: {
      color: theme.colors.onSurfaceVariant,
    },
    currentMonthDot: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: COLORS.success.main,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonCancel: {
      backgroundColor: theme.dark
        ? COLORS.transparent.white[8]
        : COLORS.transparent.black[5],
    },
    modalButtonConfirm: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowColor: COLORS.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    modalButtonTextCancel: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: TYPOGRAPHY.fontWeight.bold,
      color: theme.colors.onSurface,
    },
    modalButtonTextConfirm: {
      fontSize: TYPOGRAPHY.fontSize.base,
      fontWeight: TYPOGRAPHY.fontWeight.extrabold,
      color: COLORS.white,
    },
  });
