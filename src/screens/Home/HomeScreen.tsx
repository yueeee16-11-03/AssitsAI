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
import { useUserStore } from '../../store/userStore';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';
import { useTransactionData } from '../../hooks/useTransactionData';

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
  const displayName = (user && (user.displayName || user.email || user.phoneNumber)) || 'Người dùng';
  
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
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    } catch {
      return `${amount} VND`;
    }
  }

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
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.headerButtonFull}
        activeOpacity={0.92}
        onPress={() => {/* TODO: handle header button press, e.g. open profile or theme picker */}}
      >
        <View style={styles.headerContentFull}>
          <View style={styles.headerTextCol}>
            <Text style={styles.greeting}>Chào,</Text>
            <Text style={styles.username}>{displayName}</Text>
          </View>
          <View style={styles.headerIconsRowFull}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate("Notification")}
            >
              <Icon name="bell-outline" size={24} color="#6B7280" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.familyButton}
              onPress={() => navigation.navigate("FamilyOverview")}
            >
              <Icon name="account-multiple-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <Icon name="cog-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Icon name="account-circle-outline" size={26} color="#6B7280" />
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
          style={styles.adOverlayButton}
          activeOpacity={0.92}
          onPress={() => {}}
        >
          <View style={styles.accountCardInner}>
            <Text style={styles.accountTitle}>Tài Khoản Chính</Text>
            <Text style={styles.accountAmount}>0 vnd</Text>

            <View style={styles.accountIconsRow}>
              <TouchableOpacity ref={scanIconRef} style={styles.accountIcon} onPress={handleScanIconPress}>
                <View style={styles.accountIconCircle}>
                  <Icon name="barcode-scan" size={24} color="#6B7280" />
                </View>
                <Text style={styles.accountIconLabel}>Quét hóa đơn</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accountIcon} onPress={() => navigation.navigate('BudgetPlanner')}>
                <View style={styles.accountIconCircle}>
                  <Icon name="piggy-bank-outline" size={24} color="#6B7280" />
                </View>
                <Text style={styles.accountIconLabel}>Ngân sách</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accountIcon} onPress={() => navigation.navigate('GoalTracking')}>
                <View style={styles.accountIconCircle}>
                  <Icon name="bullseye-arrow" size={24} color="#6B7280" />
                </View>
                <Text style={styles.accountIconLabel}>Mục tiêu tiết kiệm</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.accountIcon} onPress={() => navigation.navigate('Report')}>
                <View style={styles.accountIconCircle}>
                  <Icon name="chart-box-outline" size={24} color="#6B7280" />
                </View>
                <Text style={styles.accountIconLabel}>Báo cáo chi thu</Text>
              </TouchableOpacity>

              
            </View>

            
          </View>
        </TouchableOpacity>
{/* Notebook-style card (vector icon, compact) */}
        <TouchableOpacity style={[styles.notebookCard, styles.notebookCompact]} activeOpacity={0.9} onPress={() => {}}>
          <View style={styles.notebookContent}>
            <View style={styles.notebookLeft}>
              <View style={[styles.notebookIconCircle, styles.notebookIconCircleColored]}>
                <Icon name="notebook-outline" size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.notebookTitle, styles.notebookTitleWhite]}>Sổ Ghi Chú</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Wallet management button matching notebook style */}
        <TouchableOpacity
          style={[styles.notebookCard, styles.notebookCompact]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('WalletManagement')}
        >
          <View style={styles.notebookContent}>
            <View style={styles.notebookLeft}>
              <View style={[styles.notebookIconCircle, styles.notebookIconCircleAlt]}>
                <Icon name="wallet" size={18} color="#FFFFFF" />
              </View>
              <Text style={[styles.notebookTitle, styles.notebookTitleWhite]}>Quản lý ví</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('WalletManagement')}>
              <Icon name="chevron-right" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <TouchableOpacity
            style={styles.insightButton}
            onPress={() => navigation.navigate("AIInsight")}
            activeOpacity={0.8}
          >
            <View style={styles.inlineRow}>
              <Icon name="chart-line" size={16} color="#6B7280" />
              <Text style={[styles.insightButtonText, styles.iconTextSpacing]}>Xem phân tích AI</Text>
            </View>
          </TouchableOpacity>
          {/* New spending chart button: Chi tiêu trong 7 ngày qua */}
          <TouchableOpacity
            style={styles.spendingChartButton}
            activeOpacity={0.92}
            onPress={() => { /* TODO: open spending details */ }}
          >
            <View style={styles.spendingChartInner}>
              {dailyPercents.map((v, i) => {
                const barColors = ['#F97316', '#FB923C', '#FB7185', '#F472B6', '#06B6D4', '#06B6D4', '#06B6D4'];
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
                    {amount > 0 && <Text style={styles.barAmount}>{formatVNDShort(amount)}</Text>}
                    <Animated.View style={[styles.bar, { height: animatedHeight, backgroundColor: color }]} />
                      <Text style={styles.barLabel}>{last7Labels[i]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.spendingChartTitle}>Chi tiêu trong 7 ngày qua</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thói quen</Text>
          <TouchableOpacity
            style={styles.aiCoachButton}
            onPress={() => navigation.navigate("AIHabitCoach")}
            activeOpacity={0.8}
          >
            <View style={styles.inlineRow}>
              <Icon name="robot-outline" size={16} color="#6B7280" />
              <Text style={[styles.aiCoachButtonText, styles.iconTextSpacing]}>AI Coach</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={() => navigation.navigate("DailyCheckIn")}
            activeOpacity={0.8}
          >
            <View style={styles.inlineRow}>
              <Icon name="check-circle-outline" size={16} color="#10B981" />
              <Text style={[styles.checkInButtonText, styles.iconTextSpacing]}>Check-in hôm nay</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.habitDashboardButton}
            onPress={() => navigation.navigate("HabitDashboard")}
            activeOpacity={0.8}
          >
            <View style={styles.inlineRow}>
              <Icon name="bullseye" size={16} color="#3B82F6" />
              <Text style={[styles.habitDashboardButtonText, styles.iconTextSpacing]}>Xem tất cả thói quen</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.habits}>
            <View style={styles.habitRow}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>Uống nước</Text>
                <Text style={styles.habitMeta}>4/8 cốc</Text>
              </View>
              <View style={styles.habitProgress}>
                <View style={[styles.progressFill, { width: '50%' } as any]} />
              </View>
            </View>

            <View style={styles.habitRow}>
              <View style={styles.habitInfo}>
                <Text style={styles.habitName}>Đi bộ</Text>
                <Text style={styles.habitMeta}>5000 bước</Text>
              </View>
              <View style={styles.habitProgress}>
                <View style={[styles.progressFill, { width: '65%', backgroundColor: '#EC4899' } as any]} />
              </View>
            </View>
          </View>
        </View>

        {/* 'Mục tiêu hôm nay' section removed per user request */}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.personalGoalButton}
            onPress={() => {}}
            activeOpacity={0.85}
          >
            <View style={styles.personalGoalInlineRow}>
              <Icon name="account-heart-outline" size={18} color="#6B7280" />
              <Text style={styles.personalGoalText}>Mục tiêu cá nhân</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.personalGoalButton, styles.commonGoalButton]}
            onPress={() => navigation.navigate('SharedGoal') }
            activeOpacity={0.85}
          >
            <View style={styles.personalGoalInlineRow}>
              <Icon name="bullseye-arrow" size={18} color="#6B7280" />
              <Text style={styles.commonGoalText}>Mục tiêu chung</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.personalGoalButton, styles.personalGoalButtonMarginTop]}
            onPress={() => navigation.navigate('RecurringTransactions')}
            activeOpacity={0.85}
          >
            <View style={styles.personalGoalInlineRow}>
              <Icon name="repeat" size={18} color="#6B7280" />
              <Text style={styles.personalGoalText}>Khoản thu chi định kỳ</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.personalSuggestBanner}
            onPress={() => navigation.navigate('AIRecommendation')}
            activeOpacity={0.9}
          >
            <Icon name="lightbulb-outline" size={20} color="#6B7280" style={styles.personalSuggestIcon} />
            <View style={styles.personalSuggestContent}>
              <Text style={styles.personalSuggestTitle}>Gợi ý thông minh</Text>
              <Text style={styles.personalSuggestSubtitle}>Xem mẹo tiết kiệm và cải thiện thói quen</Text>
            </View>
            <Icon name="chevron-right" size={18} color="#6B7280" />
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
            <TouchableOpacity style={styles.popoverSheetItem} onPress={() => { setScanOptionsVisible(false); setMeasuredTextWidth(0); setPopoverComputedWidth(undefined); setPopoverLeft(undefined); setPopoverTop(undefined); navigation.navigate('AddTransaction', { openCamera: true }); }} activeOpacity={0.85}>
              <View style={styles.popoverSheetIcon}><Icon name="qrcode-scan" size={20} color="#FFFFFF" /></View>
              <Text style={styles.popoverSheetText} numberOfLines={1} ellipsizeMode="tail" onLayout={(e) => { const w = e.nativeEvent?.layout?.width || 0; setMeasuredTextWidth((prev) => Math.max(prev, w)); }}>Quét hóa đơn chi tiêu</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popoverSheetItem} onPress={() => { setScanOptionsVisible(false); setMeasuredTextWidth(0); setPopoverComputedWidth(undefined); setPopoverLeft(undefined); setPopoverTop(undefined); navigation.navigate('AddIncome', { openCamera: true }); }} activeOpacity={0.85}>
              <View style={styles.popoverSheetIcon}><Icon name="qrcode-scan" size={20} color="#FFFFFF" /></View>
              <Text style={styles.popoverSheetText} numberOfLines={1} ellipsizeMode="tail" onLayout={(e) => { const w = e.nativeEvent?.layout?.width || 0; setMeasuredTextWidth((prev) => Math.max(prev, w)); }}>Quét hóa đơn thu nhập</Text>
            </TouchableOpacity>
            {/* Removed 'Quay lại' button; overlay tap closes popover */}
          </View>
        </>
      )}

      {/* Tooltip modal for bar details */}
      <Modal visible={tooltipVisible} transparent animationType="fade" onRequestClose={() => setTooltipVisible(false)}>
        <TouchableOpacity style={styles.tooltipOverlay} activeOpacity={1} onPress={() => setTooltipVisible(false)}>
          <View style={styles.tooltipBox}>
            <Text style={styles.tooltipDay}>{tooltipDay}</Text>
            <Text style={styles.tooltipShort}>{formatVNDShort(tooltipAmount)}</Text>
            <Text style={styles.tooltipFull}>{formatVNDFull(tooltipAmount)}</Text>
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  headerButtonFull: {
    width: '100%',
    backgroundColor: '#FFFFFF',
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
  greeting: { color: "#999999", fontSize: 14 },
  username: { color: "#000000", fontSize: 22, fontWeight: "800" },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitial: { color: "#111827", fontWeight: "800" },
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
  settingsIcon: {
    fontSize: 20,
  },
  familyButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  familyIcon: {
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
  cardTitle: { color: "#00796B", fontSize: 13, marginBottom: 8 },
  cardAmount: { color: "#333333", fontSize: 20, fontWeight: "800" },
  cardSub: { color: "#999999", fontSize: 12, marginTop: 8 },
  viewAllBtn: { marginTop: 12, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, backgroundColor: "rgba(6,182,212,0.15)" },
  viewAllText: { color: "#FFFFFF", fontWeight: "700" },
  goalCount: { color: "#333333", fontSize: 22, fontWeight: "800" },

  section: { marginBottom: 20 },
  sectionTitle: { color: "#000000", fontSize: 16, fontWeight: "700", marginBottom: 12 },

  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 160,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
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
  barLabel: { color: "#6B7280", fontSize: 12, marginTop: 8 },
  barValue: { color: '#374151', fontSize: 12, marginBottom: 4, fontWeight: '700' },
  barAmount: { color: '#6B7280', fontSize: 11, marginBottom: 6 },
  tooltipOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.24)' },
  tooltipBox: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8, alignItems: 'center' },
  tooltipDay: { color: '#6B7280', fontWeight: '700', fontSize: 14 },
  tooltipShort: { color: '#111827', fontWeight: '800', fontSize: 16, marginTop: 6 },
  tooltipFull: { color: '#6B7280', fontSize: 12, marginTop: 4 },
  spendingChartButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  spendingChartTitle: { color: '#06B6D4', fontSize: 14, fontWeight: '800', marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  spendingChartInner: { flexDirection: 'row', alignItems: 'flex-end', height: 160, paddingHorizontal: 6, paddingTop: 12 },

  habits: {},
  habitRow: { marginBottom: 12 },
  habitInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  habitName: { color: "#000000", fontWeight: "700" },
  habitMeta: { color: "#999999" },
  habitProgress: { height: 8, backgroundColor: "rgba(0, 137, 123, 0.15)", borderRadius: 8, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#06B6D4", width: "40%" },

  goals: {},
  goalItem: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "rgba(0, 137, 123, 0.06)", padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: "rgba(0, 137, 123, 0.12)" },
  goalText: { color: "#00796B", fontWeight: "700" },
  goalMeta: { color: "#999999" },

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
    backgroundColor: "rgba(6,182,212,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  insightButtonText: {
    color: "#6B7280",
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
  bannerTitle: { color: "#00796B", fontSize: 16, fontWeight: "800", marginBottom: 4 },
  bannerSubtitle: { color: "#999999", fontSize: 12 },
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
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  habitDashboardButtonText: {
    color: "#3B82F6",
    fontWeight: "700",
    fontSize: 14,
  },
  checkInButton: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  checkInButtonText: {
    color: "#10B981",
    fontWeight: "700",
    fontSize: 14,
  },
  aiCoachButton: {
    backgroundColor: "rgba(6,182,212,0.15)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  aiCoachButtonText: {
    color: "#06B6D4",
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
  scanOptionsWrap: { position: 'absolute', borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', paddingVertical: 4, paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 20, zIndex: 101 },
  popoverSheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  popoverSheetIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  popoverSheetText: { color: '#000000', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  scanOptionsOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.28)' },
  /* removed sheetIconMuted/sheetTextMuted - not used (overlay dismisses) */
  sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' },
  sheetIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#06B6D4', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  sheetText: { color: '#000000', fontSize: 16, fontWeight: '700' },
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)'
  },
  notebookCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  notebookContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notebookLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  notebookTextCol: { flex: 1 },
  notebookIconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(6,182,212,0.08)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  notebookIconCircleColored: { backgroundColor: 'rgba(255,255,255,0.16)' },
  notebookTitle: { color: '#00796B', fontSize: 14, fontWeight: '800' },
  notebookTitleWhite: { color: '#FFFFFF' },
  notebookImg: { width: 72, height: 48, marginLeft: 12 },
  accountCardInner: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
  },
  accountTitle: {
    color: '#00796B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  accountAmount: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '800',
    alignSelf: 'flex-end',
    marginTop: -28,
    marginRight: 8,
  },
  accountIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 32,
    transform: [{ translateY: 6 }],
  },
  accountIcon: { alignItems: 'center', width: '20%' },
  accountIconCircle: { width: 60, height: 60, borderRadius: 14, backgroundColor: 'rgba(6,182,212,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  accountIconLabel: { color: '#999999', fontSize: 13, textAlign: 'center' },
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
  goalCountSmall: { color: '#333333', fontSize: 14, fontWeight: '800', marginLeft: 6 },
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
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  personalGoalInlineRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', width: '100%' },
  personalGoalText: { color: '#111827', fontWeight: '800', fontSize: 14, marginLeft: 12 },
  commonGoalButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#10B981',
  },
  commonGoalText: { color: '#111827', fontWeight: '800', fontSize: 14, marginLeft: 12 },
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
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1FAE5'
  },
  personalSuggestIcon: { marginRight: 10 },
  personalSuggestTitle: { color: '#000000', fontWeight: '800', fontSize: 14 },
  personalSuggestSubtitle: { color: '#999999', fontSize: 12 },
  iconViewBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(6,182,212,0.08)' },
  iconViewBtnColored: { backgroundColor: 'rgba(255,255,255,0.16)' },
  personalGoalButtonMarginTop: { marginTop: 8 },
  notebookIconCircleAlt: { backgroundColor: 'rgba(255,255,255,0.16)' },
});
