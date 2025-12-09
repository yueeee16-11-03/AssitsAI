import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTransactionStore } from "../../store/transactionStore";
import { useRecurringFinancialData } from "../../hooks/useRecurringFinancialData";
import useIncomeChartData from "../../hooks/useIncomeChartData";
import useExpenseCategories from "../../hooks/useExpenseCategories";
import { useRecurringTransactionStore } from "../../store/recurringTransactionStore";
import { PieChart, BarChart } from "react-native-gifted-charts";
import LinearGradient from "react-native-linear-gradient";

type Props = NativeStackScreenProps<RootStackParamList, "FinanceDashboard">;

const ChartCenterLabel: React.FC<{ activeItem: any; totalExpense: number }> = ({ activeItem, totalExpense }) => {
  const centerLabel = activeItem ? activeItem.name : 'Tổng Chi tiêu';
  const centerValue = activeItem ? `${activeItem.percent}%` : `${(totalExpense / 1000000).toFixed(1)}M`;
  const centerColor = activeItem ? activeItem.color : '#111827';
  return (
    <View style={styles.centerLabelWrap}>
      <Text style={styles.centerLabelSubtitle}>{centerLabel}</Text>
      <Text style={[styles.centerLabelValue, { color: centerColor }]}>{centerValue}</Text>
    </View>
  );
};

