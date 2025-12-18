import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  Dimensions,
  Vibration,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

import { useTransactionStore } from "../../store/transactionStore";
import { analyzeTransactionsWithAI } from "../../services/AIInsightService";
import { useHabitStore } from "../../store/habitStore";

type Props = NativeStackScreenProps<RootStackParamList, "AIInsight">;

const PALETTE = ["#10B981", "#06B6D4", "#F97316", "#8B5CF6", "#EF4444", "#F59E0B", "#0EA5A4"];

const HABIT_ICON_MAP: Record<string, string> = {
  '💧': 'cup-water',
  '🏃': 'run',
  '🏃‍♂️': 'run',
  '🏃‍♀️': 'run',
  '📚': 'book-open-variant',
  '🧘': 'yoga',
  '🧑‍🍳': 'chef-hat',
  '🎯': 'target',
};

const PERIODS = ["day", "week", "month", "year"] as const;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function HabitCard({ habit, theme }: { habit: any; theme: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [checklistState, setChecklistState] = useState<boolean[]>(() => {
    const daysCompleted = Math.min(7, habit.completedDates?.length || Math.round((habit.progress || 0) / 100 * 7));
    return Array.from({ length: 7 }).map((_, i) => i < daysCompleted);
  });
  const onPressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 300, friction: 20 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }).start();

  // animate the streak fire glow when the streak is active
  useEffect(() => {
    if ((habit.streak || 0) > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(streakAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(streakAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
    streakAnim.setValue(0);
    return;
  }, [habit.streak, streakAnim]);

  const checklist = checklistState;

  const colorFromName = (name: string) => {
    try {
      const sum = [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0);
      return PALETTE[sum % PALETTE.length];
    } catch {
      return PALETTE[0];
    }
  };

  const resolveIconName = (iconCandidate: any, name: string) => {
    if (!iconCandidate && !name) return { name: 'target', color: PALETTE[0] };
    if (typeof iconCandidate === 'string') {
      // emoji to icon mapping
      if (HABIT_ICON_MAP[iconCandidate]) {
        return { name: HABIT_ICON_MAP[iconCandidate], color: colorFromName(name || iconCandidate) };
      }
      // if it's an icon name already
      const sanitized = iconCandidate.trim();
      if (/^[a-z0-9-]+$/i.test(sanitized)) {
        return { name: sanitized, color: colorFromName(name || sanitized) };
      }
      // fallback: show a single emoji as text
      return { name: null, color: colorFromName(name || 'emoji') };
    }
    return { name: 'target', color: colorFromName(name) };
  };

  const resolvedIcon = resolveIconName(habit.icon, habit.name || 'habit');

  const toggleCheck = (index: number) => {
    const next = [...checklistState];
    next[index] = !next[index];
    setChecklistState(next);
    // Haptic feedback when check-in
    try { Vibration.vibrate(40); } catch {}
    if (next[index]) {
      // trigger confetti
      setConfettiVisible(true);
      confettiAnim.setValue(0);
      Animated.timing(confettiAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => setConfettiVisible(false));
    }
  };

  useEffect(() => {
    // persist checklist state to AsyncStorage per habit id
    AsyncStorage.setItem(`habit_checklist_${habit.id || habit.name}`, JSON.stringify(checklistState)).catch(() => {});
  }, [checklistState, habit.id, habit.name]);

  useEffect(() => {
    // attempt to load persisted checklist state
    AsyncStorage.getItem(`habit_checklist_${habit.id || habit.name}`).then((v) => {
      if (v) {
        try {
          const parsed = JSON.parse(v);
          if (Array.isArray(parsed) && parsed.length === 7) {
            setChecklistState(parsed);
          }
        } catch {}
      }
    }).catch(() => {});
  }, [habit.id, habit.name]);

  return (
    <AnimatedTouchable
      style={[styles.habitCardVertical, { transform: [{ scale }], backgroundColor: theme.habitCardBg, borderColor: theme.habitCardBorder }]}
      activeOpacity={0.85}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => Alert.alert(habit.name || 'Thói quen', `Tiến độ ${habit.progress}% — Chuỗi ${habit.streak} ngày`)}
    >
      <View style={styles.habitRowHorizontal}>
        <View style={[styles.habitIconCircle, { backgroundColor: resolvedIcon.color || PALETTE[0] }]}> 
          {resolvedIcon.name ? (
            <MaterialCommunityIcons name={resolvedIcon.name as string} size={18} color="#FFFFFF" />
          ) : (
            <Text style={styles.habitEmojiText}>{habit.icon || '🎯'}</Text>
          )}
        </View>
        <View style={styles.habitTextCol}>
          <View style={styles.habitHeaderRow}>
            <Text style={[styles.habitName, { color: theme.habitNameColor }]}>{habit.name}</Text>
            <View style={styles.habitStreakRow}>
              {(habit.streak || 0) > 0 && (
                <Animated.Text style={[styles.streakFire, { transform: [{ scale: streakAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] }) }], opacity: streakAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }]}>
                  🔥
                </Animated.Text>
              )}
              <Text style={[styles.streakTextSmall, { color: theme.textSecondary }]}>{habit.streak}d</Text>
            </View>
          </View>
          <View style={styles.checklistRow}>
            {checklist.map((done, idx) => (
              <TouchableOpacity key={idx} style={[styles.checkItem, done && styles.checkItemDone]} activeOpacity={0.8} onPress={() => toggleCheck(idx)}>
                {done && <View style={styles.checkItemInner} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
      {confettiVisible && (
          <Animated.View pointerEvents="none" style={[styles.confetti, styles.confettiOverlay, { opacity: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: confettiAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }] }]}>
            <View style={styles.confettiRow}>
              <View style={[styles.confettiDot, styles.confettiDotPink]} />
              <View style={[styles.confettiDot, styles.confettiDotYellow]} />
              <View style={[styles.confettiDot, styles.confettiDotCyan]} />
              <View style={[styles.confettiDot, styles.confettiDotGreen]} />
            </View>
          </Animated.View>
      )}
    </AnimatedTouchable>
  );
}

