import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableOpacity,
  TextInput,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from '../../store/familyStore';
import FamilySettingsService, { FamilySettings, FamilyInfo } from '../../services/admin/FamilySettingsService';
import auth from '@react-native-firebase/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

// Color System - Professional palette
const COLORS = {
  primary: {
    main: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
    alpha10: 'rgba(99, 102, 241, 0.1)',
    alpha20: 'rgba(99, 102, 241, 0.2)',
  },
  success: {
    main: '#10B981',
    light: '#34D399',
    dark: '#059669',
    alpha10: 'rgba(16, 185, 129, 0.1)',
    alpha20: 'rgba(16, 185, 129, 0.2)',
  },
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    alpha10: 'rgba(245, 158, 11, 0.1)',
    alpha20: 'rgba(245, 158, 11, 0.2)',
  },
  danger: {
    main: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    alpha10: 'rgba(239, 68, 68, 0.1)',
    alpha20: 'rgba(239, 68, 68, 0.2)',
  },
  info: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    alpha10: 'rgba(139, 92, 246, 0.1)',
    alpha20: 'rgba(139, 92, 246, 0.2)',
  },
  pink: {
    main: '#EC4899',
    light: '#F472B6',
    dark: '#DB2777',
    alpha10: 'rgba(236, 72, 153, 0.1)',
    alpha20: 'rgba(236, 72, 153, 0.2)',
  },
  neutral: {
    white: '#FFFFFF',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
  },
};

