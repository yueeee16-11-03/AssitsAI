import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;

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
      avatar: "account",
      role: "Trụ cột gia đình",
      finance: { income: 25000000, expense: 18000000, saving: 7000000 },
      habits: { completed: 4, total: 5, streak: 15 },
      goals: 3,
      color: "#6366F1",
    },
    {
      id: "2",
      name: "Mẹ",
      avatar: "account-outline",
      role: "Quản lý tài chính",
      finance: { income: 15000000, expense: 12000000, saving: 3000000 },
      habits: { completed: 5, total: 5, streak: 20 },
      goals: 4,
      color: "#EC4899",
    },
    {
      id: "3",
      name: "Con trai",
      avatar: "human-child",
      role: "Học sinh",
      finance: { income: 2000000, expense: 1500000, saving: 500000 },
      habits: { completed: 3, total: 4, streak: 8 },
      goals: 2,
      color: "#10B981",
    },
    {
      id: "4",
      name: "Con gái",
      avatar: "human-female",
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gia đình</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("FamilyChat")}
        >
          <Icon name="message-text" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
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
                        <Icon name={member.avatar as any} size={32} color={member.color} />
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
                      <Icon name="currency-usd" size={20} color="#10B981" style={{ marginRight: 6 }} />
                      <View style={styles.statInfo}>
                        <Text style={styles.statLabel}>Thu nhập</Text>
                        <Text style={styles.statValue}>
                          ₫{(member.finance.income / 1000000).toFixed(1)}M
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statRow}>
                      <Icon name="cash-remove" size={20} color="#EF4444" style={{ marginRight: 6 }} />
                      <View style={styles.statInfo}>
                        <Text style={styles.statLabel}>Chi tiêu</Text>
                        <Text style={styles.statValue}>
                          ₫{(member.finance.expense / 1000000).toFixed(1)}M
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statRow}>
                      <Icon name="piggy-bank" size={20} color={member.color} style={{ marginRight: 6 }} />
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
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="fire" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={styles.habitStreak}>{member.habits.streak} ngày</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="target" size={12} color="#00796B" style={{ marginRight: 4 }} />
                        <Text style={styles.habitGoals}>{member.goals} mục tiêu</Text>
                      </View>
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
              <Icon name="robot" size={24} color="#8B5CF6" style={{ marginRight: 8 }} />
              <Text style={styles.aiTitle}>Phân tích AI</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Icon name="lightbulb-on" size={14} color="#F59E0B" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.aiText}>
                <Text style={styles.aiBold}>Mẹ</Text> đang duy trì thói quen tốt nhất với 100% hoàn thành.
                Cả gia đình nên học hỏi!
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Icon name="alert" size={14} color="#EF4444" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.aiText}>
                <Text style={styles.aiBold}>Con trai</Text> cần cải thiện thói quen đọc sách.
                Đề xuất đặt nhắc nhở 8PM mỗi tối.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 0 }}>
              <Icon name="chart-bar" size={14} color="#10B981" style={{ marginRight: 6, marginTop: 2 }} />
              <Text style={styles.aiText}>
                Gia đình đang tiết kiệm được <Text style={styles.aiHighlight}>
                  {((totalSaving / totalIncome) * 100).toFixed(1)}%
                </Text> thu nhập. Mục tiêu là 25%!
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("SharedGoal")}>
              <Icon name="target" size={32} color="#6366F1" style={{ marginBottom: 8 }} />
              <Text style={styles.actionText}>Mục tiêu chung</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("FinanceDashboard")}>
              <Icon name="cash-multiple" size={32} color="#10B981" style={{ marginBottom: 8 }} />
              <Text style={styles.actionText}>Tài chính</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0, 137, 123, 0.08)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00796B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" },
  addIcon: { fontSize: 24, color: "#00897B", fontWeight: "700" },
  content: { padding: 16 },
  summaryCard: { backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 20, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: "#00796B", marginBottom: 16, textAlign: "center" },
  summaryStats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 12, color: "#999999", marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryDivider: { width: 1, height: 40, backgroundColor: "rgba(0, 137, 123, 0.15)" },
  summaryProgress: { height: 8, backgroundColor: "rgba(0, 137, 123, 0.15)", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  summaryProgressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 4 },
  summaryPercentage: { fontSize: 13, color: "#999999", textAlign: "center" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16 },
  memberCard: { backgroundColor: "rgba(0, 137, 123, 0.06)", borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4 },
  memberHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  memberInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  memberAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginRight: 12 },
  memberAvatarText: { fontSize: 32 },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 18, fontWeight: "800", color: "#00796B", marginBottom: 4 },
  memberRole: { fontSize: 13, color: "#999999" },
  memberBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  memberBadgeText: { fontSize: 16, fontWeight: "800" },
  memberStats: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  statRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  statIcon: { fontSize: 20, marginRight: 6 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 11, color: "#999999", marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: "700", color: "#333333" },
  memberHabits: { marginBottom: 12 },
  habitInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  habitLabel: { fontSize: 13, color: "#00796B", fontWeight: "700" },
  habitValue: { fontSize: 13, color: "#333333", fontWeight: "700" },
  habitProgress: { height: 6, backgroundColor: "rgba(0, 137, 123, 0.15)", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  habitProgressFill: { height: "100%", borderRadius: 3 },
  habitMeta: { flexDirection: "row", justifyContent: "space-between" },
  habitStreak: { fontSize: 12, color: "#00796B", fontWeight: "700" },
  habitGoals: { fontSize: 12, color: "#00796B", fontWeight: "700" },
  memberActions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, backgroundColor: "rgba(0, 137, 123, 0.08)", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  actionBtnText: { color: "#00796B", fontWeight: "700", fontSize: 13 },
  actionBtnPrimary: { backgroundColor: "#6366F1" },
  actionBtnTextPrimary: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  aiCard: { backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#00796B" },
  aiText: { fontSize: 14, color: "#333333", lineHeight: 20, marginBottom: 8 },
  aiBold: { fontWeight: "800", color: "#00796B" },
  aiHighlight: { color: "#8B5CF6", fontWeight: "900" },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "rgba(0, 137, 123, 0.06)", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(0, 137, 123, 0.15)" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "#00796B", fontWeight: "600", textAlign: "center" },
});
