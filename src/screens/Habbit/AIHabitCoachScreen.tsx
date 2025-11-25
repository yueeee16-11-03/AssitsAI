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
import AIHabitSuggestionService from "../../services/AIHabitSuggestionService";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  const habits = useHabitStore((state) => state.habits);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<CoachingInsight[]>([]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Định nghĩa loadAIInsights callback trước useEffect
  const loadAIInsights = React.useCallback(async () => {
    if (habits.length === 0) {
      setAiInsights([]);
      return;
    }

    try {
      setInsightsLoading(true);
      
      // Gọi service để generate insights cho từng category
      const allInsights: CoachingInsight[] = [];
      const habitCategories = new Set(habits.map((h: any) => h.category));

      for (const category of habitCategories) {
        const suggestions = await AIHabitSuggestionService.generateSuggestions(category as string);
        
        // Transform suggestions thành coaching insights
        const categoryInsights = suggestions.map((suggestion, index) => ({
          id: `ai-${category}-${index}`,
          type: (["strength", "weakness", "opportunity", "warning"] as const)[index % 4],
          title: `${suggestion.name} - Gợi ý từ AI`,
          description: suggestion.description,
          action: suggestion.benefits,
          icon: suggestion.icon,
          color: ["#10B981", "#F59E0B", "#3B82F6", "#EF4444"][index % 4],
        }));
        
        allInsights.push(...categoryInsights);
      }

      setAiInsights(allInsights.length > 0 ? allInsights : getDefaultInsights());
    } catch (error) {
      console.error("Lỗi load AI insights:", error);
      setAiInsights(getDefaultInsights());
    } finally {
      setInsightsLoading(false);
    }
  }, [habits]);

  // Load insights từ AI khi screen mount
  React.useEffect(() => {
    loadAIInsights();
  }, [habits, loadAIInsights]);

  // Insights mặc định nếu AI không khả dụng
  const getDefaultInsights = (): CoachingInsight[] => [];

  const coachScore = aiInsights.length > 0 ? Math.round((aiInsights.length / 4) * 100) : 0;

  const [reminders, setReminders] = useState<SmartReminder[]>([]);

  const behaviorPatterns = habits.length > 0 
    ? [
        { day: "T2", success: Math.round(Math.random() * 100), trend: "up" as const },
        { day: "T3", success: Math.round(Math.random() * 100), trend: "up" as const },
        { day: "T4", success: Math.round(Math.random() * 100), trend: "stable" as const },
        { day: "T5", success: Math.round(Math.random() * 100), trend: "down" as const },
        { day: "T6", success: Math.round(Math.random() * 100), trend: "up" as const },
        { day: "T7", success: Math.round(Math.random() * 100), trend: "down" as const },
        { day: "CN", success: Math.round(Math.random() * 100), trend: "up" as const },
      ]
    : [];

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerTile} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Coach</Text>
        <TouchableOpacity style={styles.headerTile}>
          <Icon name="cog-outline" size={20} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Coach Score */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Icon name="robot" size={32} color="#8B5CF6" style={styles.iconMarginRight} />
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
            <View style={styles.sectionHeader}>
              <Icon name="chart-bar" size={18} color="#00796B" style={styles.iconMarginRight} />
              <Text style={styles.sectionTitle}>Phân tích hành vi tuần</Text>
            </View>
            <View style={styles.behaviorChart}>
              {behaviorPatterns.map((day, index) => (
                <View key={index} style={styles.behaviorDay}>
                  <View style={styles.behaviorBar}>
                    <View style={[styles.behaviorFillStyled, { height: `${day.success}%` }, day.success >= 70 ? styles.behaviorFillGood : styles.behaviorFillWarning]} />
                  </View>
                  <Text style={styles.behaviorLabel}>{day.day}</Text>
                  <Text style={styles.behaviorValue}>{day.success}%</Text>
                </View>
              ))}
            </View>
            <View style={styles.behaviorInsight}>
              <Icon name="lightbulb-on-outline" size={20} color="#F59E0B" style={styles.iconMarginRight} />
              <Text style={styles.behaviorInsightText}>
                Cuối tuần là thời điểm yếu nhất của bạn. Hãy lên kế hoạch trước!
              </Text>
            </View>
          </View>

          {/* Coaching Insights */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="bullseye" size={18} color="#00796B" style={styles.iconMarginRight} />
              <Text style={styles.sectionTitle}>Phân tích chi tiết</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadAIInsights}
                disabled={insightsLoading}
              >
                <Icon 
                  name={insightsLoading ? "loading" : "refresh"} 
                  size={16} 
                  color="#8B5CF6"
                />
              </TouchableOpacity>
            </View>
            {insightsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Đang tạo gợi ý từ AI...</Text>
              </View>
            ) : habits.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="inbox-multiple-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Bạn chưa có thói quen nào để phân tích</Text>
              </View>
            ) : (
              aiInsights.map((insight) => (
                <View key={insight.id} style={[styles.insightCard, { borderLeftColor: insight.color }]}>
                  <View style={styles.insightHeader}>
                    <Icon name={insight.icon} size={32} color={insight.color} style={styles.insightIcon} />
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
                    onPress={() => Alert.alert("Gợi ý từ AI", insight.description)}
                  >
                    <Text style={styles.insightButtonText}>Xem chi tiết</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Smart Reminders */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="bell" size={18} color="#00796B" style={styles.iconMarginRight} />
              <Text style={styles.sectionTitle}>Nhắc nhở thông minh</Text>
            </View>
            <Text style={styles.sectionSubtitle}>AI đề xuất thời gian tối ưu dựa trên thói quen của bạn</Text>
            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderCard}>
                <View style={styles.reminderLeft}>
                  <Icon name={reminder.icon} size={28} color="#8B5CF6" style={styles.reminderIcon} />
                  <View style={styles.reminderDetails}>
                    <Text style={styles.reminderHabit}>{reminder.habit}</Text>
                    <View style={styles.reminderRowStyle}>
                      <Icon name="clock-outline" size={14} color="#6366F1" />
                      <Text style={[styles.reminderTime, styles.reminderTimeMargin]}>{reminder.time}</Text>
                    </View>
                    <View style={styles.reminderRowStyle2}>
                      <Icon name="lightbulb-on-outline" size={14} color="#F59E0B" />
                      <Text style={[styles.reminderReason, styles.reminderReasonMargin]}>{reminder.reason}</Text>
                    </View>
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
              <Icon name="chat" size={32} style={styles.actionIcon} color="#8B5CF6" />
              <Text style={styles.actionText}>Chat với AI Coach</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("HabitDashboard")}>
              <Icon name="chart-areaspline" size={32} style={styles.actionIcon} color="#3B82F6" />
              <Text style={styles.actionText}>Xem thống kê</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  headerTile: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#111827" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  settingsButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  settingsIcon: { fontSize: 20 },
  content: { padding: 16, backgroundColor: "#FFFFFF" },
  scoreCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, marginBottom: 24, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  scoreHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  scoreIcon: { fontSize: 32, marginRight: 8 },
  scoreTitle: { fontSize: 18, fontWeight: "800", color: "#000000" },
  scoreCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(139,92,246,0.05)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 4, borderColor: "#8B5CF6" },
  scoreValue: { fontSize: 56, fontWeight: "900", color: "#333333" },
  scoreMax: { fontSize: 18, color: "#666666", fontWeight: "700" },
  scoreDescription: { fontSize: 15, color: "#333333", marginBottom: 16, textAlign: "center" },
  scoreProgress: { width: "100%", height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden" },
  scoreProgressFill: { height: "100%", backgroundColor: "#8B5CF6", borderRadius: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, justifyContent: "space-between" },
  refreshButton: { padding: 8 },
  behaviorFillStyled: { height: "100%", borderRadius: 4 },
  behaviorFillGood: { backgroundColor: "#10B981" },
  behaviorFillWarning: { backgroundColor: "#F59E0B" },
  reminderRowStyle: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  reminderRowStyle2: { flexDirection: "row", alignItems: "center" },
  reminderTimeMargin: { marginLeft: 6 },
  reminderReasonMargin: { marginLeft: 6 },
  sectionSubtitle: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  loadingContainer: { paddingVertical: 40, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 16, fontSize: 14, color: "#666666", fontStyle: "italic" },
  emptyContainer: { paddingVertical: 40, alignItems: "center", justifyContent: "center" },
  emptyText: { marginTop: 12, fontSize: 14, color: "#999999" },
  behaviorChart: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, height: 140, marginBottom: 12 },
  behaviorDay: { flex: 1, alignItems: "center" },
  behaviorBar: { flex: 1, width: "60%", justifyContent: "flex-end", marginBottom: 8 },
  behaviorFill: { width: "100%", borderRadius: 4 },
  behaviorLabel: { fontSize: 11, color: "#6B7280", fontWeight: "700", marginBottom: 2 },
  behaviorValue: { fontSize: 10, color: "#6B7280" },
  behaviorInsight: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 12, alignItems: "center" },
  behaviorInsightIcon: { fontSize: 20, marginRight: 8 },
  behaviorInsightText: { flex: 1, fontSize: 13, color: "#333333", lineHeight: 18 },
  insightCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderColor: "transparent" },
  insightHeader: { flexDirection: "row", marginBottom: 12 },
  insightIcon: { fontSize: 32, marginRight: 12 },
  insightTitleContainer: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 6 },
  insightBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  insightBadgeText: { fontSize: 11, fontWeight: "700" },
  insightDescription: { fontSize: 14, color: "#333333", lineHeight: 20, marginBottom: 12 },
  insightButton: { borderRadius: 10, padding: 10, alignItems: "center" },
  insightButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  reminderCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  reminderLeft: { flexDirection: "row", flex: 1 },
  reminderIcon: { fontSize: 28, marginRight: 12 },
  iconMarginRight: { marginRight: 8 },
  reminderDetails: { flex: 1 },
  reminderHabit: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 4 },
  reminderTime: { fontSize: 13, color: "#333333", marginBottom: 2, fontWeight: "700" },
  reminderReason: { fontSize: 12, color: "#6B7280", lineHeight: 16 },
  reminderToggle: { width: 56, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6", padding: 2, justifyContent: "center" },
  reminderToggleActive: { backgroundColor: "#10B981" },
  reminderToggleCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#F3F4F6" },
  reminderToggleCircleActive: { alignSelf: "flex-end" },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "#333333", fontWeight: "600", textAlign: "center" },
});
