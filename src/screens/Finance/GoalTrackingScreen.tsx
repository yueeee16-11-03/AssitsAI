import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "GoalTracking">;

interface Goal {
  id: string;
  title: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: "saving" | "purchase" | "investment" | "education";
  color: string;
  monthlyContribution: number;
}

export default function GoalTrackingScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const [goals] = useState<Goal[]>([
    {
      id: "1",
      title: "Mua xe hơi",
      icon: "🚗",
      targetAmount: 500000000,
      currentAmount: 180000000,
      deadline: new Date(2025, 11, 31),
      category: "purchase",
      color: "#EC4899",
      monthlyContribution: 15000000,
    },
    {
      id: "2",
      title: "Tiết kiệm học phí con",
      icon: "🎓",
      targetAmount: 200000000,
      currentAmount: 85000000,
      deadline: new Date(2026, 8, 1),
      category: "education",
      color: "#8B5CF6",
      monthlyContribution: 5000000,
    },
    {
      id: "3",
      title: "Quỹ dự phòng khẩn cấp",
      icon: "🏦",
      targetAmount: 100000000,
      currentAmount: 45000000,
      deadline: new Date(2024, 11, 31),
      category: "saving",
      color: "#6366F1",
      monthlyContribution: 8000000,
    },
    {
      id: "4",
      title: "Du lịch châu Âu",
      icon: "✈️",
      targetAmount: 80000000,
      currentAmount: 32000000,
      deadline: new Date(2025, 5, 1),
      category: "saving",
      color: "#10B981",
      monthlyContribution: 4000000,
    },
  ]);

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getTimeRemaining = (deadline: Date) => {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    const months = Math.ceil(diff / (1000 * 60 * 60 * 24 * 30));
    return months;
  };

  const getRequiredMonthly = (goal: Goal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const months = getTimeRemaining(goal.deadline);
    return months > 0 ? remaining / months : 0;
  };

  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalProgress = (totalCurrentAmount / totalTargetAmount) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mục tiêu</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Total Progress */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Tổng tiến độ</Text>
            <Text style={styles.totalAmount}>
              ₫{totalCurrentAmount.toLocaleString("vi-VN")} / ₫{totalTargetAmount.toLocaleString("vi-VN")}
            </Text>
            <View style={styles.totalProgressBar}>
              <View
                style={[
                  styles.totalProgressFill,
                  { width: `${totalProgress}%` },
                ]}
              />
            </View>
            <Text style={styles.totalPercentage}>{totalProgress.toFixed(1)}% hoàn thành</Text>
          </View>

          {/* AI Insight */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiIcon}>🤖</Text>
              <Text style={styles.aiTitle}>Phân tích AI</Text>
            </View>
            <Text style={styles.aiText}>
              💡 Với tốc độ hiện tại, bạn sẽ đạt mục tiêu{" "}
              <Text style={styles.aiHighlight}>"Mua xe hơi"</Text> muộn hơn 3 tháng.
              Hãy tăng tiết kiệm thêm <Text style={styles.aiHighlight}>₫2M/tháng</Text>.
            </Text>
            <Text style={styles.aiText}>
              ✅ Mục tiêu <Text style={styles.aiHighlight}>"Du lịch châu Âu"</Text> đang đúng kế hoạch!
            </Text>
          </View>

          {/* Goals List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách mục tiêu</Text>
            {goals.map((goal) => {
              const progress = getProgress(goal.currentAmount, goal.targetAmount);
              const monthsLeft = getTimeRemaining(goal.deadline);
              const requiredMonthly = getRequiredMonthly(goal);
              const isOnTrack = goal.monthlyContribution >= requiredMonthly;

              return (
                <TouchableOpacity
                  key={goal.id}
                  style={styles.goalCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <View style={[styles.iconContainer, { backgroundColor: `${goal.color}22` }]}>
                        <Text style={styles.goalIcon}>{goal.icon}</Text>
                      </View>
                      <View style={styles.goalTitleContainer}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <Text style={styles.goalDeadline}>
                          📅 {goal.deadline.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
                        </Text>
                      </View>
                    </View>
                    {!isOnTrack && (
                      <View style={styles.warningBadge}>
                        <Text style={styles.warningText}>⚠️</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.goalAmounts}>
                    <View>
                      <Text style={styles.amountLabel}>Hiện tại</Text>
                      <Text style={styles.amountValue}>
                        ₫{(goal.currentAmount / 1000000).toFixed(1)}M
                      </Text>
                    </View>
                    <View style={styles.amountDivider} />
                    <View>
                      <Text style={styles.amountLabel}>Mục tiêu</Text>
                      <Text style={styles.amountValue}>
                        ₫{(goal.targetAmount / 1000000).toFixed(1)}M
                      </Text>
                    </View>
                    <View style={styles.amountDivider} />
                    <View>
                      <Text style={styles.amountLabel}>Còn lại</Text>
                      <Text style={[styles.amountValue, { color: "#F59E0B" }]}>
                        ₫{((goal.targetAmount - goal.currentAmount) / 1000000).toFixed(1)}M
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${progress}%`,
                            backgroundColor: goal.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
                  </View>

                  <View style={styles.goalStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statIcon}>⏱️</Text>
                      <Text style={styles.statText}>{monthsLeft} tháng</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statIcon}>💰</Text>
                      <Text style={styles.statText}>
                        ₫{(goal.monthlyContribution / 1000000).toFixed(1)}M/tháng
                      </Text>
                    </View>
                    {!isOnTrack && (
                      <View style={styles.statItem}>
                        <Text style={styles.statIcon}>📈</Text>
                        <Text style={[styles.statText, { color: "#EF4444" }]}>
                          Cần ₫{(requiredMonthly / 1000000).toFixed(1)}M/tháng
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => Alert.alert("Thêm tiền", "Tính năng đang phát triển")}
                    >
                      <Text style={styles.actionButtonText}>+ Thêm tiền</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonSecondary]}
                      onPress={() => Alert.alert("Chi tiết", "Xem lịch sử giao dịch")}
                    >
                      <Text style={styles.actionButtonTextSecondary}>Chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Stats */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Thống kê nhanh</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>{goals.length}</Text>
                <Text style={styles.statsLabel}>Mục tiêu</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>
                  {goals.filter(g => getProgress(g.currentAmount, g.targetAmount) >= 100).length}
                </Text>
                <Text style={styles.statsLabel}>Hoàn thành</Text>
              </View>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>
                  ₫{(goals.reduce((sum, g) => sum + g.monthlyContribution, 0) / 1000000).toFixed(1)}M
                </Text>
                <Text style={styles.statsLabel}>Tổng tiết kiệm/tháng</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
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
  totalCard: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  totalLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8 },
  totalAmount: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 16 },
  totalProgressBar: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  totalProgressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 6 },
  totalPercentage: { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  aiCard: {
    backgroundColor: "rgba(139,92,246,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.3)",
  },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  aiText: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 8 },
  aiHighlight: { color: "#8B5CF6", fontWeight: "900" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16 },
  goalCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  goalInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  goalIcon: { fontSize: 24 },
  goalTitleContainer: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 4 },
  goalDeadline: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  warningBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  warningText: { fontSize: 16 },
  goalAmounts: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  amountLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, textAlign: "center" },
  amountValue: { fontSize: 14, fontWeight: "800", color: "#fff", textAlign: "center" },
  amountDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.7)", minWidth: 40 },
  goalStats: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statIcon: { fontSize: 14, marginRight: 6 },
  statText: { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "600" },
  goalActions: { flexDirection: "row", gap: 8 },
  actionButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  actionButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  actionButtonTextSecondary: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 13 },
  statsCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16, textAlign: "center" },
  statsGrid: { flexDirection: "row", justifyContent: "space-around" },
  statsItem: { alignItems: "center" },
  statsValue: { fontSize: 24, fontWeight: "900", color: "#6366F1", marginBottom: 4 },
  statsLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center" },
});
