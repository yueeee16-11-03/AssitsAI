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
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraPermission, useCameraDevice, useCameraFormat } from "react-native-vision-camera";
import { launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useUserStore } from '../../store/userStore';
import { useUnreadNotificationCount } from '../../hooks/useUnreadNotificationCount';

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation, route }: Props) {
  const [loading] = useState(false);
  const insets = useSafeAreaInsets();
  const user = useUserStore((s: any) => s.user);
  const { unreadCount } = useUnreadNotificationCount();
  const displayName = (user && (user.displayName || user.email || user.phoneNumber)) || 'Người dùng';
  const [cameraOptionsVisible, setCameraOptionsVisible] = useState(false);
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const TAB_BAR_HEIGHT = 70; // adjust as needed for the app's bottom tab bar height
  // Open camera when navigated with params from global bottom sheet
  React.useEffect(() => {
    if (route?.params && (route as any).params.openCamera) {
      setCameraOptionsVisible(true);
      // clear param to avoid re-trigger on back navigation
      navigation.setParams({ openCamera: false } as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params]);

  const sampleBars = [50, 75, 40, 90, 60, 80, 70]; // 7-day values
  const CHART_HEIGHT = 100; // px height used for bar animations (reduced so 100% bars don't overflow)

  const barAnimsRef = React.useRef(sampleBars.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    const animations = sampleBars.map((v, i) =>
      Animated.timing(barAnimsRef[i], {
        toValue: (v / 100) * CHART_HEIGHT,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      })
    );

    Animated.stagger(90, animations).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <TouchableOpacity style={styles.accountIcon} onPress={() => { setCameraOptionsVisible(true); }}>
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
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.card, styles.goalCard]}
            onPress={() => navigation.navigate('DailyGoalsDetail')}
            activeOpacity={0.8}
          >
            <View style={styles.goalRowInner}>
              <View style={styles.goalLeft}>
                <Icon name="bullseye" size={18} color="#FFFFFF" />
                <Text style={[styles.cardTitle, styles.goalCardTitle]}>Mục tiêu hôm nay</Text>
                <View style={styles.goalBadge}>
                  <Text style={styles.goalBadgeText}>3</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.iconViewBtn, styles.iconViewBtnColored]} onPress={() => navigation.navigate('DailyGoalsDetail')}>
                <Icon name="chevron-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>

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
              {sampleBars.map((v, i) => {
                const barColors = ['#F97316', '#FB923C', '#FB7185', '#F472B6', '#06B6D4', '#06B6D4', '#06B6D4'];
                const color = barColors[i % barColors.length];
                const animatedHeight = barAnimsRef[i];
                return (
                  <View key={i} style={styles.barColumn}>
                    <Text style={styles.barValue}>{v}%</Text>
                    <Animated.View style={[styles.bar, { height: animatedHeight, backgroundColor: color }]} />
                      <Text style={styles.barLabel}>{['T2','T3','T4','T5','T6','T7','CN'][i]}</Text>
                  </View>
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

      {/* Bottom tabs, FAB, and bottom sheet moved to top-level navigation component */}

      {/* Camera Screen Modal with live preview */}
      {cameraOptionsVisible && (
        <CameraScreenHome
          onCapture={(uri) => {
            setCameraOptionsVisible(false);
            navigation.navigate('AIProcessingOverlay', { imageUri: uri, transactionType: 'expense' });
          }}
          onClose={() => setCameraOptionsVisible(false)}
        />
      )}
    </SafeAreaView>
  );
}

// Camera Screen Component with live preview and controls
function CameraScreenHome({ onCapture, onClose }: { onCapture: (uri: string) => void; onClose: () => void }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = React.useState<"back" | "front">("back");
  const device = useCameraDevice(cameraPosition);
  const camera = React.useRef<Camera>(null);
  const [permissionRequested, setPermissionRequested] = React.useState(false);
  const [torchEnabled, setTorchEnabled] = React.useState(false);

  const format = useCameraFormat(device, [
    { videoStabilizationMode: "cinematic" },
  ]);

  React.useEffect(() => {
    const requestCameraPermission = async () => {
      if (!hasPermission && !permissionRequested) {
        setPermissionRequested(true);
        try {
          const result = await requestPermission();
          console.log("Camera permission result:", result);
        } catch (error) {
          console.error("Error requesting camera permission:", error);
        }
      }
    };
    requestCameraPermission();
  }, [hasPermission, requestPermission, permissionRequested]);

  const handleTakePhoto = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          flash: cameraPosition === "back" && torchEnabled ? "on" : "off",
        });
        if (photo.path) {
          onCapture("file://" + photo.path);
        }
      } catch (error) {
        console.error("Error taking photo:", error);
        Alert.alert("Lỗi", "Không thể chụp ảnh");
      }
    }
  };

  const handlePickFromGallery = async () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log("User cancelled image picker");
        } else if (response.errorMessage) {
          Alert.alert("Lỗi", "Không thể lấy hình ảnh: " + response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          if (asset.uri) {
            onCapture(asset.uri);
          }
        }
      }
    );
  };

  const toggleFlash = () => {
    setTorchEnabled(!torchEnabled);
  };

  const toggleCameraPosition = () => {
    setCameraPosition(cameraPosition === "back" ? "front" : "back");
    // Disable torch when switching to front camera
    if (cameraPosition === "back") {
      setTorchEnabled(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={cameraStyles.cameraContainer}>
        <View style={cameraStyles.permissionContainer}>
          <Text style={cameraStyles.permissionIcon}>📷</Text>
          <Text style={cameraStyles.permissionText}>Cần quyền truy cập camera</Text>
          <Text style={cameraStyles.permissionDescription}>
            Để chụp ảnh hóa đơn, vui lòng cấp quyền camera cho ứng dụng
          </Text>
          <TouchableOpacity
            style={cameraStyles.permissionButton}
            onPress={() => requestPermission()}
          >
            <Text style={cameraStyles.permissionButtonText}>🔒 Cấp quyền camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={cameraStyles.permissionButtonCancel}
            onPress={onClose}
          >
            <Text style={cameraStyles.permissionButtonCancelText}>✕ Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={cameraStyles.cameraContainer}>
        <View style={cameraStyles.permissionContainer}>
          <Text style={cameraStyles.permissionIcon}>⚠️</Text>
          <Text style={cameraStyles.permissionText}>Không tìm thấy camera</Text>
          <Text style={cameraStyles.permissionDescription}>
            Thiết bị của bạn không có camera hoặc camera không khả dụng
          </Text>
          <TouchableOpacity
            style={cameraStyles.permissionButtonCancel}
            onPress={onClose}
          >
            <Text style={cameraStyles.permissionButtonCancelText}>✕ Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={cameraStyles.cameraContainer}>
      <Camera
        ref={camera}
        style={cameraStyles.camera}
        device={device}
        isActive={true}
        photo={true}
        format={format}
        torch={cameraPosition === "back" && torchEnabled ? "on" : "off"}
      />

      {/* Top Header with Close and Camera Flip buttons */}
      <View style={cameraStyles.cameraHeader}>
        <TouchableOpacity style={cameraStyles.cameraHeaderButton} onPress={onClose}>
          <Icon name="close-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
        <View style={cameraStyles.cameraHeaderTitleWrap}>
          <Icon name="qrcode-scan" size={16} color="#6B7280" style={cameraStyles.cameraHeaderIconSpacing} />
          <Text style={cameraStyles.cameraHeaderTitle}>Quét hóa đơn</Text>
        </View>
        <TouchableOpacity style={cameraStyles.cameraHeaderButton} onPress={toggleCameraPosition}>
          <Icon name="camera-flip-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Bill Scanning Frame */}
      <View style={cameraStyles.billScanFrame}>
        <View style={cameraStyles.billFrameCorner} />
        <View style={[cameraStyles.billFrameCorner, cameraStyles.billFrameCornerTopRight]} />
        <View style={[cameraStyles.billFrameCorner, cameraStyles.billFrameCornerBottomLeft]} />
        <View style={[cameraStyles.billFrameCorner, cameraStyles.billFrameCornerBottomRight]} />
        <Text style={cameraStyles.billFrameText}>Căn chỉnh hóa đơn vào khung</Text>
      </View>

      {/* Status Bar */}
      <View style={cameraStyles.cameraStatusBar}>
        <View style={cameraStyles.statusIndicator}>
          <Text style={cameraStyles.statusText}>
            {torchEnabled ? 'Đèn: Bật' : 'Đèn: Tắt'}
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={cameraStyles.cameraControlsBottom}>
        <TouchableOpacity
          style={cameraStyles.galleryButton}
          onPress={handlePickFromGallery}
        >
          <Icon name="image-outline" size={28} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={cameraStyles.cameraShootButton}
          onPress={handleTakePhoto}
        >
          <Icon name="qrcode-scan" size={36} color="#6B7280" />
        </TouchableOpacity>

        {cameraPosition === 'back' && (
          <TouchableOpacity
            style={cameraStyles.flashButton}
            onPress={toggleFlash}
          >
            <Icon name={torchEnabled ? 'flash' : 'flash-off-outline'} size={28} color="#6B7280" />
          </TouchableOpacity>
        )}
        {cameraPosition === 'front' && (
          <View style={cameraStyles.flashButton} />
        )}
      </View>
    </View>
  );
}

const cameraStyles = StyleSheet.create({
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
  },
  cameraHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 18,
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
    borderWidth: 2,
    borderColor: "#4CAF50",
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
    bottom: 180,
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
  cameraControlsBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingBottom: 20,
    zIndex: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)'
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  galleryButtonText: {
    fontSize: 28,
  },
  cameraShootButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  flashButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  flashButtonText: {
    fontSize: 28,
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
});

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
  barValue: { color: '#374151', fontSize: 12, marginBottom: 8, fontWeight: '700' },
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
