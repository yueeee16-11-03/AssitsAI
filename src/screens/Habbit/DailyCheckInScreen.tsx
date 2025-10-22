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
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "DailyCheckIn">;

interface CheckInHabit {
  id: string;
  name: string;
  icon: string;
  points: number;
  checked: boolean;
  streak: number;
}

export default function DailyCheckInScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [habits, setHabits] = useState<CheckInHabit[]>([
    { id: "1", name: "Uống nước", icon: "💧", points: 5, checked: false, streak: 12 },
    { id: "2", name: "Đọc sách", icon: "📚", points: 10, checked: false, streak: 5 },
    { id: "3", name: "Tập thể dục", icon: "💪", points: 15, checked: false, streak: 14 },
    { id: "4", name: "Thiền", icon: "🧘", points: 10, checked: false, streak: 0 },
    { id: "5", name: "Viết nhật ký", icon: "✍️", points: 5, checked: false, streak: 3 },
  ]);

  const totalPoints = habits.filter(h => h.checked).reduce((sum, h) => sum + h.points, 0);
  const checkedCount = habits.filter(h => h.checked).length;
  const completionRate = (checkedCount / habits.length) * 100;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleCheckIn = (id: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === id && !habit.checked) {
        // Show encouragement
        showEncouragement(habit);
        return { ...habit, checked: true, streak: habit.streak + 1 };
      }
      return habit;
    }));
  };

  const showEncouragement = (habit: CheckInHabit) => {
    const messages = [
      `🎉 Tuyệt vời! +${habit.points} điểm cho "${habit.name}"!`,
      `💪 Làm tốt lắm! Bạn đã hoàn thành "${habit.name}"`,
      `⭐ Xuất sắc! Streak ${habit.streak + 1} ngày cho "${habit.name}"`,
      `🔥 Tiếp tục phát huy! "${habit.name}" hoàn thành`,
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    Alert.alert("Chúc mừng!", randomMessage);
  };

  const getAIMotivation = () => {
    if (completionRate === 100) {
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
    if (checkedCount === habits.length) {
      Alert.alert(
        "Hoàn thành!",
        `Bạn đã nhận được ${totalPoints} điểm hôm nay! 🎉`,
        [{ text: "Tuyệt vời!", onPress: () => navigation.goBack() }]
      );
    } else {
      Alert.alert("Thông báo", "Vui lòng hoàn thành tất cả thói quen trước khi kết thúc");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Check-in hôm nay</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>🎯 {totalPoints}</Text>
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
            {habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[styles.habitCard, habit.checked && styles.habitCardChecked]}
                onPress={() => handleCheckIn(habit.id)}
                disabled={habit.checked}
                activeOpacity={0.8}
              >
                <View style={styles.habitLeft}>
                  <View style={[styles.checkbox, habit.checked && styles.checkboxChecked]}>
                    {habit.checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.habitIconContainer}>
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                  </View>
                  <View style={styles.habitDetails}>
                    <Text style={[styles.habitName, habit.checked && styles.habitNameChecked]}>
                      {habit.name}
                    </Text>
                    <View style={styles.habitMeta}>
                      <Text style={styles.habitPoints}>+{habit.points} điểm</Text>
                      {habit.streak > 0 && (
                        <Text style={styles.habitStreak}>🔥 {habit.checked ? habit.streak : habit.streak}</Text>
                      )}
                    </View>
                  </View>
                </View>
                {habit.checked && (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Stats Summary */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Thống kê hôm nay</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statIcon}>⭐</Text>
                <Text style={styles.statValue}>{totalPoints}</Text>
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
                  {habits.filter(h => h.checked).reduce((sum, h) => Math.max(sum, h.streak), 0)}
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
  container: { flex: 1, backgroundColor: "#0A0E27" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  pointsBadge: { backgroundColor: "rgba(99,102,241,0.2)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  pointsText: { fontSize: 14, fontWeight: "800", color: "#6366F1" },
  content: { padding: 16 },
  progressCard: { backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 20, padding: 24, marginBottom: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  progressLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16 },
  progressCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(99,102,241,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 3, borderColor: "#6366F1" },
  progressValue: { fontSize: 32, fontWeight: "900", color: "#fff" },
  progressSubtext: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  progressBar: { width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 4 },
  progressPercentage: { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  motivationCard: { backgroundColor: "rgba(139,92,246,0.08)", borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 2 },
  motivationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  motivationIcon: { fontSize: 28, marginRight: 8 },
  motivationTitle: { fontSize: 16, fontWeight: "800", color: "#fff" },
  motivationText: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16 },
  habitCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  habitCardChecked: { backgroundColor: "rgba(16,185,129,0.08)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)" },
  habitLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  checkboxChecked: { backgroundColor: "#10B981", borderColor: "#10B981" },
  checkmark: { fontSize: 16, fontWeight: "900", color: "#fff" },
  habitIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(99,102,241,0.15)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  habitIcon: { fontSize: 20 },
  habitDetails: { flex: 1 },
  habitName: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 4 },
  habitNameChecked: { textDecorationLine: "line-through", color: "rgba(255,255,255,0.6)" },
  habitMeta: { flexDirection: "row", gap: 12 },
  habitPoints: { fontSize: 12, color: "#F59E0B", fontWeight: "700" },
  habitStreak: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: "700" },
  completedBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#10B981", alignItems: "center", justifyContent: "center" },
  completedText: { fontSize: 18, color: "#fff", fontWeight: "900" },
  statsCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, marginBottom: 24 },
  statsTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 16, textAlign: "center" },
  statsGrid: { flexDirection: "row", justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: "900", color: "#6366F1", marginBottom: 4 },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  completeButton: { backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 18, alignItems: "center" },
  completeButtonActive: { backgroundColor: "#10B981", shadowColor: "#10B981", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  completeButtonText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