export default function FinanceDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [activeExpenseIndex, setActiveExpenseIndex] = useState<number | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const selectionAnim = useRef(new Animated.Value(1)).current;
  const toggleExpenseIndex = (index: number) => {
    const newIndex = activeExpenseIndex === index ? null : index;
    setActiveExpenseIndex(newIndex);
    // Pulse animation for selection feedback
    Animated.sequence([
      Animated.timing(selectionAnim, { toValue: 1.06, duration: 120, useNativeDriver: true }),
      Animated.timing(selectionAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };
  
  // ⚠️ CRITICAL: Subscribe to store - này là key để auto-update
  // Bất cứ lúc nào state.transactions thay đổi → component re-render
  const transactions = useTransactionStore((state) => state.transactions);
  const fetchTransactions = useTransactionStore((state) => state.fetchTransactions);
  const transactionsLoading = useTransactionStore((state) => state.isLoading);

  // ⭐ RECURRING: Subscribe to recurring transaction store
  const recurringTransactions = useRecurringTransactionStore((state: any) => state.recurringTransactions);
  const fetchRecurringTransactions = useRecurringTransactionStore((state: any) => state.fetchRecurringTransactions);

  // ⭐ Recent transactions derived from store (most recent first)
  // INCLUDE BOTH: regular transactions + recurring transactions
  const allTransactionsForRecent = React.useMemo(() => {
    const combined = [
      ...(transactions || []),
      ...(recurringTransactions || []).map((rt: any) => ({
        ...rt,
        // Prefer lastPaid for sorting (recent occurrence); fallback to createdAt, then nextDue
        date: rt.lastPaid || rt.createdAt || rt.nextDue,
        isRecurring: true, // Mark as recurring
      })),
    ];
    
    // Sort by date (newest first)
    return combined.sort((a: any, b: any) => {
      const dateA = a.date?.toDate?.() || new Date(a.date || a.createdAt);
      const dateB = b.date?.toDate?.() || new Date(b.date || b.createdAt);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    }).slice(0, 5);
  }, [transactions, recurringTransactions]);

  const recentTransactions = allTransactionsForRecent;

  // Load transactions helper (declare before useFocusEffect to avoid TDZ error)
  const loadRecentTransactions = React.useCallback(async () => {
    try {
      console.log('📊 [DASHBOARD] Fetching fresh transactions...');
      await fetchTransactions();
      console.log('✅ [DASHBOARD] Fresh transactions fetched');
      
      // ⭐ Also fetch recurring transactions
      console.log('📊 [DASHBOARD] Fetching fresh recurring transactions...');
      await fetchRecurringTransactions();
      console.log('✅ [DASHBOARD] Fresh recurring transactions fetched');
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  }, [fetchTransactions, fetchRecurringTransactions]);

  // ⚠️ IMPORTANT: Fetch fresh data khi screen focus
  // Đây đảm bảo nếu có thay đổi từ tab khác → fetch fresh
  useFocusEffect(
    React.useCallback(() => {
      console.log('👀 [DASHBOARD] Screen focused - fetching fresh data');
      loadRecentTransactions();
    }, [loadRecentTransactions])
  );

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // ⭐ INITIALIZE: Fetch recurring transactions on mount
  React.useEffect(() => {
    const initializeRecurringTransactions = async () => {
      try {
        console.log('📊 [DASHBOARD] Initializing recurring transactions...');
        const initAction = (useRecurringTransactionStore.getState() as any).initialize;
        await initAction();
        console.log('✅ [DASHBOARD] Recurring transactions initialized');
      } catch (error) {
        console.error('❌ [DASHBOARD] Error initializing recurring transactions:', error);
      }
    };

    initializeRecurringTransactions();
  }, []);

  // ⚠️ AUTO-UPDATE: Mỗi khi transactions thay đổi (từ Store)
  // Component tự động re-render với dữ liệu mới
  React.useEffect(() => {
    console.log('📊 [DASHBOARD] Transactions updated from store. Count:', transactions.length);
    // recentTransactions sẽ được computed lại tự động
  }, [transactions]);

  // ⭐ AUTO-UPDATE: When recurring transactions change, log for debug
  React.useEffect(() => {
    console.log('🔄 [DASHBOARD] Recurring transactions updated from store. Count:', recurringTransactions.length);
    console.log('🔄 [DASHBOARD] Recurring transactions:', recurringTransactions);
    
    // 💡 This triggers useRecurringFinancialData to recalculate
    console.log('💹 [DASHBOARD] useRecurringFinancialData will recalculate automatically due to dependency');
  }, [recurringTransactions]);

  // 🎯 Sử dụng custom hook để tính toán dữ liệu tài chính ⭐ NOW WITH RECURRING TRANSACTIONS
  const financialData = useRecurringFinancialData(transactions, recurringTransactions, selectedPeriod);

  // Income chart data (last 6 months) — moved to hook for separation
  const incomeData = useIncomeChartData(transactions);

  // Convert income data to bar chart format with enhanced colors
  const barChartData = React.useMemo(() => {
    const colors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    return incomeData.map((item, idx) => ({
      value: item.value / 1000000, // Convert to millions for display
      label: item.month,
      frontColor: colors[idx % colors.length],
      labelWidth: 35,
    }));
  }, [incomeData]);

  // Expense categories computed from real transactions
  const expenseCategories = useExpenseCategories(transactions, selectedPeriod);

  const expensePieData = React.useMemo(() => {
    const filtered = expenseCategories.filter((c) => c.name !== "Ghi chú" && c.amount > 0);
    const total = filtered.reduce((s, c) => s + (c.amount || 0), 0);
    // Rainbow color palette for visual distinction
    const rainbowColors = [
      "#EF4444", "#F97316", "#F59E0B", "#10B981", "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899",
    ];
    return filtered.map((c, i) => {
      const color = rainbowColors[i % rainbowColors.length];
      return {
        ...c,
        value: c.amount,
        percent: total > 0 ? Math.round(((c.amount || 0) / total) * 100) : 0,
        color,
        text: `${total > 0 ? Math.round(((c.amount || 0) / total) * 100) : 0}%`, // percent inside donut
        amountText: `${((c.amount || 0) / 1000000).toFixed(1)}M`, // compact amount for visual layout
        amountVND: `${(c.amount || 0).toLocaleString('vi-VN')} VND`, // full amount for legend/accessibility
      };
    });
  }, [expenseCategories]);

  const totalIncomeValue = React.useMemo(() => {
    return incomeData.reduce((sum, item) => sum + item.value, 0);
  }, [incomeData]);

  // 🟢 Xóa hardcoded values, dùng financialData thay vào
  const totalIncome = financialData.totalIncome;
  const totalExpense = financialData.totalExpense;
  const balance = financialData.balance;
  const savingRate = financialData.savingRate;

  const activeItem = activeExpenseIndex !== null ? expensePieData[activeExpenseIndex] : null;
  const activeRef = React.useRef(activeItem);
  const totalRef = React.useRef(totalExpense);
  activeRef.current = activeItem;
  totalRef.current = totalExpense;
  const centerLabelRenderer = React.useCallback(() => <ChartCenterLabel activeItem={activeRef.current} totalExpense={totalRef.current} />, []);

  const getCategoryIcon = (categoryId: string) => {
    const map: { [key: string]: { name: string; color: string } } = {
      "1": { name: "food", color: "#EF4444" },
      "2": { name: "car", color: "#F97316" },
      "3": { name: "shopping", color: "#EC4899" },
      "4": { name: "gamepad-variant", color: "#8B5CF6" },
      "5": { name: "hospital-box", color: "#EF4444" },
      "6": { name: "book", color: "#3B82F6" },
      "7": { name: "home", color: "#10B981" },
      "8": { name: "dots-horizontal", color: "#6B7280" },
      "9": { name: "briefcase", color: "#10B981" },
      "10": { name: "gift", color: "#F59E0B" },
      "11": { name: "chart-line", color: "#10B981" },
      "12": { name: "cash", color: "#6366F1" },
    };
    return map[categoryId] || { name: 'wallet', color: '#6B7280' };
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerButton}>
        <TouchableOpacity
          style={styles.iconLeft}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitleCentered}>Tài chính</Text>
        <TouchableOpacity
          style={styles.iconRight}
          onPress={() => navigation.navigate("BudgetPlanner")}
        >
          <MaterialCommunityIcons name="chart-box" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Period Selector */}
          <View style={styles.modernPeriodContainer}>
            {(["day", "week", "month", "year"] as const).map((period, index) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.modernPeriodButton,
                  selectedPeriod === period && styles.modernPeriodButtonActive,
                  index === 0 && styles.modernPeriodButtonFirst,
                  index === 3 && styles.modernPeriodButtonLast,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.modernPeriodText,
                    selectedPeriod === period && styles.modernPeriodTextActive,
                  ]}
                >
                  {period === "day" ? "Ngày" : period === "week" ? "Tuần" : period === "month" ? "Tháng" : "Năm"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Balance Overview */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
            <Text style={styles.balanceAmount}>{balance.toLocaleString("vi-VN")} VND</Text>
            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <Text style={styles.statLabel}>Thu nhập</Text>
                <Text style={[styles.statValue, styles.incomeText]}>
                  +{(totalIncome / 1000000).toFixed(1)}M VND
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.balanceStat}>
                <Text style={styles.statLabel}>Chi tiêu</Text>
                <Text style={[styles.statValue, styles.expenseText]}>
                  -{(totalExpense / 1000000).toFixed(1)}M VND
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.balanceStat}>
                <Text style={styles.statLabel}>Tiết kiệm</Text>
                <Text style={[styles.statValue, styles.savingText]}>
                  {savingRate}%
                </Text>
              </View>
            </View>
          </View>

          {/* Income Chart */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeaderButton}
              onPress={() => navigation.navigate("AIInsight", undefined)}
            >
              <View style={[styles.sectionBadgeFull, styles.sectionBadgeBorder]}>
                <View style={styles.sectionBadgeLeft}>
                  <MaterialCommunityIcons name="chart-line" size={18} color="#6B7280" />
                  <Text style={styles.sectionBadgeText}>Thu nhập 6 tháng</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.chartContainer}
              onPress={() => navigation.navigate("AIInsight", undefined)}
            >
              <LinearGradient
                colors={["rgba(99, 102, 241, 0.05)", "rgba(16, 185, 129, 0.05)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chartGradientBg}
              >
                <View style={styles.barChartContainer}>
                  <View style={styles.barChartTopInfo}>
                    <Text style={styles.barChartLabel}>Thu nhập</Text>
                    <Text style={styles.barChartTotal}>{(totalIncomeValue / 1000000).toFixed(1)}M</Text>
                  </View>
                  <BarChart
                    data={barChartData}
                    barWidth={26}
                    spacing={14}
                    xAxisColor="#E5E7EB"
                    yAxisColor="#E5E7EB"
                    yAxisLabelWidth={50}
                    height={200}
                    disableScroll
                    cappedBars
                    barBorderRadius={6}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Expense Breakdown - Pie Chart */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeaderButton}
              onPress={() => navigation.navigate("AIInsight", undefined)}
            >
              <View style={[styles.sectionBadgeFull, styles.sectionBadgeBorder]}>
                <View style={styles.sectionBadgeLeft}>
                  <MaterialCommunityIcons name="wallet" size={18} color="#6B7280" />
                  <Text style={styles.sectionBadgeText}>Chi tiêu theo danh mục</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.chartContainer}
              onPress={() => navigation.navigate("AIInsight", undefined)}
            >
              <LinearGradient
                colors={["rgba(239, 68, 68, 0.02)", "rgba(168, 85, 247, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.chartGradientBgCompact}
              >
                <View style={styles.expenseChartColumn}>
                  <View style={[styles.chartArea, styles.chartAreaPieSize]} accessible accessibilityRole="image" accessibilityLabel={`Biểu đồ tròn Chi tiêu. Tổng ${(totalExpense || 0).toLocaleString("vi-VN")} VND. Chạm vào một phần để xem chi tiết.`}> 
                    {expensePieData.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Chưa có chi tiêu</Text>
                      </View>
                    ) : (
                      <PieChart
                        data={expensePieData.map((c, i) => ({ value: c.value, color: c.color, label: c.name, text: activeExpenseIndex === i ? `${c.percent}%` : '' }))}
                        donut
                        radius={90}
                        innerRadius={60}
                        innerCircleColor="#FFFFFF"
                        textBackgroundRadius={22}
                        textColor="#FFFFFF"
                        textSize={11}
                        showText={false}
                        fontWeight="700"
                        strokeWidth={0}
                        centerLabelComponent={centerLabelRenderer}
                        onPress={(_item: any, index: number) => toggleExpenseIndex(index)}
                        focusOnPress={false}
                        selectedIndex={activeExpenseIndex ?? undefined}
                      />
                    )}
                    </View>
                  
                  {/* Total shown beneath the pie chart if nothing is selected */}
                  {activeExpenseIndex === null && (
                    <View style={styles.chartTotalBelow}>
                      <Text style={styles.chartTotalLabel}>Tổng Chi tiêu</Text>
                      <Text style={styles.chartTotalValue}>{(totalExpense / 1000000).toFixed(1)}M</Text>
                    </View>
                  )}
                  
                  <View style={styles.expenseLegendAreaBelow}>
                    <View style={styles.expenseLegendContainer}>
                {expensePieData.map((item, i) => (
                  <Animated.View key={item.name} style={{ transform: [{ scale: activeExpenseIndex === i ? selectionAnim : 1 }] }}>
                  <TouchableOpacity accessible accessibilityRole="button" accessibilityLabel={`${item.name}. ${item.percent}% of total. ${item.amountVND}`} style={[styles.expenseLegendItem, activeExpenseIndex === i && styles.expenseLegendItemActive]} onPress={() => toggleExpenseIndex(i)}>
                    <View style={[styles.expenseLegendDot, { backgroundColor: item.color }]} />
                    <View style={styles.expenseLegendInfo}>
                      <Text style={styles.expenseLegendLabel} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    </View>
                    <Text style={styles.expenseLegendValue} numberOfLines={1} ellipsizeMode="tail">{item.amountVND ?? item.amountText}</Text>
                  </TouchableOpacity>
                  </Animated.View>
                ))}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* AI Analysis */}
          <View style={styles.aiAnalysisCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconContainer}>
                <MaterialCommunityIcons name="robot" size={24} color="#10B981" />
              </View>
              <Text style={styles.aiTitle}>Phân tích AI</Text>
            </View>
            <View style={styles.aiTextSection}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#059669" style={styles.aiIcon} />
              <Text style={styles.aiText}>
                <Text style={styles.aiBold}>Chi tiêu ăn uống tăng 5%</Text> so với tháng trước. Bạn nên giảm chi phí ăn ngoài và nấu ăn tại nhà nhiều hơn.
              </Text>
            </View>
            <View style={styles.aiTextSection}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" style={styles.aiIcon} />
              <Text style={styles.aiText}>
                <Text style={styles.aiBold}>Tiết kiệm tốt</Text>: Bạn đã tiết kiệm được <Text style={styles.highlight}>{savingRate}%</Text> thu nhập tháng này.
              </Text>
            </View>
            <View style={styles.aiTextSection}>
              <MaterialCommunityIcons name="trending-up" size={16} color="#059669" style={styles.aiIcon} />
              <Text style={styles.aiText}>
                <Text style={styles.aiBold}>Xu hướng tích cực</Text>: Thu nhập tăng 22% so với 3 tháng trước.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => navigation.navigate("AIChat", undefined)}
            >
              <Text style={styles.aiButtonText}>Hỏi AI chi tiết hơn</Text>
              <Text style={styles.aiButtonIcon}>→</Text>
            </TouchableOpacity>
          </View>



          {/* Recent Transactions */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeaderButton}
              onPress={() => navigation.push("TransactionHistory", { newTransaction: undefined })}
            >
              <View style={styles.sectionBadgeFull}>
                <View style={styles.sectionBadgeLeft}>
                  <MaterialCommunityIcons name="history" size={18} color="#6B7280" />
                  <Text style={styles.sectionBadgeText}>Giao dịch gần đây</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#6B7280" />
              </View>
            </TouchableOpacity>
            {transactionsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : recentTransactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
              </View>
            ) : (
              <View>
                {recentTransactions.map((transaction: any, index: number) => {
                  // Format date and time
                  const getFormattedDateTime = (dateObj: any) => {
                    try {
                      const date = dateObj?.toDate?.() || new Date(dateObj);
                      if (isNaN(date.getTime())) return { date: "N/A", time: "N/A" };
                      
                      const day = String(date.getDate()).padStart(2, "0");
                      const month = String(date.getMonth() + 1).padStart(2, "0");
                      const year = date.getFullYear();
                      const hours = String(date.getHours()).padStart(2, "0");
                      const minutes = String(date.getMinutes()).padStart(2, "0");
                      
                      return {
                        date: `${day}/${month}/${year}`,
                        time: `${hours}:${minutes}`,
                      };
                    } catch {
                      return { date: "N/A", time: "N/A" };
                    }
                  };

                  const dateTime = getFormattedDateTime(transaction.date || transaction.createdAt);
                  const categoryStr = String(transaction.category || '').trim();
                  const isNoteCategory = categoryStr === '' || /ghi chú/i.test(categoryStr) || categoryStr.includes('📝');
                  const displayTitle = transaction.isRecurring && transaction.name ? transaction.name : (isNoteCategory ? (transaction.description || transaction.category || 'Giao dịch') : transaction.category);

                  return (
                    <TouchableOpacity
                      key={`transaction-${index}-${transaction.id}`}
                      style={styles.recentTransactionItem}
                      onPress={() => navigation.push("EditTransaction", { transaction: transaction as any })}
                    >
                      {/* Header: Category + Amount */}
                      <View style={styles.transactionHeader}>
                        <View style={styles.transactionLeft}>
                                    <MaterialCommunityIcons
                                      name={getCategoryIcon(transaction.categoryId).name}
                                      size={24}
                                      color={getCategoryIcon(transaction.categoryId).color}
                                      style={styles.transactionIcon}
                                    />
                          <View style={styles.transactionInfo}>
                            {/* Display transaction name if recurring, otherwise category */}
                            {transaction.isRecurring && transaction.name ? (
                              <View style={styles.transactionNameRow}>
                                <Text style={styles.transactionName}>{transaction.name}</Text>
                                <View style={styles.recurringBadge}>
                                  <MaterialCommunityIcons name="repeat" size={10} color="#6366F1" />
                                  <Text style={styles.recurringBadgeText}>Lặp lại</Text>
                                </View>
                              </View>
                            ) : (
                              <View style={styles.transactionCategoryRow}>
                                <Text style={styles.transactionCategory}>{displayTitle}</Text>
                                {transaction.isRecurring && (
                                  <View style={styles.recurringBadge}>
                                    <MaterialCommunityIcons name="repeat" size={10} color="#6366F1" />
                                    <Text style={styles.recurringBadgeText}>Lặp lại</Text>
                                  </View>
                                )}
                              </View>
                            )}
                            <Text style={styles.transactionTime}>
                              <MaterialCommunityIcons name="clock-outline" size={12} color="#9CA3AF" /> {dateTime.time} · <MaterialCommunityIcons name="calendar-outline" size={12} color="#9CA3AF" /> {dateTime.date}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.transactionAmount,
                            transaction.type === "expense"
                              ? styles.amountExpense
                              : styles.amountIncome,
                          ]}
                        >
                          {transaction.type === "expense" ? "-" : "+"} {Math.abs(transaction.amount).toLocaleString("vi-VN")} VND
                        </Text>
                      </View>

                      {/* Description */}
                      {transaction.description && (
                        <Text style={styles.transactionDescription}>
                          <MaterialCommunityIcons name="note-text-outline" size={14} color="#6B7280" /> {transaction.description}
                        </Text>
                      )}

                      {/* Items breakdown (if available) */}
                      {transaction.items && transaction.items.length > 0 && (
                        <View style={styles.itemsSection}>
                          <Text style={styles.itemsTitle}><MaterialCommunityIcons name="package-variant-closed" size={14} color="#6B7280" /> Chi tiết:</Text>
                          {transaction.items.map((item: any, itemIndex: number) => (
                            <Text key={itemIndex} style={styles.itemRow}>
                              • {item.item} - {item.amount?.toLocaleString("vi-VN") || "0"} ₫
                            </Text>
                          ))}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#111827" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  headerButton: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButtonTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  headerTitleButton: { fontSize: 18, fontWeight: "800", color: "#111827", marginLeft: 8 },
  headerTitleCentered: { fontSize: 18, fontWeight: "800", color: "#111827" },
  iconLeft: { position: "absolute", left: 12, top: 8, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  iconRight: { position: "absolute", right: 12, top: 8, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerButtonCenter: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerSpacer: { width: 40, height: 40 },
  exportButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  exportButtonActive: { width: 40, height: 40, alignItems: "center", justifyContent: "center", backgroundColor: "#10B981", borderRadius: 8 },
  exportIcon: { fontSize: 20 },
  content: { padding: 16 },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: "#F3F4F6" },
  periodButtonActive: { backgroundColor: "#10B981" },
  periodText: { color: "#374151", fontWeight: "600", fontSize: 13 },
  periodTextActive: { color: "#FFFFFF" },
  modernPeriodContainer: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  modernPeriodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  modernPeriodButtonFirst: {
    borderLeftWidth: 0,
  },
  modernPeriodButtonLast: {
    borderRightWidth: 0,
  },
  modernPeriodButtonActive: {
    backgroundColor: '#10B981',
    borderRightColor: '#10B981',
  },
  modernPeriodText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
  },
  modernPeriodTextActive: {
    color: '#FFFFFF',
  },
  balanceCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.08)",
  },
  balanceLabel: { fontSize: 14, color: "#333333", marginBottom: 8 },
  balanceAmount: { fontSize: 16, fontWeight: "800", color: "#333333", marginBottom: 20 },
  balanceStats: { flexDirection: "row", justifyContent: "space-around" },
  balanceStat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "#000000", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#333333" },
  incomeText: { color: "#333333" },
  expenseText: { color: "#333333" },
  savingText: { color: "#333333" },
  statDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)" },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sectionBadgeText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 16 },
  sectionTitleButton: { fontSize: 16, fontWeight: "800", color: "#000000" },
  sectionHeaderButton: { 
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionBadgeFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
  },
  sectionBadgeBorder: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionBadgeLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllLink: { fontSize: 13, color: "#000000", fontWeight: "700" },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 180,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  chartColumn: { flex: 1, alignItems: "center", height: "100%" },
  chartValue: {
    fontSize: 10,
    color: "#000000",
    marginBottom: 4,
    fontWeight: "700",
  },
  chartBar: { width: "100%", borderRadius: 6, marginBottom: 8 },
  chartLabel: { fontSize: 11, color: "#000000", fontWeight: "600" },
  categoryItem: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryInfo: { flexDirection: "row", alignItems: "center" },
  categoryIconMargin: { marginRight: 8 },
  categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  categoryName: { fontSize: 15, fontWeight: "700", color: "#000000" },
  categoryAmount: { alignItems: "flex-end" },
  amountText: { fontSize: 15, fontWeight: "800", color: "#000000", marginBottom: 2 },
  trendText: { fontSize: 11, fontWeight: "700" },
  trendUp: { color: "#EF4444" },
  trendDown: { color: "#10B981" },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  percentText: { fontSize: 11, color: "#000000" },
  aiAnalysisCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  aiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139,92,246,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  aiIcon: { marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#000000" },
  aiTextSection: { marginBottom: 12 },
  aiText: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 22,
    marginBottom: 12,
  },
  aiBold: { fontWeight: "800", color: "#000000" },
  highlight: { color: "#8B5CF6", fontWeight: "900" },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  aiButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  aiButtonIcon: { color: "#FFFFFF", fontSize: 16, marginLeft: 8, fontWeight: "700" },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "600",
  },
  recentTransactionItem: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 137, 123, 0.12)",
  },
  categoryListContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    padding: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  categoryGridContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  categoryCardButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  categoryCardContent: {
    flex: 1,
    minWidth: 0,
  },
  categoryCardName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  categoryCardAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  categoryCardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  categoryCardProgressSmall: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryCardProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  categoryCardPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  transactionIcon: { marginRight: 12 },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  transactionLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  transactionEmoji: { fontSize: 24, marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionCategory: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 2,
  },
  transactionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  transactionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
  transactionCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionTime: {
    fontSize: 11,
    color: "#000000",
    marginBottom: 2,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recurringBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366F1',
  },
  transactionDescription: {
    fontSize: 12,
    color: "#000000",
    marginBottom: 8,
    marginLeft: 36,
    fontWeight: "500",
  },
  itemsSection: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    marginLeft: 36,
  },
  itemsTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  itemRow: {
    fontSize: 11,
    color: "#000000",
    marginBottom: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  amountExpense: { color: "#EF4444" },
  amountIncome: { color: "#10B981" },
  chartContainer: {
    borderRadius: 12,
    padding: 0,
    paddingBottom: 12,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: 'hidden',
  },
  chartGradientBg: {
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  chartGradientBgCompact: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 340,
  },
  chartPieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    position: 'relative',
  },
  chartAreaPieSize: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 95,
  },
  expenseChartColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    width: '100%',
  },
  chartArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartCenterLabelOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -22 }],
    zIndex: 10,
  },
  chartCenterValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#000000',
  },
  chartCenterLabelText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '600',
  },
  chartCenterSmallText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '600',
  },
  centerLabelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  centerLabelValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  chartTotalBelow: {
    marginTop: 6,
    marginBottom: 4,
    alignItems: 'center',
  },
  chartTotalLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  chartTotalValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '800',
    marginTop: 2,
  },
  chartLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: '48%',
    paddingVertical: 6,
  },
  chartLegendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartLegendInfo: {
    flex: 1,
  },
  chartLegendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  chartLegendValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    marginTop: 2,
  },
  chartNote: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FEF3C7',
    borderTopWidth: 1,
    borderTopColor: '#FCD34D',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  chartNoteText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 18,
  },
  expenseLegendAreaBelow: {
    width: '100%',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  expenseLegendContainer: {
    paddingTop: 6,
    paddingBottom: 4,
    paddingHorizontal: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  expenseLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 6,
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: '#F3F4F6',
  },
  expenseLegendItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  expenseLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  expenseLegendInfo: {
    flex: 1,
    minWidth: 0,
  },
  expenseLegendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 0,
  },
  expenseLegendPercent: {
    fontSize: 12,
    color: '#6B7280',
  },
  expenseLegendValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
    minWidth: 100,
  },
  barChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  barChartTopInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  barChartLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  barChartTotal: {
    fontSize: 28,
    fontWeight: '900',
    color: '#111827',
  },
});
