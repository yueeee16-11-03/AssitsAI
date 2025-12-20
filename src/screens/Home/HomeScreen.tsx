import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// image picker not used on Home
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import { useUserStore } from '../../store/userStore';
import { useFamilyStore } from '../../store/familyStore';
import { useInviteStore } from '../../store/inviteStore';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { useTransactionData } from '../../hooks/useTransactionData';
import { useHabitStore } from '../../store/habitStore';

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const [loading] = useState(false);
  const [scanOptionsVisible, setScanOptionsVisible] = useState(false);
  const scanIconRef = React.useRef<any>(null);
  const [measuredTextWidth, setMeasuredTextWidth] = useState(0);
  const [anchorLayout, setAnchorLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [popoverLeft, setPopoverLeft] = useState<number | undefined>(undefined);
  const [popoverTop, setPopoverTop] = useState<number | undefined>(undefined);
  const [popoverComputedWidth, setPopoverComputedWidth] = useState<number | undefined>(undefined);

  // Theme setup
  const theme = useTheme();
  const borderColor = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const secondaryBg = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,137,123,0.08)';
  const tooltipOverlayBg = theme.dark ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.24)';
  const notebookBorderColor = theme.dark ? '#404040' : '#E5E7EB';
  const notebookOrangeBg = theme.dark ? 'rgba(255,176,32,0.2)' : 'rgba(255,176,32,0.15)';
  const notebookGreenBg = theme.dark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)';
  const buttonCardBg = theme.colors.surface;
  const buttonBorderColor = theme.dark ? '#404040' : '#E5E7EB';
  const cyanIconBg = theme.dark ? 'rgba(6,182,212,0.2)' : 'rgba(6,182,212,0.15)';
  const greenIconBg = theme.dark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)';
  const blueIconBg = theme.dark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)';
  const barColorOrange = '#F97316';
  const barColorOrangeLight = '#FB923C';
  const barColorPink = '#EC4899';
  const barColorMagenta = '#D946EF';
  const barColorCyan = '#06B6D4';

  const handleScanIconPress = () => {
    if (scanIconRef.current && scanIconRef.current.measureInWindow) {
      scanIconRef.current.measureInWindow((x:number, y:number, width:number, height:number) => {
        setAnchorLayout({ x,y,width,height });
        const contentPadding = 14; const iconTotal = 32 + 12; // icon container width + margin
        const measured = Math.max(measuredTextWidth + iconTotal + contentPadding * 2, Math.round(popoverWidth * 0.8));
        const targetWidth = Math.min(measured, POPOVER_MAX_WIDTH);
        const left = Math.max(8, Math.min(SCREEN_WIDTH - targetWidth - 8, Math.round(x + width / 2 - (targetWidth / 2))));
        const estTop = Math.max(insets.top + 8, y - 8 - 64);
                    setPopoverComputedWidth(targetWidth);
                    setPopoverLeft(left);
                    setPopoverTop(estTop);
        setScanOptionsVisible(true);
      });
    } else {
      // fallback
      const targetWidth = Math.round(popoverWidth * 0.8);
      setPopoverComputedWidth(targetWidth);
      setPopoverLeft(Math.round((SCREEN_WIDTH - targetWidth) / 2));
      setPopoverTop(insets.top + 140);
      setScanOptionsVisible(true);
    }
  };
  const insets = useSafeAreaInsets();
  const user = useUserStore((s: any) => s.user);
  const { unreadCount } = useUnreadNotificationCount();
  // Prefer Firestore 'name' (merged into userStore), then auth displayName, then email/phone, else fallback
  const displayName = (user && (user.name || user.displayName || user.email || user.phoneNumber)) || 'Người dùng';
  
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const POPOVER_MAX_WIDTH = 320;
  const popoverWidth = Math.min(POPOVER_MAX_WIDTH, SCREEN_WIDTH - 48);
  const TAB_BAR_HEIGHT = 70; // adjust as needed for the app's bottom tab bar height
  // No camera modal on Home - open camera on dedicated finance screens instead

  // Placeholder sample; replaced by real transaction data below
  const CHART_HEIGHT = 100; // px height used for bar animations (reduced so 100% bars don't overflow)

  const barAnimsRef = React.useRef(Array(7).fill(0).map(() => new Animated.Value(0))).current;

  // We'll animate based on computed percentages below; initialize with zeros
  React.useEffect(() => {
    // noop: animations are triggered when dailyPercents change
  }, []);

  // --- Real transaction data integration ---
  const { transactions } = useTransactionData() as any;

  // Habits: load and show top 3 on Home
  const habits = useHabitStore((s: any) => s.habits);
  const initializeHabits = useHabitStore((s: any) => s.initialize);

  React.useEffect(() => {
    if (!habits || habits.length === 0) {
      initializeHabits();
    }
  }, [initializeHabits, habits]);

  const safeAmount = (a: any) => {
    const n = Number(a);
    if (!isFinite(n) || isNaN(n)) return 0;
    return Math.round(n);
  };

  const toDate = (t: any): Date | null => {
    if (!t) return null;
    if (t.toDate && typeof t.toDate === 'function') return t.toDate();
    if (typeof t === 'string') return new Date(t);
    if (typeof t === 'number') return new Date(t);
    if (t.seconds && typeof t.seconds === 'number') return new Date(t.seconds * 1000);
    return null;
  };

  // Compute last 7 days (oldest to newest)
  const now = new Date();
  const last7Dates = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - idx));
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const last7Keys = last7Dates.map(d => d.toISOString().slice(0, 10));

  const last7Amounts = last7Keys.map((key) => {
    return (transactions || []).filter((t: any) => {
      if (!t) return false;
      const dt = toDate(t.date || t.createdAt);
      if (!dt) return false;
      return dt.toISOString().slice(0, 10) === key && t.type === 'expense';
    }).reduce((s: number, t: any) => s + safeAmount(t.amount), 0);
  });

  const maxAmount = Math.max(...last7Amounts, 0);
  const dailyPercents = last7Amounts.map(a => (maxAmount > 0 ? Math.round((a / maxAmount) * 100) : 0));
  const weekdayMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const last7Labels = last7Dates.map(d => weekdayMap[d.getDay()]);
  
  // Tooltip / modal state
  const [tooltipVisible, setTooltipVisible] = React.useState(false);
  const [tooltipDay, setTooltipDay] = React.useState('');
  const [tooltipAmount, setTooltipAmount] = React.useState(0);

  function formatVNDShort(amount: number) {
    if (!amount || amount === 0) return '0';
    const abs = Math.abs(amount);
    if (abs >= 1000000) {
      const m = Math.round((amount / 1000000) * 10) / 10;
      return `${m % 1 === 0 ? Math.round(m) : m}tr`;
    }
    if (abs >= 1000) {
      const k = Math.round(amount / 1000);
      return `${k}k`;
    }
    return `${amount}`;
  }

  function formatVNDFull(amount: number) {
    try {
      const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount);
      return `${formatted} VNĐ`;
    } catch {
      return `${amount} VNĐ`;
    }
  }

  // --- Today's totals logic (used by the account card) ---
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  const todayKey = todayDate.toISOString().slice(0,10);
  const todaysTransactions = (transactions || []).filter((t: any) => {
    const dt = toDate(t.date || t.createdAt);
    return dt && dt.toISOString().slice(0,10) === todayKey;
  });
  const totalIncomeToday = todaysTransactions.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + safeAmount(t.amount), 0);
  const totalExpenseToday = todaysTransactions.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + safeAmount(t.amount), 0);
  const totalActivityToday = totalIncomeToday + totalExpenseToday;

  React.useEffect(() => {
    const animations = dailyPercents.map((v, i) =>
      Animated.timing(barAnimsRef[i], {
        toValue: (v / 100) * CHART_HEIGHT,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );
    Animated.stagger(90, animations).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dailyPercents)]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity
        style={[styles.headerButtonFull, { backgroundColor: theme.colors.surface }]}
        activeOpacity={0.92}
        onPress={() => {/* TODO: handle header button press, e.g. open profile or theme picker */}}
      >
        <View style={styles.headerContentFull}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.greeting, { color: theme.colors.onSurfaceVariant }]}>Chào,</Text>
            <Text style={[styles.username, { color: theme.colors.onSurface }]}>{displayName}</Text>
          </View>
          <View style={styles.headerIconsRowFull}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("Notification")}
            >
              <Icon name="bell-outline" size={24} color={theme.colors.onSurfaceVariant} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.familyButton}
              onPress={async () => {
                const is = useInviteStore.getState();
                // Check if there's a pending invite code (from clipboard)
                if (is.pendingInviteCode) {
                  const code = is.pendingInviteCode;
                  // Clear immediately to prevent re-triggering
                  is.setPendingInviteCode(null);
                  navigation.navigate('JoinFamily', { code });
                } else {
                  // No pending code, check existing families
                  const fs = useFamilyStore.getState();
                  if (!fs.families || fs.families.length === 0) {
                    try {
                      await fs.initialize();
                    } catch (err) {
                      console.warn('Failed to fetch families on press:', err);
                    }
                  }

                  const updated = useFamilyStore.getState();
                  if (updated.families && updated.families.length > 0) {
                    if (!updated.currentFamily) {
                      updated.setCurrentFamily(updated.families[0]);
                    }
                    navigation.navigate('FamilyOverview');
                  } else {
                    navigation.navigate('FamilyOnboarding');
                  }
                }
              }}
            >
              <Icon name="account-group-outline" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <Icon name="cog-outline" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Icon name="account-circle-outline" size={26} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(styles.content.paddingBottom || 24, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        {/* Full-width ad carousel button with indicator dots */}
        <TouchableOpacity
          style={styles.adCarouselButton}
          activeOpacity={0.92}
          onPress={() => {/* TODO: handle ad carousel press */}}
        >
          <View style={[styles.adCarouselWrap, { width: SCREEN_WIDTH + 48 }]}>
            {/* Replace source with your real ad image */}
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }}
              style={styles.adCarouselImg}
              resizeMode="cover"
            />
            {/* Indicator dots */}
            <View style={styles.adCarouselDots}>
              <View style={styles.adCarouselDot} />
              <View style={[styles.adCarouselDot, styles.adCarouselDotInactive]} />
              <View style={[styles.adCarouselDot, styles.adCarouselDotInactive]} />
              <View style={[styles.adCarouselDot, styles.adCarouselDotInactive]} />
            </View>
            {/* overlay removed from here to keep layout flow */}
          </View>
        </TouchableOpacity>
        {/* In-flow overlay action button (visible, pushes subsequent content down) */}
        <TouchableOpacity
          style={[styles.adOverlayButton, { backgroundColor: theme.colors.surface }]}
          activeOpacity={0.92}
          onPress={() => {}}
        >
          <View style={styles.accountCardInner}>
            <Text style={[styles.accountTitle, { color: theme.colors.primary }]}>Tổng chi thu hôm nay</Text>
            <Text style={[styles.accountAmount, { color: theme.colors.onSurface }]}>{formatVNDFull(totalActivityToday)}</Text>
            

            <View style={styles.accountIconsRow}>
              <TouchableOpacity ref={scanIconRef} style={styles.accountIcon} onPress={handleScanIconPress}>
                <View style={[styles.accountIconCircle, { backgroundColor: secondaryBg }]}>
                  <Icon name="barcode-scan" size={24} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text style={[styles.accountIconLabel, { color: theme.colors.onSurfaceVariant }]}>Quét hóa đơn</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accountIcon} onPress={() => navigation.navigate('BudgetPlanner')}>
                <View style={[styles.accountIconCircle, { backgroundColor: secondaryBg }]}>
                  <Icon name="piggy-bank-outline" size={24} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text style={[styles.accountIconLabel, { color: theme.colors.onSurfaceVariant }]}>Ngân sách</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accountIcon} onPress={() => navigation.navigate('GoalTracking')}>
                <View style={[styles.accountIconCircle, { backgroundColor: secondaryBg }]}>
                  <Icon name="bullseye-arrow" size={24} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text style={[styles.accountIconLabel, { color: theme.colors.onSurfaceVariant }]}>Mục tiêu tiết kiệm</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accountIcon} onPress={() => navigation.navigate('Report')}>
                <View style={[styles.accountIconCircle, { backgroundColor: secondaryBg }]}>
                  <Icon name="chart-box-outline" size={24} color={theme.colors.onSurfaceVariant} />
                </View>
                <Text style={[styles.accountIconLabel, { color: theme.colors.onSurfaceVariant }]}>Báo cáo chi thu</Text>
              </TouchableOpacity>

              
            </View>

            
          </View>
        </TouchableOpacity>
{/* Notebook-style card (vector icon, compact) */}
        <TouchableOpacity style={[styles.notebookCard, { backgroundColor: theme.colors.surface, borderColor: notebookBorderColor }]} activeOpacity={0.9} onPress={() => {}}>
          <View style={styles.notebookContent}>
            <View style={styles.notebookLeft}>
              <View style={[styles.notebookIconCircle, { backgroundColor: notebookOrangeBg }]}>
                <Icon name="notebook-outline" size={18} color="#FFB020" />
              </View>
              <Text style={[styles.notebookTitle, { color: theme.colors.onSurface }]}>Sổ Ghi Chú</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Wallet management button matching notebook style */}
        <TouchableOpacity
          style={[styles.notebookCard, { backgroundColor: theme.colors.surface, borderColor: notebookBorderColor }]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('WalletManagement')}
        >
          <View style={styles.notebookContent}>
            <View style={styles.notebookLeft}>
              <View style={[styles.notebookIconCircle, { backgroundColor: notebookGreenBg }]}>
                <Icon name="wallet" size={18} color="#10B981" />
              </View>
              <Text style={[styles.notebookTitle, { color: theme.colors.onSurface }]}>Quản lý ví</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('WalletManagement')}>
              <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Tổng quan</Text>
          <TouchableOpacity
            style={[styles.insightButton, { backgroundColor: buttonCardBg, borderColor: buttonBorderColor }]}
            onPress={() => navigation.navigate("AIInsight")}
            activeOpacity={0.8}
          >
            <View style={styles.inlineRow}>
              <View style={[styles.notebookIconCircle, { backgroundColor: cyanIconBg }]}>
                <Icon name="chart-line" size={16} color="#06B6D4" />
              </View>
              <Text style={[styles.insightButtonText, styles.iconTextSpacing, { color: theme.colors.onSurface }]}>Xem phân tích AI</Text>
            </View>
          </TouchableOpacity>
          {/* New spending chart button: Chi tiêu trong 7 ngày qua */}
          <TouchableOpacity
            style={[styles.spendingChartButton, { backgroundColor: theme.colors.surface, borderColor }]}
            activeOpacity={0.92}
            onPress={() => { /* TODO: open spending details */ }}
          >
            <View style={styles.spendingChartInner}>
              {dailyPercents.map((v, i) => {
                const barColors = [barColorOrange, barColorOrangeLight, barColorPink, barColorMagenta, barColorCyan, barColorCyan, barColorCyan];
                const color = barColors[i % barColors.length];
                const animatedHeight = barAnimsRef[i];
                const amount = last7Amounts[i] || 0;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.barColumn}
                    activeOpacity={0.9}
                    onPress={() => { setTooltipDay(last7Labels[i]); setTooltipAmount(amount); setTooltipVisible(true); }}
                  >
                    {amount > 0 && <Text style={[styles.barAmount, { color: theme.colors.onSurfaceVariant }]}>{formatVNDShort(amount)}</Text>}
                    <Animated.View style={[styles.bar, { height: animatedHeight, backgroundColor: color }]} />
                      <Text style={[styles.barLabel, { color: theme.colors.onSurfaceVariant }]}>{last7Labels[i]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.spendingChartTitle, { color: theme.colors.primary }]}>Chi tiêu trong 7 ngày qua</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Thói quen</Text>
          <TouchableOpacity
            style={[styles.aiCoachButton, { backgroundColor: buttonCardBg, borderColor: buttonBorderColor }]}
            onPress={() => navigation.navigate("AIHabitCoach")}
            activeOpacity={0.8}
          >
            <View style={styles.inlineRow}>
              <View style={[styles.notebookIconCircle, { backgroundColor: cyanIconBg }]}>
                <Icon name="robot-outline" size={16} color="#06B6D4" />
              </View>
              <Text style={[styles.aiCoachButtonText, styles.iconTextSpacing, { color: theme.colors.onSurface }]}>AI Coach</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkInButton, { backgroundColor: buttonCardBg, borderColor: buttonBorderColor }]}
            onPress={() => navigation.navigate("DailyCheckIn")}
            activeOpacity={0.8}
          >
            <View style={styles.inlineRow}>
              <View style={[styles.notebookIconCircle, { backgroundColor: greenIconBg }]}>
                <Icon name="check-circle-outline" size={16} color="#10B981" />
              </View>
              <Text style={[styles.checkInButtonText, styles.iconTextSpacing, { color: theme.colors.onSurface }]}>Check-in hôm nay</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.habitDashboardButton, { backgroundColor: buttonCardBg, borderColor: buttonBorderColor }]}
            onPress={() => navigation.navigate("HabitDashboard")}
            activeOpacity={0.8}
          >
            <View style={styles.inlineRow}>
              <View style={[styles.notebookIconCircle, { backgroundColor: blueIconBg }]}>
                <Icon name="bullseye" size={16} color="#3B82F6" />
              </View>
              <Text style={[styles.habitDashboardButtonText, styles.iconTextSpacing, { color: theme.colors.onSurface }]}>Xem tất cả thói quen</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.habits}>
            <Text style={[styles.habitsPlaceholder, styles.habitsPlaceholderText, { color: theme.colors.onSurfaceVariant }]}>Không có thói quen hiển thị</Text>
          </View>
        </View>

        {/* 'Mục tiêu hôm nay' section removed per user request */}

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.personalGoalButton, { backgroundColor: buttonCardBg, borderColor: buttonBorderColor }]}
            onPress={() => {}}
            activeOpacity={0.85}
          >
            <View style={styles.personalGoalInlineRow}>
              <View style={[styles.notebookIconCircle, { backgroundColor: cyanIconBg }]}>
                <Icon name="account-heart-outline" size={18} color="#06B6D4" />
              </View>
              <Text style={[styles.personalGoalText, { color: theme.colors.onSurface }]}>Mục tiêu cá nhân</Text>
            </View>
          </TouchableOpacity>



          <TouchableOpacity
            style={[styles.personalGoalButton, styles.personalGoalButtonMarginTop, { backgroundColor: buttonCardBg, borderColor: buttonBorderColor }]}
            onPress={() => navigation.navigate('RecurringTransactions')}
            activeOpacity={0.85}
          >
            <View style={styles.personalGoalInlineRow}>
              <View style={[styles.notebookIconCircle, { backgroundColor: cyanIconBg }]}>
                <Icon name="repeat" size={18} color="#06B6D4" />
              </View>
              <Text style={[styles.personalGoalText, { color: theme.colors.onSurface }]}>Khoản thu chi định kỳ</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.personalSuggestBanner, { backgroundColor: buttonCardBg, borderColor: buttonBorderColor }]}
            onPress={() => navigation.navigate('AIRecommendation')}
            activeOpacity={0.9}
          >
            <View style={[styles.notebookIconCircle, { backgroundColor: cyanIconBg }]}>
              <Icon name="lightbulb-outline" size={20} color="#06B6D4" />
            </View>
            <View style={styles.personalSuggestContent}>
              <Text style={[styles.personalSuggestTitle, { color: theme.colors.onSurface }]}>Gợi ý thông minh</Text>
              <Text style={[styles.personalSuggestSubtitle, { color: theme.colors.onSurfaceVariant }]}>Xem mẹo tiết kiệm và cải thiện thói quen</Text>
            </View>
            <Icon name="chevron-right" size={18} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Old AI Recommendations Banner removed per request */}

        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00897B" />
        </View>
      )}

      {scanOptionsVisible && (
        <>
          <TouchableOpacity style={styles.scanOptionsOverlay} onPress={() => {
            setScanOptionsVisible(false);
            setMeasuredTextWidth(0);
            setPopoverComputedWidth(undefined);
            setPopoverLeft(undefined);
            setPopoverTop(undefined);
            setAnchorLayout(null);
          }} activeOpacity={1} />
          <View
            style={[
              styles.scanOptionsWrap,
              {
                top: popoverTop ?? (insets.top + 140),
                left: typeof popoverLeft !== 'undefined' ? popoverLeft : Math.round((SCREEN_WIDTH - (popoverComputedWidth ?? Math.round(popoverWidth * 0.8))) / 2),
                width: popoverComputedWidth ?? Math.round(popoverWidth * 0.8),
                backgroundColor: theme.colors.surface,
                borderColor,
              },
            ]}
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (anchorLayout) {
                const newTop = anchorLayout.y - h - 8;
                setPopoverTop(Math.max(insets.top + 8, newTop));
              }
            }}
          > 
            <TouchableOpacity style={[styles.popoverSheetItem, { borderBottomColor: borderColor }]} onPress={() => { setScanOptionsVisible(false); setMeasuredTextWidth(0); setPopoverComputedWidth(undefined); setPopoverLeft(undefined); setPopoverTop(undefined); navigation.navigate('AddTransaction', { openCamera: true }); }} activeOpacity={0.85}>
              <View style={styles.popoverSheetIcon}><Icon name="qrcode-scan" size={20} color="#FFFFFF" /></View>
              <Text style={[styles.popoverSheetText, { color: theme.colors.onSurface }]} numberOfLines={1} ellipsizeMode="tail" onLayout={(e) => { const w = e.nativeEvent?.layout?.width || 0; setMeasuredTextWidth((prev) => Math.max(prev, w)); }}>Quét hóa đơn chi tiêu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.popoverSheetItem, { borderBottomColor: borderColor }]} onPress={() => { setScanOptionsVisible(false); setMeasuredTextWidth(0); setPopoverComputedWidth(undefined); setPopoverLeft(undefined); setPopoverTop(undefined); navigation.navigate('AddIncome', { openCamera: true }); }} activeOpacity={0.85}>
              <View style={styles.popoverSheetIcon}><Icon name="qrcode-scan" size={20} color="#FFFFFF" /></View>
              <Text style={[styles.popoverSheetText, { color: theme.colors.onSurface }]} numberOfLines={1} ellipsizeMode="tail" onLayout={(e) => { const w = e.nativeEvent?.layout?.width || 0; setMeasuredTextWidth((prev) => Math.max(prev, w)); }}>Quét hóa đơn thu nhập</Text>
            </TouchableOpacity>
            {/* Removed 'Quay lại' button; overlay tap closes popover */}
          </View>
        </>
      )}

      {/* Tooltip modal for bar details */}
      <Modal visible={tooltipVisible} transparent animationType="fade" onRequestClose={() => setTooltipVisible(false)}>
        <TouchableOpacity style={[styles.tooltipOverlay, { backgroundColor: tooltipOverlayBg }]} activeOpacity={1} onPress={() => setTooltipVisible(false)}>
          <View style={[styles.tooltipBox, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.tooltipDay, { color: theme.colors.onSurfaceVariant }]}>{tooltipDay}</Text>
            <Text style={[styles.tooltipShort, { color: theme.colors.onSurface }]}>{formatVNDShort(tooltipAmount)}</Text>
            <Text style={[styles.tooltipFull, { color: theme.colors.onSurfaceVariant }]}>{formatVNDFull(tooltipAmount)}</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom tabs, FAB, and bottom sheet moved to top-level navigation component */}

      {/* Camera Screen Modal with live preview */}
      {/* Camera handled in AddTransaction/AddIncome screens — no Home camera modal */}
    </SafeAreaView>
  );
}

