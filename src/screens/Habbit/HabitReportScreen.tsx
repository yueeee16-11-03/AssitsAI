import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useHabitStore } from '../../store/habitStore';
import { useCheckInStore } from '../../store/checkInStore';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, "HabitReport">;

interface HeatmapDay {
  date: number;
  value: number;
  label: string;
  iso?: string;
}

export default function HabitReportScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month">("month");
  const fetchHabits = useHabitStore((s) => s.fetchHabits);
  const getCheckInHistory = useCheckInStore((s) => s.getCheckInHistory);

  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [habitPerformance, setHabitPerformance] = useState<Array<any>>([]);
  const [weekStats, setWeekStats] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Heatmap and stats driven from Firestore via stores
  // Improved visibility: white for empty, stronger indigo gradient for completed counts
  const getHeatColor = (value: number) => {
    // Missed -> light gray, Done -> strong indigo
    if (!value || value <= 0) return '#F3F4F6'; // light gray for missed
    return '#4C1D95'; // indigo-800 for done
  };

  const getPerformanceBarColor = (completion: number) => {
    if (completion >= 80) return "#10B981";
    if (completion >= 60) return "#F59E0B";
    return "#EF4444";
  };

  // Normalize any date-like input to local YYYY-MM-DD (avoid toISOString UTC shift)
  const normalizeToLocalYMD = (input: any) => {
    if (!input) return '';
    try {
      if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
      let dt: Date;
      if (typeof input === 'string') dt = new Date(input);
      else if (input && typeof input.toDate === 'function') dt = input.toDate();
      else dt = new Date(input);
      if (!(dt instanceof Date) || isNaN(dt.getTime())) return '';
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      return '';
    }
  };

  // Load real data when screen focused or period changes
  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const load = async () => {
        try {
          setIsLoading(true);
          console.log('📊 [HABIT-REPORT] Starting report load...');
          
          // windowDays will be computed after we build `dates` so it matches month length or week

          // Fetch habits once
          await fetchHabits();

          // Read fresh habits directly from store (avoid closure issue)
          const freshHabits = useHabitStore.getState().habits || [];
          
          if (!mounted || freshHabits.length === 0) {
            console.log('ℹ️ [HABIT-REPORT] No habits or unmounted, skipping load');
            if (mounted) setIsLoading(false);
            return;
          }

          console.log('📊 [HABIT-REPORT] Found', freshHabits.length, 'habits');

          // build date keys depending on selected period
          const today = new Date();
          const dates: string[] = [];
          if (selectedPeriod === 'week') {
            // find Monday of current week (Mon..Sun)
            const day = today.getDay(); // 0 (Sun) .. 6 (Sat)
            const diffToMonday = (day + 6) % 7; // days since Monday
            const monday = new Date(today);
            monday.setDate(today.getDate() - diffToMonday);
            for (let i = 0; i < 7; i++) {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              dates.push(normalizeToLocalYMD(d));
            }
          } else {
            // full current month (1..daysInMonth)
            const year = today.getFullYear();
            const month = today.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
              const d = new Date(year, month, dayNum);
              dates.push(normalizeToLocalYMD(d));
            }
          }

          // initialize count map
          const counts: Record<string, number> = {};
          dates.forEach(d => { counts[d] = 0; });

          console.log('📊 [HABIT-REPORT] Fetching check-in histories...');
          
          // determine window for fetching history (week or month length)
          const windowDays = selectedPeriod === 'week' ? 7 : dates.length;

          // For each habit, fetch last `windowDays` history and aggregate
          const histories = await Promise.all(
            freshHabits.map((h: any) =>
              getCheckInHistory(h.id, windowDays).catch((e: any) => {
                console.warn('⚠️ [HABIT-REPORT] Failed to fetch history for habit', h.id, e);
                return [];
              })
            )
          );

          console.log('📊 [HABIT-REPORT] Building performance metrics and habit-specific heatmap...');

          // Build habit performance (still using aggregated history for metrics)
          const perf = freshHabits.map((h: any, idx: number) => {
            const hist = histories[idx] || [];
            const completed = hist.filter((e: any) => e.completed).length;
            const completionRate = Math.round((completed / Math.max(1, windowDays)) * 100);
            const streak = h.currentStreak || 0;
            return {
              name: h.name,
              completion: completionRate,
              trend: completionRate >= 80 ? 'up' : completionRate >= 60 ? 'stable' : 'down',
              streak,
              icon: h.icon || 'circle',
            };
          });

          // Aggregate counts across all histories for the current date window
          histories.forEach((hist: any[]) => {
            (hist || []).forEach((e: any) => {
              const key = normalizeToLocalYMD(e?.date);
              if (e && key && e.completed && counts[key] !== undefined) {
                counts[key] += 1;
              }
            });
          });

          // Build heatmapData array in original order for rendering
          const heatmap: HeatmapDay[] = dates.map(d => {
            const parts = d.split('-');
            const dt = parts.length === 3 ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])) : new Date(d);
            return {
              date: dt.getDate(),
              // mark done when ANY habit completed on that date (aggregated counts)
              value: (counts[d] && counts[d] > 0) ? 1 : 0,
              label: dt.toLocaleDateString('vi-VN', { weekday: 'short' }),
              iso: d,
            };
          });
          // Compute period stats (completion % across all habits for the rendered window)
          let totalPossible = 0;
          let totalCompleted = 0;
          dates.forEach(d => {
            totalPossible += freshHabits.length;
            totalCompleted += counts[d] || 0;
          });
          const periodCompletionPct = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
          const longestStreak = perf.reduce((mx: number, p: any) => Math.max(mx, p.streak || 0), 0);
          const avgCompletionPct = perf.length ? Math.round(perf.reduce((s: number, p: any) => s + (p.completion || 0), 0) / perf.length) : 0;
          const bestHabit = perf.length ? perf.slice().sort((a: any, b: any) => (b.completion || 0) - (a.completion || 0))[0].name : '-';

          if (!mounted) return;

          console.log('📊 [HABIT-REPORT] Report loaded successfully');
          setHeatmapData(heatmap);
          setHabitPerformance(perf);
          setWeekStats([
            { metric: 'Hoàn thành', value: `${periodCompletionPct}%`, change: '', icon: 'check', color: '#10B981' },
            { metric: 'Streak dài nhất', value: `${longestStreak}`, change: '', icon: 'fire', color: '#F59E0B' },
            { metric: 'Điểm TB', value: `${avgCompletionPct}`, change: '', icon: 'star', color: '#6366F1' },
            { metric: 'Thói quen tốt nhất', value: bestHabit, change: '', icon: 'book-open-variant', color: '#EC4899' },
          ]);

        } catch (err) {
          console.error('❌ [HABIT-REPORT] Failed to load report data:', err);
          if (mounted) {
            setHeatmapData([]);
            setHabitPerformance([]);
            setWeekStats([]);
          }
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      };

      load();
      return () => { mounted = false; };
    }, [fetchHabits, getCheckInHistory, selectedPeriod])
  );

  return (
    <SafeAreaView style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={20} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo thói quen</Text>
        <TouchableOpacity style={styles.exportButton}>
          <Icon name="chart-box" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.cardTitle}>{selectedPeriod === 'month' ? `Lịch hoàn thành trong tháng này (${new Date().toLocaleDateString('vi-VN',{month:'long', year:'numeric'})})` : `Lịch hoàn thành trong tuần`}</Text>
            <Text style={styles.cardSubtitle}>{heatmapData.length ? `${new Date(heatmapData[0]?.iso || '').toLocaleDateString('vi-VN')} → ${new Date(heatmapData[heatmapData.length-1]?.iso || '').toLocaleDateString('vi-VN')}` : ''}</Text>
            <View style={styles.heatmapGrid}>
              {heatmapData.map((day, index) => {
                const weekLabels = ['T2','T3','T4','T5','T6','T7','CN'];
                const colWidth = selectedPeriod === 'week' ? `${100 / 7}%` : undefined;
                const cellStyle = selectedPeriod === 'week'
                  ? (day.value ? styles.heatmapCellWeekDone : styles.heatmapCellWeekMissed)
                  : (day.value ? styles.heatmapCellDone : styles.heatmapCellMissed);
                return (
                  <View key={index} style={[styles.heatmapColumn, colWidth ? { width: colWidth } : {}]}>
                    <View style={cellStyle} />
                    <Text style={[styles.heatmapDate, selectedPeriod === 'week' && styles.heatmapDateWeek]}>{selectedPeriod === 'week' ? weekLabels[index] : day.date}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.heatmapLegend}>
              <Text style={styles.legendText}>Bỏ lỡ</Text>
              <View style={styles.legendColors}>
                {[0, 1].map((val) => (
                  <View key={val} style={[styles.legendCell, { backgroundColor: getHeatColor(val) }]} />
                ))}
              </View>
              <Text style={styles.legendText}>Hoàn thành</Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {weekStats.map((stat, index) => {
              const isBest = stat.metric === 'Thói quen tốt nhất';
              return (
                <View key={index} style={styles.statCard}>
                  <Icon name={stat.icon} size={28} color={isBest ? '#000000' : stat.color} style={styles.statIcon} />
                  <Text style={[styles.statMetric, isBest && { color: '#000000' }]}>{stat.metric}</Text>
                  <Text style={[styles.statValue, isBest ? styles.statValueBest : { color: stat.color }]}>{stat.value}</Text>
                  <Text style={[styles.statChange, isBest && { color: '#000000' }]}>{stat.change}</Text>
                </View>
              );
            })}
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
                      <View style={styles.streakContainer}>
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
                        backgroundColor: getPerformanceBarColor(habit.completion)
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  streakContainer: { flexDirection: 'row', alignItems: 'center' },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "transparent", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#000000" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#000000" },
  exportButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  exportIcon: { fontSize: 20 },
  content: { padding: 16, backgroundColor: "#FFFFFF" },
  periodSelector: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 20 },
  periodButton: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  periodButtonActive: { backgroundColor: "#4F46E5", shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  periodText: { color: "#374151", fontWeight: "700", fontSize: 14 },
  periodTextActive: { color: "#FFFFFF" },
  heatmapCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#000000", marginBottom: 16 },
  heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 12 },
  heatmapColumn: { alignItems: "center", width: '16.5%', marginBottom: 6 },
  heatmapCell: { width: 22, height: 22, borderRadius: 4, borderWidth: 0.5, borderColor: '#E5E7EB' },
  heatmapCellDone: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#4C1D95', borderWidth: 1, borderColor: '#312E81' },
  heatmapCellMissed: { width: 22, height: 22, borderRadius: 4, backgroundColor: '#F3F4F6', borderWidth: 0.5, borderColor: '#E5E7EB' },
  // Week view: larger square cells
  heatmapCellWeekDone: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#4C1D95', borderWidth: 1, borderColor: '#312E81' },
  heatmapCellWeekMissed: { width: 36, height: 36, borderRadius: 6, backgroundColor: '#F3F4F6', borderWidth: 0.5, borderColor: '#E5E7EB' },
  heatmapDateWeek: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  cardSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 6, marginBottom: 8 },
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
  statValueBest: { fontSize: 16, fontWeight: "800", marginBottom: 2, color: '#000000' },
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
