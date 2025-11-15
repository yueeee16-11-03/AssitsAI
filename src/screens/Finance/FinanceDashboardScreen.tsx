import React, { useState } from "react";
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
import { useTransactionStore } from "../../store/transactionStore";
import { useFinancialData } from "../../hooks/useFinancialData";
import useIncomeChartData from "../../hooks/useIncomeChartData";
import useExpenseCategories from "../../hooks/useExpenseCategories";

type Props = NativeStackScreenProps<RootStackParamList, "FinanceDashboard">;

export default function FinanceDashboardScreen({ navigation }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // ⚠️ CRITICAL: Subscribe to store - này là key để auto-update
  // Bất cứ lúc nào state.transactions thay đổi → component re-render
  const transactions = useTransactionStore((state) => state.transactions);
  const fetchTransactions = useTransactionStore((state) => state.fetchTransactions);
  const transactionsLoading = useTransactionStore((state) => state.isLoading);

  // Recent transactions derived from store (most recent first)
  // Computed lại mỗi khi transactions thay đổi
  const recentTransactions = transactions ? transactions.slice(0, 5) : [];

  // Load transactions helper (declare before useFocusEffect to avoid TDZ error)
  const loadRecentTransactions = React.useCallback(async () => {
    try {
      console.log('📊 [DASHBOARD] Fetching fresh transactions...');
      await fetchTransactions();
      console.log('✅ [DASHBOARD] Fresh transactions fetched');
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  }, [fetchTransactions]);

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

  // ⚠️ AUTO-UPDATE: Mỗi khi transactions thay đổi (từ Store)
  // Component tự động re-render với dữ liệu mới
  React.useEffect(() => {
    console.log('📊 [DASHBOARD] Transactions updated from store. Count:', transactions.length);
    // recentTransactions sẽ được computed lại tự động
  }, [transactions]);

  // 🎯 Sử dụng custom hook để tính toán dữ liệu tài chính
  const financialData = useFinancialData(transactions, selectedPeriod);

  // Income chart data (last 6 months) — moved to hook for separation
  const incomeData = useIncomeChartData(transactions);

  // Expense categories computed from real transactions
  const expenseCategories = useExpenseCategories(transactions, selectedPeriod);

  // 🟢 Xóa hardcoded values, dùng financialData thay vào
  const totalIncome = financialData.totalIncome;
  const totalExpense = financialData.totalExpense;
  const balance = financialData.balance;
  const savingRate = financialData.savingRate;

  const getCategoryEmoji = (categoryId: string) => {
    const emojiMap: { [key: string]: string } = {
      "1": "🍔", // Ăn uống
      "2": "🚗", // Di chuyển
      "3": "🛍️", // Mua sắm
      "4": "🎮", // Giải trí
      "5": "💊", // Sức khỏe
      "6": "📚", // Giáo dục
      "7": "🏠", // Nhà cửa
      "8": "📦", // Khác (expense)
      "9": "💼", // Lương
      "10": "🎁", // Thưởng
      "11": "📈", // Đầu tư
      "12": "💰", // Khác (income)
    };
    return emojiMap[categoryId] || "💳";
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerButton}>
        <TouchableOpacity
          style={styles.iconLeft}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitleCentered}>Tài chính</Text>
        <TouchableOpacity
          style={styles.iconRight}
          onPress={() => navigation.navigate("BudgetPlanner")}
        >
          <MaterialCommunityIcons name="chart-box" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(["day", "week", "month", "year"] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === period && styles.periodTextActive,
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
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="chart-line" size={24} color="#10B981" />
                <Text style={styles.sectionTitleButton}>Thu nhập 6 tháng</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.chartContainer}
              onPress={() => navigation.navigate("AIInsight", undefined)}
            >
              <View style={styles.chart}>
              {incomeData.map((item, index) => (
                <View key={index} style={styles.chartColumn}>
                  <Text style={styles.chartValue}>
                    {(item.value / 1000000).toFixed(0)}M
                  </Text>
                <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${item.percent}%`,
                        backgroundColor: item.percent >= 100 ? "#10B981" : "#6366F1",
                      } as any,
                    ]}
                  />
                  <Text style={styles.chartLabel}>{item.month}</Text>
                </View>
              ))}
              </View>
            </TouchableOpacity>
          </View>

          {/* Expense Breakdown */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeaderButton}
              onPress={() => navigation.navigate("AIInsight", undefined)}
            >
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="wallet" size={24} color="#10B981" />
                <Text style={styles.sectionTitleButton}>Chi tiêu theo danh mục</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#10B981" />
            </TouchableOpacity>
            {expenseCategories.filter((category) => category.name !== "Ghi chú").map((category, index) => {
              const getCategoryIcon = (categoryName: string) => {
                const iconMap: { [key: string]: { name: string; color: string } } = {
                  "Ăn uống": { name: "food", color: "#EF4444" },
                  "Di chuyển": { name: "car", color: "#F97316" },
                  "Mua sắm": { name: "shopping", color: "#EC4899" },
                  "Giải trí": { name: "gamepad-variant", color: "#8B5CF6" },
                  "Sức khỏe": { name: "hospital-box", color: "#EF4444" },
                  "Giáo dục": { name: "book", color: "#3B82F6" },
                  "Nhà cửa": { name: "home", color: "#10B981" },
                  "Khác": { name: "dots-horizontal", color: "#6B7280" },
                };
                return iconMap[categoryName] || { name: "wallet", color: "#6B7280" };
              };
              const icon = getCategoryIcon(category.name);
              return (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <MaterialCommunityIcons name={icon.name} size={24} color={icon.color} style={styles.categoryIconMargin} />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={styles.amountText}>
                      {(category.amount / 1000000).toFixed(1)}M VND
                    </Text>
                    <Text
                      style={[
                        styles.trendText,
                        category.trend.startsWith("+") ? styles.trendUp : styles.trendDown,
                      ]}
                    >
                      {category.trend}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${category.percent}%`, backgroundColor: icon.color },
                    ]}
                  />
                </View>
                <Text style={styles.percentText}>{category.percent}% tổng chi tiêu</Text>
              </View>
            );
            })}
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
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons name="history" size={24} color="#10B981" />
                <Text style={styles.sectionTitleButton}>Giao dịch gần đây</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#10B981" />
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

                  return (
                    <TouchableOpacity
                      key={`transaction-${index}-${transaction.id}`}
                      style={styles.recentTransactionItem}
                      onPress={() => navigation.push("EditTransaction", { transaction: transaction as any })}
                    >
                      {/* Header: Category + Amount */}
                      <View style={styles.transactionHeader}>
                        <View style={styles.transactionLeft}>
                          <Text style={styles.transactionEmoji}>
                            {getCategoryEmoji(transaction.categoryId)}
                          </Text>
                          <View style={styles.transactionInfo}>
                            <Text style={styles.transactionCategory}>{transaction.category}</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#000000" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#000000" },
  headerButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 48,
  },
  headerButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButtonTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  headerTitleButton: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginLeft: 8 },
  headerTitleCentered: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  iconLeft: { position: "absolute", left: 12, top: 48, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  iconRight: { position: "absolute", right: 12, top: 48, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerButtonCenter: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#10B981",
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
  periodButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  periodButtonActive: { backgroundColor: "#10B981" },
  periodText: { color: "#999999", fontWeight: "600", fontSize: 13 },
  periodTextActive: { color: "#FFFFFF" },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  balanceLabel: { fontSize: 14, color: "#333333", marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: "900", color: "#333333", marginBottom: 20 },
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
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 16 },
  sectionTitleButton: { fontSize: 16, fontWeight: "800", color: "#000000" },
  sectionHeaderButton: { 
    backgroundColor: "transparent",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  viewAllLink: { fontSize: 13, color: "#000000", fontWeight: "700" },
  chartContainer: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "transparent",
  },
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
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 137, 123, 0.12)",
  },
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
  transactionTime: {
    fontSize: 11,
    color: "#000000",
    marginBottom: 2,
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
});