// Camera Screen Component removed — camera handled in AddTransaction/AddIncome
// CameraScreenHome removed — camera is handled in AddTransaction/AddIncome

/* cameraStyles removed */ /*
  cameraContainer: {
    flex: 1,
    backgroundColor: "#FBF7F3",
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 10,
  },
  cameraHeaderButton: {
    width: 36,
    height: 18,
    borderRadius: 18,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraHeaderIcon: {
    fontSize: 24,
    fontWeight: "bold",
  },
  cameraHeaderTitle: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "700",
  },
  cameraHeaderTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  cameraHeaderSide: { width: 40 },
  cameraHeaderIconSpacing: { marginRight: 8 },
  billScanFrame: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: "20%",
    height: 350,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  billFrameCorner: {
    display: "none",
  },
  billFrameCornerTopRight: {
    display: "none",
  },
  billFrameCornerBottomLeft: {
    display: "none",
  },
  billFrameCornerBottomRight: {
    display: "none",
  },
  billFrameText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  cameraStatusBar: {
    position: "absolute",
    bottom: 320,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  statusIndicator: {
    backgroundColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "600",
  },
  cameraControlsBottomBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.98)',
    zIndex: 9,
  },
  cameraControlsBottom: {
    position: "absolute",
    bottom: 160,
    left: 0,
    right: 0,
    height: 140,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingBottom: 6,
    paddingTop: 8,
    zIndex: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)'
  },
  galleryButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderColor: "transparent",
    transform: [{ translateY: -10 }],
  },
  galleryButtonText: {
    fontSize: 28,
  },
  cameraShootButton: {
    width: 60,
    height: 60,
    borderRadius: 50,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ translateY: -16 }],
  },
  flashButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderColor: "transparent",
    transform: [{ translateY: -10 }],
  },
  flashButtonText: {
    fontSize: 28,
  },
  cameraControlIcon: {
    transform: [{ translateY: -6 }],
  },

  cameraControlInner: {
    alignItems: 'center',
  },
  cameraControlLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  cameraShootIcon: {
    transform: [{ translateY: 0 }],
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#E0F2F1",
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#00796B",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionDescription: {
    fontSize: 14,
    color: "rgba(0,0,0,0.6)",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionButton: {
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "#00897B",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  permissionButtonCancel: {
    width: "100%",
    paddingVertical: 14,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.3)",
  },
  permissionButtonCancelText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
*/

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerButtonFull: {
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    paddingTop: 14, // smaller top padding
    paddingBottom: 12, // smaller bottom padding
    paddingHorizontal: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  headerContentFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
  },
  headerTextCol: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 0,
  },
  headerIconsRowFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greeting: { fontSize: 14 },
  username: { fontSize: 22, fontWeight: "800" },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: { fontWeight: "800" },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  familyButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    fontSize: 20,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  content: { paddingHorizontal: 24, paddingBottom: 24 },
  row: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "rgba(0, 137, 123, 0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 137, 123, 0.15)",
  },
  smallCard: { flex: 0.6, justifyContent: "space-between" },
  cardTitle: { fontSize: 13, marginBottom: 8 },
  cardAmount: { fontSize: 20, fontWeight: "800" },
  cardSub: { fontSize: 12, marginTop: 8 },
  viewAllBtn: { marginTop: 12, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "rgba(6,182,212,0.15)" },
  viewAllText: { color: "#FFFFFF", fontWeight: "700" },
  goalCount: { fontSize: 22, fontWeight: "800" },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },

  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 160,
    paddingHorizontal: 12,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  barColumn: { flex: 1, alignItems: "center", justifyContent: 'flex-end' },
  bar: { width: 22, borderRadius: 10, elevation: 3 },
  barLabel: { fontSize: 12, marginTop: 8, fontWeight: '700' },
  barValue: { fontSize: 12, marginBottom: 4, fontWeight: '700' },
  barAmount: { fontSize: 11, marginBottom: 6 },
  tooltipOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  tooltipBox: { padding: 12, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8, alignItems: 'center' },
  tooltipDay: { fontWeight: '700', fontSize: 14 },
  tooltipShort: { fontWeight: '800', fontSize: 16, marginTop: 6 },
  tooltipFull: { fontSize: 12, marginTop: 4 },
  spendingChartButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  spendingChartTitle: { fontSize: 14, fontWeight: '800', marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  spendingChartInner: { flexDirection: 'row', alignItems: 'flex-end', height: 160, paddingHorizontal: 6, paddingTop: 12 },

  habits: {},
  habitsPlaceholder: { paddingVertical: 8 },
  habitsPlaceholderText: {},
  habitRow: { marginBottom: 12 },
  habitInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  habitName: { fontWeight: "700" },
  habitMeta: {},
  habitProgress: { height: 8, backgroundColor: "rgba(0, 137, 123, 0.15)", borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#06B6D4", width: "40%" },

  /* New habit card styles */
  habitCard: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  habitCardRow: { flexDirection: 'row', alignItems: 'center' },
  habitCardLeft: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  habitCardBody: { flex: 1, marginLeft: 12 },
  habitCardTitle: { fontWeight: '800', fontSize: 13 },
  habitCardMeta: { fontWeight: '700', fontSize: 11 },
  habitCardProgress: { height: 8, backgroundColor: 'rgba(15,23,42,0.06)', borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  habitCardProgressFill: { height: '100%', width: '0%', backgroundColor: '#06B6D4' },

  goals: {},
  goalItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(0, 137, 123, 0.06)", padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "rgba(0, 137, 123, 0.12)" },
  goalText: { fontWeight: "700" },
  goalMeta: {},

  fab: {
    position: "absolute",
    zIndex: 20,
    right: 24,
    bottom: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#06B6D4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: "#E0E7FF",
  },
  fabIcon: { fontSize: 28, color: "#7C3AED", fontWeight: "bold" },

  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },

  insightButton: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderWidth: 1,
  },
  insightButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },

  recommendationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(236,72,153,0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(236,72,153,0.3)",
  },
  bannerIcon: { fontSize: 32, marginRight: 12 },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  bannerSubtitle: { fontSize: 12 },
  bannerArrow: { fontSize: 20, color: "#EC4899", fontWeight: "700" },

  budgetButton: {
    backgroundColor: "rgba(6,182,212,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  budgetButtonText: {
    color: "#06B6D4",
    fontWeight: "700",
    fontSize: 14,
  },
  goalTrackingButton: {
    backgroundColor: "rgba(236,72,153,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  goalTrackingButtonText: {
    color: "#EC4899",
    fontWeight: "700",
    fontSize: 14,
  },
  habitDashboardButton: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderWidth: 1,
  },
  habitDashboardButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
  checkInButton: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderWidth: 1,
  },
  checkInButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
  aiCoachButton: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderWidth: 1,
  },
  aiCoachButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
  bottomSpacer: { height: 140 },
  bottomSheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.32)',
    zIndex: 60,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 70,
  },
  bottomSheetHandleWrap: { alignItems: 'center', marginTop: 0 },
  bottomSheetContent: { marginTop: 8 },
  scanOptionsWrap: { position: 'absolute', borderRadius: 12, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 20, zIndex: 101 },
  popoverSheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1 },
  popoverSheetIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  popoverSheetText: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  scanOptionsOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.28)' },
  /* removed sheetIconMuted/sheetTextMuted - not used (overlay dismisses) */
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  sheetIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sheetText: { fontSize: 16, fontWeight: '700' },
  /* Bottom Tab Bar styles */
  bottomTabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    minWidth: 60,
  },
  tabIconBold: {
    fontSize: 26,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  tabLabelBold: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  tabCenterPlaceholder: { width: 70 },
  centerActionWrap: { position: 'absolute', left: 0, right: 0, bottom: 34, alignItems: 'center', pointerEvents: 'box-none' },
  centerActionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#06B6D4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  centerActionIcon: { fontSize: 28, color: '#FFFFFF' },
  inlineRow: { flexDirection: 'row', alignItems: 'center' },
  iconTextSpacing: { marginLeft: 8 },
  bannerArrowIcon: { fontWeight: '700' },
  adCarouselButton: {
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 0,
    marginBottom: 20,
    /* counter the ScrollView content padding so this button reaches screen edges */
    marginHorizontal: -24,
    alignItems: 'stretch',
  },
  adCarouselWrap: {
    width: '100%',
    aspectRatio: 2.0,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#E0E7EF',
    position: 'relative',
    marginTop: 0,
    alignSelf: 'stretch',
  },
  adCarouselImg: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  adCarouselDots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  adCarouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    opacity: 1,
  },
  adCarouselDotInactive: {
    opacity: 0.5,
  },
  adOverlayButton: {
    alignSelf: 'center',
    marginTop: -44,
    width: '96%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 20,
    marginBottom: 20,
  },
  adOverlayText: {
    color: '#06B6D4',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  /* Notebook card */
  notebookCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
  },
  notebookContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notebookLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  notebookTextCol: { flex: 1 },
  notebookIconCircle: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  notebookTitle: { fontSize: 14, fontWeight: '800' },
  notebookImg: { width: 72, height: 48, marginLeft: 12 },
  accountCardInner: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  accountAmount: {
    fontSize: 18,
    fontWeight: '800',
    alignSelf: 'flex-end',
    marginTop: -28,
    marginRight: 8,
  },
  dailySub: { fontSize: 12, marginTop: 6, fontWeight: '700' },
  incomeToday: { color: '#10B981', fontWeight: '800' },
  expenseToday: { color: '#EF4444', fontWeight: '800' },
  accountIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 32,
    transform: [{ translateY: 6 }],
  },
  accountIcon: { alignItems: 'center', width: '20%' },
  accountIconCircle: { width: 60, height: 60, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  accountIconLabel: { fontSize: 13, textAlign: 'center' },
  /* Goal card compact styles */
  goalCard: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFB020',
    borderWidth: 1,
    borderColor: '#FFB020',
    marginBottom: 16,
  },
  goalRowInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalCountSmall: { fontSize: 14, fontWeight: '800', marginLeft: 6 },
  goalCardTitle: { color: '#FFFFFF', fontSize: 14, marginBottom: 0, marginLeft: 6 },
  goalBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginLeft: 8,
  },
  goalBadgeText: { color: '#FFB020', fontWeight: '800' },
  personalGoalButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
  },
  personalGoalInlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%' },
  personalGoalText: { fontWeight: '800', fontSize: 14, marginLeft: 12 },
  commonGoalButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#10B981',
  },
  commonGoalText: { fontWeight: '800', fontSize: 14, marginLeft: 12 },
  personalSuggestContent: { flex: 1 },
  tabBarBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    zIndex: 0,
  },
  personalSuggestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  personalSuggestIcon: { marginRight: 10 },
  personalSuggestTitle: { fontWeight: '800', fontSize: 14 },
  personalSuggestSubtitle: { fontSize: 12 },
  iconViewBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(6,182,212,0.08)' },
  iconViewBtnColored: { backgroundColor: 'rgba(255,255,255,0.16)' },
  personalGoalButtonMarginTop: { marginTop: 8 },
});
