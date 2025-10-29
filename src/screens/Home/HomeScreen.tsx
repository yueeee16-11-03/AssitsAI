import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [loading] = useState(false);
  const [chatPulse] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(chatPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(chatPulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [chatPulse]);

  const sampleBars = [50, 75, 40, 90, 60, 80];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Chào,</Text>
          <Text style={styles.username}>Người dùng</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate("Notification")}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.familyButton}
            onPress={() => navigation.navigate("FamilyOverview")}
          >
            <Text style={styles.familyIcon}>👨‍👩‍👧‍👦</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.profileInitial}>A</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("FinanceDashboard")}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>Tổng tài sản</Text>
            <Text style={styles.cardAmount}>₫ 24,560,000</Text>
            <Text style={styles.cardSub}>Thu nhập 7 ngày: ₫ 8,200,000</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.card, styles.smallCard]}
            onPress={() => navigation.navigate('DailyGoalsDetail')}
            activeOpacity={0.8}
          >
            <Text style={styles.cardTitle}>Mục tiêu hôm nay</Text>
            <Text style={styles.goalCount}>3 việc</Text>
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('DailyGoalsDetail')}>
              <Text style={styles.viewAllText}>Xem</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <TouchableOpacity
            style={styles.insightButton}
            onPress={() => navigation.navigate("AIInsight")}
            activeOpacity={0.8}
          >
            <Text style={styles.insightButtonText}>📊 Xem phân tích AI</Text>
          </TouchableOpacity>
          <View style={styles.chart}>
            {sampleBars.map((v, i) => (
              <View key={i} style={styles.barColumn}>
                <View style={[styles.bar, { height: `${v}%`, backgroundColor: i % 2 ? "#8B5CF6" : "#6366F1" }]} />
                <Text style={styles.barLabel}>T{i + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thói quen</Text>
          <TouchableOpacity
            style={styles.aiCoachButton}
            onPress={() => navigation.navigate("AIHabitCoach")}
            activeOpacity={0.8}
          >
            <Text style={styles.aiCoachButtonText}>🤖 AI Coach</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => navigation.navigate("DailyCheckIn")}
            activeOpacity={0.8}
          >
            <Text style={styles.checkInButtonText}>✓ Check-in hôm nay</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.habitDashboardButton}
            onPress={() => navigation.navigate("HabitDashboard")}
            activeOpacity={0.8}
          >
            <Text style={styles.habitDashboardButtonText}>🎯 Xem tất cả thói quen</Text>
          </TouchableOpacity>
          <View style={styles.habits}>
            <View style={styles.habitRow}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>Uống nước</Text>
                <Text style={styles.habitMeta}>4/8 cốc</Text>
              </View>
              <View style={styles.habitProgress}>
                <View style={[styles.progressFill, { width: "50%" }]} />
              </View>
            </View>

            <View style={styles.habitRow}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>Đi bộ</Text>
                <Text style={styles.habitMeta}>5000 bước</Text>
              </View>
              <View style={styles.habitProgress}>
                <View style={[styles.progressFill, { width: "65%", backgroundColor: "#EC4899" }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mục tiêu hôm nay</Text>
          <TouchableOpacity
            style={styles.goalTrackingButton}
            onPress={() => navigation.navigate("GoalTracking")}
            activeOpacity={0.8}
          >
            <Text style={styles.goalTrackingButtonText}>🎯 Xem tất cả mục tiêu</Text>
          </TouchableOpacity>
          <View style={styles.goals}>
            <TouchableOpacity style={styles.goalItem}>
              <Text style={styles.goalText}>Hoàn thành báo cáo</Text>
              <Text style={styles.goalMeta}>2h</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.goalItem}>
              <Text style={styles.goalText}>Gọi khách hàng</Text>
              <Text style={styles.goalMeta}>30m</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AI Recommendations Banner */}
        <TouchableOpacity
          style={styles.recommendationBanner}
          onPress={() => navigation.navigate("AIRecommendation")}
          activeOpacity={0.9}
        >
          <Text style={styles.bannerIcon}>🎯</Text>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>6 gợi ý thông minh</Text>
            <Text style={styles.bannerSubtitle}>Tiết kiệm ₫650K • Tăng 5h năng suất</Text>
          </View>
          <Text style={styles.bannerArrow}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      <Animated.View
        style={[
          styles.fab,
          {
            transform: [
              {
                scale: chatPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate("AIChat")}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>💬</Text>
        </TouchableOpacity>
      </Animated.View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00897B" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { color: "#999999", fontSize: 14 },
  username: { color: "#00796B", fontSize: 22, fontWeight: "800" },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: { color: "#00796B", fontWeight: "800" },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    fontSize: 20,
  },
  familyButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  familyIcon: {
    fontSize: 20,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  content: { paddingHorizontal: 24, paddingBottom: 24 },
  row: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "rgba(0, 137, 123, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 137, 123, 0.15)",
  },
  smallCard: { flex: 0.6, justifyContent: "space-between" },
  cardTitle: { color: "#00796B", fontSize: 13, marginBottom: 8 },
  cardAmount: { color: "#333333", fontSize: 20, fontWeight: "800" },
  cardSub: { color: "#999999", fontSize: 12, marginTop: 8 },
  viewAllBtn: { marginTop: 12, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "rgba(99,102,241,0.15)" },
  viewAllText: { color: "#6366F1", fontWeight: "700" },
  goalCount: { color: "#333333", fontSize: 22, fontWeight: "800" },

  section: { marginBottom: 20 },
  sectionTitle: { color: "#00796B", fontSize: 16, fontWeight: "700", marginBottom: 12 },

  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    paddingHorizontal: 8,
    backgroundColor: "rgba(0, 137, 123, 0.06)",
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 137, 123, 0.12)",
  },
  barColumn: { flex: 1, alignItems: "center" },
  bar: { width: 18, borderRadius: 6 },
  barLabel: { color: "#999999", fontSize: 11, marginTop: 8 },

  habits: {},
  habitRow: { marginBottom: 12 },
  habitInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  habitName: { color: "#00796B", fontWeight: "700" },
  habitMeta: { color: "#999999" },
  habitProgress: { height: 8, backgroundColor: "rgba(0, 137, 123, 0.15)", borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#6366F1", width: "40%" },

  goals: {},
  goalItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(0, 137, 123, 0.06)", padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "rgba(0, 137, 123, 0.12)" },
  goalText: { color: "#00796B", fontWeight: "700" },
  goalMeta: { color: "#999999" },

  fab: { position: "absolute", right: 20, bottom: 30 },
  fabButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center", shadowColor: "#6366F1", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  fabIcon: { fontSize: 24, color: "#FFFFFF" },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },

  insightButton: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  insightButtonText: {
    color: "#6366F1",
    fontWeight: "700",
    fontSize: 14,
  },

  recommendationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(236,72,153,0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.3)",
  },
  bannerIcon: { fontSize: 32, marginRight: 12 },
  bannerContent: { flex: 1 },
  bannerTitle: { color: "#00796B", fontSize: 16, fontWeight: "800", marginBottom: 4 },
  bannerSubtitle: { color: "#999999", fontSize: 12 },
  bannerArrow: { fontSize: 20, color: "#EC4899", fontWeight: "700" },

  budgetButton: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  budgetButtonText: {
    color: "#8B5CF6",
    fontWeight: "700",
    fontSize: 14,
  },
  goalTrackingButton: {
    backgroundColor: "rgba(236,72,153,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  goalTrackingButtonText: {
    color: "#EC4899",
    fontWeight: "700",
    fontSize: 14,
  },
  habitDashboardButton: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  habitDashboardButtonText: {
    color: "#3B82F6",
    fontWeight: "700",
    fontSize: 14,
  },
  checkInButton: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  checkInButtonText: {
    color: "#10B981",
    fontWeight: "700",
    fontSize: 14,
  },
  aiCoachButton: {
    backgroundColor: "rgba(139,92,246,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  aiCoachButtonText: {
    color: "#8B5CF6",
    fontWeight: "700",
    fontSize: 14,
  },
});
