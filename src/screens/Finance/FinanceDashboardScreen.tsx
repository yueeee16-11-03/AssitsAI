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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import transactionApi from "../../api/transactionApi";

type Props = NativeStackScreenProps<RootStackParamList, "FinanceDashboard">;

export default function FinanceDashboardScreen({ navigation }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [fadeAnim] = useState(new Animated.Value(0));
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Load transactions when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadRecentTransactions();
    }, [])
  );

  const loadRecentTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const data = await transactionApi.getTransactions();
      // Get last 5 transactions
      setRecentTransactions(data.slice(0, 5));
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const incomeData = [
    { month: "T1", value: 15000000, percent: 85 },
    { month: "T2", value: 18000000, percent: 100 },
    { month: "T3", value: 16500000, percent: 92 },
    { month: "T4", value: 20000000, percent: 110 },
    { month: "T5", value: 17000000, percent: 94 },
    { month: "T6", value: 22000000, percent: 122 },
  ];

  const expenseCategories = [
    { name: "Ăn uống", amount: 4500000, percent: 35, color: "#EC4899", trend: "+5%" },
    { name: "Di chuyển", amount: 2000000, percent: 15, color: "#8B5CF6", trend: "-2%" },
    { name: "Nhà cửa", amount: 5000000, percent: 39, color: "#6366F1", trend: "0%" },
    { name: "Mua sắm", amount: 1400000, percent: 11, color: "#10B981", trend: "+8%" },
  ];

  const totalIncome = 22000000;
  const totalExpense = 12900000;
  const balance = totalIncome - totalExpense;
  const savingRate = ((balance / totalIncome) * 100).toFixed(1);

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài chính</Text>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => {}}
        >
          <Text style={styles.exportIcon}>📊</Text>
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
            <Text style={styles.balanceAmount}>₫{balance.toLocaleString("vi-VN")}</Text>
            <View style={styles.balanceStats}>
              <View style={styles.balanceStat}>
                <Text style={styles.statLabel}>Thu nhập</Text>
                <Text style={[styles.statValue, styles.incomeText]}>
                  +₫{(totalIncome / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.balanceStat}>
                <Text style={styles.statLabel}>Chi tiêu</Text>
                <Text style={[styles.statValue, styles.expenseText]}>
                  -₫{(totalExpense / 1000000).toFixed(1)}M
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
            <Text style={styles.sectionTitle}>📈 Thu nhập 6 tháng</Text>
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
          </View>

          {/* Expense Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>💳 Chi tiêu theo danh mục</Text>
              <TouchableOpacity onPress={() => navigation.navigate("AIInsight")}>
                <Text style={styles.viewAllLink}>Xem chi tiết →</Text>
              </TouchableOpacity>
            </View>
            {expenseCategories.map((category, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[styles.categoryDot, { backgroundColor: category.color }]}
                    />
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={styles.amountText}>
                      ₫{(category.amount / 1000000).toFixed(1)}M
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
                      { width: `${category.percent}%`, backgroundColor: category.color },
                    ]}
                  />
                </View>
                <Text style={styles.percentText}>{category.percent}% tổng chi tiêu</Text>
              </View>
            ))}
          </View>

          {/* AI Analysis */}
          <View style={styles.aiAnalysisCard}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconContainer}>
                <Text style={styles.aiIcon}>🤖</Text>
              </View>
              <Text style={styles.aiTitle}>Phân tích AI</Text>
            </View>
            <Text style={styles.aiText}>
              💡 <Text style={styles.aiBold}>Chi tiêu ăn uống tăng 5%</Text> so với tháng trước.
              Bạn nên giảm chi phí ăn ngoài và nấu ăn tại nhà nhiều hơn.
            </Text>
            <Text style={styles.aiText}>
              ✅ <Text style={styles.aiBold}>Tiết kiệm tốt</Text>: Bạn đã tiết kiệm được{" "}
              <Text style={styles.highlight}>{savingRate}%</Text> thu nhập tháng này.
            </Text>
            <Text style={styles.aiText}>
              📊 <Text style={styles.aiBold}>Xu hướng tích cực</Text>: Thu nhập tăng 22% so với 3 tháng trước.
            </Text>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => navigation.navigate("AIChat")}
            >
              <Text style={styles.aiButtonText}>Hỏi AI chi tiết hơn</Text>
              <Text style={styles.aiButtonIcon}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate("AddTransaction")}
              >
                <Text style={styles.actionIcon}>➕</Text>
                <Text style={styles.actionText}>Thêm thu nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate("AddTransaction")}
              >
                <Text style={styles.actionIcon}>➖</Text>
                <Text style={styles.actionText}>Thêm chi tiêu</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionCard}
                onPress={() => navigation.navigate("AIRecommendation")}
              >
                <Text style={styles.actionIcon}>🎯</Text>
                <Text style={styles.actionText}>Gợi ý tiết kiệm</Text>
              </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate("AddTransaction")}
                >
                  <Text style={styles.actionIcon}>📄</Text>
                  <Text style={styles.actionText}>Xuất báo cáo</Text>
                </TouchableOpacity>
            </View>
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📋 Giao dịch gần đây</Text>
              <TouchableOpacity onPress={() => navigation.push("TransactionHistory", { newTransaction: undefined })}>
                <Text style={styles.viewAllLink}>Xem tất cả →</Text>
              </TouchableOpacity>
            </View>
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
                {recentTransactions.map((transaction, index) => (
                  <TouchableOpacity
                    key={`transaction-${index}-${transaction.id}`}
                    style={styles.recentTransactionItem}
                    onPress={() => navigation.push("EditTransaction", { transaction })}
                  >
                    <View style={styles.transactionLeft}>
                      <Text style={styles.transactionEmoji}>
                        {getCategoryEmoji(transaction.categoryId)}
                      </Text>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionCategory}>{transaction.category}</Text>
                        <Text style={styles.transactionDescription}>
                          {transaction.description}
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
                      {transaction.type === "expense" ? "-" : "+"} ₫
                      {Math.abs(transaction.amount).toLocaleString("vi-VN")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E27" },
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
  backIcon: { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  exportButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
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
  periodButtonActive: { backgroundColor: "#6366F1" },
  periodText: { color: "rgba(255,255,255,0.6)", fontWeight: "600", fontSize: 13 },
  periodTextActive: { color: "#fff" },
  balanceCard: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: "900", color: "#fff", marginBottom: 20 },
  balanceStats: { flexDirection: "row", justifyContent: "space-around" },
  balanceStat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800" },
  incomeText: { color: "#10B981" },
  expenseText: { color: "#EF4444" },
  savingText: { color: "#F59E0B" },
  statDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)" },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16 },
  viewAllLink: { fontSize: 13, color: "#6366F1", fontWeight: "700" },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 180,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  chartColumn: { flex: 1, alignItems: "center", height: "100%" },
  chartValue: {
    fontSize: 10,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
    fontWeight: "700",
  },
  chartBar: { width: "100%", borderRadius: 6, marginBottom: 8 },
  chartLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  categoryItem: {
    backgroundColor: "rgba(255,255,255,0.04)",
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
  categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  categoryName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  categoryAmount: { alignItems: "flex-end" },
  amountText: { fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 2 },
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
  percentText: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  aiAnalysisCard: {
    backgroundColor: "rgba(139,92,246,0.1)",
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
  aiIcon: { fontSize: 20 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  aiText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 22,
    marginBottom: 12,
  },
  aiBold: { fontWeight: "800", color: "#fff" },
  highlight: { color: "#8B5CF6", fontWeight: "900" },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  aiButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  aiButtonIcon: { color: "#fff", fontSize: 16, marginLeft: 8, fontWeight: "700" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600", textAlign: "center" },
  loadingContainer: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  recentTransactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  transactionLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  transactionEmoji: { fontSize: 24, marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionCategory: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  amountExpense: { color: "#EF4444" },
  amountIncome: { color: "#10B981" },
});
