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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
      return { message: "Hoàn hảo! Bạn đã hoàn thành tất cả thói quen hôm nay. Đây là một ngày tuyệt vời!", color: "#10B981", iconName: "trophy" };
    } else if (completionRate >= 80) {
      return { message: "Xuất sắc! Bạn gần hoàn thành rồi. Hãy duy trì động lực này!", color: "#3B82F6", iconName: "star" };
    } else if (completionRate >= 50) {
      return { message: "Đang làm tốt! Hãy tiếp tục hoàn thành các thói quen còn lại nhé!", color: "#F59E0B", iconName: "arm-flex" };
    } else if (completionRate > 0) {
      return { message: "Bắt đầu tốt rồi! Mỗi bước nhỏ đều quan trọng. Hãy tiếp tục!", color: "#8B5CF6", iconName: "leaf" };
    }
    return { message: "Hãy bắt đầu ngày mới với những thói quen tích cực! Bạn làm được!", color: "#EC4899", iconName: "bullseye" };
  };

  const motivation = getAIMotivation();

  const getMotivationStyles = (color: string) => {
    switch (color) {
      case "#10B981": // green
        return { cardBg: "#ECFDF5", textColor: "#065F46" };
      case "#3B82F6": // blue
        return { cardBg: "#EFF6FF", textColor: "#1E3A8A" };
      case "#F59E0B": // amber
        return { cardBg: "#FFFBEB", textColor: "#92400E" };
      case "#8B5CF6": // purple
        return { cardBg: "#F5F3FF", textColor: "#5B21B6" };
      case "#EC4899": // pink
        return { cardBg: "#FFF1F2", textColor: "#9F1239" };
      default:
        return { cardBg: "#FFFFFF", textColor: "#111827" };
    }
  };

  const motivationStyles = getMotivationStyles(motivation.color);

  const getHabitIconName = (iconStr: string) => {
    const map: { [key: string]: string } = {
      "🎯": "bullseye",
      "💧": "water",
      "🚶": "walk",
      "📚": "book-open-variant",
      "🧘": "meditation",
      "💪": "arm-flex",
      "🥗": "food-apple",
      "😴": "bed",
      "✍️": "pencil",
      "🎵": "music",
      "🏃": "run",
      "🧠": "brain",
    };
    // Default to a single filled circle to avoid rendering two concentric circles
    if (!iconStr) return 'circle';
    return map[iconStr] || iconStr || 'circle';
  };

  const getHabitColor = (habit: any) => {
    // Use explicit color if provided on the habit object
    if (habit && habit.color) return habit.color;
    // Fallback palette
    const palette = [
      '#EF4444', // red
      '#F59E0B', // amber
      '#10B981', // green
      '#3B82F6', // blue
      '#8B5CF6', // purple
      '#EC4899', // pink
      '#F97316', // orange
      '#6366F1', // indigo
    ];
    const key = (habit && (habit.id || habit.name)) || Math.random().toString();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
  };

  const hexToRgba = (hex: string, alpha = 1) => {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

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
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
          <View style={styles.headerInner}>
            <Icon name="chevron-left" size={20} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Check-in hôm nay</Text>
            <View style={styles.pointsBadgeInline}>
              <Icon name="bullseye" size={20} color="#FFFFFF" />
              <Text style={[styles.pointsText, { marginLeft: 8, color: '#FFFFFF' }]}>0</Text>
            </View>
          </View>
        </TouchableOpacity>
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
      <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
        <View style={styles.headerInner}>
          <Icon name="chevron-left" size={20} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Check-in hôm nay</Text>
          <View style={styles.pointsBadgeInline}>
            <Icon name="bullseye" size={20} color="#FFFFFF" />
            <Text style={[styles.pointsText, { marginLeft: 8, color: '#FFFFFF' }]}> {totalPointsToday}</Text>
          </View>
        </View>
      </TouchableOpacity>

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
          <View style={[styles.motivationCard, { borderColor: '#F59E0B', backgroundColor: '#FFFFFF' }]}>
              <View style={styles.motivationHeader}>
                <Icon name={motivation.iconName} size={24} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={styles.motivationTitle}>AI Động viên</Text>
              </View>
            <Text
              style={[
                styles.motivationText,
                { color: motivation.message && motivation.message.startsWith('Hãy bắt đầu ngày mới') ? '#333333' : motivationStyles.textColor },
              ]}
            >
              {motivation.message}
            </Text>
          </View>

          {/* Habits Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách thói quen</Text>
            {habits.map((habit: any) => {
              const checkIn = todayCheckIns[habit.id] || { completed: false, points: 0, streak: 0 };
              const isToggling = isTogglingHabit[habit.id];
              const iconColor = getHabitColor(habit);
              const iconBg = hexToRgba(iconColor, 0.12);

              return (
                <TouchableOpacity
                  key={habit.id}
                  style={[styles.habitCard, checkIn.completed && styles.habitCardChecked]}
                  onPress={() => handleCheckIn(habit.id)}
                  disabled={isToggling}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  testID={`habit-card-${habit.id}`}
                >
                  <View style={styles.habitLeft}>
                    <View style={[styles.checkbox, checkIn.completed && styles.checkboxChecked]}>
                      {isToggling ? (
                        <ActivityIndicator size="small" color="#00897B" />
                      ) : checkIn.completed ? (
                        <Icon name="check" size={14} color="#FFFFFF" />
                      ) : (
                        <Icon name="checkbox-blank-circle-outline" size={16} color="#9CA3AF" />
                      )}
                    </View>
                    <View style={[styles.habitIconContainer, { backgroundColor: iconBg }] }>
                      <Icon name={getHabitIconName(habit.icon)} size={20} color={iconColor} />
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
              <View style={styles.statColumn}>
                <View style={styles.statItem}>
                  <Icon name="star" size={20} color="#F59E0B" style={{ marginBottom: 8 }} />
                  <Text style={styles.statValue}>{totalPointsToday}</Text>
                  <Text style={styles.statLabel}>Điểm</Text>
                </View>
              </View>

              <View style={styles.statColumn}>
                <View style={styles.statItem}>
                  <Icon name="check" size={20} color="#10B981" style={{ marginBottom: 8 }} />
                  <Text style={styles.statValue}>{checkedCount}</Text>
                  <Text style={styles.statLabel}>Hoàn thành</Text>
                </View>
              </View>

              <View style={styles.statColumn}>
                <View style={styles.statItem}>
                  <Icon name="fire" size={20} color="#EF4444" style={{ marginBottom: 8 }} />
                  <Text style={styles.statValue}>
                    {Math.max(...Object.values(todayCheckIns).map((c: any) => c.streak || 0), 0)}
                  </Text>
                  <Text style={styles.statLabel}>Streak cao nhất</Text>
                </View>
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
            {checkedCount === habits.length ? (
              <View style={styles.completeButtonInline}>
                <Icon name="trophy" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={[styles.completeButtonText, { color: '#FFFFFF' }]}>Hoàn thành ngày mới</Text>
              </View>
            ) : (
              <View style={styles.completeButtonInline}>
                <Icon name="timer-sand" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={styles.completeButtonText}>Chưa hoàn thành</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.08)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#000000" },
  headerButton: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#10B981', borderBottomWidth: 0 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", flex: 1, textAlign: 'center' },
  pointsBadge: { backgroundColor: "transparent", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  pointsBadgeInline: { backgroundColor: 'transparent', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  pointsText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
  content: { padding: 16 },
  progressCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, marginBottom: 20, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  progressLabel: { fontSize: 14, color: "#333333", marginBottom: 16 },
  progressCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 3, borderColor: "#E5E7EB" },
  progressValue: { fontSize: 32, fontWeight: "900", color: "#333333" },
  progressSubtext: { fontSize: 12, color: "#333333" },
  progressBar: { width: "100%", height: 8, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 4 },
  progressPercentage: { fontSize: 13, color: "#333333" },
  motivationCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB", overflow: 'hidden', shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  motivationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  motivationIcon: { fontSize: 28, marginRight: 8 },
  motivationTitle: { fontSize: 16, fontWeight: "800", color: "#000000" },
  motivationText: { fontSize: 15, lineHeight: 22, fontWeight: "700", color: "#333333" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 16 },
  habitCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E5E7EB" },
  habitCardChecked: { backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" },
  habitLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkboxChecked: { backgroundColor: "#10B981", borderColor: "#10B981" },
  checkmark: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
  habitIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginRight: 12 },
  habitIcon: { fontSize: 20 },
  habitDetails: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 4 },
  habitNameChecked: { textDecorationLine: "line-through", color: "#000000" },
  habitMeta: { flexDirection: "row", gap: 12 },
  habitPoints: { fontSize: 12, color: "#000000", fontWeight: "700" },
  habitStreak: { fontSize: 12, color: "#000000", fontWeight: "700" },
  habitTarget: { fontSize: 12, color: "#000000", fontWeight: "600" },
  completedBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  completedText: { fontSize: 18, color: "#FFFFFF", fontWeight: "900" },
  statsCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: "#E5E7EB" },
  statsTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 12, textAlign: "center" },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  statItem: { alignItems: "center", flex: 1 },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "900", color: "#000000", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#333333" },
  statDivider: { width: 1, height: 48, backgroundColor: "rgba(0,0,0,0.06)", marginHorizontal: 8, alignSelf: 'center' },
  statColumn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  completeButtonInline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  completeButton: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 18, alignItems: "center", marginBottom: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  completeButtonActive: { backgroundColor: "#10B981", shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  completeButtonText: { color: "#000000", fontSize: 17, fontWeight: "800" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#333333", marginTop: 16, fontSize: 14 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, color: "#333333", textAlign: "center", marginBottom: 20 },
  addHabitButton: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#6366F1", borderRadius: 12 },
  addHabitButtonText: { color: "#FFFFFF", fontWeight: "700" },
});
