import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useHabitStore } from "../../store/habitStore";
import { useCheckInStore } from "../../store/checkInStore";
import { useFocusEffect } from "@react-navigation/native";

type Props = NativeStackScreenProps<RootStackParamList, "DailyCheckIn">;

export default function DailyCheckInScreen({ navigation }: Props) {
  // Habit Store
  const habits = useHabitStore((state) => state.habits);
  const habitsLoading = useHabitStore((state) => state.isLoading);
  const fetchHabits = useHabitStore((state) => state.fetchHabits);

  // CheckIn Store
  const todayCheckIns = useCheckInStore((state) => state.todayCheckIns);
  const totalPointsToday = useCheckInStore((state) => state.totalPointsToday);
  const checkInLoading = useCheckInStore((state) => state.isLoading);
  const toggleCheckInToday = useCheckInStore((state) => state.toggleCheckInToday);
  const getTodayAllCheckIns = useCheckInStore((state) => state.getTodayAllCheckIns);
  const getTodayTotalPoints = useCheckInStore((state) => state.getTodayTotalPoints);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [isTogglingHabit, setIsTogglingHabit] = useState<{ [key: string]: boolean }>({});

  // Load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log("📋 [DAILY-CHECK-IN] Screen focused - loading data");
      fetchHabits();
      getTodayAllCheckIns();
      getTodayTotalPoints();
    }, [fetchHabits, getTodayAllCheckIns, getTodayTotalPoints])
  );

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Calculate completion metrics
  const checkedCount = Object.values(todayCheckIns).filter((c: any) => c.completed).length;
  const completionRate = habits.length > 0 ? (checkedCount / habits.length) * 100 : 0;

  const handleCheckIn = async (habitId: string) => {
    try {
      setIsTogglingHabit(prev => ({ ...prev, [habitId]: true }));

      const habit = habits.find((h: any) => h.id === habitId);
      if (!habit) {
        Alert.alert("Lỗi", "Không tìm thấy thói quen");
        return;
      }

      // Call toggleCheckInToday with habit data for points calculation
      await toggleCheckInToday(habitId, {
        target: habit.target || 10,
        currentStreak: todayCheckIns[habitId]?.streak || 0,
        bestStreak: habit.bestStreak || 0,
      });

      // Refresh total points
      await getTodayTotalPoints();

      // Get new check-in status
      const newCheckIn = todayCheckIns[habitId];
      if (newCheckIn?.completed) {
        showEncouragement(habit, newCheckIn.points);
      }

      console.log(`✅ [DAILY-CHECK-IN] ${habit.name} toggled`);
    } catch (error) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Không thể cập nhật");
      console.error("❌ [DAILY-CHECK-IN] Error checking in:", error);
    } finally {
      setIsTogglingHabit(prev => ({ ...prev, [habitId]: false }));
    }
  };

  const showEncouragement = (habit: any, points: number) => {
    const messages = [
      `🎉 Tuyệt vời! +${points} điểm cho "${habit.name}"!`,
      `💪 Làm tốt lắm! Bạn đã hoàn thành "${habit.name}"`,
      `⭐ Xuất sắc! "${habit.name}" hoàn thành hôm nay`,
      `🔥 Tiếp tục phát huy! "${habit.name}" đã check-in`,
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    Alert.alert("Chúc mừng!", randomMessage);
  };

  const getAIMotivation = () => {
    if (completionRate === 100 && habits.length > 0) {
      return {
        message: "🏆 Hoàn hảo! Bạn đã hoàn thành tất cả thói quen hôm nay. Đây là một ngày tuyệt vời!",
        color: "#10B981",
        icon: "🏆",
      };
    } else if (completionRate >= 80) {
      return {
        message: "⭐ Xuất sắc! Bạn gần hoàn thành rồi. Hãy duy trì động lực này!",
        color: "#3B82F6",
        icon: "⭐",
      };
    } else if (completionRate >= 50) {
      return {
        message: "💪 Đang làm tốt! Hãy tiếp tục hoàn thành các thói quen còn lại nhé!",
        color: "#F59E0B",
        icon: "💪",
      };
    } else if (completionRate > 0) {
      return {
        message: "🌱 Bắt đầu tốt rồi! Mỗi bước nhỏ đều quan trọng. Hãy tiếp tục!",
        color: "#8B5CF6",
        icon: "🌱",
      };
    }
    return {
      message: "🎯 Hãy bắt đầu ngày mới với những thói quen tích cực! Bạn làm được!",
      color: "#EC4899",
      icon: "🎯",
    };
  };

  const motivation = getAIMotivation();

  const handleCompleteAll = () => {
    if (checkedCount === habits.length && habits.length > 0) {
      Alert.alert(
        "Hoàn thành!",
        `Bạn đã nhận được ${totalPointsToday} điểm hôm nay! 🎉`,
        [{ text: "Tuyệt vời!", onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert("Thông báo", "Vui lòng hoàn thành tất cả thói quen trước khi kết thúc");
    }
  };

  // Loading state
  if ((habitsLoading || checkInLoading) && habits.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  // Empty state
  if (habits.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check-in hôm nay</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>🎯 0</Text>
          </View>
        </View>
        <View style={[styles.content, styles.emptyContainer]}>
          <Text style={styles.emptyText}>
            Bạn chưa có thói quen nào.{"\n"}Hãy thêm thói quen để bắt đầu!
          </Text>
          <TouchableOpacity
            style={styles.addHabitButton}
            onPress={() => navigation.navigate("AddHabit")}
          >
            <Text style={styles.addHabitButtonText}>+ Thêm thói quen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-in hôm nay</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>🎯 {totalPointsToday}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Progress Overview */}
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>Tiến độ hôm nay</Text>
            <View style={styles.progressCircle}>
              <Text style={styles.progressValue}>{checkedCount}/{habits.length}</Text>
              <Text style={styles.progressSubtext}>thói quen</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${completionRate}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{completionRate.toFixed(0)}% hoàn thành</Text>
          </View>

          {/* AI Motivation */}
          <View style={[styles.motivationCard, { borderColor: `${motivation.color}44` }]}>
            <View style={styles.motivationHeader}>
              <Text style={styles.motivationIcon}>{motivation.icon}</Text>
              <Text style={styles.motivationTitle}>AI Động viên</Text>
            </View>
            <Text style={[styles.motivationText, { color: motivation.color }]}>
              {motivation.message}
            </Text>
          </View>

          {/* Habits Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách thói quen</Text>
            {habits.map((habit: any) => {
              const checkIn = todayCheckIns[habit.id] || { completed: false, points: 0, streak: 0 };
              const isToggling = isTogglingHabit[habit.id];

              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitCard, checkIn.completed && styles.habitCardChecked]}
                  onPress={() => handleCheckIn(habit.id)}
                  disabled={isToggling}
                  activeOpacity={0.8}
                >
                  <View style={styles.habitLeft}>
                    <View style={[styles.checkbox, checkIn.completed && styles.checkboxChecked]}>
                      {checkIn.completed && <Text style={styles.checkmark}>✓</Text>}
                      {isToggling && <ActivityIndicator size="small" color="#00897B" />}
                    </View>
                    <View style={styles.habitIconContainer}>
                      <Text style={styles.habitIcon}>{habit.icon}</Text>
                    </View>
                    <View style={styles.habitDetails}>
                      <Text style={[styles.habitName, checkIn.completed && styles.habitNameChecked]}>
                        {habit.name}
                      </Text>
                      <View style={styles.habitMeta}>
                        <Text style={styles.habitPoints}>+{checkIn.points} điểm</Text>
                        {checkIn.streak > 0 && (
                          <Text style={styles.habitStreak}>🔥 {checkIn.streak}</Text>
                        )}
                        <Text style={styles.habitTarget}>{habit.target} {habit.unit}/ngày</Text>
                      </View>
                    </View>
                  </View>
                  {checkIn.completed && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stats Summary */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Thống kê hôm nay</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{totalPointsToday}</Text>
                <Text style={styles.statLabel}>Điểm</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>✓</Text>
                <Text style={styles.statValue}>{checkedCount}</Text>
                <Text style={styles.statLabel}>Hoàn thành</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>
                  {Math.max(...Object.values(todayCheckIns).map((c: any) => c.streak || 0), 0)}
                </Text>
                <Text style={styles.statLabel}>Streak cao nhất</Text>
              </View>
            </View>
          </View>

          {/* Complete Button */}
          <TouchableOpacity
            style={[
              styles.completeButton,
              checkedCount === habits.length && styles.completeButtonActive,
            ]}
            onPress={handleCompleteAll}
            activeOpacity={0.9}
          >
            <Text style={styles.completeButtonText}>
              {checkedCount === habits.length ? "🎉 Hoàn thành ngày mới" : "⏳ Chưa hoàn thành"}
            </Text>
          </TouchableOpacity>
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
  pointsBadge: { backgroundColor: "rgba(99,102,241,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  pointsText: { fontSize: 14, fontWeight: "800", color: "#6366F1" },
  content: { padding: 16 },
  progressCard: { backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 20, padding: 24, marginBottom: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  progressLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16 },
  progressCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(99,102,241,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 3, borderColor: "#6366F1" },
  progressValue: { fontSize: 32, fontWeight: "900", color: "#333333" },
  progressSubtext: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  progressBar: { width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 4 },
  progressPercentage: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  motivationCard: { backgroundColor: "rgba(139,92,246,0.08)", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 2 },
  motivationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  motivationIcon: { fontSize: 28, marginRight: 8 },
  motivationTitle: { fontSize: 16, fontWeight: "800", color: "#00796B" },
  motivationText: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16 },
  habitCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  habitCardChecked: { backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" },
  habitLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkboxChecked: { backgroundColor: "#10B981", borderColor: "#10B981" },
  checkmark: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
  habitIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(99,102,241,0.15)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  habitIcon: { fontSize: 20 },
  habitDetails: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 4 },
  habitNameChecked: { textDecorationLine: "line-through", color: "rgba(255,255,255,0.6)" },
  habitMeta: { flexDirection: "row", gap: 12 },
  habitPoints: { fontSize: 12, color: "#F59E0B", fontWeight: "700" },
  habitStreak: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  habitTarget: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: "600" },
  completedBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  completedText: { fontSize: 18, color: "#FFFFFF", fontWeight: "900" },
  statsCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, marginBottom: 24 },
  statsTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16, textAlign: "center" },
  statsGrid: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: "900", color: "#6366F1", marginBottom: 4 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  completeButton: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 18, alignItems: "center", marginBottom: 20 },
  completeButtonActive: { backgroundColor: "#10B981", shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  completeButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#00796B", marginTop: 16, fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "rgba(255,255,255,0.6)", textAlign: "center", marginBottom: 20 },
  addHabitButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#6366F1", borderRadius: 12 },
  addHabitButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
