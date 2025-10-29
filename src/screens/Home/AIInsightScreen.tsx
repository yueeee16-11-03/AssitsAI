import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AIInsight">;

export default function AIInsightScreen({ navigation }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("month");
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const spendingData = [
    { category: "Ăn uống", amount: 4500000, percent: 35, color: "#EC4899" },
    { category: "Di chuyển", amount: 2000000, percent: 15, color: "#8B5CF6" },
    { category: "Mua sắm", amount: 3200000, percent: 25, color: "#6366F1" },
    { category: "Giải trí", amount: 1800000, percent: 14, color: "#10B981" },
    { category: "Khác", amount: 1400000, percent: 11, color: "#F59E0B" },
  ];

  const habits = [
    { name: "Uống nước", streak: 7, progress: 85, icon: "💧" },
    { name: "Tập thể dục", streak: 5, progress: 70, icon: "🏃" },
    { name: "Đọc sách", streak: 3, progress: 45, icon: "📚" },
  ];

  const insights = [
    {
      title: "Chi tiêu tăng 15%",
      description: "So với tháng trước, bạn đã chi nhiều hơn cho ăn uống",
      type: "warning",
      icon: "⚠️",
    },
    {
      title: "Tiết kiệm tốt",
      description: "Bạn đã tiết kiệm được 20% thu nhập tháng này",
      type: "success",
      icon: "✅",
    },
    {
      title: "Thói quen tốt",
      description: "Bạn đã duy trì được 7 ngày uống đủ nước",
      type: "info",
      icon: "💪",
    },
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
        <Text style={styles.headerTitle}>AI Insights</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(["week", "month", "year"] as const).map((period) => (
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
                  {period === "week" ? "Tuần" : period === "month" ? "Tháng" : "Năm"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.aiIcon}>
              <Text style={styles.aiIconText}>🤖</Text>
            </View>
            <Text style={styles.summaryTitle}>Phân tích AI</Text>
            <Text style={styles.summaryText}>
              Tháng này bạn đã chi tiêu <Text style={styles.highlight}>₫12,900,000</Text>, tăng 15% so với tháng trước. 
              Chi tiêu chủ yếu vào ăn uống và mua sắm. Bạn nên giảm 20% chi tiêu không cần thiết.
            </Text>
          </View>

          {/* Spending Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phân tích chi tiêu</Text>
            <View style={styles.spendingChart}>
              {spendingData.map((item, index) => (
                <View key={index} style={styles.spendingItem}>
                  <View style={styles.spendingInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.category}</Text>
                  </View>
                  <View style={styles.spendingAmount}>
                    <Text style={styles.amountText}>₫{(item.amount / 1000000).toFixed(1)}M</Text>
                    <Text style={styles.percentText}>{item.percent}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.percent}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Habits Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiến độ thói quen</Text>
            <View style={styles.habitsGrid}>
              {habits.map((habit, index) => (
                <View key={index} style={styles.habitCard}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <View style={styles.habitStats}>
                    <Text style={styles.streakText}>🔥 {habit.streak} ngày</Text>
                  </View>
                  <View style={styles.habitProgressBar}>
                    <View
                      style={[styles.habitProgressFill, { width: `${habit.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.habitPercent}>{habit.progress}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Insights & Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khuyến nghị</Text>
            {insights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightCard,
                  insight.type === "warning" && styles.insightWarning,
                  insight.type === "success" && styles.insightSuccess,
                ]}
              >
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* AI Actions */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("AIChat")}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Hỏi AI về chi tiết</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E0F2F1",
  },
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
  backIcon: {
    fontSize: 20,
    color: "#00897B",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#00796B",
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshIcon: {
    fontSize: 20,
  },
  content: {
    padding: 16,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: "#6366F1",
  },
  periodText: {
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
  },
  periodTextActive: {
    color: "#FFFFFF",
  },
  summaryCard: {
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.2)",
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(99,102,241,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  aiIconText: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#00796B",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },
  highlight: {
    color: "#6366F1",
    fontWeight: "800",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#00796B",
    marginBottom: 16,
  },
  spendingChart: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
  },
  spendingItem: {
    marginBottom: 16,
  },
  spendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    color: "#00796B",
    fontWeight: "700",
  },
  spendingAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountText: {
    color: "#333333",
    fontWeight: "600",
  },
  percentText: {
    color: "rgba(255,255,255,0.6)",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  habitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  habitCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  habitIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  habitName: {
    color: "#00796B",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  habitStats: {
    marginBottom: 8,
  },
  streakText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  habitProgressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginBottom: 4,
    overflow: "hidden",
  },
  habitProgressFill: {
    height: "100%",
    backgroundColor: "#10B981",
  },
  habitPercent: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#6366F1",
  },
  insightWarning: {
    borderLeftColor: "#F59E0B",
    backgroundColor: "rgba(245,158,11,0.08)",
  },
  insightSuccess: {
    borderLeftColor: "#10B981",
    backgroundColor: "rgba(16,185,129,0.08)",
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: "#00796B",
    fontWeight: "700",
    marginBottom: 4,
  },
  insightDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
