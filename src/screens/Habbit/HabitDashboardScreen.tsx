import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useHabitStore } from "../../store/habitStore";
import { useFocusEffect } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

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
    if (score >= 80) return { level: "Xuất sắc", color: "#10B981", icon: "trophy" };
    if (score >= 60) return { level: "Tốt", color: "#3B82F6", icon: "star" };
    if (score >= 40) return { level: "Trung bình", color: "#F59E0B", icon: "fire" };
    return { level: "Cần cải thiện", color: "#EF4444", icon: "trending-up" };
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
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thói quen</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate("AddHabit")}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
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
              <MaterialCommunityIcons name={discipline.icon} size={20} color={discipline.color} style={{ marginRight: 8 }} />
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
              <MaterialCommunityIcons name="robot" size={24} color="#8B5CF6" />
              <Text style={styles.aiTitle}>Đánh giá AI</Text>
            </View>
            <Text style={styles.aiText}>
              {disciplineScore >= 80 ? "Tuyệt vời! Bạn đang duy trì kỷ luật xuất sắc. Hãy tiếp tục phát huy!"
                : disciplineScore >= 60 ? "Bạn đang làm tốt! Hãy tập trung vào các thói quen chưa hoàn thành."
                : "Đừng bỏ cuộc! Hãy bắt đầu với 1-2 thói quen đơn giản và xây dựng từ đó."}
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
                <MaterialCommunityIcons name="inbox-multiple-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Bạn chưa có thói quen nào</Text>
                <TouchableOpacity
                  style={styles.addFirstHabitButton}
                  onPress={() => navigation.navigate("AddHabit")}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.addFirstHabitText}>Thêm thói quen đầu tiên</Text>
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
                            <MaterialCommunityIcons name="fire" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                            <Text style={styles.streakText}>{habit.currentStreak}</Text>
                          </View>
                        )}
                        <View style={[styles.checkbox, isCompletedToday && styles.checkboxCompleted, { borderColor: habit.color }]}>
                          {isCompletedToday && <MaterialCommunityIcons name="check" size={20} color="#10B981" />}
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
                <MaterialCommunityIcons name="chart-box" size={32} color="#059669" />
                <Text style={styles.actionText}>Xem báo cáo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => navigation.navigate("AIRecommendation")}
              >
                <MaterialCommunityIcons name="lightbulb" size={32} color="#F59E0B" />
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
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#059669", borderBottomWidth: 0 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#FFFFFF" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  addIcon: { fontSize: 24, color: "#FFFFFF", fontWeight: "700" },
  content: { padding: 16 },
  scoreCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, marginBottom: 20, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  scoreLabel: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 3, borderColor: "#059669" },
  scoreValue: { fontSize: 48, fontWeight: "900", color: "#059669" },
  scoreMax: { fontSize: 16, color: "#9CA3AF", fontWeight: "700" },
  levelBadge: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, flexDirection: "row", alignItems: "center", marginBottom: 16 },
  levelIcon: { fontSize: 20, marginRight: 8 },
  levelText: { fontSize: 16, fontWeight: "800", color: "#FFFFFF" },
  scoreStats: { flexDirection: "row", justifyContent: "space-around", width: "100%" },
  scoreStat: { alignItems: "center" },
  scoreStatValue: { fontSize: 18, fontWeight: "800", color: "#1F2937", marginBottom: 4 },
  scoreStatLabel: { fontSize: 11, color: "#9CA3AF" },
  statDivider: { width: 1, height: 40, backgroundColor: "#E5E7EB" },
  aiCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#1F2937" },
  aiText: { fontSize: 14, color: "#4B5563", lineHeight: 20, marginBottom: 8 },
  aiHighlight: { color: "#8B5CF6", fontWeight: "900" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1F2937", marginBottom: 16 },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6B7280", marginBottom: 16, fontWeight: "600" },
  addFirstHabitButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#059669", borderRadius: 12 },
  addFirstHabitText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  weekChart: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, height: 150, borderWidth: 1, borderColor: "#E5E7EB" },
  dayColumn: { flex: 1, alignItems: "center" },
  barContainer: { flex: 1, width: "60%", justifyContent: "flex-end", marginBottom: 8 },
  bar: { width: "100%", borderRadius: 4 },
  dayLabel: { fontSize: 11, color: "#4B5563", fontWeight: "700", marginBottom: 2 },
  dayCount: { fontSize: 10, color: "#9CA3AF" },
  habitCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  habitCardCompleted: { backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#DCFCE7" },
  habitHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  habitInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  habitIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 12, backgroundColor: "#F3F4F6" },
  habitIcon: { fontSize: 24 },
  habitDetails: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "800", color: "#1F2937", marginBottom: 4 },
  habitTarget: { fontSize: 13, color: "#6B7280" },
  habitRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  streakBadge: { backgroundColor: "#FEF3C7", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  streakText: { fontSize: 12, fontWeight: "700", color: "#92400E" },
  checkbox: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  checkboxCompleted: { backgroundColor: "#D1FAE5", borderColor: "#10B981" },
  checkmark: { fontSize: 18, fontWeight: "900", color: "#10B981" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBar: { flex: 1, height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, color: "#6B7280", fontWeight: "700", minWidth: 40 },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 14, fontWeight: "700", color: "#1F2937", marginTop: 8, textAlign: "center" },
});
