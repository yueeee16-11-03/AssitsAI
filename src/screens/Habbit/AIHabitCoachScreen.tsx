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

type Props = NativeStackScreenProps<RootStackParamList, "AIHabitCoach">;

interface CoachingInsight {
  id: string;
  type: "strength" | "weakness" | "opportunity" | "warning";
  title: string;
  description: string;
  action: string;
  icon: string;
  color: string;
}

interface SmartReminder {
  id: string;
  habit: string;
  time: string;
  reason: string;
  icon: string;
  enabled: boolean;
}

export default function AIHabitCoachScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const coachScore = 78;

  const insights: CoachingInsight[] = [
    {
      id: "1",
      type: "strength",
      title: "Thói quen đọc sách xuất sắc",
      description: "Bạn đã duy trì đọc sách 15 ngày liên tiếp! Đây là streak tốt nhất của bạn.",
      action: "Tiếp tục phát huy",
      icon: "🏆",
      color: "#10B981",
    },
    {
      id: "2",
      type: "weakness",
      title: "Thiền chưa đều đặn",
      description: "Bạn chỉ hoàn thành thiền 2/7 ngày tuần này. Hãy thử vào buổi tối trước khi ngủ.",
      action: "Cần cải thiện",
      icon: "⚠️",
      color: "#F59E0B",
    },
    {
      id: "3",
      type: "opportunity",
      title: "Thêm thói quen buổi sáng",
      description: "AI phát hiện bạn có 30 phút rảnh mỗi sáng 7-7:30. Hãy thêm yoga hoặc viết nhật ký.",
      action: "Khám phá thêm",
      icon: "💡",
      color: "#3B82F6",
    },
    {
      id: "4",
      type: "warning",
      title: "Nguy cơ bỏ thói quen tập gym",
      description: "Bạn đã bỏ lỡ 3 ngày liên tiếp. Hãy đặt lại mục tiêu nhỏ hơn: 15 phút thay vì 45 phút.",
      action: "Hành động ngay",
      icon: "🚨",
      color: "#EF4444",
    },
  ];

  const [reminders, setReminders] = useState<SmartReminder[]>([
    { id: "1", habit: "Uống nước", time: "9:00 AM", reason: "Bạn thường quên uống nước buổi sáng", icon: "💧", enabled: true },
    { id: "2", habit: "Đọc sách", time: "8:00 PM", reason: "Thời gian tập trung tốt nhất của bạn", icon: "📚", enabled: true },
    { id: "3", habit: "Thiền", time: "10:00 PM", reason: "Giúp bạn ngủ ngon hơn", icon: "🧘", enabled: false },
    { id: "4", habit: "Tập thể dục", time: "6:30 AM", reason: "Trước khi đi làm", icon: "💪", enabled: true },
  ]);

  const behaviorPatterns = [
    { day: "T2", success: 80, trend: "up" },
    { day: "T3", success: 90, trend: "up" },
    { day: "T4", success: 85, trend: "stable" },
    { day: "T5", success: 60, trend: "down" },
    { day: "T6", success: 70, trend: "up" },
    { day: "T7", success: 40, trend: "down" },
    { day: "CN", success: 50, trend: "up" },
  ];

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Coach</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Coach Score */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreIcon}>🤖</Text>
              <Text style={styles.scoreTitle}>Điểm đánh giá AI</Text>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{coachScore}</Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.scoreDescription}>
              {coachScore >= 80 ? "Xuất sắc! Bạn đang rất kỷ luật" : 
               coachScore >= 60 ? "Tốt! Cần cải thiện thêm một chút" :
               "Hãy cố gắng hơn nữa!"}
            </Text>
            <View style={styles.scoreProgress}>
              <View style={[styles.scoreProgressFill, { width: `${coachScore}%` }]} />
            </View>
          </View>

          {/* Behavior Analysis */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Phân tích hành vi tuần</Text>
            <View style={styles.behaviorChart}>
              {behaviorPatterns.map((day, index) => (
                <View key={index} style={styles.behaviorDay}>
                  <View style={styles.behaviorBar}>
                    <View style={[styles.behaviorFill, { height: `${day.success}%`, backgroundColor: day.success >= 70 ? "#10B981" : "#F59E0B" }]} />
                  </View>
                  <Text style={styles.behaviorLabel}>{day.day}</Text>
                  <Text style={styles.behaviorValue}>{day.success}%</Text>
                </View>
              ))}
            </View>
            <View style={styles.behaviorInsight}>
              <Text style={styles.behaviorInsightIcon}>💡</Text>
              <Text style={styles.behaviorInsightText}>
                Cuối tuần là thời điểm yếu nhất của bạn. Hãy lên kế hoạch trước!
              </Text>
            </View>
          </View>

          {/* Coaching Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Phân tích chi tiết</Text>
            {insights.map((insight) => (
              <View key={insight.id} style={[styles.insightCard, { borderLeftColor: insight.color }]}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightIcon}>{insight.icon}</Text>
                  <View style={styles.insightTitleContainer}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <View style={[styles.insightBadge, { backgroundColor: `${insight.color}22` }]}>
                      <Text style={[styles.insightBadgeText, { color: insight.color }]}>
                        {insight.action}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
                <TouchableOpacity
                  style={[styles.insightButton, { backgroundColor: insight.color }]}
                  onPress={() => Alert.alert("Hành động", insight.action)}
                >
                  <Text style={styles.insightButtonText}>Xem chi tiết</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Smart Reminders */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ Nhắc nhở thông minh</Text>
            <Text style={styles.sectionSubtitle}>AI đề xuất thời gian tối ưu dựa trên thói quen của bạn</Text>
            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderLeft}>
                  <Text style={styles.reminderIcon}>{reminder.icon}</Text>
                  <View style={styles.reminderDetails}>
                    <Text style={styles.reminderHabit}>{reminder.habit}</Text>
                    <Text style={styles.reminderTime}>⏰ {reminder.time}</Text>
                    <Text style={styles.reminderReason}>💡 {reminder.reason}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.reminderToggle, reminder.enabled && styles.reminderToggleActive]}
                  onPress={() => toggleReminder(reminder.id)}
                >
                  <View style={[styles.reminderToggleCircle, reminder.enabled && styles.reminderToggleCircleActive]} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("AIChat")}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Chat với AI Coach</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("HabitDashboard")}>
              <Text style={styles.actionIcon}>📈</Text>
              <Text style={styles.actionText}>Xem thống kê</Text>
            </TouchableOpacity>
          </View>
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
  settingsButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  settingsIcon: { fontSize: 20 },
  content: { padding: 16 },
  scoreCard: { backgroundColor: "rgba(139,92,246,0.15)", borderRadius: 20, padding: 24, marginBottom: 24, alignItems: "center", borderWidth: 1, borderColor: "rgba(139,92,246,0.3)" },
  scoreHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  scoreIcon: { fontSize: 32, marginRight: 8 },
  scoreTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(139,92,246,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 4, borderColor: "#8B5CF6" },
  scoreValue: { fontSize: 56, fontWeight: "900", color: "#333333" },
  scoreMax: { fontSize: 18, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  scoreDescription: { fontSize: 15, color: "rgba(255,255,255,0.8)", marginBottom: 16, textAlign: "center" },
  scoreProgress: { width: "100%", height: 8, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" },
  scoreProgressFill: { height: "100%", backgroundColor: "#8B5CF6", borderRadius: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 16 },
  behaviorChart: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, height: 140, marginBottom: 12 },
  behaviorDay: { flex: 1, alignItems: "center" },
  behaviorBar: { flex: 1, width: "60%", justifyContent: "flex-end", marginBottom: 8 },
  behaviorFill: { width: "100%", borderRadius: 4 },
  behaviorLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "700", marginBottom: 2 },
  behaviorValue: { fontSize: 10, color: "rgba(255,255,255,0.5)" },
  behaviorInsight: { flexDirection: "row", backgroundColor: "rgba(99,102,241,0.1)", borderRadius: 12, padding: 12, alignItems: "center" },
  behaviorInsightIcon: { fontSize: 20, marginRight: 8 },
  behaviorInsightText: { flex: 1, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 18 },
  insightCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4 },
  insightHeader: { flexDirection: "row", marginBottom: 12 },
  insightIcon: { fontSize: 32, marginRight: 12 },
  insightTitleContainer: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 6 },
  insightBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  insightBadgeText: { fontSize: 11, fontWeight: "700" },
  insightDescription: { fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 20, marginBottom: 12 },
  insightButton: { borderRadius: 10, padding: 10, alignItems: "center" },
  insightButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  reminderCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, marginBottom: 12 },
  reminderLeft: { flexDirection: "row", flex: 1 },
  reminderIcon: { fontSize: 28, marginRight: 12 },
  reminderDetails: { flex: 1 },
  reminderHabit: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 4 },
  reminderTime: { fontSize: 13, color: "#6366F1", marginBottom: 2, fontWeight: "700" },
  reminderReason: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 16 },
  reminderToggle: { width: 56, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", padding: 2, justifyContent: "center" },
  reminderToggleActive: { backgroundColor: "#10B981" },
  reminderToggleCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F3F4F6" },
  reminderToggleCircleActive: { alignSelf: "flex-end" },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "600", textAlign: "center" },
});
