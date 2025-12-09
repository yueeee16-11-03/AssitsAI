import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, "SharedGoal">;

interface SharedGoal {
  id: string;
  title: string;
  icon: string;
  target: number;
  current: number;
  deadline: string;
  contributors: Contributor[];
  category: string;
}

interface Contributor {
  id: string;
  name: string;
  avatar: string;
  contribution: number;
  suggested: number;
  color: string;
}

export default function SharedGoalScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const sharedGoals: SharedGoal[] = [
    {
      id: "1",
      title: "Du lịch Đà Lạt gia đình",
      icon: "airplane",
      target: 30000000,
      current: 18000000,
      deadline: "01/06/2025",
      category: "Giải trí",
      contributors: [
        { id: "1", name: "Bố", avatar: "account", contribution: 10000000, suggested: 12000000, color: "#6366F1" },
        { id: "2", name: "Mẹ", avatar: "account-outline", contribution: 8000000, suggested: 10000000, color: "#EC4899" },
        { id: "3", name: "Con trai", avatar: "human-child", contribution: 0, suggested: 4000000, color: "#10B981" },
        { id: "4", name: "Con gái", avatar: "human-female", contribution: 0, suggested: 4000000, color: "#F59E0B" },
      ],
    },
    {
      id: "2",
      title: "Quỹ học phí con",
      icon: "school",
      target: 100000000,
      current: 45000000,
      deadline: "01/09/2025",
      category: "Giáo dục",
      contributors: [
        { id: "1", name: "Bố", avatar: "account", contribution: 25000000, suggested: 30000000, color: "#6366F1" },
        { id: "2", name: "Mẹ", avatar: "account-outline", contribution: 20000000, suggested: 25000000, color: "#EC4899" },
        { id: "3", name: "Con trai", avatar: "human-child", contribution: 0, suggested: 0, color: "#10B981" },
        { id: "4", name: "Con gái", avatar: "human-female", contribution: 0, suggested: 0, color: "#F59E0B" },
      ],
    },
    {
      id: "3",
      title: "Sửa chữa nhà cửa",
      icon: "home-variant",
      target: 50000000,
      current: 15000000,
      deadline: "31/12/2024",
      category: "Gia đình",
      contributors: [
        { id: "1", name: "Bố", avatar: "account", contribution: 10000000, suggested: 20000000, color: "#6366F1" },
        { id: "2", name: "Mẹ", avatar: "account-outline", contribution: 5000000, suggested: 15000000, color: "#EC4899" },
        { id: "3", name: "Con trai", avatar: "human-child", contribution: 0, suggested: 0, color: "#10B981" },
        { id: "4", name: "Con gái", avatar: "human-female", contribution: 0, suggested: 0, color: "#F59E0B" },
      ],
    },
  ];

  const totalTarget = sharedGoals.reduce((sum, g) => sum + g.target, 0);
  const totalCurrent = sharedGoals.reduce((sum, g) => sum + g.current, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mục tiêu chung</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tổng mục tiêu gia đình</Text>
            <Text style={styles.summaryAmount}>₫{totalTarget.toLocaleString("vi-VN")}</Text>
            <View style={styles.summaryProgress}>
              <View style={[styles.summaryProgressFill, { width: `${(totalCurrent / totalTarget) * 100}%` }]} />
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.statLabel}>Đã góp</Text>
                <Text style={[styles.statValue, { color: "#10B981" }]}>₫{(totalCurrent / 1000000).toFixed(1)}M</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.statLabel}>Còn lại</Text>
                <Text style={[styles.statValue, { color: "#F59E0B" }]}>₫{((totalTarget - totalCurrent) / 1000000).toFixed(1)}M</Text>
              </View>
            </View>
          </View>

          {/* AI Allocation Card */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Icon name="robot" size={18} color="#6366F1" style={{ marginRight: 8 }} />
              <Text style={styles.aiTitle}>Gợi ý phân bổ AI</Text>
            </View>
            <Text style={styles.aiText}>
              AI đã phân tích thu nhập và chi tiêu của từng thành viên. Dưới đây là gợi ý đóng góp công bằng cho mỗi mục tiêu:
            </Text>
            <View style={styles.aiInsight}>
              <Icon name="lightbulb-on" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.aiInsightText}>
                Bố và Mẹ nên đóng góp nhiều hơn vì thu nhập ổn định. Con cái có thể đóng góp từ tiền lì xì hoặc học bổng.
              </Text>
            </View>
          </View>

          {/* Shared Goals List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mục tiêu ({sharedGoals.length})</Text>
            {sharedGoals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              const remaining = goal.target - goal.current;
              
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Icon name={goal.icon as any} size={24} color="#00796B" />
                      <View style={styles.goalDetails}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <Text style={styles.goalCategory}>{goal.category} • <Icon name="calendar" size={12} color="#999" /> {goal.deadline}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.goalAmounts}>
                    <Text style={styles.goalCurrent}>₫{(goal.current / 1000000).toFixed(1)}M</Text>
                    <Text style={styles.goalTarget}>/ ₫{(goal.target / 1000000).toFixed(1)}M</Text>
                  </View>

                  <View style={styles.goalProgress}>
                    <View style={[styles.goalProgressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.goalPercent}>{progress.toFixed(0)}% • Còn ₫{(remaining / 1000000).toFixed(1)}M</Text>

                  {/* Contributors */}
                  <View style={styles.contributorsSection}>
                    <Text style={styles.contributorsTitle}>Đóng góp thành viên</Text>
                    {goal.contributors.map((contributor) => (
                      <View key={contributor.id} style={styles.contributorRow}>
                        <View style={styles.contributorInfo}>
                          <View style={[styles.contributorAvatar, { backgroundColor: `${contributor.color}22` }]}>
                            <Icon name={contributor.avatar as any} size={20} color={contributor.color} />
                          </View>
                          <Text style={styles.contributorName}>{contributor.name}</Text>
                        </View>
                        <View style={styles.contributorAmounts}>
                          <View style={styles.amountColumn}>
                            <Text style={styles.amountLabel}>Đã góp</Text>
                            <Text style={styles.amountValue}>₫{(contributor.contribution / 1000000).toFixed(1)}M</Text>
                          </View>
                          <View style={styles.amountColumn}>
                            <Text style={styles.amountLabel}>AI gợi ý</Text>
                            <Text style={[styles.amountValue, { color: contributor.color }]}>
                              ₫{(contributor.suggested / 1000000).toFixed(1)}M
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.goalActions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => Alert.alert("Đóng góp", `Thêm tiền vào "${goal.title}"`)}>
                      <Icon name="currency-usd" size={16} color="#00796B" style={{ marginRight: 8 }} />
                      <Text style={styles.actionBtnText}>Đóng góp</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
                      <Text style={styles.actionBtnTextSecondary}>Chi tiết</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("GoalTracking")}>
              <Icon name="target" size={32} color="#00796B" style={{ marginBottom: 8 }} />
              <Text style={styles.actionText}>Mục tiêu cá nhân</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("FamilyOverview")}>
              <Icon name="account-group" size={32} color="#00796B" style={{ marginBottom: 8 }} />
              <Text style={styles.actionText}>Tổng quan gia đình</Text>
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
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#00897B", alignItems: "center", justifyContent: "center" },
  addIcon: { fontSize: 24, color: "#fff", fontWeight: "700" },
  content: { padding: 16 },
  summaryCard: { backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  summaryLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, textAlign: "center" },
  summaryAmount: { fontSize: 32, fontWeight: "900", color: "#333333", marginBottom: 16, textAlign: "center" },
  summaryProgress: { height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 16 },
  summaryProgressFill: { height: "100%", backgroundColor: "#00897B", borderRadius: 4 },
  summaryStats: { flexDirection: "row", justifyContent: "space-around" },
  summaryStat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "800" },
  statDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)" },
  aiCard: { backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#00796B" },
  aiText: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 12 },
  aiInsight: { flexDirection: "row", backgroundColor: "rgba(139,92,246,0.15)", borderRadius: 12, padding: 12 },
  aiInsightIcon: { fontSize: 20, marginRight: 8 },
  aiInsightText: { flex: 1, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 18 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16 },
  goalCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 16 },
  goalHeader: { marginBottom: 12 },
  goalInfo: { flexDirection: "row", alignItems: "center" },
  goalIcon: { fontSize: 32, marginRight: 12 },
  goalDetails: { flex: 1 },
  goalTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 4 },
  goalCategory: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  goalAmounts: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  goalCurrent: { fontSize: 20, fontWeight: "900", color: "#6366F1" },
  goalTarget: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginLeft: 4 },
  goalProgress: { height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  goalProgressFill: { height: "100%", backgroundColor: "#00897B", borderRadius: 4 },
  goalPercent: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 16 },
  contributorsSection: { marginBottom: 12 },
  contributorsTitle: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.8)", marginBottom: 12 },
  contributorRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingVertical: 8 },
  contributorInfo: { flexDirection: "row", alignItems: "center" },
  contributorAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 8 },
  contributorAvatarText: { fontSize: 16 },
  contributorName: { fontSize: 14, fontWeight: "700", color: "#00796B" },
  contributorAmounts: { flexDirection: "row", gap: 16 },
  amountColumn: { alignItems: "flex-end" },
  amountLabel: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 2 },
  amountValue: { fontSize: 13, fontWeight: "700", color: "#333333" },
  goalActions: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, backgroundColor: "#00897B", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  actionBtnSecondary: { backgroundColor: "rgba(255,255,255,0.06)" },
  actionBtnTextSecondary: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 13 },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600", textAlign: "center" },
});
