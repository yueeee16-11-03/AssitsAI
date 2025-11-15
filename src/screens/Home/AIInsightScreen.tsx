import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

import { useTransactionStore } from "../../store/transactionStore";
import { analyzeTransactionsWithAI } from "../../services/AIInsightService";
import { useHabitStore } from "../../store/habitStore";

type Props = NativeStackScreenProps<RootStackParamList, "AIInsight">;

const PALETTE = ["#10B981", "#34D399", "#6EE7B7", "#059669", "#047857", "#065F46", "#064E3B"];

export default function AIInsightScreen({ navigation }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("month");
  const [fadeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const transactions = useTransactionStore((s: any) => s.transactions);
  const getFinancialDataByPeriod = useTransactionStore((s: any) => s.getFinancialDataByPeriod);
  const habitsRaw = useHabitStore((s: any) => s.habits);

  const financial = useMemo(() => {
    try {
      return getFinancialDataByPeriod(selectedPeriod);
    } catch {
      return { totalIncome: 0, totalExpense: 0, balance: 0, savingRate: '0.0', transactionCount: 0 };
    }
  }, [getFinancialDataByPeriod, selectedPeriod]);

  // AI analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Call AI analysis whenever transactions or selectedPeriod change
  React.useEffect(() => {
    let mounted = true;
    // Debounce to avoid rapid calls
    const timer = setTimeout(() => {
      (async () => {
        try {
          if (!transactions || transactions.length === 0) {
            setAiResult(null);
            return;
          }
          setAiLoading(true);
          setAiError(null);
          // compute explicit startDate/endDate for the selected period so AI gets exact range
          const now = new Date();
          let startDate: Date | null = null;
          let endDate: Date | null = null;
          switch (selectedPeriod) {
            case 'day': {
              startDate = new Date(now);
              startDate.setHours(0, 0, 0, 0);
              endDate = new Date(startDate);
              endDate.setHours(23, 59, 59, 999);
              break;
            }
            case 'week': {
              startDate = new Date(now);
              const dayOfWeek = now.getDay();
              startDate.setDate(now.getDate() - dayOfWeek);
              startDate.setHours(0, 0, 0, 0);
              endDate = now;
              break;
            }
            case 'month': {
              startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
              endDate = now;
              break;
            }
            case 'year': {
              startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
              endDate = now;
              break;
            }
            default: {
              startDate = null;
              endDate = null;
            }
          }

          const res = await analyzeTransactionsWithAI(transactions, { periodLabel: selectedPeriod, startDate: startDate ?? undefined, endDate: endDate ?? undefined });
          if (!mounted) return;
          if (res.success) {
            setAiResult(res.data || null);
          } else {
            setAiError(res.error || 'AI returned no data');
            setAiResult(null);
          }
        } catch (e: any) {
          if (!mounted) return;
          setAiError(e?.message || String(e));
          setAiResult(null);
        } finally {
          if (mounted) setAiLoading(false);
        }
      })();
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [transactions, selectedPeriod]);

  const spendingData = useMemo(() => {
    // compute category totals for the selected period
    const now = new Date();
    let startDate = new Date();
    switch (selectedPeriod) {
      case 'day': {
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'week': {
        const dayOfWeek = now.getDay();
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'month': {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case 'year': {
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      default: {
        startDate.setDate(1);
      }
    }

    const byCat = {} as Record<string, number>;
    const filtered = (transactions || []).filter((t: any) => {
      const txDate = t.date?.toDate?.() || new Date(t.date || t.createdAt);
      if (!txDate || isNaN(new Date(txDate).getTime())) return false;
      return new Date(txDate) >= startDate && new Date(txDate) <= now && t.type === 'expense';
    });

    filtered.forEach((t: any) => {
      const cat = t.category || 'Khác';
      byCat[cat] = (byCat[cat] || 0) + (t.amount || 0);
    });

    const total = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;
    const items = Object.entries(byCat)
      .map(([category, amount], idx) => ({
        category,
        amount,
        percent: Math.round((amount / total) * 100),
        color: PALETTE[idx % PALETTE.length],
      }))
      .sort((a, b) => b.amount - a.amount);

    // If AI provided categoryBreakdown, prefer it (map to our UI shape)
    // Note: aiResult is in component state; we will use it at render-time as override.
    if (items.length === 0) {
      return [
        { category: "Ăn uống", amount: 4500000, percent: 35, color: "#EC4899" },
        { category: "Di chuyển", amount: 2000000, percent: 15, color: "#8B5CF6" },
        { category: "Mua sắm", amount: 3200000, percent: 25, color: "#6366F1" },
      ];
    }

    return items;
  }, [transactions, selectedPeriod]);

  // If AI provided breakdown, prefer that for display
  const displaySpending = useMemo(() => {
    if (aiResult?.categoryBreakdown && Array.isArray(aiResult.categoryBreakdown) && aiResult.categoryBreakdown.length > 0) {
      return aiResult.categoryBreakdown.map((c: any, idx: number) => ({
        category: c.category,
        amount: c.amount || 0,
        percent: Math.round((c.percent || 0) * 10) / 10,
        color: PALETTE[idx % PALETTE.length],
      }));
    }
    return spendingData;
  }, [aiResult, spendingData]);

  const habits = useMemo(() => {
    if (!habitsRaw || habitsRaw.length === 0) {
      return [
        { name: "Uống nước", streak: 7, progress: 85, icon: "💧" },
        { name: "Tập thể dục", streak: 5, progress: 70, icon: "🏃" },
      ];
    }

    return habitsRaw.map((h: any, idx: number) => ({
      name: h.title || h.name || 'Thói quen',
      streak: h.currentStreak || h.streak || 0,
      progress: h.progress || Math.min(100, Math.round(((h.completedDates?.length || 0) / 7) * 100)),
      icon: h.icon || ['💧','🏃','📚','🧘','🧑‍🍳'][idx % 5],
    }));
  }, [habitsRaw]);

  const insights = [
    {
      title: "Chi tiêu tăng 15%",
      description: "So với tháng trước, bạn đã chi nhiều hơn cho ăn uống",
      type: "warning",
      icon: "⚠️",
    },
    {
      title: "Tiết kiệm tốt",
      description: "Bạn đã tiết kiệm được 20% thu nhập tháng này",
      type: "success",
      icon: "✅",
    },
    {
      title: "Thói quen tốt",
      description: "Bạn đã duy trì được 7 ngày uống đủ nước",
      type: "info",
      icon: "💪",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phân tích thông minh</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(["day", "week", "month", "year"] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === period && styles.periodTextActive,
                  ]}
                >
                  {period === "day" ? "Ngày" : period === "week" ? "Tuần" : period === "month" ? "Tháng" : "Năm"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* AI Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.aiIcon}>
              <MaterialCommunityIcons name="lightbulb-on" size={32} color="#10B981" />
            </View>
            <Text style={styles.summaryTitle}>Phân tích AI</Text>
            <Text style={styles.summaryText}>
              {aiResult?.summary ? (
                aiResult.summary
              ) : (
                <>
                  {`Tháng này bạn đã chi tiêu `}
                  <Text style={styles.highlight}>{`₫${(financial.totalExpense || 0).toLocaleString('vi-VN')}`}</Text>
                  {`, tiết kiệm ${financial.savingRate}% so với thu nhập. Chi tiêu chủ yếu vào các hạng mục hiển thị bên dưới.`}
                </>
              )}
            </Text>
            {aiLoading && (
              <Text style={styles.aiStatusText}>Đang phân tích bằng AI...</Text>
            )}
            {aiError && (
              <Text style={styles.aiErrorText}>{`AI lỗi: ${aiError}`}</Text>
            )}
          </View>

          {/* Spending Breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phân tích chi tiêu</Text>
            <View style={styles.spendingChart}>
              {displaySpending.map((item: any, index: number) => (
                <View key={index} style={styles.spendingItem}>
                  <View style={styles.spendingInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.category}</Text>
                  </View>
                  <View style={styles.spendingAmount}>
                    <Text style={styles.amountText}>₫{(item.amount / 1000000).toFixed(1)}M</Text>
                    <Text style={styles.percentText}>{item.percent}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.percent}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Habits Progress */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tiến độ thói quen</Text>
            <View style={styles.habitsGrid}>
              {habits.map((habit: any, index: number) => (
                <View key={index} style={styles.habitCard}>
                  <Text style={styles.habitIcon}>{habit.icon}</Text>
                  <Text style={styles.habitName}>{habit.name}</Text>
                  <View style={styles.habitStats}>
                    <Text style={styles.streakText}>🔥 {habit.streak} ngày</Text>
                  </View>
                  <View style={styles.habitProgressBar}>
                    <View
                      style={[styles.habitProgressFill, { width: `${habit.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.habitPercent}>{habit.progress}%</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Insights & Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khuyến nghị</Text>
            {insights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightCard,
                  insight.type === "warning" && styles.insightWarning,
                  insight.type === "success" && styles.insightSuccess,
                ]}
              >
                <Text style={styles.insightIcon}>{insight.icon}</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* AI Actions */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("AIChat")}
            >
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Hỏi AI về chi tiết</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "#10B981",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#10B981",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
  },
  refreshIcon: {
    fontSize: 20,
  },
  content: {
    padding: 16,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: "#10B981",
  },
  periodText: {
    color: "#9CA3AF",
    fontWeight: "600",
  },
  periodTextActive: {
    color: "#FFFFFF",
  },
  summaryCard: {
    backgroundColor: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(74, 222, 128, 0.05) 100%)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "rgba(16, 185, 129, 0.15)",
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  aiIconText: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  highlight: {
    color: "#111827",
    fontWeight: "800",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  spendingChart: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
  },
  spendingItem: {
    marginBottom: 16,
  },
  spendingInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryName: {
    flex: 1,
    color: "#1F2937",
    fontWeight: "700",
  },
  spendingAmount: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  amountText: {
    color: "#111827",
    fontWeight: "600",
  },
  percentText: {
    color: "#9CA3AF",
  },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  habitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  habitCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
  },
  habitIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  habitName: {
    color: "#111827",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  habitStats: {
    marginBottom: 8,
  },
  streakText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  habitProgressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 2,
    marginBottom: 4,
    overflow: "hidden",
  },
  habitProgressFill: {
    height: "100%",
    backgroundColor: "#10B981",
  },
  habitPercent: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
  },
  insightWarning: {
    borderLeftColor: "#F59E0B",
    backgroundColor: "rgba(245,158,11,0.08)",
  },
  insightSuccess: {
    borderLeftColor: "#10B981",
    backgroundColor: "rgba(16,185,129,0.08)",
  },
  insightIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    color: "#111827",
    fontWeight: "700",
    marginBottom: 4,
  },
  insightDescription: {
    color: "#111827",
    fontSize: 13,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 18,
    shadowColor: "rgba(16, 185, 129, 0.3)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 8,
    color: "#FFFFFF",
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  aiStatusText: {
    marginTop: 8,
    color: "#9CA3AF",
    fontSize: 13,
  },
  aiErrorText: {
    marginTop: 8,
    color: "#EF4444",
    fontSize: 13,
  },
});
