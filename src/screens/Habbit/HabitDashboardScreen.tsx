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
import { useHabitStore } from "../../store/habitStore";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "HabitDashboard">;

export default function HabitDashboardScreen({ navigation }: Props) {
  const habits = useHabitStore((state) => state.habits);
  const fetchHabits = useHabitStore((state) => state.fetchHabits);
  const toggleHabitToday = useHabitStore.getState().deleteHabit ? 
    ((id: string) => {
      // Will implement toggleHabitToday properly
      console.log("Toggle habit:", id);
    }) : null;

  const [fadeAnim] = useState(new Animated.Value(0));

  // Fetch habits khi screen focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("📄 [HABIT-DASHBOARD] Screen focused - fetching habits");
      fetchHabits();
    }, [])
  );

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Tính toán stats
  const completedCount = habits.filter(h => {
    const today = new Date().toDateString();
    return h.completedDates?.includes(today);
  }).length;

  const completionRate = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;
  const totalStreak = habits.reduce((sum, h) => sum + (h.currentStreak || 0), 0);
  const avgStreak = habits.length > 0 ? totalStreak / habits.length : 0;
  const disciplineScore = Math.round((completionRate * 0.5) + (avgStreak * 2) + (completedCount * 5));

  const getDisciplineLevel = (score: number) => {
    if (score >= 80) return { level: "Xuất sắc", color: "#10B981", icon: "🏆" };
    if (score >= 60) return { level: "Tốt", color: "#3B82F6", icon: "⭐" };
    if (score >= 40) return { level: "Trung bình", color: "#F59E0B", icon: "💪" };
    return { level: "Cần cải thiện", color: "#EF4444", icon: "📈" };
  };

  const discipline = getDisciplineLevel(disciplineScore);

  const weekProgress = [
    { day: "T2", completed: 3, total: 5 }, { day: "T3", completed: 4, total: 5 },
    { day: "T4", completed: 5, total: 5 }, { day: "T5", completed: 4, total: 5 },
    { day: "T6", completed: 3, total: 5 }, { day: "T7", completed: 2, total: 5 },
    { day: "CN", completed: 2, total: 5 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thói quen</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("AddHabit")}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Discipline Score */}
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Mức kỷ luật hôm nay</Text>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{disciplineScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <View style={[styles.levelBadge, { backgroundColor: `${discipline.color}22` }]}>
              <Text style={styles.levelIcon}>{discipline.icon}</Text>
              <Text style={[styles.levelText, { color: discipline.color }]}>{discipline.level}</Text>
            </View>
            <View style={styles.scoreStats}>
              <View style={styles.scoreStat}>
                <Text style={styles.scoreStatValue}>{completedCount}/{habits.length}</Text>
                <Text style={styles.scoreStatLabel}>Hoàn thành</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.scoreStat}>
                <Text style={styles.scoreStatValue}>{avgStreak.toFixed(1)}</Text>
                <Text style={styles.scoreStatLabel}>Streak TB</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.scoreStat}>
                <Text style={styles.scoreStatValue}>{completionRate.toFixed(0)}%</Text>
                <Text style={styles.scoreStatLabel}>Tỷ lệ</Text>
              </View>
            </View>
          </View>

          {/* AI Evaluation */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiIcon}>🤖</Text>
              <Text style={styles.aiTitle}>Đánh giá AI</Text>
            </View>
            <Text style={styles.aiText}>
              {disciplineScore >= 80 ? "🎉 Tuyệt vời! Bạn đang duy trì kỷ luật xuất sắc. Hãy tiếp tục phát huy!"
                : disciplineScore >= 60 ? "👍 Bạn đang làm tốt! Hãy tập trung vào các thói quen chưa hoàn thành."
                : "💪 Đừng bỏ cuộc! Hãy bắt đầu với 1-2 thói quen đơn giản và xây dựng từ đó."}
            </Text>
            <Text style={styles.aiText}>
              💡 Gợi ý: Thói quen <Text style={styles.aiHighlight}>"Thiền"</Text> chưa được thực hiện. Hãy dành 5 phút trước khi ngủ.
            </Text>
          </View>

          {/* Week Progress Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiến độ tuần</Text>
            <View style={styles.weekChart}>
              {weekProgress.map((day, index) => {
                const percentage = (day.completed / day.total) * 100;
                return (
                  <View key={index} style={styles.dayColumn}>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: `${percentage}%`, backgroundColor: percentage === 100 ? "#10B981" : "#6366F1" }]} />
                    </View>
                    <Text style={styles.dayLabel}>{day.day}</Text>
                    <Text style={styles.dayCount}>{day.completed}/{day.total}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Habits List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thói quen hôm nay</Text>
            {habits.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>Bạn chưa có thói quen nào</Text>
                <TouchableOpacity
                  style={styles.addFirstHabitButton}
                  onPress={() => navigation.navigate("AddHabit")}
                >
                  <Text style={styles.addFirstHabitText}>+ Thêm thói quen đầu tiên</Text>
                </TouchableOpacity>
              </View>
            ) : (
              habits.map((habit) => {
                const today = new Date().toDateString();
                const isCompletedToday = habit.completedDates?.includes(today);
                const completedCount = habit.completedDates?.length || 0;

                return (
                  <TouchableOpacity
                    key={habit.id}
                    style={[styles.habitCard, isCompletedToday && styles.habitCardCompleted]}
                    onPress={() => navigation.navigate("EditHabit", { habitId: habit.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.habitHeader}>
                      <View style={styles.habitInfo}>
                        <View style={[styles.habitIconContainer, { backgroundColor: `${habit.color}22` }]}>
                          <Text style={styles.habitIcon}>{habit.icon}</Text>
                        </View>
                        <View style={styles.habitDetails}>
                          <Text style={styles.habitName}>{habit.name}</Text>
                          <Text style={styles.habitTarget}>{habit.target} {habit.unit}</Text>
                        </View>
                      </View>
                      <View style={styles.habitRight}>
                        {(habit.currentStreak || 0) > 0 && (
                          <View style={styles.streakBadge}>
                            <Text style={styles.streakText}>🔥 {habit.currentStreak}</Text>
                          </View>
                        )}
                        <View style={[styles.checkbox, isCompletedToday && styles.checkboxCompleted, { borderColor: habit.color }]}>
                          {isCompletedToday && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                      </View>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View 
                          style={[
                            styles.progressFill, 
                            { 
                              width: `${Math.min((completedCount / 30) * 100, 100)}%`,
                              backgroundColor: habit.color 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.progressText}>{completedCount} lần</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("HabitReport")}
              >
                <Text style={styles.actionIcon}>📊</Text>
                <Text style={styles.actionText}>Xem báo cáo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("AIRecommendation")}
              >
                <Text style={styles.actionIcon}>💡</Text>
                <Text style={styles.actionText}>Gợi ý AI</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" },
  addIcon: { fontSize: 24, color: "#fff", fontWeight: "700" },
  content: { padding: 16 },
  scoreCard: { backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 20, padding: 24, marginBottom: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  scoreLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(99,102,241,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 4, borderColor: "#6366F1" },
  scoreValue: { fontSize: 48, fontWeight: "900", color: "#fff" },
  scoreMax: { fontSize: 16, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  levelBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  levelIcon: { fontSize: 20, marginRight: 8 },
  levelText: { fontSize: 16, fontWeight: "800" },
  scoreStats: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
  scoreStat: { alignItems: "center" },
  scoreStatValue: { fontSize: 18, fontWeight: "800", color: "#fff", marginBottom: 4 },
  scoreStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  statDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.1)" },
  aiCard: { backgroundColor: "rgba(139,92,246,0.1)", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  aiText: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 20, marginBottom: 8 },
  aiHighlight: { color: "#8B5CF6", fontWeight: "900" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "rgba(255,255,255,0.6)", marginBottom: 16, fontWeight: "600" },
  addFirstHabitButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#6366F1", borderRadius: 12 },
  addFirstHabitText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  weekChart: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, height: 150 },
  dayColumn: { flex: 1, alignItems: "center" },
  barContainer: { flex: 1, width: "60%", justifyContent: "flex-end", marginBottom: 8 },
  bar: { width: "100%", borderRadius: 4 },
  dayLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: 2 },
  dayCount: { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  habitCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  habitCardCompleted: { backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" },
  habitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  habitInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  habitIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 12 },
  habitIcon: { fontSize: 24 },
  habitDetails: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 4 },
  habitTarget: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  habitRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakBadge: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  streakText: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.9)" },
  checkbox: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkboxCompleted: { backgroundColor: "rgba(16,185,129,0.2)" },
  checkmark: { fontSize: 18, fontWeight: "900", color: "#10B981" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: "700", minWidth: 40 },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600", textAlign: "center" },
});
