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
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "FamilyOverview">;

interface FamilyMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  finance: {
    income: number;
    expense: number;
    saving: number;
  };
  habits: {
    completed: number;
    total: number;
    streak: number;
  };
  goals: number;
  color: string;
}

export default function FamilyOverviewScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const familyMembers: FamilyMember[] = [
    {
      id: "1",
      name: "Bố",
      avatar: "👨",
      role: "Trụ cột gia đình",
      finance: { income: 25000000, expense: 18000000, saving: 7000000 },
      habits: { completed: 4, total: 5, streak: 15 },
      goals: 3,
      color: "#6366F1",
    },
    {
      id: "2",
      name: "Mẹ",
      avatar: "👩",
      role: "Quản lý tài chính",
      finance: { income: 15000000, expense: 12000000, saving: 3000000 },
      habits: { completed: 5, total: 5, streak: 20 },
      goals: 4,
      color: "#EC4899",
    },
    {
      id: "3",
      name: "Con trai",
      avatar: "👦",
      role: "Học sinh",
      finance: { income: 2000000, expense: 1500000, saving: 500000 },
      habits: { completed: 3, total: 4, streak: 8 },
      goals: 2,
      color: "#10B981",
    },
    {
      id: "4",
      name: "Con gái",
      avatar: "👧",
      role: "Học sinh",
      finance: { income: 1500000, expense: 1200000, saving: 300000 },
      habits: { completed: 4, total: 4, streak: 12 },
      goals: 3,
      color: "#F59E0B",
    },
  ];

  const totalIncome = familyMembers.reduce((sum, m) => sum + m.finance.income, 0);
  const totalExpense = familyMembers.reduce((sum, m) => sum + m.finance.expense, 0);
  const totalSaving = familyMembers.reduce((sum, m) => sum + m.finance.saving, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gia đình</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("FamilyChat")}
        >
          <Text style={styles.addIcon}>💬</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Family Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Tổng quan gia đình</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Thu nhập</Text>
                <Text style={[styles.summaryValue, { color: "#10B981" }]}>
                  ₫{(totalIncome / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Chi tiêu</Text>
                <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
                  ₫{(totalExpense / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tiết kiệm</Text>
                <Text style={[styles.summaryValue, { color: "#6366F1" }]}>
                  ₫{(totalSaving / 1000000).toFixed(1)}M
                </Text>
              </View>
            </View>
            <View style={styles.summaryProgress}>
              <View style={[styles.summaryProgressFill, { width: `${(totalSaving / totalIncome) * 100}%` }]} />
            </View>
            <Text style={styles.summaryPercentage}>
              {((totalSaving / totalIncome) * 100).toFixed(1)}% tỷ lệ tiết kiệm
            </Text>
          </View>

          {/* Family Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thành viên ({familyMembers.length})</Text>
            {familyMembers.map((member) => {
              const habitRate = (member.habits.completed / member.habits.total) * 100;

              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.memberCard, { borderLeftColor: member.color }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("MemberDetail")}
                >
                  <View style={styles.memberHeader}>
                    <View style={styles.memberInfo}>
                      <View style={[styles.memberAvatar, { backgroundColor: `${member.color}22` }]}>
                        <Text style={styles.memberAvatarText}>{member.avatar}</Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberRole}>{member.role}</Text>
                      </View>
                    </View>
                    <View style={[styles.memberBadge, { backgroundColor: `${member.color}22` }]}>
                      <Text style={[styles.memberBadgeText, { color: member.color }]}>
                        {habitRate.toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* Finance Stats */}
                  <View style={styles.memberStats}>
                    <View style={styles.statRow}>
                      <Text style={styles.statIcon}>💰</Text>
                      <View style={styles.statInfo}>
                        <Text style={styles.statLabel}>Thu nhập</Text>
                        <Text style={styles.statValue}>
                          ₫{(member.finance.income / 1000000).toFixed(1)}M
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statIcon}>💸</Text>
                      <View style={styles.statInfo}>
                        <Text style={styles.statLabel}>Chi tiêu</Text>
                        <Text style={styles.statValue}>
                          ₫{(member.finance.expense / 1000000).toFixed(1)}M
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statRow}>
                      <Text style={styles.statIcon}>🎯</Text>
                      <View style={styles.statInfo}>
                        <Text style={styles.statLabel}>Tiết kiệm</Text>
                        <Text style={[styles.statValue, { color: member.color }]}>
                          ₫{(member.finance.saving / 1000000).toFixed(1)}M
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Habits Progress */}
                  <View style={styles.memberHabits}>
                    <View style={styles.habitInfo}>
                      <Text style={styles.habitLabel}>Thói quen</Text>
                      <Text style={styles.habitValue}>
                        {member.habits.completed}/{member.habits.total}
                      </Text>
                    </View>
                    <View style={styles.habitProgress}>
                      <View
                        style={[
                          styles.habitProgressFill,
                          { width: `${habitRate}%`, backgroundColor: member.color },
                        ]}
                      />
                    </View>
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitStreak}>🔥 {member.habits.streak} ngày</Text>
                      <Text style={styles.habitGoals}>🎯 {member.goals} mục tiêu</Text>
                    </View>
                  </View>

                  {/* Quick Actions */}
                  <View style={styles.memberActions}>
                    <TouchableOpacity style={styles.actionBtn}>
                      <Text style={styles.actionBtnText}>Chi tiết</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]}>
                      <Text style={styles.actionBtnTextPrimary}>Nhắc nhở</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AI Family Insights */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiIcon}>🤖</Text>
              <Text style={styles.aiTitle}>Phân tích AI</Text>
            </View>
            <Text style={styles.aiText}>
              💡 <Text style={styles.aiBold}>Mẹ</Text> đang duy trì thói quen tốt nhất với 100% hoàn thành.
              Cả gia đình nên học hỏi!
            </Text>
            <Text style={styles.aiText}>
              ⚠️ <Text style={styles.aiBold}>Con trai</Text> cần cải thiện thói quen đọc sách.
              Đề xuất đặt nhắc nhở 8PM mỗi tối.
            </Text>
            <Text style={styles.aiText}>
              📊 Gia đình đang tiết kiệm được <Text style={styles.aiHighlight}>
                {((totalSaving / totalIncome) * 100).toFixed(1)}%
              </Text> thu nhập. Mục tiêu là 25%!
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("SharedGoal")}>
              <Text style={styles.actionIcon}>🎯</Text>
              <Text style={styles.actionText}>Mục tiêu chung</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("FinanceDashboard")}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionText}>Tài chính</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E27" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" },
  addIcon: { fontSize: 24, color: "#fff", fontWeight: "700" },
  content: { padding: 16 },
  summaryCard: { backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 16, textAlign: "center" },
  summaryStats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)" },
  summaryProgress: { height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  summaryProgressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 4 },
  summaryPercentage: { fontSize: 13, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16 },
  memberCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4 },
  memberHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  memberInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  memberAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginRight: 12 },
  memberAvatarText: { fontSize: 32 },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 4 },
  memberRole: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  memberBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  memberBadgeText: { fontSize: 16, fontWeight: "800" },
  memberStats: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  statRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  statIcon: { fontSize: 20, marginRight: 6 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: "700", color: "#fff" },
  memberHabits: { marginBottom: 12 },
  habitInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  habitLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  habitValue: { fontSize: 13, color: "#fff", fontWeight: "700" },
  habitProgress: { height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  habitProgressFill: { height: "100%", borderRadius: 3 },
  habitMeta: { flexDirection: "row", justifyContent: "space-between" },
  habitStreak: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  habitGoals: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  memberActions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  actionBtnText: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 13 },
  actionBtnPrimary: { backgroundColor: "#6366F1" },
  actionBtnTextPrimary: { color: "#fff", fontWeight: "700", fontSize: 13 },
  aiCard: { backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  aiText: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 8 },
  aiBold: { fontWeight: "800", color: "#fff" },
  aiHighlight: { color: "#8B5CF6", fontWeight: "900" },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600", textAlign: "center" },
});