export default function AIInsightScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const TAB_BAR_HEIGHT = 70;
  
  // Theme colors
  const bgColor = theme.colors.background;
  const surfaceColor = theme.colors.surface;
  const textPrimary = theme.colors.onSurface;
  const textSecondary = theme.colors.onSurfaceVariant;
  const borderColor = theme.dark ? '#404040' : 'rgba(0,0,0,0.06)';
  const cardBg = theme.dark ? '#2A2D3A' : '#F9FAFB';
  const periodBgInactive = theme.dark ? '#3F4451' : '#F3F4F6';
  const habitCardBg = theme.dark ? '#2A2D3A' : '#FFFFFF';
  const habitCardBorder = theme.dark ? '#404040' : 'rgba(31,41,55,0.12)';
  const habitNameColor = theme.dark ? textPrimary : '#111827';
  const insightTextColor = theme.dark ? '#FFFFFF' : '#051126';
  const insightWarningGradient = theme.dark ? ['#7C2D12', '#5B21B6'] : ['#FFEDD5', '#FFE4D6'];
  const insightSuccessGradient = theme.dark ? ['#065F46', '#047857'] : ['#ECFDF5', '#D1FAE5'];
  const insightInfoGradient = theme.dark ? [theme.colors.primary, '#4F46E5'] : [`${theme.colors.primary}20`, `${theme.colors.primary}10`];
  const accentColor = theme.colors.primary;
  const accentError = '#dc2626';
  
  const [selectedPeriod, setSelectedPeriod] = useState<"day" | "week" | "month" | "year">("month");
  
  const [containerWidth, setContainerWidth] = useState(0);
  const indicator = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    if (!containerWidth) return;
    const idx = PERIODS.indexOf(selectedPeriod);
    const border = 1; // container border width
    const width = (containerWidth - border * 2) / PERIODS.length;
    // position starts at left border offset
    const target = idx * width + border;
    Animated.spring(indicator, { toValue: target, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [selectedPeriod, containerWidth, indicator]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [showAiDetails, setShowAiDetails] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [aiRequested, setAiRequested] = useState(false);
  const robotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(robotAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(robotAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [robotAnim]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const transactions = useTransactionStore((s: any) => s.transactions);
  const getFinancialDataByPeriod = useTransactionStore((s: any) => s.getFinancialDataByPeriod);
  const fetchTransactions = useTransactionStore((s: any) => s.fetchTransactions);
  const habitsRaw = useHabitStore((s: any) => s.habits);

  // Fetch transactions lần đầu khi screen mount
  React.useEffect(() => {
    console.log('[AIInsightScreen] Mounted - fetching transactions');
    fetchTransactions().catch((err: any) => {
      console.error('[AIInsightScreen] Error fetching transactions:', err);
    });
  }, [fetchTransactions]);

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

    console.log(`[AIInsightScreen] spendingData: period=${selectedPeriod}, filtered=${filtered.length} of ${transactions?.length || 0}`);

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

    console.log(`[AIInsightScreen] spendingData items:`, items.length);

    // If AI provided categoryBreakdown, prefer it (map to our UI shape)
    // Note: aiResult is in component state; we will use it at render-time as override.
    if (items.length === 0) {
      return [] as any[];
    }

    return items;
  }, [transactions, selectedPeriod]);

  // If AI provided breakdown, prefer that for display
  const displaySpending = useMemo(() => {
    // Ưu tiên dữ liệu từ AI nếu có, nếu không thì dùng dữ liệu từ transactions
    if (aiResult?.categoryBreakdown && Array.isArray(aiResult.categoryBreakdown) && aiResult.categoryBreakdown.length > 0) {
      return aiResult.categoryBreakdown.map((c: any, idx: number) => ({
        category: c.category,
        amount: c.amount || 0,
        percent: Math.round((c.percent || 0) * 10) / 10,
        color: PALETTE[idx % PALETTE.length],
      }));
    }
    // Luôn dùng spendingData từ transactions (đã lọc theo period)
    return spendingData;
  }, [aiResult, spendingData]);

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const CAROUSEL_CARD_WIDTH = Math.min(320, Math.round(SCREEN_WIDTH * 0.72));
  const INSIGHT_CARD_WIDTH = Math.min(260, Math.round(SCREEN_WIDTH * 0.66));

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

  // Open modal immediately when AI is requested
  React.useEffect(() => {
    if (aiRequested && !modalVisible) {
      setModalVisible(true);
    }
  }, [aiRequested, modalVisible]);

  // Call AI analysis whenever transactions, selectedPeriod, or explicit user request occur
  React.useEffect(() => {
    if (!aiRequested) return;
    let mounted = true;
    const timer = setTimeout(() => {
      (async () => {
        try {
          setAiLoading(true);
          if (!transactions || transactions.length === 0) {
            console.log('[AIInsightScreen] No transactions, using fallback analysis');
            // Không return, tiếp tục với mock data hoặc empty analysis
          }
          setAiError(null);
          // compute explicit startDate/endDate for the selected period
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

          // Use optimized function: prepareCompactPayload + analyzeCompactPayload
          try {
            const res = await analyzeTransactionsWithAI(transactions, habitsRaw, { periodLabel: selectedPeriod });
            if (!mounted) return;
            if (res.success) {
              setAiResult(res.data || null);
            } else {
              setAiError(res.error || 'Không thể phân tích dữ liệu');
              setAiResult(null);
            }
          } catch (error: any) {
            if (!mounted) return;
            console.error('[AIInsightScreen] AI analysis error:', error?.message || error);
            setAiError(error?.message || 'Lỗi khi phân tích');
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
  }, [transactions, selectedPeriod, aiRequested, habitsRaw]);

  

  

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
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={18} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>Phân tích thông minh</Text>
        <TouchableOpacity style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={16} color={textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Period Selector */}
          <View
            style={styles.periodSelector}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            {!!containerWidth && (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.periodIndicator,
                  {
                    width: (containerWidth - 2) / PERIODS.length,
                    transform: [{ translateX: indicator }],
                  },
                ]}
              />
            )}
            {PERIODS.map((period, idx) => {
              const label = period === "day" ? "Ngày" : period === "week" ? "Tuần" : period === "month" ? "Tháng" : "Năm";
              const selected = selectedPeriod === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.periodButton,
                    selected && { backgroundColor: '#06B6D4' },
                    !selected && { backgroundColor: periodBgInactive },
                    idx === 0 && styles.periodButtonFirst,
                    idx === PERIODS.length - 1 && styles.periodButtonLast,
                  ]}
                  onPress={() => setSelectedPeriod(period)}
                >
                  <View style={styles.periodTextWrap}>
                    <Text style={[styles.periodText, selected ? [styles.periodTextActive, { color: '#FFFFFF' }] : { color: textSecondary }]}>{label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AI Summary Card */}
          {!aiError && (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setAiRequested(true)}>
              <LinearGradient colors={["#06B6D4", "#10B981"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.summaryCard, styles.summaryCardGlass]}>
                <Animated.View style={[styles.aiIcon, styles.aiIconCenter, { transform: [{ scale: robotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.06] }) }], shadowOpacity: robotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] }) }]}>
                  <MaterialCommunityIcons name="robot-outline" size={28} color="#FFFFFF" />
                </Animated.View>
              <Text style={styles.summaryTitle}>Xin chào! Mình là trợ lý AI</Text>
              <View style={styles.summaryContentRow}>
                {aiLoading && <MaterialCommunityIcons name="clock-outline" size={18} color="#FFFFFF" style={styles.summaryIcon} />}
                {aiResult?.summary && <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" style={styles.summaryIcon} />}
                <Text style={styles.summaryTextWithIcon}>
                  {aiLoading ? (
                    `Đang phân tích dữ liệu của bạn...`
                  ) : aiResult?.summary ? (
                    aiResult.summary
                  ) : (
                    `Mình đã xem qua các giao dịch của bạn. Mình có thể giúp tóm tắt, gợi ý tiết kiệm và đưa ra phân tích chi tiết.`
                  )}
                </Text>
              </View>

              {/* Show toggle to view details if AI provided suggestions/anomalies */}
              {( (aiResult?.suggestions && aiResult.suggestions.length > 0) || (aiResult?.actions && aiResult.actions.length > 0) || (aiResult?.anomalies && aiResult.anomalies.length > 0) ) && (
                <View style={styles.summaryActionsRow}>
                  {aiResult && (
                    <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.resultButton]}>
                      <Text style={styles.resultButtonText}>Xem kết quả</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => { setAiRequested(true); setShowAiDetails(v => !v); }} style={styles.summaryActionButton}>
                    <Text style={styles.summaryActionText}>{showAiDetails ? 'Thu gọn' : 'Khám phá chi tiết'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setAiRequested(true); setModalVisible(true); }} style={[styles.summaryActionButton, styles.summaryActionButtonOutline]}>
                    <Text style={[styles.summaryActionText, styles.summaryActionTextOutline]}>Trò chuyện với mình</Text>
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
            </TouchableOpacity>
          )}

          {/* AI Modal */}
          <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => {
            setModalVisible(false);
            setAiRequested(false);
          }}>
            <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: bgColor }]}>
                <View style={[styles.modalHeaderRow, { backgroundColor: surfaceColor, borderBottomColor: borderColor }]}>
                  <Text style={[styles.modalTitle, { color: textPrimary }]}>Trợ lý AI</Text>
                  <TouchableOpacity onPress={() => {
                    setModalVisible(false);
                    setAiRequested(false);
                  }}>
                    <Text style={[styles.modalClose, { color: accentColor }]}>Đóng</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {aiLoading ? (
                    <View style={styles.modalLoadingRow}>
                      <MaterialCommunityIcons name="clock-outline" size={20} color={textPrimary} />
                      <Text style={[styles.modalGreeting, { color: textPrimary }]}>Đang phân tích dữ liệu của bạn...</Text>
                    </View>
                  ) : aiResult?.summary ? (
                    <View style={styles.modalLoadingRow}>
                      <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10B981" />
                      <Text style={[styles.modalGreetingFlex, { color: textPrimary }]}>Tóm tắt: {aiResult.summary}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.modalGreeting, { color: textPrimary }]}>Mình có thể giúp bạn phân tích chi tiết thu chi và đưa ra gợi ý. Tháng này bạn đã chi khoảng {(financial.totalExpense || 0).toLocaleString('vi-VN')} VNĐ</Text>
                  )}
                  {aiError && (
                    <View style={styles.aiErrorContainerRow}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#dc2626" />
                      <Text style={[styles.aiErrorMessageFlex, { color: accentError }]}>Lỗi: {aiError}</Text>
                    </View>
                  )}
                  {!aiLoading && aiResult && ( (aiResult?.suggestions && aiResult.suggestions.length > 0) || (aiResult?.actions && aiResult.actions.length > 0) ) && (
                    <View style={styles.modalSectionSpacing}>
                      <View style={styles.sectionTitleRow}>
                        <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#F59E0B" />
                        <Text style={[styles.sectionTitle, { color: textPrimary }]}>Gợi ý từ AI</Text>
                      </View>
                      { (aiResult?.suggestions || aiResult?.actions).map((s: any, i: number) => (
                        <View key={`modal-sugg-${i}`} style={styles.aiDetailRow}>
                          <Text style={[styles.aiDetailBullet, { color: textSecondary }]}>•</Text>
                          <Text style={[styles.aiDetailText, { color: textPrimary }]}>{typeof s === 'string' ? s : `${s.title || s.name || ''}${s.description ? ' — ' + s.description : ''}`}</Text>
                        </View>
                      )) }
                    </View>
                  )}
                </ScrollView>
                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={[styles.modalActionLeft, styles.modalPrimaryButton]} onPress={() => { 
                    setModalVisible(false); 
                    setAiRequested(false);
                    navigation.navigate('AIChat'); 
                  }}>
                    <Text style={styles.modalPrimaryText}>Bắt đầu trò chuyện</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalActionRight, styles.summaryActionButtonOutline]} onPress={() => {
                    setModalVisible(false);
                    setAiRequested(false);
                  }}>
                    <Text style={[styles.summaryActionText, styles.summaryActionTextOutline]}>Đóng</Text>
                  </TouchableOpacity>
                </View>
                </View>
              </TouchableWithoutFeedback>
            </Pressable>
          </Modal>

          {/* AI Details expandable area */}
          {showAiDetails && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chi tiết AI</Text>
              { ( (aiResult?.suggestions && aiResult.suggestions.length > 0) || (aiResult?.actions && aiResult.actions.length > 0) ) ? (
                (aiResult?.suggestions || aiResult?.actions).map((s: any, i: number) => (
                  <View key={`sugg-${i}`} style={styles.aiDetailRow}>
                    <Text style={styles.aiDetailBullet}>•</Text>
                    <Text style={styles.aiDetailText}>{typeof s === 'string' ? s : `${s.title || s.name || ''}${s.description ? ' — ' + s.description : ''}`}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.aiDetailEmpty}>Không có đề xuất từ AI</Text>
              )}
              {aiResult?.anomalies && aiResult.anomalies.length > 0 && (
                <View style={styles.aiAnomalyWrap}>
                  <Text style={styles.aiAnomalyTitle}>Các giao dịch bất thường</Text>
                  {aiResult.anomalies.map((a: any, idx: number) => (
                    <View key={`anom-${idx}`} style={styles.aiDetailRow}>
                      <Text style={styles.aiDetailBullet}>•</Text>
                      <Text style={styles.aiDetailText}>{a}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Spending Breakdown */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>Phân tích chi tiêu</Text>
              <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('Report')}>
                <Text style={[styles.viewAllText, { color: accentColor }]}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.spendingChartCarouselWrap}>
              {displaySpending && displaySpending.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate={'fast'}
                  snapToInterval={CAROUSEL_CARD_WIDTH + 12}
                  snapToAlignment={'center'}
                  contentContainerStyle={styles.carouselContent}
                >
                  {displaySpending.slice(0, 3).map((item: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.spendingCard, index === 0 && styles.spendingCardFeatured, { width: CAROUSEL_CARD_WIDTH, backgroundColor: cardBg, borderColor: borderColor }]}
                      activeOpacity={0.9}
                      onPress={() => Alert.alert(item.category || 'Hạng mục', `${(item.amount || 0).toLocaleString('vi-VN')} VNĐ`)}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.cardLeftRow}>
                          <View style={[styles.categoryDotLarge, { backgroundColor: item.color }]} />
                          <Text style={[styles.spendingCardTitle, { color: textPrimary }]}>{item.category}</Text>
                        </View>
                        <Text style={[styles.spendingCardAmount, { color: textPrimary }]}>{(item.amount || 0).toLocaleString('vi-VN')} VNĐ</Text>
                      </View>
                      <View style={[styles.spendingCardProgressBar, { backgroundColor: borderColor }]}>
                        <View style={[styles.spendingCardProgressFill, { width: `${item.percent}%`, backgroundColor: item.color }]} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={[styles.emptySpending, { backgroundColor: cardBg, borderColor: borderColor }]}>
                  <Text style={[styles.emptySpendingText, { color: textSecondary }]}>Không có dữ liệu chi tiêu cho khoảng thời gian này.</Text>
                  <View style={styles.spendingCTARow}>
                    <TouchableOpacity style={styles.spendingCTAButton} onPress={() => navigation.navigate('AddTransaction', { defaultType: 'expense' })}>
                      <Text style={styles.spendingCTAText}>Thêm giao dịch</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.spendingCTAButtonOutline} onPress={() => navigation.navigate('Report')}>
                      <Text style={[styles.spendingCTAOutlineText, { color: accentColor }]}>Mở báo cáo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Habits Progress */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: textPrimary }]}>Tiến độ thói quen</Text>
            <View style={styles.habitsGridVertical}>
              {habits.map((habit: any, index: number) => (
                <HabitCard key={index} habit={habit} theme={{ habitCardBg, habitCardBorder, habitNameColor, textSecondary }} />
              ))}
            </View>
          </View>

          {/* Insights & Recommendations */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: textPrimary }]}>Khuyến nghị</Text>
              <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate('AIChat')}>
                <Text style={[styles.viewAllText, { color: accentColor }]}>Tương tác</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.insightCarouselWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate={'fast'}
                snapToInterval={INSIGHT_CARD_WIDTH + 12}
                snapToAlignment={'center'}
                contentContainerStyle={styles.carouselContent}
              >
                {insights.map((insight, index) => {
                  const colors = insight.type === 'warning' ? insightWarningGradient : insight.type === 'success' ? insightSuccessGradient : insightInfoGradient;
                  const iconName = insight.type === 'warning' ? 'alert-circle-outline' : insight.type === 'success' ? 'check-circle-outline' : 'lightbulb-outline';
                  const iconColor = insight.type === 'warning' ? '#F97316' : insight.type === 'success' ? '#059669' : accentColor;
                  return (
                    <TouchableOpacity key={index} activeOpacity={0.9} onPress={() => Alert.alert(insight.title, insight.description)} style={[styles.insightStoryCard, { width: INSIGHT_CARD_WIDTH }]}> 
                      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.insightStoryGradient}>
                        <View style={styles.insightStoryTop}>
                          <View style={[styles.insightStoryIcon, { backgroundColor: `${iconColor}20`}]}>
                            <MaterialCommunityIcons name={iconName} size={18} color={iconColor} />
                          </View>
                        </View>
                        <View style={styles.insightStoryBody}>
                          <Text style={[styles.insightStoryTitle, { color: insightTextColor }]}>{insight.title}</Text>
                          <Text numberOfLines={3} style={[styles.insightStoryDesc, { color: insightTextColor }]}>{insight.description}</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* AI Actions (moved to sticky FAB) */}
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>

      {/* Sticky FAB Chat Input */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + TAB_BAR_HEIGHT - 40 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.fabButton} activeOpacity={0.92} onPress={() => navigation.navigate('AIChat')}>
          <MaterialCommunityIcons name="chat-processing-outline" size={20} color="#FFFFFF" style={styles.fabIcon} />
          <Text style={styles.fabText}>Bạn thắc mắc gì không? Hỏi mình nhé...</Text>
          <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" style={styles.fabSendIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  spendingItem: {
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 1,
    paddingHorizontal: 16,
    paddingBottom: 3,
    borderBottomWidth: 1,
  },
  spendingChart: {
    backgroundColor: "transparent",
    borderRadius: 0,
    padding: 0,
    borderWidth: 0,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },
  backIcon: {
    fontSize: 18,
    color: "#10B981",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 0,
  },
  refreshButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 10,
    marginTop: -2,
  },
  refreshIcon: {
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  periodSelector: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 0,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 0,
    zIndex: 2,
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
  periodButtonFirst: { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  periodButtonMiddle: { borderRadius: 0 },
  periodButtonLast: { borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  periodButtonActive: {
    zIndex: 3,
    shadowColor: '#06B6D4',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    letterSpacing: 0.2,
  },
  periodTextActive: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    letterSpacing: 0.2,
  },
  periodIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    backgroundColor: '#06B6D4',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 3,
    zIndex: 0,
  },
  periodTextWrap: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  summaryCardGlass: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  // summaryEmoji removed — badge removed per design
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#06B6D4',
    alignItems: 'center',
  },
  summaryCardGray: {
    backgroundColor: '#FFFFFF',
    borderColor: '#06B6D4',
  },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  aiIconBorder: {
    borderWidth: 1,
    borderColor: '#06B6D4',
  },
  aiIconCenter: { alignSelf: 'center' },
  aiIconGray: {
    backgroundColor: '#FFFFFF',
  },
  aiIconText: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Roboto',
    letterSpacing: 0.2,
  },
  summaryText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Roboto',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  summaryContentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  summaryIcon: { marginTop: 2 },
  summaryTextWithIcon: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Roboto',
    fontWeight: '500',
    letterSpacing: 0.1,
    flex: 1,
  },
  highlight: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 16,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewAllButton: { paddingHorizontal: 8 },
  viewAllText: { fontWeight: '700' },
  insightCarouselWrap: { marginTop: 6, marginBottom: 6 },
  insightStoryCard: { marginRight: 12, borderRadius: 14, overflow: 'hidden' },
  insightStoryGradient: { borderRadius: 14, padding: 16, height: 160, justifyContent: 'space-between' },
  insightStoryTop: { alignItems: 'flex-end' },
  insightStoryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  insightStoryBody: { marginTop: 6 },
  insightStoryTitle: { fontWeight: '800', fontSize: 15, marginBottom: 6 },
  insightStoryDesc: { fontSize: 13, lineHeight: 18 },
  
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
  categoryDotLarge: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },

  spendingChartCarouselWrap: { marginTop: 6, marginBottom: 6 },
  carouselContent: { paddingHorizontal: 16 },
  spendingCard: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginRight: 12, borderWidth: 2, borderColor: '#06B6D4' },
  spendingCardFeatured: { transform: [{ scale: 1.03 }], shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  spendingCardTitle: { fontWeight: '800', fontSize: 16 },
  spendingCardAmount: { fontWeight: '800' },
  spendingCardProgressBar: { height: 10, borderRadius: 6, overflow: 'hidden' },
  spendingCardProgressFill: { height: '100%' },
  cardLeftRow: { flexDirection: 'row', alignItems: 'center' },
  habitIconCircle: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  habitEmojiText: { fontSize: 26 },
  habitHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  habitStreakRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  streakFire: { marginRight: 6, fontSize: 14, textShadowColor: 'rgba(249, 115, 22, 0.8)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 8 },
  checklistRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  checkItem: { width: 16, height: 16, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.06)' },
  checkItemDone: { backgroundColor: '#06B6D4', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' },
  checkItemInner: { width: '100%', height: '100%', borderRadius: 4 },
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
  /* vertical habit list */
  habitsGridVertical: {
    flexDirection: 'column',
    gap: 12,
  },
  habitCardVertical: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    borderWidth: 1,
    marginBottom: 10,
  },
  habitRowHorizontal: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitIcon: { fontSize: 28, marginRight: 8, width: 36, textAlign: 'center' },
  habitName: {
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  habitProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  habitProgressBarHorizontal: { flex: 1, height: 8, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 6, overflow: 'hidden' },
  habitProgressFillHorizontal: { height: '100%', backgroundColor: '#10B981' },
  habitPercent: { color: '#9CA3AF', fontSize: 12, marginLeft: 8 },
  streakTextSmall: { fontSize: 12, marginTop: 8 },
  insightCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(31,41,55,0.12)",
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

  insightCardModern: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(31,41,55,0.12)',
    shadowColor: 'rgba(0,0,0,0.04)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  insightIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(31,41,55,0.12)",
  },
  actionButtonStrong: {
    backgroundColor: '#E9ECEF',
  },
  actionIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  actionText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto',
    letterSpacing: 0.2,
  },
  aiStatusText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
  },
  aiErrorText: {
    marginTop: 8,
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
  },
  /* New UI: summary action buttons */
  summaryActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'center' },
  summaryActionButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  summaryActionButtonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  summaryActionText: { color: 'rgba(255,255,255,0.98)', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'HelveticaNeue' : 'Roboto', letterSpacing: 0.2 },
  summaryActionTextOutline: { color: 'rgba(255,255,255,0.98)' },

  emptySpending: { padding: 18, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  emptySpendingText: { marginBottom: 12 },
  spendingCTARow: { flexDirection: 'row', gap: 8 },
  spendingCTAButton: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  spendingCTAText: { color: '#FFFFFF', fontWeight: '700' },
  spendingCTAButtonOutline: { backgroundColor: 'transparent', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  spendingCTAOutlineText: { fontWeight: '700' },

  aiDetailRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  aiDetailBullet: { fontSize: 18, lineHeight: 22, marginTop: 2 },
  aiDetailText: { flex: 1 },
  aiDetailEmpty: { color: '#6B7280' },

  habitIconMargin: { marginRight: 12 },
  habitTextCol: { flex: 1 },
  aiAnomalyWrap: { marginTop: 12 },
  aiAnomalyTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  /* Floating Action Button */
  fabContainer: { position: 'absolute', left: 16, right: 16, zIndex: 999 },
  fabButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111827', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, shadowColor: 'rgba(0,0,0,0.2)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  fabIcon: { marginRight: 12 },
  fabText: { flex: 1, color: '#FFFFFF', opacity: 0.95, fontWeight: '600', marginLeft: 8 },
  fabSendIcon: { marginLeft: 12 },
  confetti: { backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  confettiOverlay: { position: 'absolute', left: 8, right: 8, top: 8, height: 80 },
  confettiDotPink: { backgroundColor: '#FF7AA2' },
  confettiDotYellow: { backgroundColor: '#FFD166' },
  confettiDotCyan: { backgroundColor: '#06B6D4' },
  confettiDotGreen: { backgroundColor: '#10B981' },
  confettiRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  confettiDot: { width: 8, height: 8, borderRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modalContent: { borderRadius: 14, padding: 16, maxHeight: '86%' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, paddingBottom: 12 },
  modalTitle: { fontWeight: '800', fontSize: 16 },
  modalClose: { fontWeight: '700' },
  modalGreeting: { marginBottom: 8, fontSize: 14 },
  modalLoadingRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 16 },
  modalGreetingFlex: { marginBottom: 8, fontSize: 14, flex: 1 },
  modalSectionSpacing: { marginTop: 12 },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  modalActionLeft: { flex: 1, marginRight: 8 },
  modalActionRight: { flex: 1 },
  modalPrimaryButton: { backgroundColor: '#06B6D4', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(6,182,212,0.16)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 3 },
  modalPrimaryText: { color: '#FFFFFF', fontWeight: '800' },
  resultButton: { backgroundColor: '#059669', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  resultButtonText: { color: '#FFFFFF', fontWeight: '800' },
  aiErrorContainer: { padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#dc2626', marginBottom: 12 },
  aiErrorMessage: { color: '#991b1b', fontWeight: '600' as any },
  aiErrorContainerRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 12, backgroundColor: '#fee2e2', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#dc2626', marginBottom: 12 },
  aiErrorMessageFlex: { color: '#991b1b', fontWeight: '600', flex: 1 },
  sectionTitleRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 16 },
});