export default function FamilySettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { currentFamily } = useFamilyStore();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [settings, setSettings] = useState<FamilySettings | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Modal states
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [thresholdInput, setThresholdInput] = useState('');

  // Check if user is owner
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (currentUser && currentFamily) {
      setIsOwner(currentFamily.ownerId === currentUser.uid);
    }
  }, [currentFamily]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentFamily?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [info, config] = await Promise.all([
        FamilySettingsService.getFamilyInfo(currentFamily.id),
        FamilySettingsService.getSettings(currentFamily.id),
      ]);

      setFamilyInfo(info);
      setSettings(config);
    } catch (error: any) {
      console.error('❌ Error fetching family settings:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  }, [currentFamily?.id]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    fetchData();
  }, [fadeAnim, fetchData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Handle notification toggle
  const handleNotificationToggle = useCallback(
    async (key: keyof FamilySettings['notifications']) => {
      if (!currentFamily?.id || !settings || !isOwner) {
        Alert.alert('⚠️ Lỗi', 'Chỉ chủ gia đình mới có thể thay đổi cài đặt');
        return;
      }

      const newValue = !settings.notifications[key];

      // Optimistic update
      setSettings({
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: newValue,
        },
      });

      try {
        await FamilySettingsService.updateNotificationSetting(
          currentFamily.id,
          key,
          newValue
        );
      } catch (error: any) {
        // Revert on error
        setSettings({
          ...settings,
          notifications: {
            ...settings.notifications,
            [key]: !newValue,
          },
        });
        Alert.alert('Lỗi', error.message || 'Không thể cập nhật cài đặt');
      }
    },
    [currentFamily?.id, settings, isOwner]
  );

  // Handle privacy toggle
  const handlePrivacyToggle = useCallback(
    async (key: keyof FamilySettings['privacy']) => {
      if (!currentFamily?.id || !settings || !isOwner) {
        Alert.alert('⚠️ Lỗi', 'Chỉ chủ gia đình mới có thể thay đổi cài đặt');
        return;
      }

      const currentValue = settings.privacy[key];
      const newValue = typeof currentValue === 'boolean' ? !currentValue : currentValue;

      // Optimistic update
      setSettings({
        ...settings,
        privacy: {
          ...settings.privacy,
          [key]: newValue,
        },
      });

      try {
        await FamilySettingsService.updatePrivacySetting(
          currentFamily.id,
          key,
          newValue
        );
      } catch (error: any) {
        // Revert on error
        setSettings({
          ...settings,
          privacy: {
            ...settings.privacy,
            [key]: currentValue,
          },
        });
        Alert.alert('Lỗi', error.message || 'Không thể cập nhật cài đặt');
      }
    },
    [currentFamily?.id, settings, isOwner]
  );

  // Handle update budget
  const handleUpdateBudget = useCallback(async () => {
    if (!currentFamily?.id || !budgetInput) {
      Alert.alert('⚠️ Lỗi', 'Vui lòng nhập ngân sách hợp lệ');
      return;
    }

    const budget = parseFloat(budgetInput.replace(/[,.]/g, ''));
    if (isNaN(budget) || budget < 0) {
      Alert.alert('⚠️ Lỗi', 'Ngân sách không hợp lệ');
      return;
    }

    try {
      await FamilySettingsService.updateMonthlyBudget(currentFamily.id, budget);
      setShowBudgetModal(false);
      await fetchData();
      Alert.alert('✅ Thành công', 'Đã cập nhật ngân sách tháng');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật ngân sách');
    }
  }, [currentFamily?.id, budgetInput, fetchData]);

  // Handle update threshold
  const handleUpdateThreshold = useCallback(async () => {
    if (!currentFamily?.id || !settings || !thresholdInput) {
      Alert.alert('⚠️ Lỗi', 'Vui lòng nhập ngưỡng hợp lệ');
      return;
    }

    const threshold = parseFloat(thresholdInput);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      Alert.alert('⚠️ Lỗi', 'Ngưỡng phải từ 0-100%');
      return;
    }

    try {
      await FamilySettingsService.updateSettings(currentFamily.id, {
        budget: {
          ...settings.budget,
          warningThreshold: threshold,
        },
      } as any);
      setShowThresholdModal(false);
      await fetchData();
      Alert.alert('✅ Thành công', 'Đã cập nhật ngưỡng cảnh báo');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật ngưỡng');
    }
  }, [currentFamily?.id, settings, thresholdInput, fetchData]);

  // Handle export data
  const handleExportData = useCallback(async () => {
    if (!currentFamily?.id) return;

    try {
      const data = await FamilySettingsService.exportFamilyData(currentFamily.id);
      const jsonString = JSON.stringify(data, null, 2);

      await Share.share({
        message: `Dữ liệu gia đình ${familyInfo?.name || 'Unknown'}\n\n${jsonString}`,
        title: 'Export Family Data',
      });
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể xuất dữ liệu');
    }
  }, [currentFamily?.id, familyInfo?.name]);

  // Handle leave family
  const handleLeaveFamily = useCallback(async () => {
    if (!currentFamily?.id) return;

    Alert.alert(
      '👋 Rời gia đình',
      'Bạn có chắc muốn rời khỏi gia đình này? Bạn sẽ mất quyền truy cập vào tất cả dữ liệu gia đình.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rời gia đình',
          style: 'destructive',
          onPress: async () => {
            if (!currentFamily?.id) return;
            try {
              await FamilySettingsService.leaveFamily(currentFamily.id);
              Alert.alert('✅ Thành công', 'Đã rời khỏi gia đình', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Home'),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể rời gia đình');
            }
          },
        },
      ]
    );
  }, [currentFamily?.id, navigation]);

  // Handle delete family
  const handleDeleteFamily = useCallback(async () => {
    if (!currentFamily?.id) return;

    Alert.alert(
      '🗑️ Xóa gia đình',
      'Hành động này không thể hoàn tác. Tất cả dữ liệu gia đình sẽ bị xóa vĩnh viễn.\n\nBạn có chắc chắn muốn xóa?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            if (!currentFamily?.id) return;
            try {
              await FamilySettingsService.deleteFamily(currentFamily.id);
              Alert.alert('✅ Đã xóa', 'Gia đình đã được xóa', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('Home'),
                },
              ]);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa gia đình');
            }
          },
        },
      ]
    );
  }, [currentFamily?.id, navigation]);

  // Handle edit family name
  const handleEditFamilyName = useCallback(() => {
    if (!isOwner) {
      Alert.alert('⚠️ Thông báo', 'Chỉ chủ gia đình mới có thể đổi tên gia đình');
      return;
    }
    Alert.alert('✏️ Đổi tên gia đình', 'Chức năng đang phát triển. Bạn sẽ có thể đổi tên gia đình trong phiên bản tiếp theo.');
  }, [isOwner]);

  // Handle view members
  const handleViewMembers = useCallback(() => {
    Alert.alert(
      '👥 Thành viên gia đình',
      `Hiện tại gia đình có ${familyInfo?.memberCount || 0} thành viên.\n\nBấm "Đồng ý" để xem chi tiết danh sách thành viên.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          onPress: () => navigation.navigate('FamilyMembers')
        },
      ]
    );
  }, [navigation, familyInfo]);

  // Handle view budget details
  const handleViewBudgetDetails = useCallback(() => {
    const spentAmount = familyInfo?.totalBalance || 0;
    const budgetAmount = familyInfo?.monthlyBudget || 0;
    const remainingAmount = budgetAmount - spentAmount;
    const percentUsed = budgetAmount > 0 ? ((spentAmount / budgetAmount) * 100).toFixed(1) : '0';
    const status = spentAmount > budgetAmount ? '⚠️ Vượt ngân sách!' : remainingAmount < budgetAmount * 0.2 ? '🔴 Sắp hết!' : '✅ An toàn';
    
    Alert.alert(
      '💰 Ngân sách tháng',
      `${status}\n\n` +
      `🎯 Ngân sách: ${formatCurrency(budgetAmount)}\n` +
      `💸 Đã chi tiêu: ${formatCurrency(spentAmount)} (${percentUsed}%)\n` +
      `💵 Còn lại: ${formatCurrency(remainingAmount)}`,
      [{ text: 'Đóng' }]
    );
  }, [familyInfo]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Đang tải cài đặt...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!familyInfo || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Không thể tải cài đặt gia đình
          </Text>
          <Pressable style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Cài đặt gia đình</Text>
        <View style={styles.spacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Family Info Card */}
          <View style={[styles.heroCard, theme.dark && styles.heroCardDark]}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <Icon name="home-heart" size={32} color={COLORS.neutral.white} />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.heroTitle}>{familyInfo.name}</Text>
                <Text style={styles.heroSubtitle}>
                  {isOwner ? '👑 Chủ gia đình' : '👤 Thành viên'}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.heroEditButton,
                  pressed && styles.heroEditButtonPressed,
                ]}
                onPress={handleEditFamilyName}
              >
                <Icon name="pencil" size={22} color={COLORS.neutral.white} />
              </Pressable>
            </View>

            <View style={styles.statsGrid}>
              <Pressable
                style={({ pressed }) => [
                  styles.statCard,
                  pressed && styles.statCardPressed,
                ]}
                onPress={handleViewMembers}
              >
                <Icon name="account-group" size={26} color={COLORS.neutral.white} />
                <Text style={styles.statValue}>{familyInfo.memberCount}</Text>
                <Text style={styles.statLabel}>Thành viên</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.statCard,
                  pressed && styles.statCardPressed,
                ]}
                onPress={() => {
                  const spentAmount = familyInfo.totalBalance;
                  const budgetAmount = familyInfo.monthlyBudget;
                  const remainingAmount = budgetAmount - spentAmount;
                  const percentUsed = ((spentAmount / budgetAmount) * 100).toFixed(1);
                  
                  Alert.alert(
                    '💸 Chi tiêu tháng này',
                    `💰 Đã chi: ${formatCurrency(spentAmount)}\n` +
                    `🎯 Ngân sách: ${formatCurrency(budgetAmount)}\n` +
                    `✅ Còn lại: ${formatCurrency(remainingAmount)}\n` +
                    `📊 Sử dụng: ${percentUsed}%`,
                    [{ text: 'Đóng' }]
                  );
                }}
              >
                <Icon name="cash-multiple" size={26} color={COLORS.neutral.white} />
                <Text style={styles.statValue}>
                  {(familyInfo.totalBalance / 1000000).toFixed(1)}M
                </Text>
                <Text style={styles.statLabel}>Chi tiêu</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.statCard,
                  pressed && styles.statCardPressed,
                ]}
                onPress={handleViewBudgetDetails}
              >
                <Icon name="calendar-month" size={26} color={COLORS.neutral.white} />
                <Text style={styles.statValue}>
                  {(familyInfo.monthlyBudget / 1000000).toFixed(0)}M
                </Text>
                <Text style={styles.statLabel}>Ngân sách</Text>
              </Pressable>
            </View>

            <View style={styles.infoRow}>
              <Icon name="calendar-clock" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.infoRowText, { color: theme.colors.onSurfaceVariant }]}>
                Tạo ngày {formatDate(familyInfo.createdAt)}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
            <View style={styles.quickActions}>
              <Pressable
                style={styles.quickActionButton}
                onPress={() => {
                  setBudgetInput(familyInfo.monthlyBudget.toString());
                  setShowBudgetModal(true);
                }}
                disabled={!isOwner}
              >
                {({ pressed }) => (
                  <View style={[styles.quickActionCard, pressed && styles.quickActionCardPressed]}>
                    <View style={[styles.quickActionIconContainer, styles.quickActionIconBlue]}>
                      <Icon name="currency-usd" size={28} color={COLORS.primary.main} />
                    </View>
                    <Text style={[styles.quickActionText, !isOwner && styles.disabledText]}>
                      Ngân sách
                    </Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={styles.quickActionButton}
                onPress={handleExportData}
              >
                {({ pressed }) => (
                  <View style={[styles.quickActionCard, pressed && styles.quickActionCardPressed]}>
                    <View style={[styles.quickActionIconContainer, styles.quickActionIconGreen]}>
                      <Icon name="download" size={28} color={COLORS.success.main} />
                    </View>
                    <Text style={styles.quickActionText}>Xuất dữ liệu</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('FamilyCategories')}
              >
                {({ pressed }) => (
                  <View style={[styles.quickActionCard, pressed && styles.quickActionCardPressed]}>
                    <View style={[styles.quickActionIconContainer, styles.quickActionIconOrange]}>
                      <Icon name="format-list-bulleted" size={28} color={COLORS.warning.main} />
                    </View>
                    <Text style={styles.quickActionText}>Danh mục</Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('FamilyMembers')}
              >
                {({ pressed }) => (
                  <View style={[styles.quickActionCard, pressed && styles.quickActionCardPressed]}>
                    <View style={[styles.quickActionIconContainer, styles.quickActionIconPink]}>
                      <Icon name="account-multiple" size={28} color={COLORS.pink.main} />
                    </View>
                    <Text style={styles.quickActionText}>Thành viên</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>

          {/* Notification Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="bell-ring" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Thông báo</Text>
            </View>

            <View style={styles.settingsCard}>
              <SettingItem
                icon="bell"
                iconColor={COLORS.primary.main}
                iconBg={COLORS.primary.alpha10}
                label="Bật thông báo"
                description="Nhận thông báo về hoạt động gia đình"
                value={settings.notifications.enabled}
                onToggle={() => handleNotificationToggle('enabled')}
                disabled={!isOwner}
                theme={theme}
              />

              <SettingItem
                icon="swap-horizontal"
                iconColor={COLORS.success.main}
                iconBg={COLORS.success.alpha10}
                label="Thông báo giao dịch"
                description="Nhận thông báo khi có giao dịch mới"
                value={settings.notifications.transactions}
                onToggle={() => handleNotificationToggle('transactions')}
                disabled={!isOwner}
                theme={theme}
              />

              <SettingItem
                icon="alert-circle"
                iconColor={COLORS.warning.main}
                iconBg={COLORS.warning.alpha10}
                label="Cảnh báo ngân sách"
                description="Cảnh báo khi sắp vượt ngân sách"
                value={settings.notifications.budgetAlerts}
                onToggle={() => handleNotificationToggle('budgetAlerts')}
                disabled={!isOwner}
                theme={theme}
              />

              <SettingItem
                icon="calendar"
                iconColor={COLORS.info.main}
                iconBg={COLORS.info.alpha10}
                label="Báo cáo hàng tháng"
                description="Nhận báo cáo tài chính cuối tháng"
                value={settings.notifications.monthlyReport}
                onToggle={() => handleNotificationToggle('monthlyReport')}
                disabled={!isOwner}
                theme={theme}
              />

              <SettingItem
                icon="account-clock"
                iconColor={COLORS.pink.main}
                iconBg={COLORS.pink.alpha10}
                label="Hoạt động thành viên"
                description="Thông báo khi thành viên có hoạt động"
                value={settings.notifications.memberActivity}
                onToggle={() => handleNotificationToggle('memberActivity')}
                disabled={!isOwner}
                theme={theme}
                isLast
              />
            </View>
          </View>

          {/* Privacy & Control */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="shield-lock" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Quyền riêng tư & Điều khiển</Text>
            </View>

            <View style={styles.settingsCard}>
              <SettingItem
                icon="check-circle"
                iconColor={COLORS.primary.main}
                iconBg={COLORS.primary.alpha10}
                label="Yêu cầu phê duyệt"
                description={`Giao dịch trên ${formatCurrency(settings.privacy.approvalThreshold)} cần phê duyệt`}
                value={settings.privacy.approvalRequired}
                onToggle={() => handlePrivacyToggle('approvalRequired')}
                disabled={!isOwner}
                theme={theme}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.settingButton,
                  pressed && styles.settingButtonPressed,
                ]}
                onPress={() => {
                  setThresholdInput(settings.privacy.approvalThreshold.toString());
                  setShowThresholdModal(true);
                }}
                disabled={!isOwner}
              >
                <View style={styles.settingInfo}>
                  <View style={[styles.settingIconContainer, styles.settingIconOrange]}>
                    <Icon name="cash-marker" size={24} color={COLORS.warning.main} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingLabel, !isOwner && styles.disabledText]}>
                      Ngưỡng phê duyệt
                    </Text>
                    <Text style={[styles.settingDesc, { color: theme.colors.onSurfaceVariant }]}>
                      {formatCurrency(settings.privacy.approvalThreshold)}
                    </Text>
                  </View>
                </View>
                <View style={styles.settingArrow}>
                  <Icon name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              </Pressable>

              <SettingItem
                icon="account-eye"
                iconColor={COLORS.success.main}
                iconBg={COLORS.success.alpha10}
                label="Hồ sơ công khai"
                description="Cho phép người khác tìm gia đình"
                value={settings.privacy.publicProfile}
                onToggle={() => handlePrivacyToggle('publicProfile')}
                disabled={!isOwner}
                theme={theme}
              />

              <SettingItem
                icon="account-plus"
                iconColor={COLORS.pink.main}
                iconBg={COLORS.pink.alpha10}
                label="Cho phép mời thành viên"
                description="Thành viên có thể mời người khác"
                value={settings.privacy.allowMemberInvites}
                onToggle={() => handlePrivacyToggle('allowMemberInvites')}
                disabled={!isOwner}
                theme={theme}
                isLast
              />
            </View>
          </View>

          {/* Budget Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="piggy-bank" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Ngân sách</Text>
            </View>

            <View style={styles.budgetCard}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>Ngân sách tháng</Text>
                <Pressable
                  style={styles.budgetEditButton}
                  onPress={() => {
                    setBudgetInput(familyInfo.monthlyBudget.toString());
                    setShowBudgetModal(true);
                  }}
                  disabled={!isOwner}
                >
                  <Icon name="pencil" size={16} color={theme.colors.primary} />
                  <Text style={[styles.budgetEditText, !isOwner && styles.disabledText]}>
                    Chỉnh sửa
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.budgetValue}>
                {formatCurrency(familyInfo.monthlyBudget)}
              </Text>
              <View style={styles.budgetProgress}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(
                          (familyInfo.totalBalance / familyInfo.monthlyBudget) * 100,
                          100
                        )}%`,
                      },
                      (familyInfo.totalBalance / familyInfo.monthlyBudget) * 100 >
                      settings.budget.warningThreshold
                        ? styles.progressFillDanger
                        : styles.progressFillSuccess,
                    ]}
                  />
                </View>
                <Text style={styles.budgetPercentage}>
                  {((familyInfo.totalBalance / familyInfo.monthlyBudget) * 100).toFixed(1)}%
                </Text>
              </View>
              <Text style={[styles.budgetNote, { color: theme.colors.onSurfaceVariant }]}>
                Cảnh báo khi đạt {settings.budget.warningThreshold}% ngân sách
              </Text>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="alert-octagon" size={22} color={COLORS.danger.main} />
              <Text style={styles.dangerSectionTitle}>
                Vùng nguy hiểm
              </Text>
            </View>

            <View style={styles.dangerCard}>
              {!isOwner ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.dangerButtonPressed,
                  ]}
                  onPress={handleLeaveFamily}
                >
                  <View style={styles.dangerIconContainer}>
                    <Icon name="exit-to-app" size={24} color={COLORS.warning.main} />
                  </View>
                  <View style={styles.dangerButtonText}>
                    <Text style={styles.dangerButtonLabel}>Rời gia đình</Text>
                    <Text style={styles.dangerButtonDesc}>
                      Bạn sẽ mất quyền truy cập vào gia đình này
                    </Text>
                  </View>
                  <View style={styles.dangerArrow}>
                    <Icon name="chevron-right" size={20} color={COLORS.warning.main} />
                  </View>
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && styles.dangerButtonPressed,
                  ]}
                  onPress={handleDeleteFamily}
                >
                  <View style={styles.dangerIconContainer}>
                    <Icon name="trash-can" size={24} color={COLORS.danger.main} />
                  </View>
                  <View style={styles.dangerButtonText}>
                    <Text style={styles.dangerButtonLabelRed}>
                      Xóa gia đình
                    </Text>
                    <Text style={styles.dangerButtonDesc}>
                      Xóa vĩnh viễn gia đình và tất cả dữ liệu
                    </Text>
                  </View>
                  <View style={styles.dangerArrow}>
                    <Icon name="chevron-right" size={20} color={COLORS.danger.main} />
                  </View>
                </Pressable>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Budget Modal */}
      <Modal
        visible={showBudgetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowBudgetModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Cập nhật ngân sách tháng
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập số tiền (VND)"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowBudgetModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdateBudget}
              >
                <Text style={styles.modalSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Threshold Modal */}
      <Modal
        visible={showThresholdModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThresholdModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowThresholdModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Cập nhật ngưỡng phê duyệt
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nhập số tiền (VND)"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={thresholdInput}
              onChangeText={setThresholdInput}
              keyboardType="numeric"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowThresholdModal(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdateThreshold}
              >
                <Text style={styles.modalSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// SettingItem Component
interface SettingItemProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
  theme: any;
  isLast?: boolean;
}

function SettingItem({
  icon,
  iconColor,
  iconBg,
  label,
  description,
  value,
  onToggle,
  disabled,
  theme,
  isLast,
}: SettingItemProps) {
  const styles = getStyles(theme);

  return (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingInfo}>
        <View style={[styles.settingIconContainer, { backgroundColor: iconBg }]}>
          <Icon name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, disabled && styles.disabledText]}>
            {label}
          </Text>
          <Text style={[styles.settingDesc, { color: theme.colors.onSurfaceVariant }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{
          false: theme.dark ? 'rgba(255,255,255,0.2)' : COLORS.neutral.gray200,
          true: COLORS.primary.alpha20,
        }}
        thumbColor={value ? COLORS.primary.main : theme.dark ? COLORS.neutral.gray400 : COLORS.neutral.white}
        ios_backgroundColor={theme.dark ? 'rgba(255,255,255,0.2)' : COLORS.neutral.gray200}
      />
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: 16,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0, 137, 123, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    spacer: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    // Hero Card
    heroCard: {
      backgroundColor: theme.colors.primary,
      borderRadius: 24,
      padding: 24,
      marginBottom: 24,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 12,
    },
    heroCardDark: {
      backgroundColor: theme.dark ? COLORS.neutral.gray800 : theme.colors.primary,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
    },
    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.neutral.white,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    heroInfo: {
      flex: 1,
      marginLeft: 16,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: COLORS.neutral.white,
      marginBottom: 6,
      letterSpacing: 0.3,
    },
    heroSubtitle: {
      fontSize: 15,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: 0.2,
    },
    heroEditButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.neutral.white,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    heroEditButtonPressed: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      transform: [{ scale: 0.95 }],
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      gap: 8,
      shadowColor: COLORS.neutral.white,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    statCardPressed: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      transform: [{ scale: 0.97 }],
    },
    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: COLORS.neutral.white,
      letterSpacing: 0.3,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: 0.2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.25)',
    },
    infoRowText: {
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 0.2,
    },
    // Quick Actions
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: 0.3,
    },
    quickActions: {
      flexDirection: 'row',
      gap: 14,
    },
    quickActionButton: {
      flex: 1,
    },
    quickActionCard: {
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
      shadowColor: theme.dark ? COLORS.neutral.white : COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.05 : 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    quickActionCardPressed: {
      transform: [{ scale: 0.96 }],
      opacity: 0.8,
    },
    quickActionIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    quickActionIconBlue: {
      backgroundColor: COLORS.primary.alpha10,
    },
    quickActionIconGreen: {
      backgroundColor: COLORS.success.alpha10,
    },
    quickActionIconOrange: {
      backgroundColor: COLORS.warning.alpha10,
    },
    quickActionIconPink: {
      backgroundColor: COLORS.pink.alpha10,
    },
    quickActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurface,
      textAlign: 'center',
      letterSpacing: 0.2,
    },
    disabledText: {
      opacity: 0.4,
    },
    // Settings Card
    settingsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
      shadowColor: theme.dark ? COLORS.neutral.white : COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.05 : 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 18,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : COLORS.neutral.gray100,
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    settingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 18,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : COLORS.neutral.gray100,
    },
    settingButtonPressed: {
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : COLORS.neutral.gray50,
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    settingIconOrange: {
      backgroundColor: COLORS.warning.alpha10,
    },
    settingText: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    settingDesc: {
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    settingArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : COLORS.neutral.gray100,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
    },
    // Budget Card
    budgetCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
      shadowColor: theme.dark ? COLORS.neutral.white : COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.dark ? 0.05 : 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
    budgetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    budgetLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.2,
    },
    budgetEditButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : COLORS.neutral.gray100,
    },
    budgetEditText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
      letterSpacing: 0.2,
    },
    budgetValue: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 20,
      letterSpacing: 0.5,
    },
    budgetProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      marginBottom: 12,
    },
    progressBar: {
      flex: 1,
      height: 10,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray200,
      borderRadius: 5,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 5,
    },
    progressFillSuccess: {
      backgroundColor: COLORS.success.main,
    },
    progressFillDanger: {
      backgroundColor: COLORS.danger.main,
    },
    budgetPercentage: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: 0.2,
    },
    budgetNote: {
      fontSize: 13,
      fontWeight: '500',
      letterSpacing: 0.1,
    },
    // Danger Card
    dangerCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: COLORS.danger.alpha20,
      shadowColor: COLORS.danger.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 3,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      gap: 14,
    },
    dangerButtonPressed: {
      backgroundColor: theme.dark ? 'rgba(239, 68, 68, 0.05)' : COLORS.danger.alpha10,
    },
    dangerIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: theme.dark ? 'rgba(239, 68, 68, 0.1)' : COLORS.danger.alpha10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerButtonText: {
      flex: 1,
    },
    dangerSectionTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: COLORS.danger.main,
      letterSpacing: 0.3,
    },
    dangerButtonLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.warning.main,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    dangerButtonLabelRed: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.danger.main,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    dangerButtonDesc: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.1,
    },
    dangerArrow: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.dark ? 'rgba(239, 68, 68, 0.1)' : COLORS.danger.alpha10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 24,
      padding: 28,
      shadowColor: COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 16,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 24,
      textAlign: 'center',
      letterSpacing: 0.3,
    },
    modalInput: {
      borderWidth: 2,
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 16,
      fontSize: 17,
      fontWeight: '600',
      marginBottom: 24,
      color: theme.colors.onSurface,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : COLORS.neutral.gray50,
      borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : COLORS.neutral.gray200,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 14,
    },
    modalCancelButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : COLORS.neutral.gray100,
      alignItems: 'center',
      shadowColor: COLORS.neutral.gray900,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 1,
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.3,
    },
    modalSaveButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    modalSaveText: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.neutral.white,
      letterSpacing: 0.3,
    },
  });
