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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, "HabitReport">;

interface HeatmapDay {
  date: number;
  value: number;
  label: string;
}

export default function HabitReportScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("month");

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Generate heatmap data (last 30 days)
  const generateHeatmapData = (): HeatmapDay[] => {
    const data: HeatmapDay[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.getDate(),
        value: Math.floor(Math.random() * 6), // 0-5 habits completed
        label: date.toLocaleDateString("vi-VN", { weekday: "short" }),
      });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  const getHeatColor = (value: number) => {
    if (value === 0) return "rgba(255,255,255,0.05)";
    if (value <= 2) return "rgba(99,102,241,0.3)";
    if (value <= 3) return "rgba(99,102,241,0.6)";
    if (value <= 4) return "#6366F1";
    return "#4F46E5";
  };

  const weekStats = [
    { metric: "Hoàn thành", value: "85%", change: "+5%", icon: "check", color: "#10B981" },
    { metric: "Streak dài nhất", value: "15", change: "+3", icon: "fire", color: "#F59E0B" },
    { metric: "Điểm TB", value: "42", change: "+8", icon: "star", color: "#6366F1" },
    { metric: "Thói quen tốt nhất", value: "Đọc sách", change: "20 ngày", icon: "book-open-variant", color: "#EC4899" },
  ];

  const habitPerformance = [
    { name: "Uống nước", completion: 95, trend: "up", streak: 28, icon: "water" },
    { name: "Đọc sách", completion: 90, trend: "up", streak: 15, icon: "book-open-variant" },
    { name: "Tập thể dục", completion: 75, trend: "stable", streak: 10, icon: "arm-flex" },
    { name: "Thiền", completion: 40, trend: "down", streak: 0, icon: "meditation" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={20} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo thói quen</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Icon name="chart-box" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === "week" && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod("week")}
            >
              <Text style={[styles.periodText, selectedPeriod === "week" && styles.periodTextActive]}>
                Tuần
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, selectedPeriod === "month" && styles.periodButtonActive]}
              onPress={() => setSelectedPeriod("month")}
            >
              <Text style={[styles.periodText, selectedPeriod === "month" && styles.periodTextActive]}>
                Tháng
              </Text>
            </TouchableOpacity>
          </View>

          {/* Heatmap Calendar */}
          <View style={styles.heatmapCard}>
            <Text style={styles.cardTitle}>Lịch hoàn thành (30 ngày)</Text>
            <View style={styles.heatmapGrid}>
              {heatmapData.map((day, index) => (
                <View key={index} style={styles.heatmapColumn}>
                  <View
                    style={[
                      styles.heatmapCell,
                      { backgroundColor: getHeatColor(day.value) },
                    ]}
                  />
                  {index % 5 === 0 && <Text style={styles.heatmapDate}>{day.date}</Text>}
                </View>
              ))}
            </View>
            <View style={styles.heatmapLegend}>
              <Text style={styles.legendText}>Ít</Text>
              <View style={styles.legendColors}>
                {[0, 2, 3, 4, 5].map((val) => (
                  <View key={val} style={[styles.legendCell, { backgroundColor: getHeatColor(val) }]} />
                ))}
              </View>
              <Text style={styles.legendText}>Nhiều</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {weekStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Icon name={stat.icon} size={28} color={stat.color} style={styles.statIcon} />
                <Text style={styles.statMetric}>{stat.metric}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statChange}>{stat.change}</Text>
              </View>
            ))}
          </View>

          {/* AI Insights */}
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <Icon name="robot" size={24} color="#6366F1" style={styles.aiIcon} />
              <Text style={styles.aiTitle}>Phân tích AI</Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="trophy" size={20} color="#10B981" style={styles.insightIcon} />
              <Text style={styles.insightText}>
                <Text style={styles.insightBold}>Xuất sắc!</Text> Bạn đã cải thiện 15% so với tháng trước.
                Thói quen "Đọc sách" đặc biệt tốt với 90% hoàn thành.
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="alert-circle-outline" size={20} color="#F59E0B" style={styles.insightIcon} />
              <Text style={styles.insightText}>
                <Text style={styles.insightBold}>Cần chú ý:</Text> Thói quen "Thiền" chỉ đạt 40%.
                Hãy thử đặt nhắc nhở vào 10PM mỗi tối.
              </Text>
            </View>
            <View style={styles.insightItem}>
              <Icon name="lightbulb-on-outline" size={20} color="#F59E0B" style={styles.insightIcon} />
              <Text style={styles.insightText}>
                <Text style={styles.insightBold}>Gợi ý:</Text> Cuối tuần là thời điểm yếu nhất.
                Hãy lên kế hoạch cụ thể cho T7-CN.
              </Text>
            </View>
          </View>

          {/* Habit Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hiệu suất từng thói quen</Text>
            {habitPerformance.map((habit, index) => (
              <View key={index} style={styles.performanceCard}>
                <View style={styles.performanceHeader}>
                  <Icon name={habit.icon} size={28} color="#8B5CF6" style={styles.performanceIcon} />
                  <View style={styles.performanceInfo}>
                    <Text style={styles.performanceName}>{habit.name}</Text>
                    <View style={styles.performanceMeta}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="fire" size={12} color="#F59E0B" />
                        <Text style={styles.performanceStreak}> {habit.streak} ngày</Text>
                      </View>
                      <Text style={[
                        styles.performanceTrend,
                        habit.trend === "up" ? styles.trendUp :
                        habit.trend === "down" ? styles.trendDown : styles.trendStable
                      ]}>
                        {habit.trend === "up" ? "↑" : habit.trend === "down" ? "↓" : "→"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.performancePercent}>{habit.completion}%</Text>
                </View>
                <View style={styles.performanceBar}>
                  <View
                    style={[
                      styles.performanceBarFill,
                      {
                        width: `${habit.completion}%`,
                        backgroundColor: habit.completion >= 80 ? "#10B981" :
                                       habit.completion >= 60 ? "#F59E0B" : "#EF4444"
                      }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("HabitDashboard")}>
              <Icon name="file-document-outline" size={32} style={styles.actionIcon} color="#8B5CF6" />
              <Text style={styles.actionText}>Chi tiết thói quen</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("AIHabitCoach")}>
              <Icon name="robot" size={32} style={styles.actionIcon} color="#3B82F6" />
              <Text style={styles.actionText}>AI Coach</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#000000" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#000000" },
  exportButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  exportIcon: { fontSize: 20 },
  content: { padding: 16, backgroundColor: "#FFFFFF" },
  periodSelector: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 20 },
  periodButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  periodButtonActive: { backgroundColor: "#6366F1" },
  periodText: { color: "#374151", fontWeight: "700", fontSize: 14 },
  periodTextActive: { color: "#FFFFFF" },
  heatmapCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 16 },
  heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 12 },
  heatmapColumn: { alignItems: "center" },
  heatmapCell: { width: 16, height: 16, borderRadius: 3 },
  heatmapDate: { fontSize: 9, color: "#6B7280", marginTop: 2 },
  heatmapLegend: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12 },
  legendText: { fontSize: 11, color: "#6B7280" },
  legendColors: { flexDirection: "row", gap: 3 },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard: { flex: 1, minWidth: "45%", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statMetric: { fontSize: 12, color: "#6B7280", marginBottom: 4, textAlign: "center" },
  statValue: { fontSize: 24, fontWeight: "900", marginBottom: 2 },
  statChange: { fontSize: 11, color: "#6B7280" },
  aiCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: "#000000" },
  insightItem: { flexDirection: "row", marginBottom: 12 },
  insightIcon: { fontSize: 20, marginRight: 8 },
  insightText: { flex: 1, fontSize: 14, color: "#333333", lineHeight: 20 },
  insightBold: { fontWeight: "800", color: "#000000" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 16 },
  performanceCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  performanceHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  performanceIcon: { fontSize: 28, marginRight: 12 },
  performanceInfo: { flex: 1 },
  performanceName: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 4 },
  performanceMeta: { flexDirection: "row", gap: 12 },
  performanceStreak: { fontSize: 12, color: "#6B7280", fontWeight: "700" },
  performanceTrend: { fontSize: 14, fontWeight: "900" },
  trendUp: { color: "#10B981" },
  trendDown: { color: "#EF4444" },
  trendStable: { color: "#F59E0B" },
  performancePercent: { fontSize: 20, fontWeight: "900", color: "#6366F1" },
  performanceBar: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  performanceBarFill: { height: "100%", borderRadius: 3 },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "#333333", fontWeight: "600", textAlign: "center" },
});
