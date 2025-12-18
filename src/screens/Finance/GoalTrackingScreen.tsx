import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useFocusEffect } from '@react-navigation/native';
import { useWalletStore } from '../../store/walletStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useGoalStore } from '../../store/goalStore';
import { computeGoalCurrent, computeTotalCurrent, getProgress as utilGetProgress } from '../../utils/goalProgress';
import NotificationService from '../../services/NotificationService';
import GoalSuggestionService from '../../services/GoalSuggestionService';
import type { GoalSuggestion } from '../../services/GoalSuggestionService';
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

type Props = NativeStackScreenProps<RootStackParamList, "GoalTracking">;

interface Goal {
  id: string;
  title: string;
  icon: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  transactions?: Array<{ id: string; amount: number; note?: string; date: string }>;
  category: "saving" | "purchase" | "investment" | "education";
  color: string;
  monthlyContribution: number;
}

export default function GoalTrackingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [fadeAnim] = useState(new Animated.Value(0));
  const theme = useTheme();
  const styles = getStyles(theme);
  const primary = theme.colors.primary;
  const onPrimary = theme.colors.onPrimary || '#FFFFFF';
  const onSurface = theme.colors.onSurface;
  const errorColor = theme.colors.error;
  // AI accent: use green for AI card (avoid purple). `aiGreen` used for borders and icon.
  const aiGreen = '#10B981';
  const aiGradientColors = theme.dark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0)'] : ['rgba(16,185,129,0.06)', 'rgba(16,185,129,0.14)'];
  const aiCardBg = theme.dark ? 'transparent' : '#FFFFFF';

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const goals = useGoalStore(state => state.goals);
  // const isLoading = useGoalStore(state => state.isLoading); // unused for now
  const fetchGoals = useGoalStore(state => state.fetchGoals);
  const addGoal = useGoalStore(state => state.addGoal);
  const updateGoal = useGoalStore(state => state.updateGoal);
  const addMoneyToGoal = useGoalStore(state => state.addMoneyToGoal);
  const deleteGoal = useGoalStore(state => state.deleteGoal);

  // fetch latest goals when screen focused
  const fetchInProgressRef = React.useRef(false);
  useFocusEffect(
    React.useCallback(() => {
      if (fetchInProgressRef.current) return;
      fetchInProgressRef.current = true;
      const timeout = setTimeout(() => { fetchInProgressRef.current = false; }, 10000);
      fetchGoals().finally(() => { clearTimeout(timeout); fetchInProgressRef.current = false; });
      return () => { fetchInProgressRef.current = false; };
    }, [fetchGoals])
  );

  const getProgress = utilGetProgress;

  const getTimeRemaining = React.useCallback((deadline: any) => {
    // Accept Date | string | Firestore.Timestamp-like objects
    if (!deadline) return 0;
    let targetDate: Date | null = null;
    if (deadline instanceof Date) targetDate = deadline;
    // Firestore Timestamp has toDate()
    else if ((deadline as any)?.toDate instanceof Function) targetDate = (deadline as any).toDate();
    else {
      const parsed = new Date(String(deadline));
      targetDate = isNaN(parsed.getTime()) ? null : parsed;
    }
    if (!targetDate) return 0;
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    const months = Math.ceil(diff / (1000 * 60 * 60 * 24 * 30));
    return months;
  }, []);

  // Format/normalize a deadline input/value: returns formatted localized month/year or placeholder
  const formatDeadlineLabel = (deadline: any) => {
    if (!deadline) return '—';
    let d: Date | null = null;
    if (deadline instanceof Date) d = deadline;
    else if (deadline?.toDate instanceof Function) d = deadline.toDate();
    else {
      const parsed = new Date(String(deadline));
      d = isNaN(parsed.getTime()) ? null : parsed;
    }
    return d ? d.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : '—';
  };

  const getRequiredMonthly = React.useCallback((goal: Goal) => {
    const current = computeGoalCurrent(goal);
    const remaining = goal.targetAmount - current;
    const months = getTimeRemaining(goal.deadline);
    return months > 0 ? remaining / months : 0;
  }, [getTimeRemaining]);

  // Provide a narrow-but-visible minimum for extremely small percentages
  const progressVisibleWidth = (p: number) => {
    const n = typeof p === 'number' && Number.isFinite(p) ? p : 0;
    if (n <= 0) return 0;
    const minVisible = 0.125; // allow showing 3-decimal percentages like 0.125%
    const v = Math.min(Math.max(n, minVisible), 100);
    // keep up to 3 decimals
    const rounded = Math.round(v * 1000) / 1000;
    return rounded; // numeric percent (e.g., 0.125)
  };

  // Format VNĐ compactly (e.g., 180000000 -> "180 triệu VNĐ", 1500000000 -> "1.5 tỷ VNĐ")
  const formatVNDCompact = (val: number, includeSymbol = true) => {
    if (!isFinite(val)) return "0 VNĐ";
    const n = Math.abs(val);
    if (n >= 1000000000) {
      const t = +(val / 1000000000).toFixed((val % 1000000000 === 0) ? 0 : 1);
      return `${t} tỷ VNĐ`;
    }
    if (n >= 1000000) {
      const m = +(val / 1000000).toFixed((val % 1000000 === 0) ? 0 : 1);
      return `${m} triệu VNĐ`;
    }
    return `${includeSymbol ? '₫' : ''}${val.toLocaleString("vi-VN")} VNĐ`;
  };

  const totalTargetAmount = goals.reduce((sum: number, goal: Goal) => sum + (goal.targetAmount || 0), 0);
  const totalCurrentAmount = computeTotalCurrent(goals);
  const totalProgress = getProgress(totalCurrentAmount, totalTargetAmount);

  // modal form state (in-screen)
  const [showAddModal, setShowAddModal] = useState(false);
  const [fabScale] = useState(new Animated.Value(1));
  const handleFabPressIn = () => Animated.spring(fabScale, { toValue: 0.96, useNativeDriver: true }).start();
  const handleFabPressOut = () => {
    Animated.sequence([
      Animated.spring(fabScale, { toValue: 1.08, friction: 6, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    setShowAddModal(true);
  };
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newMonthly, setNewMonthly] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newCategory, setNewCategory] = useState<Goal['category']>('saving');
  const [newPriority, setNewPriority] = useState<'high'|'medium'|'low'>('medium');
  // detail is a separate screen now; keep only add-money modal state
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [addNote, setAddNote] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  // AI suggestions state
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<GoalSuggestion[]>([]);

  const applySuggestion = (t: GoalSuggestion) => {
    setNewTitle(t.title);
    setNewDesc(t.description);
    setNewTarget(t.targetAmount.toString());
    setNewMonthly(t.monthlyContribution.toString());
    setNewDeadline(t.deadline);
    setNewCategory(t.category);
    setNewPriority(t.priority);
  };

  // Fetch AI suggestions
  const fetchAISuggestions = async () => {
    setSuggestionLoading(true);
    try {
      console.log('📞 [GoalTracking] Gọi GoalSuggestionService...');
      const response = await GoalSuggestionService.suggestGoals();
      
      console.log('✅ [GoalTracking] Nhận được gợi ý từ AI:', response.suggestions.length);
      setAISuggestions(response.suggestions);
      Alert.alert('Thành công', `Nhận được ${response.suggestions.length} gợi ý từ AI`);
    } catch (error: any) {
      console.error('❌ [GoalTracking] Error:', error?.message);
      Alert.alert('Lỗi', error?.message || 'Không thể lấy gợi ý từ AI');
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleAddNewGoal = () => {
    if (!newTitle.trim()) { Alert.alert('Lỗi', 'Nhập tên mục tiêu'); return; }
    const targetNum = parseFloat(newTarget.replace(/,/g, '')) || 0;
    if (targetNum <= 0) { Alert.alert('Lỗi', 'Nhập số tiền hợp lệ'); return; }

    const colors: Record<Goal['category'], string> = { saving: '#10B981', purchase: '#EC4899', investment: '#6366F1', education: '#8B5CF6' };
    // parse deadline input if in MM/YYYY format
    let deadlineDate: Date = new Date();
    if (newDeadline && /^(0?[1-9]|1[0-2])\/(\d{4})$/.test(newDeadline)) {
      const parts = newDeadline.split('/');
      const mm = parseInt(parts[0], 10) - 1;
      const yy = parseInt(parts[1], 10);
      // use first day of that month
      deadlineDate = new Date(yy, mm, 1);
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      icon: newCategory === 'purchase' ? 'cart' : newCategory === 'education' ? 'school' : newCategory === 'investment' ? 'chart-line' : 'piggy-bank',
      targetAmount: targetNum,
      currentAmount: 0,
      deadline: deadlineDate,
      category: newCategory,
      color: colors[newCategory],
      monthlyContribution: parseFloat(newMonthly.replace(/,/g, '')) || 0,
    };

    // persist goal via store/service (will write to Firebase)
    addGoal(newGoal).then(() => {
      Alert.alert('Thành công', 'Đã tạo mục tiêu tiết kiệm');
    }).catch((err: any) => {
      Alert.alert('Lỗi', err?.message || 'Không thể tạo mục tiêu');
    });
    setNewTitle(''); setNewDesc(''); setNewTarget(''); setNewMonthly(''); setNewDeadline(''); setNewCategory('saving'); setNewPriority('medium');
    setShowAddModal(false);
  };

  const wallets = useWalletStore(state => state.wallets);
  const fetchWallets = useWalletStore(state => state.fetchWallets);
  const updateWallet = useWalletStore(state => state.updateWallet);
  const initializeWallets = useWalletStore(state => state.initialize);

  const addTransaction = useTransactionStore(state => state.addTransaction);

  React.useEffect(() => {
    // ensure wallets are loaded and pick default
    (async () => {
      try {
        await initializeWallets();
        if (!selectedWalletId && wallets && wallets.length > 0) setSelectedWalletId(wallets[0]?.id ?? null);
      } catch {
        // ignore
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    // keep default selected wallet if wallets change
    if (!selectedWalletId && wallets && wallets.length > 0) setSelectedWalletId(wallets[0]?.id ?? null);
  }, [wallets, selectedWalletId]);

  // When goals update: schedule payday reminders and send progress alerts as needed
  React.useEffect(() => {
    if (!goals || goals.length === 0) return;

    // avoid duplicate progress warnings per session
    const alerted = new Set<string>();

    (async () => {
      for (const g of goals) {
        // Schedule payday reminders for goals with monthly contribution
        if (g.monthlyContribution && g.monthlyContribution > 0) {
          try {
            await NotificationService.scheduleGoalPaydayReminder(
              { id: g.id, title: g.title, monthlyContribution: g.monthlyContribution },
              { days: [5, 10], hour: 9, minute: 0 }
            );
          } catch (err) {
            console.warn('GoalTracking: failed to schedule payday reminder', g.id, err);
          }
        }

        // Progress Alert: if close to deadline (<=3 months) and monthly contributions insufficient
        try {
          const monthsLeft = getTimeRemaining(g.deadline);
          const current = computeGoalCurrent(g);
          const pct = getProgress(current, g.targetAmount);
          const requiredMonthly = getRequiredMonthly(g);

          if (monthsLeft > 0 && monthsLeft <= 3 && pct < 100 && (g.monthlyContribution || 0) < requiredMonthly && !alerted.has(g.id)) {
            alerted.add(g.id);
            const body = `Chỉ còn ${monthsLeft} tháng nữa là đến hạn ${g.title || 'mục tiêu'}, bạn mới đạt ${Math.floor(pct)}%. Cần nạp thêm ${formatVNDCompact(Math.round(requiredMonthly))}/tháng.`;
            NotificationService.displayNotification({ id: `goal-progress-${g.id}`, title: 'Cảnh báo tiến độ', body }).catch(() => {});
          }
        } catch (e) {
          console.warn('GoalTracking: progress check failed', e);
        }
      }
    })();
  }, [goals, getProgress, getRequiredMonthly, getTimeRemaining]);

  const handleConfirmAddToGoal = async (g: Goal, amountOverride?: number, noteOverride?: string, dateOverride?: string) => {
    const amt = amountOverride !== undefined ? Math.round(amountOverride) : Math.round(parseFloat(addAmount.replace(/[^0-9.-]/g, '')) || 0);
    if (amt <= 0) { Alert.alert('Lỗi', 'Nhập số tiền hợp lệ'); return; }
    if (!selectedWalletId) { Alert.alert('Lỗi', 'Chọn ví nguồn'); return; }

    const wallet = wallets.find(w => w.id === selectedWalletId);
    if (!wallet) { Alert.alert('Lỗi', 'Ví không tồn tại'); return; }

    if (!wallet.id) { Alert.alert('Lỗi', 'Ví không hợp lệ'); return; }

    if ((wallet.balance || 0) < amt) {
      Alert.alert('Không đủ tiền', `Ví ${wallet.name} chỉ còn ${wallet.balance?.toLocaleString('vi-VN') || 0} VNĐ`);
      return;
    }

    // perform operations: subtract wallet -> add transaction -> add money to goal
    let walletUpdated = false;
    try {
      // 1) subtract wallet balance
      await updateWallet(wallet.id, { balance: (wallet.balance || 0) - amt });
      walletUpdated = true;

      // 2) add expense transaction to transactions (records wallet usage)
      await addTransaction({
        type: 'expense',
        amount: amt,
        description: `Nạp tiền tiết kiệm - ${g.title}`,
        category: 'goal',
        walletId: wallet.id,
        walletName: wallet.name,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      // 3) add money to goal (GoalService will update the goal and its transactions)
      await addMoneyToGoal(g.id, { 
        amount: amt, 
        category: 'Tiết kiệm', 
        description: noteOverride ?? (addNote || 'Nạp tiền tiết kiệm'),
        date: dateOverride ?? new Date().toISOString() 
      });

      setAddAmount(''); setAddNote(''); setShowAddMoneyModal(false);
      Alert.alert('Thành công', `Đã chuyển ${amt.toLocaleString('vi-VN')} VNĐ vào mục tiêu`);
    } catch (err: any) {
      // rollback wallet if necessary
      if (walletUpdated) {
        try { await updateWallet(wallet.id, { balance: (wallet.balance || 0) + amt }); } catch { }
      }
      Alert.alert('Lỗi', err?.message || 'Không thể nạp tiền vào mục tiêu');
    }
  };

  // helper to refetch wallets quickly when modal opens
  const ensureWalletsLoaded = async () => { try { await fetchWallets(); } catch { } };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mục tiêu</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Total Progress */}
          <View style={[styles.totalCard, styles.totalCardPlus]}>
            <Text style={[styles.totalLabel, styles.totalLabelOnPlus]}>Tổng tiến độ</Text>
            <Text style={[styles.totalAmountSmall, styles.totalAmountSmallOnPlus]}>
              {totalCurrentAmount.toLocaleString("vi-VN")} VND / {totalTargetAmount.toLocaleString("vi-VN")} VND
            </Text>
            <View style={[styles.totalProgressBar, styles.totalProgressBarPlus]}>
              <LinearGradient colors={['#10B981', '#06B6D4']} start={{x:0,y:0}} end={{x:1,y:0}} style={[styles.totalProgressFill, { width: `${progressVisibleWidth(totalProgress)}%` as any }]} />
            </View>
            <Text style={[styles.totalPercentage, styles.totalPercentageOnPlus]}>{totalProgress.toFixed(2)}% hoàn thành</Text>
          </View>

          {/* AI Insight */}
          <LinearGradient
            colors={aiGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.aiCard, theme.dark && styles.aiCardDark, { borderColor: `${aiGreen}14`, backgroundColor: aiCardBg }]}
          >
            <View style={styles.aiHeader}>
              <Icon name="robot" size={24} color={aiGreen} style={styles.aiIcon} />
              <Text style={[styles.aiTitle, theme.dark && styles.aiTitleDark]}>Phân tích AI</Text>
            </View>
            <View style={styles.aiBulletRow}>
              <Text style={styles.aiBulletIcon}>🐢</Text>
              <Text style={[styles.aiText, theme.dark && styles.aiTextDark]}>Chậm: <Text style={theme.dark ? styles.aiHighlightDark : styles.aiHighlight}>Mua xe hơi</Text> (Trễ 3 tháng)</Text>
            </View>
            <View style={styles.aiBulletRow}>
              <Text style={styles.aiBulletIcon}>💡</Text>
              <Text style={[styles.aiText, theme.dark && styles.aiTextDark]}>Gợi ý: <Text style={theme.dark ? styles.aiHighlightDark : styles.aiHighlight}>Nạp thêm 2M/tháng</Text></Text>
            </View>
          </LinearGradient>

          {/* Goals List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danh sách mục tiêu</Text>
            {goals.map((goal: Goal) => {
              const currentOfGoal = computeGoalCurrent(goal);
              const progress = getProgress(currentOfGoal, goal.targetAmount);
              const monthsLeft = getTimeRemaining(goal.deadline);
              const requiredMonthly = getRequiredMonthly(goal);
              const isOnTrack = goal.monthlyContribution >= requiredMonthly;

              

              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[styles.goalCardLarge, styles.goalButton]}
                  activeOpacity={0.9}
                    onPress={() => navigation.navigate('GoalDetail', { goal, onSave: (updatedGoal: any) => updateGoal(updatedGoal.id, updatedGoal) })}
                >
                  <View style={styles.goalHeaderLarge}>
                    <View style={styles.goalInfoLarge}>
                      <View style={[styles.iconContainerLarge, { backgroundColor: goal.color || '#10B981' }]}>
                        <Icon name={goal.icon} size={48} color={onPrimary} style={styles.goalIconLarge} />
                      </View>
                      <View style={styles.goalTitleContainer}>
                        <Text style={styles.goalTitleLarge} numberOfLines={1} ellipsizeMode="tail">{goal.title}</Text>
                        <View style={styles.deadlineRow}>
                          <Icon name="calendar-month" size={14} color={theme.colors.onSurfaceVariant} style={styles.deadlineIcon} />
                          <Text style={[styles.goalDeadlineLarge]}>
                            {formatDeadlineLabel(goal.deadline)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {!isOnTrack ? (
                      <TouchableOpacity
                        style={styles.warningBadge}
                        onPress={() =>
                          Alert.alert(
                            'Cảnh báo tiến độ',
                            `Bạn đang chậm tiến độ cho mục tiêu "${goal.title}". Cần ${formatVNDCompact(Math.round(getRequiredMonthly(goal)))} /tháng để kịp hạn.`
                          )
                        }
                      >
                        <Icon name="alert-circle" size={18} color={onPrimary} />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.onTrackBadge}>
                        <Icon name="check-circle" size={18} color={onPrimary} />
                      </View>
                    )}
                  </View>

                  <View style={styles.goalAmountsStack}>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabelSmall}>Hiện tại</Text>
                      <Text style={styles.amountValueSmall} numberOfLines={1} ellipsizeMode="tail">
                        {formatVNDCompact(currentOfGoal, false)}
                      </Text>
                    </View>

                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabelSmall}>Mục tiêu</Text>
                      <Text style={styles.amountValueMuted} numberOfLines={1} ellipsizeMode="tail">
                        {formatVNDCompact(goal.targetAmount, false)}
                      </Text>
                    </View>

                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabelSmall}>Còn lại</Text>
                      <Text style={[styles.amountValueRemainingLarge]} numberOfLines={1} ellipsizeMode="tail">
                        {formatVNDCompact(goal.targetAmount - currentOfGoal, false)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressContainerLargeInline}>
                    <View style={styles.progressBarLargeInline}>
                      <LinearGradient colors={[goal.color || '#10B981', '#06B6D4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFillLarge, { width: `${progressVisibleWidth(progress)}%` as any }]} />
                    </View>
                    <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
                  </View>

                  {/* compact info area: if not on track show requiredMonthly prominently, otherwise show a subtle on-track row */}
                  {!isOnTrack ? (
                    <View style={styles.requiredRow}>
                      <Icon name="chart-line" size={16} color={errorColor} style={styles.iconRight} />
                      <Text style={styles.requiredText}>Cần {formatVNDCompact(Math.round(requiredMonthly))}/tháng để kịp hạn</Text>
                    </View>
                  ) : (
                    <View style={styles.onTrackRow}>
                      <Icon name="check-circle-outline" size={14} color={primary} style={styles.iconRight} />
                      <Text style={styles.onTrackText}>Đang đúng kế hoạch — {monthsLeft} tháng · {formatVNDCompact(goal.monthlyContribution)}/tháng</Text>
                    </View>
                  )}

                  <View style={styles.goalActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionPrimary]}
                      onPress={() => { setActiveGoalId(goal.id); setShowAddMoneyModal(true); }}
                    >
                      <Text style={styles.actionTextPrimary}>+ Thêm tiền</Text>
                    </TouchableOpacity>
                    {/* card tap opens details view; removed duplicate 'Chi tiết' button */}
                  </View>

                  <View style={styles.goalSecondaryActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionSecondary]}
                      onPress={() => navigation.navigate('GoalDetail', { goal, onSave: (updatedGoal: any) => updateGoal(updatedGoal.id, updatedGoal) })}
                    >
                      <Text style={styles.actionTextSecondary}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionDanger]}
                      onPress={() => {
                        Alert.alert('Xác nhận xóa', `Bạn có chắc chắn muốn xóa mục tiêu "${goal.title}"? Hành động này không thể hoàn tác.`, [
                          { text: 'Hủy', style: 'cancel' },
                          { text: 'Xóa', onPress: async () => {
                              try {
                                await deleteGoal(goal.id);
                                Alert.alert('Thành công', 'Mục tiêu đã được xóa');
                              } catch (err: any) {
                                Alert.alert('Lỗi', err?.message || 'Không thể xóa mục tiêu');
                              }
                            }, style: 'destructive' }
                        ]);
                      }}
                    >
                      <Text style={[styles.actionTextSecondary, styles.actionTextDanger]}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Stats */}
          <TouchableOpacity
            style={[styles.statsCard, styles.statsCardButton]}
            activeOpacity={0.95}
            onPress={() => Alert.alert('Thống kê nhanh', 'Xem chi tiết thống kê nhanh')}
          >
            <Text style={styles.statsTitle}>Thống kê nhanh</Text>
            <View style={styles.statsInlineRowCentered}>
                <View style={styles.statsInlineItem}>
                  <Text style={styles.statsInlineValue}>{goals.length}</Text>
                  <Text style={styles.statsInlineLabel}>Mục tiêu</Text>
                </View>
                <View style={styles.statsInlineItem}>
                  <Text style={styles.statsInlineValue}>{goals.filter((g: Goal) => getProgress(computeGoalCurrent(g), g.targetAmount) >= 100).length}</Text>
                  <Text style={styles.statsInlineLabel}>Hoàn thành</Text>
                </View>
                <View style={styles.statsInlineItem}>
                  <Text style={styles.statsInlineValue}>{formatVNDCompact(goals.reduce((sum: number, g: Goal) => sum + (g.monthlyContribution || 0), 0), false)}</Text>
                  <Text style={styles.statsInlineLabel}>Tổng tiết kiệm/tháng</Text>
                </View>
              </View>
          </TouchableOpacity>
          <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
        </Animated.View>
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }] }] }>
        <TouchableOpacity
          style={styles.fabButton}
          onPressIn={handleFabPressIn}
          onPressOut={handleFabPressOut}
          activeOpacity={0.9}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Add Saving Goal Modal (inline form) */}
      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Icon name="close" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tạo mục tiêu tiết kiệm</Text>
            <TouchableOpacity onPress={handleAddNewGoal}>
              <Text style={styles.modalSaveText}>Thêm</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + TAB_BAR_HEIGHT) }}>
            <View style={styles.formGroupRowBetween}>
              <Text style={styles.formLabel}>Gợi ý</Text>
              <TouchableOpacity
                style={[styles.aiSuggestToggle, showAISuggestions && styles.aiSuggestToggleActive, showAISuggestions && { backgroundColor: aiGreen, borderColor: aiGreen }]}
                onPress={() => {
                  if (!showAISuggestions && !suggestionLoading) {
                    setShowAISuggestions(true);
                    fetchAISuggestions();
                  } else {
                    setShowAISuggestions(!showAISuggestions);
                  }
                }}
                disabled={suggestionLoading}
              >
                {suggestionLoading ? (
                  <ActivityIndicator size="small" color={showAISuggestions ? onPrimary : aiGreen} style={styles.aiToggleIcon} />
                ) : (
                  <Icon name="robot" size={14} color={showAISuggestions ? onPrimary : aiGreen} style={styles.aiToggleIcon} />
                )}
                <Text style={[styles.aiSuggestText, showAISuggestions && styles.aiSuggestTextActive, { color: showAISuggestions ? onPrimary : aiGreen }]}>
                  {suggestionLoading ? 'Đang tải...' : 'AI gợi ý'}
                </Text>
              </TouchableOpacity>
            </View>

            {showAISuggestions && (
              <View style={styles.formGroup}>
                {aiSuggestions.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.suggestionRowScroll, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }] }>
                    {aiSuggestions.map(s => (
                      <TouchableOpacity key={s.title} style={styles.suggestionButton} onPress={() => applySuggestion(s)}>
                        <Text style={styles.suggestionText}>{s.title}</Text>
                        <Text style={styles.suggestionSub}>{s.targetAmount.toLocaleString("vi-VN")}₫</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noSuggestionsText}>Chưa có gợi ý. Hãy bấm lại để tải.</Text>
                )}
              </View>
            )}
              <Text style={styles.formLabel}>Tên mục tiêu</Text>
              <TextInput style={styles.formInput} placeholder="Nhập tên mục tiêu..." placeholderTextColor={theme.colors.onSurfaceVariant} value={newTitle} onChangeText={setNewTitle} />

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mô tả (tùy chọn)</Text>
              <TextInput style={[styles.formInput, styles.textArea]} placeholder="Mô tả ngắn" placeholderTextColor={theme.colors.onSurfaceVariant} value={newDesc} onChangeText={setNewDesc} multiline />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroupHalf, styles.formGroupLeft]}> 
                <Text style={styles.formLabel}>Số tiền mục tiêu (VNĐ)</Text>
                <TextInput style={styles.formInput} placeholder="0" placeholderTextColor={theme.colors.onSurfaceVariant} keyboardType="numeric" value={newTarget} onChangeText={setNewTarget} />
              </View>

              <View style={[styles.formGroupHalf, styles.formGroupRight]}> 
                <Text style={styles.formLabel}>Tiết kiệm/tháng (VNĐ)</Text>
                <TextInput style={styles.formInput} placeholder="0" placeholderTextColor={theme.colors.onSurfaceVariant} keyboardType="numeric" value={newMonthly} onChangeText={setNewMonthly} />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Hạn chót (tháng/năm)</Text>
              <TextInput style={styles.formInput} placeholder="MM/YYYY" placeholderTextColor={theme.colors.onSurfaceVariant} value={newDeadline} onChangeText={setNewDeadline} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Danh mục</Text>
              <View style={styles.categoryGridModal}>
                {([
                  { key: 'saving', label: 'Tiết kiệm', icon: 'piggy-bank' },
                  { key: 'purchase', label: 'Mua sắm', icon: 'cart' },
                  { key: 'investment', label: 'Đầu tư', icon: 'chart-line' },
                  { key: 'education', label: 'Học phí', icon: 'school' },
                ] as const).map(c => (
                  <TouchableOpacity key={c.key} style={[styles.categoryButton, newCategory === c.key && styles.categoryButtonActive]} onPress={() => setNewCategory(c.key)}>
                    <Icon name={c.icon} size={20} color={newCategory === c.key ? onSurface : primary} style={styles.categoryIcon} />
                    <Text style={[styles.categoryButtonLabel, newCategory === c.key && styles.categoryButtonLabelActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mức độ ưu tiên</Text>
              <View style={styles.priorityGroupModal}>
                {(['high', 'medium', 'low'] as const).map(p => (
                  <TouchableOpacity key={p} style={[styles.priorityButton, newPriority === p && styles.priorityButtonActive]} onPress={() => setNewPriority(p)}>
                    <Text style={[styles.priorityButtonLabel, newPriority === p && styles.priorityButtonLabelActive]}>{p === 'high' ? 'Cao' : p === 'medium' ? 'Trung' : 'Thấp'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Add-money modal (when pressing + Thêm tiền) */}
      <Modal visible={showAddMoneyModal} animationType="slide" onRequestClose={() => setShowAddMoneyModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddMoneyModal(false)}>
              <Icon name="close" size={20} color={theme.colors.onSurface} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thêm tiền</Text>
            <TouchableOpacity onPress={() => setShowAddMoneyModal(false)}>
              <Text style={styles.modalSaveText}>Đóng</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(120, insets.bottom + TAB_BAR_HEIGHT) }}>
            {activeGoalId ? (() => {
              const g = goals.find((x: Goal) => x.id === activeGoalId);
              if (!g) return <Text style={styles.notFoundText}>Mục tiêu không tìm thấy.</Text>;

              const currentOfG = computeGoalCurrent(g);
              const progress = getProgress(currentOfG, g.targetAmount);

              return (
                <View>
                  <View style={styles.goalDetailHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: `${g.color}22` }]}>
                      <Icon name={g.icon} size={28} color={theme.colors.onSurfaceVariant} />
                    </View>
                    <View style={styles.detailHeaderRight}>
                      <Text style={styles.goalTitle}>{g.title}</Text>
                      <Text style={[styles.goalDeadline, styles.goalDeadlineDark]}>{formatDeadlineLabel(g.deadline)}</Text>
                    </View>
                  </View>

                  <View style={styles.detailAmountsRow}>
                    <View style={styles.detailAmountCol}>
                      <Text style={styles.detailAmountLabel}>Hiện tại</Text>
                      <Text style={styles.detailAmountValue}>{formatVNDCompact(currentOfG)}</Text>
                    </View>
                    <View style={styles.detailAmountCol}>
                      <Text style={styles.detailAmountLabel}>Mục tiêu</Text>
                      <Text style={styles.detailAmountValue}>{formatVNDCompact(g.targetAmount)}</Text>
                    </View>
                    <View style={styles.detailAmountColRight}>
                      <Text style={styles.detailAmountLabel}>Tiến độ</Text>
                      <Text style={styles.detailAmountValue}>{progress.toFixed(3)}%</Text>
                    </View>
                  </View>

                  <View style={styles.progressContainerLarge}>
                      <View style={styles.progressBarLarge}>
                      <View style={[styles.progressFill, { width: `${progressVisibleWidth(progress)}%` as any, backgroundColor: g.color }]} />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.sectionTitle}>Thêm tiền vào mục tiêu</Text>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Ví nguồn</Text>
                      <View style={styles.walletSelectorRow}>
                        <TouchableOpacity style={styles.walletSelector} onPress={() => ensureWalletsLoaded()}>
                          <Text style={styles.walletSelectorText}>{wallets.find(w => w.id === selectedWalletId)?.name || 'Chọn ví'}</Text>
                          <Text style={styles.walletSelectorSub}>{wallets.find(w => w.id === selectedWalletId) ? `${(wallets.find(w => w.id === selectedWalletId)?.balance || 0).toLocaleString('vi-VN')} VNĐ` : ''}</Text>
                        </TouchableOpacity>
                        {/* render list of wallets inline for quick selection */}
                      </View>
                      <View style={styles.walletListRow}>
                        {wallets.map(w => (
                          <TouchableOpacity key={w.id} style={[styles.walletChip, selectedWalletId === w.id && styles.walletChipActive]} onPress={() => w.id && setSelectedWalletId(w.id)}>
                            <Text style={[styles.walletChipText, selectedWalletId === w.id && styles.walletChipTextActive]}>{w.name}</Text>
                            <Text style={[styles.walletChipSub, selectedWalletId === w.id && styles.walletChipTextActive]}>{(w.balance || 0).toLocaleString('vi-VN')} VNĐ</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <Text style={[styles.formLabel, styles.formLabelSpacing]}>Số tiền (VNĐ)</Text>
                      <TextInput value={addAmount} onChangeText={setAddAmount} placeholder="vd: 500000" keyboardType="numeric" style={styles.formInput} placeholderTextColor={theme.colors.onSurfaceVariant} />
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Ghi chú (tùy chọn)</Text>
                      <TextInput value={addNote} onChangeText={setAddNote} style={[styles.formInput, styles.textArea]} placeholder="Ghi chú giao dịch" placeholderTextColor={theme.colors.onSurfaceVariant} />
                    </View>

                    <View style={styles.detailActionsRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionPrimary]}
                        onPress={() => {
                          const amt = Math.round(parseFloat(addAmount.replace(/[^0-9.-]/g, '')) || 0);
                          if (amt <= 0) { Alert.alert('Lỗi', 'Nhập số tiền hợp lệ'); return; }
                            handleConfirmAddToGoal(g);
                        }}
                      >
                        <Text style={styles.actionTextPrimary}>Xác nhận thêm</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionSecondary]}
                        onPress={() => { setAddAmount(''); setAddNote(''); setShowAddMoneyModal(false); }}
                      >
                        <Text style={styles.actionTextSecondary}>Hủy</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Transactions list - simplified: remove detailed add-transaction form */}
                    <View style={styles.txListWrap}>
                      <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
                      {(g.transactions || []).length === 0 ? (
                        <Text style={styles.emptyTxText}>Chưa có giao dịch</Text>
                      ) : (
                        (g.transactions || []).map((tx: any) => (
                          <View key={tx.id} style={styles.txRow}>
                            <View style={styles.txRowLeft}>
                              <Text style={styles.txAmount}>{formatVNDCompact(tx.amount)}</Text>
                              <Text style={styles.txDate}>{new Date(tx.date).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                            </View>
                            {tx.note ? <Text style={styles.txNote}>{tx.note}</Text> : null}
                          </View>
                        ))
                      )}
                    </View>
                  </View>

                </View>
              );
            })() : null}
            <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
          </ScrollView>
        </View>
      </Modal>

      {/* details moved to screen — inline detail modal removed */}
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => {
  const onSurface = theme.colors.onSurface;
  const onSurfaceVariant = theme.colors.onSurfaceVariant || 'rgba(0,0,0,0.06)';
  const surface = theme.colors.surface;
  const background = theme.colors.background;
  const primary = theme.colors.primary;
  const onPrimary = theme.colors.onPrimary || '#FFFFFF';
  const error = theme.colors.error;

  return StyleSheet.create({
  container: { flex: 1, backgroundColor: background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: surface,
    borderBottomWidth: 1,
    borderBottomColor: onSurfaceVariant,
  },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: onSurface },
  headerTitle: { fontSize: 18, fontWeight: '800', color: onSurface },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  addIcon: { fontSize: 24, color: onSurface, fontWeight: '700' },
  content: { padding: 16 },
  totalCard: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  totalCardGray: {
    backgroundColor: '#F3F4F6',
    borderColor: 'rgba(0,0,0,0.04)'
  },
  totalLabel: { fontSize: 14, color: "rgba(0,0,0,0.6)", marginBottom: 8 },
  totalAmount: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 16 },
  totalAmountSmall: { fontSize: 14, fontWeight: "700", color: "#0F1724", marginBottom: 12 },
  totalProgressBar: {
    height: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 0,
  },
  totalProgressBarGreen: { backgroundColor: 'rgba(16,185,129,0.12)' },
  totalProgressBarPlus: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', padding: 2, overflow: 'hidden' },
  totalProgressFill: { height: "100%", borderRadius: 5 },
  totalPercentage: { fontSize: 13, color: "rgba(15,23,36,0.7)", textAlign: "center" },
  totalCardPlus: {
    backgroundColor: '#06B6D4',
    borderColor: 'rgba(6,182,212,0.18)'
  },
  totalLabelOnPlus: { color: onPrimary },
  totalAmountSmallOnPlus: { fontSize: 14, fontWeight: '700', color: onPrimary, marginBottom: 12 },
  totalPercentageOnPlus: { fontSize: 13, color: onPrimary, textAlign: 'center' },
  aiCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${primary}14`,
    backgroundColor: theme.dark ? 'transparent' : `${primary}0F`,
  },
  aiCardDark: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  aiTitleDark: { color: onPrimary },
  aiTextDark: { color: '#E6EEF6', fontSize: 14 },
  aiHighlightDark: { color: '#FFD166', fontWeight: '900' },
  aiBulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiBulletIcon: { fontSize: 18, marginRight: 8 },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: onSurface },
  aiText: { fontSize: 14, color: "rgba(15,23,36,0.8)", lineHeight: 20, marginBottom: 8 },
  aiTextRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiTextIcon: { marginRight: 8 },
  deadlineRow: { flexDirection: 'row', alignItems: 'center' },
  deadlineIcon: { marginRight: 6 },
  aiHighlight: { color: "#34D399", fontWeight: "900" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: onSurface, marginBottom: 16 },
  goalCard: {
    backgroundColor: surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    minHeight: 128,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: onSurfaceVariant
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  goalInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  goalIcon: { fontSize: 24 },
  goalTitleContainer: { flex: 1 },
  goalTitle: { fontSize: 15, fontWeight: "800", color: onSurface, marginBottom: 2 },
  goalDeadline: { fontSize: 12, color: onSurfaceVariant },
  warningBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${error}33`,
    alignItems: "center",
    justifyContent: "center",
    position: 'absolute',
    right: 12,
    top: 12,
  },
  warningText: { fontSize: 16 },
  onTrackBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${primary}22`, alignItems: 'center', justifyContent: 'center', position: 'absolute', right: 12, top: 12 },
  goalAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: 'center',
    flexWrap: 'nowrap'
  },
  amountColumn: { flex: 1, minWidth: 0, paddingHorizontal: 6 },
  amountColumnLeft: { alignItems: 'flex-start' },
  amountColumnCenter: { alignItems: 'center' },
  amountColumnRight: { alignItems: 'flex-end' },
  amountLabel: { fontSize: 11, color: onSurfaceVariant, marginBottom: 4, textAlign: "center" },
  amountValue: { fontSize: 14, fontWeight: "800", color: onSurface, textAlign: "center", flexShrink: 1, maxWidth: 120 },
  amountDivider: { width: 1, backgroundColor: "rgba(0,0,0,0.06)", height: 44, alignSelf: 'center', marginHorizontal: 8 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: "700", color: onSurface, minWidth: 40 },
  goalStats: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statCompact: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, marginRight: 6, minWidth: 72 },

  smallInlineStat: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, backgroundColor: 'transparent', paddingHorizontal: 0, paddingVertical: 0, maxWidth: 120, flexShrink: 1 },
  statIcon: { fontSize: 14, marginRight: 6 },
  statText: { fontSize: 12, color: "rgba(15,23,36,0.8)", fontWeight: "600" },
  statTextDanger: { color: error },
  goalDeadlineDark: { color: '#6B7280' },
  amountValueWarning: { color: '#F59E0B' },
  goalActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  goalSecondaryActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: error },
  actionTextDanger: { color: error, fontWeight: '700' },
  actionPrimary: {
    backgroundColor: primary,
    borderWidth: 1,
    borderColor: primary
  },
  actionSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: onSurfaceVariant
  },
  actionTextPrimary: { color: onPrimary, fontWeight: '700', fontSize: 13 },
  actionTextSecondary: { color: onSurfaceVariant, fontWeight: '700', fontSize: 13 },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: 'center',
    minHeight: 40
  },
  // Large card styles
  goalHeaderLarge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' },
  goalInfoLarge: { flexDirection: 'row', alignItems: 'center' },
  iconContainerLarge: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6 },
  goalIconLarge: { fontSize: 48 },
  goalTitleLarge: { fontSize: 16, fontWeight: '900', color: onSurface },
  goalDeadlineLarge: { fontSize: 12, color: onSurfaceVariant },
  // Progress bar large
  progressContainerLargeInline: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  progressBarLargeInline: { flex: 1, height: 14, backgroundColor: onSurfaceVariant, borderRadius: 8, overflow: 'hidden' },
  progressFillLarge: { height: '100%', borderRadius: 8 },
  // FAB
  fab: { position: 'absolute', right: 20, bottom: 24, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  fabButton: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: primary },
  fabIcon: { fontSize: 28, color: onPrimary },
  // Card elevated style
  goalCardLarge: { backgroundColor: surface, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 6 },
  goalButton: {
    backgroundColor: surface,
    borderWidth: 1,
    borderColor: onSurfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  smallStatText: { fontSize: 12 },
  
  actionButtonGray: {
    backgroundColor: 'rgba(107,114,128,0.12)'
  },
  actionButtonTextDark: { color: '#374151' },
  actionButtonSecondaryGray: { backgroundColor: 'rgba(0,0,0,0.04)' },
  actionButtonTextDarkSecondary: { color: 'rgba(15,23,36,0.7)' },
  actionButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  actionButtonSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  actionButtonTextSecondary: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 13 },
  statsCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 20,
  },
  statsCardButton: {
    backgroundColor: surface,
    borderWidth: 1,
    borderColor: onSurfaceVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: { fontSize: 16, fontWeight: "800", color: onSurface, marginBottom: 16, textAlign: "center" },
  /* compact goal amounts (now also support stacked layout to avoid truncation) */
  goalAmountsCompact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalAmountsStack: { flexDirection: 'column', alignItems: 'stretch', marginBottom: 10 },
  // show label and value on the same row
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 6 },
  amountCompactLeft: { flex: 1, alignItems: 'flex-start' },
  amountCompactMiddle: { flex: 1, alignItems: 'center' },
  amountCompactRight: { flex: 1, alignItems: 'flex-end' },
  amountLabelSmall: { fontSize: 12, color: onSurfaceVariant, marginBottom: 0, marginRight: 8 },
  amountValueSmall: { fontSize: 15, fontWeight: '900', color: onSurface, textAlign: 'right', flexShrink: 1 },
  amountValueMuted: { fontSize: 15, color: onSurfaceVariant, fontWeight: '700', textAlign: 'right' },
  amountValueRemaining: { fontSize: 18, fontWeight: '900', color: error },
  amountValueRemainingLarge: { fontSize: 20, fontWeight: '900', color: error },
  requiredRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  requiredText: { color: error, fontWeight: '800', fontSize: 13 },
  onTrackRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  onTrackText: { color: primary, fontWeight: '700', fontSize: 13 },
  statsRowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsTitleInline: { fontSize: 16, fontWeight: '800', color: '#111827', marginRight: 12 },
  statsInlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14 },
  statsInlineRowCentered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  statsInlineItem: { alignItems: 'center', minWidth: 80 },
  statsInlineValue: { fontSize: 15, fontWeight: '900', color: onSurface },
  statsInlineLabel: { fontSize: 11, color: onSurface, marginTop: 4, textAlign: 'center' },
  iconRight: { marginRight: 8 },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  statBox: { flex: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 6 },
  statBoxPrimary: { backgroundColor: surface, borderWidth: 1, borderColor: onSurfaceVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  statBoxValue: { fontSize: 20, fontWeight: '900', color: onSurface, marginBottom: 6 },
  statBoxLabel: { fontSize: 12, color: 'rgba(15,23,36,0.6)', textAlign: 'center' },
  statsItem: { alignItems: "center" },
  statsValue: { fontSize: 24, fontWeight: "900", color: "#6366F1", marginBottom: 4 },
  statsLabel: { fontSize: 11, color: "rgba(0,0,0,0.6)", textAlign: "center" },
  /* Modal / form styles */
  modalContainer: { flex: 1, backgroundColor: background },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: onSurfaceVariant },
  modalTitle: { fontSize: 18, fontWeight: '700', color: onSurface },
  modalSaveText: { fontSize: 16, fontWeight: '600', color: primary },
  modalBody: { flex: 1, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 36 },
  formGroup: { marginBottom: 18 },
  formGroupHalf: { flex: 1 },
  formGroupLeft: { marginRight: 8 },
  formGroupRight: { marginLeft: 8 },
  
  formLabel: { fontSize: 14, color: onSurfaceVariant, fontWeight: '600', marginBottom: 8 },
  formInput: { backgroundColor: surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: onSurfaceVariant, color: onSurface },
  textArea: { minHeight: 84, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row' },
  formGroupRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  aiSuggestToggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: primary, backgroundColor: 'transparent' },
  aiSuggestToggleActive: { backgroundColor: primary, borderColor: primary },
  aiSuggestText: { color: primary, fontWeight: '700', fontSize: 13 },
  aiSuggestTextActive: { color: onPrimary },
  formLabelSpacing: { marginTop: 12 },
  aiToggleIcon: { marginRight: 8 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  suggestionRowScroll: { paddingVertical: 6, paddingRight: 8 },
  suggestionButton: { backgroundColor: surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: onSurfaceVariant, marginRight: 8, minWidth: 120 },
  suggestionText: { color: onSurface, fontWeight: '800', fontSize: 13 },
  suggestionSub: { color: onSurfaceVariant, fontSize: 11, marginTop: 4 },
  goalDetailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  detailAmountsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  detailAmountCol: { flex: 1, alignItems: 'center' },
  detailAmountColRight: { flex: 1, alignItems: 'center' },
  detailAmountLabel: { fontSize: 12, color: onSurfaceVariant },
  detailAmountValue: { fontSize: 16, fontWeight: '800', color: onSurface, marginTop: 6 },
  progressContainerLarge: { marginBottom: 12 },
  progressBarLarge: { height: 12, backgroundColor: onSurfaceVariant, borderRadius: 8, overflow: 'hidden' },
  notFoundText: { padding: 20, color: onSurfaceVariant, fontWeight: '600' },
  detailHeaderRight: { flex: 1, marginLeft: 12 },
  detailActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  sectionSpaced: { marginTop: 16 },
  txListWrap: { marginTop: 16 },
  emptyTxText: { color: onSurfaceVariant, marginTop: 8 },
  txRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  txRowLeft: { flexDirection: 'column' },
  txAmount: { fontSize: 14, fontWeight: '800', color: onSurface },
  txDate: { fontSize: 12, color: onSurfaceVariant, marginTop: 4 },
  txNote: { fontSize: 13, color: onSurface, marginTop: 6 },
  categoryGridModal: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryButton: { width: '48%', backgroundColor: surface, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: onSurfaceVariant },
  categoryButtonActive: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: primary },
  categoryIcon: { marginBottom: 6 },
  categoryButtonLabel: { fontSize: 13, color: primary, fontWeight: '700' },
  categoryButtonLabelActive: { color: onSurface },
  priorityGroupModal: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  priorityButton: { flex: 1, paddingVertical: 12, borderWidth: 2, borderRadius: 12, alignItems: 'center', backgroundColor: surface },
  priorityButtonActive: { backgroundColor: primary, borderColor: primary },
  priorityButtonLabel: { color: onSurface, fontWeight: '600', fontSize: 13 },
  priorityButtonLabelActive: { color: onPrimary },
  walletSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  walletSelector: { width: '100%', backgroundColor: surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: onSurfaceVariant },
  walletSelectorText: { fontSize: 14, fontWeight: '800', color: onSurface },
  walletSelectorSub: { fontSize: 12, color: onSurfaceVariant, marginTop: 4 },
  walletListRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  walletChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: surface, borderWidth: 1, borderColor: onSurfaceVariant, marginRight: 8, marginBottom: 8 },
  walletChipActive: { backgroundColor: primary, borderColor: primary },
  walletChipText: { fontSize: 13, fontWeight: '800', color: onSurface },
  walletChipTextActive: { color: onPrimary },
  walletChipSub: { fontSize: 11, color: onSurfaceVariant, marginTop: 4 },
  noSuggestionsText: { fontSize: 13, color: 'rgba(15,23,36,0.5)', textAlign: 'center', paddingVertical: 16 },
  spacer: { width: 40 },
  });
};
