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

type Props = NativeStackScreenProps<RootStackParamList, "MemberDetail">;

export default function MemberDetailScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedTab, setSelectedTab] = useState<"finance" | "habits" | "goals">("finance");

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Mock data - sẽ nhận từ navigation params
  const member = {
    name: "Bố",
    avatar: "👨",
    role: "Trụ cột gia đình",
    color: "#6366F1",
  };

  const financeData = {
    income: 25000000,
    expense: 18000000,
    saving: 7000000,
    categories: [
      { name: "Ăn uống", amount: 6000000, color: "#EC4899" },
      { name: "Di chuyển", amount: 4000000, color: "#8B5CF6" },
      { name: "Nhà cửa", amount: 5000000, color: "#6366F1" },
      { name: "Khác", amount: 3000000, color: "#10B981" },
    ],
    recentTransactions: [
      { id: "1", type: "expense", amount: 150000, category: "Ăn uống", date: "Hôm nay", icon: "🍔" },
      { id: "2", type: "income", amount: 5000000, category: "Lương", date: "Hôm qua", icon: "💰" },
      { id: "3", type: "expense", amount: 500000, category: "Xăng xe", date: "2 ngày trước", icon: "⛽" },
    ],
  };

  const habitsData = [
    { id: "1", name: "Đọc sách", icon: "📚", completed: 15, total: 15, streak: 15, progress: 100 },
    { id: "2", name: "Tập gym", icon: "💪", completed: 12, total: 15, streak: 12, progress: 80 },
    { id: "3", name: "Thiền", icon: "🧘", completed: 10, total: 15, streak: 10, progress: 67 },
  ];

  const goalsData = [
    { id: "1", name: "Mua xe", icon: "🚗", target: 500000000, current: 180000000, deadline: "31/12/2025" },
    { id: "2", name: "Du lịch", icon: "✈️", target: 50000000, current: 25000000, deadline: "01/06/2025" },
    { id: "3", name: "Quỹ dự phòng", icon: "🏦", target: 100000000, current: 45000000, deadline: "31/12/2024" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết thành viên</Text>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Member Profile */}
          <View style={[styles.profileCard, { borderTopColor: member.color }]}>
            <View style={[styles.avatar, { backgroundColor: `${member.color}22` }]}>
              <Text style={styles.avatarText}>{member.avatar}</Text>
            </View>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberRole}>{member.role}</Text>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabSelector}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "finance" && styles.tabActive]}
              onPress={() => setSelectedTab("finance")}
            >
              <Text style={[styles.tabText, selectedTab === "finance" && styles.tabTextActive]}>
                💰 Tài chính
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "habits" && styles.tabActive]}
              onPress={() => setSelectedTab("habits")}
            >
              <Text style={[styles.tabText, selectedTab === "habits" && styles.tabTextActive]}>
                ✓ Thói quen
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === "goals" && styles.tabActive]}
              onPress={() => setSelectedTab("goals")}
            >
              <Text style={[styles.tabText, selectedTab === "goals" && styles.tabTextActive]}>
                🎯 Mục tiêu
              </Text>
            </TouchableOpacity>
          </View>

          {/* Finance Tab */}
          {selectedTab === "finance" && (
            <View>
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Thu nhập</Text>
                    <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                      ₫{(financeData.income / 1000000).toFixed(1)}M
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Chi tiêu</Text>
                    <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
                      ₫{(financeData.expense / 1000000).toFixed(1)}M
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tiết kiệm</Text>
                    <Text style={[styles.summaryValue, { color: "#6366F1" }]}>
                      ₫{(financeData.saving / 1000000).toFixed(1)}M
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chi tiêu theo danh mục</Text>
                {financeData.categories.map((cat, index) => {
                  const percent = (cat.amount / financeData.expense) * 100;
                  return (
                    <View key={index} style={styles.categoryCard}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                        <Text style={styles.categoryAmount}>₫{(cat.amount / 1000000).toFixed(1)}M</Text>
                      </View>
                      <View style={styles.categoryProgress}>
                        <View style={[styles.categoryFill, { width: `${percent}%`, backgroundColor: cat.color }]} />
                      </View>
                    </View>
                  );
                })}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
                {financeData.recentTransactions.map((trans) => (
                  <View key={trans.id} style={styles.transactionCard}>
                    <Text style={styles.transIcon}>{trans.icon}</Text>
                    <View style={styles.transInfo}>
                      <Text style={styles.transCategory}>{trans.category}</Text>
                      <Text style={styles.transDate}>{trans.date}</Text>
                    </View>
                    <Text style={[styles.transAmount, { color: trans.type === "income" ? "#10B981" : "#EF4444" }]}>
                      {trans.type === "income" ? "+" : "-"}₫{(trans.amount / 1000).toFixed(0)}K
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Habits Tab */}
          {selectedTab === "habits" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thói quen ({habitsData.length})</Text>
              {habitsData.map((habit) => (
                <View key={habit.id} style={styles.habitCard}>
                  <View style={styles.habitHeader}>
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      <Text style={styles.habitMeta}>
                        {habit.completed}/{habit.total} ngày • 🔥 {habit.streak}
                      </Text>
                    </View>
                    <Text style={styles.habitPercent}>{habit.progress}%</Text>
                  </View>
                  <View style={styles.habitProgress}>
                    <View style={[styles.habitFill, { width: `${habit.progress}%` }]} />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Goals Tab */}
          {selectedTab === "goals" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mục tiêu ({goalsData.length})</Text>
              {goalsData.map((goal) => {
                const progress = (goal.current / goal.target) * 100;
                return (
                  <View key={goal.id} style={styles.goalCard}>
                    <View style={styles.goalHeader}>
                      <Text style={styles.goalIcon}>{goal.icon}</Text>
                      <View style={styles.goalInfo}>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <Text style={styles.goalDeadline}>📅 {goal.deadline}</Text>
                      </View>
                    </View>
                    <View style={styles.goalAmounts}>
                      <Text style={styles.goalCurrent}>₫{(goal.current / 1000000).toFixed(1)}M</Text>
                      <Text style={styles.goalTarget}>/ ₫{(goal.target / 1000000).toFixed(1)}M</Text>
                    </View>
                    <View style={styles.goalProgress}>
                      <View style={[styles.goalFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.goalPercent}>{progress.toFixed(0)}%</Text>
                  </View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  editButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  editIcon: { fontSize: 20 },
  content: { padding: 16 },
  profileCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 20, padding: 24, marginBottom: 20, alignItems: "center", borderTopWidth: 4 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 48 },
  memberName: { fontSize: 24, fontWeight: "900", color: "#00796B", marginBottom: 4 },
  memberRole: { fontSize: 14, color: "rgba(255,255,255,0.6)" },
  tabSelector: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#00897B" },
  tabText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  tabTextActive: { color: "#FFFFFF" },
  summaryCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, marginBottom: 20 },
  summaryRow: { flexDirection: "row", justifyContent: "space-around" },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 12 },
  categoryCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, marginBottom: 8 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  categoryName: { fontSize: 14, fontWeight: "700", color: "#00796B" },
  categoryAmount: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  categoryProgress: { height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  categoryFill: { height: "100%", borderRadius: 3 },
  transactionCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 12, marginBottom: 8 },
  transIcon: { fontSize: 24, marginRight: 12 },
  transInfo: { flex: 1 },
  transCategory: { fontSize: 14, fontWeight: "700", color: "#00796B", marginBottom: 2 },
  transDate: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  transAmount: { fontSize: 15, fontWeight: "800" },
  habitCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12 },
  habitHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  habitIcon: { fontSize: 32, marginRight: 12 },
  habitInfo: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 4 },
  habitMeta: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  habitPercent: { fontSize: 18, fontWeight: "800", color: "#6366F1" },
  habitProgress: { height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  habitFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 3 },
  goalCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 12 },
  goalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  goalIcon: { fontSize: 32, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalName: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 4 },
  goalDeadline: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  goalAmounts: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  goalCurrent: { fontSize: 20, fontWeight: "900", color: "#6366F1" },
  goalTarget: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginLeft: 4 },
  goalProgress: { height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  goalFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 4 },
  goalPercent: { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "right" },
});
