import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "BudgetPlanner">;

interface BudgetItem {
  id: string;
  category: string;
  icon: string;
  budget: number;
  spent: number;
  predicted: number;
  color: string;
}

export default function BudgetPlannerScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const [budgets, setBudgets] = useState<BudgetItem[]>([
    {
      id: "1",
      category: "Ăn uống",
      icon: "🍔",
      budget: 5000000,
      spent: 4500000,
      predicted: 5200000,
      color: "#EC4899",
    },
    {
      id: "2",
      category: "Di chuyển",
      icon: "🚗",
      budget: 2000000,
      spent: 1800000,
      predicted: 1950000,
      color: "#8B5CF6",
    },
    {
      id: "3",
      category: "Nhà cửa",
      icon: "🏠",
      budget: 5000000,
      spent: 5000000,
      predicted: 5000000,
      color: "#6366F1",
    },
    {
      id: "4",
      category: "Mua sắm",
      icon: "🛍️",
      budget: 2000000,
      spent: 2500000,
      predicted: 2800000,
      color: "#F59E0B",
    },
    {
      id: "5",
      category: "Giải trí",
      icon: "🎮",
      budget: 1500000,
      spent: 1200000,
      predicted: 1400000,
      color: "#10B981",
    },
  ]);

  const totalBudget = budgets.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0);
  const totalPredicted = budgets.reduce((sum, item) => sum + item.predicted, 0);

  const getStatusColor = (spent: number, budget: number, predicted: number) => {
    if (spent > budget || predicted > budget) return "#EF4444";
    if (spent > budget * 0.8) return "#F59E0B";
    return "#10B981";
  };

  const getPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const handleUpdateBudget = (id: string) => {
    const budget = parseInt(editingValue.replace(/[^0-9]/g, "")) || 0;
    setBudgets(prev =>
      prev.map(item => (item.id === id ? { ...item, budget } : item))
    );
    setEditingId(null);
    setEditingValue("");
  };

  const handleStartEdit = (id: string, currentBudget: number) => {
    setEditingId(id);
    setEditingValue(currentBudget.toString());
  };

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ngân sách</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Bộ chọn tháng */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthSelector}
          >
            {monthNames.map((month, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.monthButton,
                  selectedMonth === index && styles.monthButtonActive,
                ]}
                onPress={() => setSelectedMonth(index)}
              >
                <Text
                  style={[
                    styles.monthText,
                    selectedMonth === index && styles.monthTextActive,
                  ]}
                >
                  {month}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tổng quan */}
          <View style={styles.overviewCard}>
            <Text style={styles.overviewLabel}>Tổng ngân sách tháng</Text>
            <Text style={styles.overviewAmount}>₫{totalBudget.toLocaleString("vi-VN")}</Text>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.statLabel}>Đã chi</Text>
                <Text style={[styles.statValue, { color: totalSpent > totalBudget ? "#EF4444" : "#fff" }]}>
                  ₫{(totalSpent / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.statLabel}>Còn lại</Text>
                <Text style={[styles.statValue, { color: "#10B981" }]}>
                  ₫{((totalBudget - totalSpent) / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.overviewStat}>
                <Text style={styles.statLabel}>Dự kiến</Text>
                <Text style={[styles.statValue, { color: "#F59E0B" }]}>
                  ₫{(totalPredicted / 1000000).toFixed(1)}M
                </Text>
              </View>
            </View>
            <View style={styles.totalProgress}>
              <View
                style={[
                  styles.totalProgressFill,
                  {
                    width: `${getPercentage(totalSpent, totalBudget)}%`,
                    backgroundColor: totalSpent > totalBudget ? "#EF4444" : "#6366F1",
                  },
                ]}
              />
            </View>
          </View>

          {/* Dự đoán AI */}
          <View style={styles.aiPredictionCard}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiIcon}>🤖</Text>
              <Text style={styles.aiTitle}>Dự đoán AI</Text>
            </View>
            <Text style={styles.aiText}>
              Dựa trên chi tiêu hiện tại, AI dự đoán bạn sẽ vượt ngân sách{" "}
              <Text style={styles.aiHighlight}>
                ₫{((totalPredicted - totalBudget) / 1000000).toFixed(1)}M
              </Text>{" "}
              vào cuối tháng.
            </Text>
            <View style={styles.aiWarnings}>
              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  <Text style={styles.warningBold}>Ăn uống</Text> có thể vượt ₫200K
                </Text>
              </View>
              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>🔴</Text>
                <Text style={styles.warningText}>
                  <Text style={styles.warningBold}>Mua sắm</Text> đã vượt ₫500K
                </Text>
              </View>
            </View>
          </View>

          {/* Danh mục ngân sách */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chi tiết theo danh mục</Text>
            {budgets.map((item) => {
              const percentage = getPercentage(item.spent, item.budget);
              const statusColor = getStatusColor(item.spent, item.budget, item.predicted);
              const isOverBudget = item.spent > item.budget || item.predicted > item.budget;

              return (
                <View key={item.id} style={styles.budgetCard}>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetIcon}>{item.icon}</Text>
                      <Text style={styles.budgetCategory}>{item.category}</Text>
                      {isOverBudget && (
                        <View style={styles.warningBadge}>
                          <Text style={styles.warningBadgeText}>!</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => handleStartEdit(item.id, item.budget)}>
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                  </View>

                  {editingId === item.id ? (
                    <View style={styles.editContainer}>
                      <TextInput
                        style={styles.editInput}
                        value={editingValue}
                        onChangeText={setEditingValue}
                        keyboardType="numeric"
                        onBlur={() => handleUpdateBudget(item.id)}
                        autoFocus
                      />
                    </View>
                  ) : (
                    <>
                      <View style={styles.budgetAmounts}>
                        <View style={styles.amountItem}>
                          <Text style={styles.amountLabel}>Ngân sách</Text>
                          <Text style={styles.amountValue}>
                            ₫{(item.budget / 1000000).toFixed(1)}M
                          </Text>
                        </View>
                        <View style={styles.amountItem}>
                          <Text style={styles.amountLabel}>Đã chi</Text>
                          <Text style={[styles.amountValue, { color: statusColor }]}>
                            ₫{(item.spent / 1000000).toFixed(1)}M
                          </Text>
                        </View>
                        <View style={styles.amountItem}>
                          <Text style={styles.amountLabel}>Dự kiến</Text>
                          <Text style={[styles.amountValue, { color: "#F59E0B" }]}>
                            ₫{(item.predicted / 1000000).toFixed(1)}M
                          </Text>
                        </View>
                      </View>

                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${percentage}%`,
                                backgroundColor: statusColor,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>{percentage.toFixed(0)}%</Text>
                      </View>

                      {item.predicted > item.budget && (
                        <View style={styles.predictionAlert}>
                          <Text style={styles.predictionText}>
                            ⚠️ Dự kiến vượt ₫
                            {((item.predicted - item.budget) / 1000).toFixed(0)}K
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>

          {/* Thao tác nhanh */}
          <View style={styles.section}>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => Alert.alert("Tính năng", "Đang phát triển")}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Xem báo cáo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("AIRecommendation")}
              >
                <Text style={styles.actionIcon}>💡</Text>
                <Text style={styles.actionText}>Gợi ý tiết kiệm</Text>
              </TouchableOpacity>
            </View>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: { fontSize: 24, color: "#fff", fontWeight: "700" },
  content: { padding: 16 },
  monthSelector: { paddingBottom: 16, gap: 8 },
  monthButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  monthButtonActive: { backgroundColor: "#6366F1" },
  monthText: { color: "rgba(255,255,255,0.6)", fontWeight: "700", fontSize: 13 },
  monthTextActive: { color: "#fff" },
  overviewCard: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  overviewLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8 },
  overviewAmount: { fontSize: 36, fontWeight: "900", color: "#fff", marginBottom: 16 },
  overviewStats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  overviewStat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#fff" },
  statDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)" },
  totalProgress: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  totalProgressFill: { height: "100%", borderRadius: 4 },
  aiPredictionCard: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  aiText: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 12 },
  aiHighlight: { color: "#F59E0B", fontWeight: "900" },
  aiWarnings: { gap: 8 },
  warningItem: { flexDirection: "row", alignItems: "center" },
  warningIcon: { fontSize: 16, marginRight: 8 },
  warningText: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  warningBold: { fontWeight: "800", color: "#fff" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16 },
  budgetCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetInfo: { flexDirection: "row", alignItems: "center" },
  budgetIcon: { fontSize: 28, marginRight: 10 },
  budgetCategory: { fontSize: 16, fontWeight: "800", color: "#fff" },
  warningBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  warningBadgeText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  editIcon: { fontSize: 16 },
  editContainer: { marginBottom: 12 },
  editInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  budgetAmounts: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  amountItem: { alignItems: "center" },
  amountLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 },
  amountValue: { fontSize: 14, fontWeight: "800", color: "#fff" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)", minWidth: 40 },
  predictionAlert: {
    marginTop: 8,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: 8,
    padding: 8,
  },
  predictionText: { fontSize: 12, color: "#F59E0B", fontWeight: "700" },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600", textAlign: "center" },
});
