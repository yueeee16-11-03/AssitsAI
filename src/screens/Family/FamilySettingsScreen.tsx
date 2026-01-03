import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

export default function FamilySettingsScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    approvalRequired: true,
    monthlyReport: true,
    publicProfile: false,
    spendingAlert: true,
  });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const mockFamilyInfo = {
    name: 'Gia đình Nguyễn',
    createdDate: '2024-01-01',
    memberCount: 4,
    monthlyBudget: 50000000,
  };

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
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Family Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="home-group" size={32} color={theme.colors.primary} />
              <View style={styles.infoText}>
                <Text style={styles.infoTitle}>{mockFamilyInfo.name}</Text>
                <Text style={styles.infoSubtitle}>
                  Tạo ngày: {mockFamilyInfo.createdDate}
                </Text>
              </View>
            </View>
            <View style={styles.infoStats}>
              <View style={styles.infoStatItem}>
                <Text style={styles.infoStatLabel}>Thành viên</Text>
                <Text style={styles.infoStatValue}>
                  {mockFamilyInfo.memberCount}
                </Text>
              </View>
              <View style={styles.infoStatDivider} />
              <View style={styles.infoStatItem}>
                <Text style={styles.infoStatLabel}>Ngân sách tháng</Text>
                <Text style={styles.infoStatValue}>
                  ₫{(mockFamilyInfo.monthlyBudget / 1000000).toFixed(0)}M
                </Text>
              </View>
            </View>
          </View>

          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông báo</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon
                  name="bell"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.settingIcon}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Bật thông báo</Text>
                  <Text style={styles.settingDesc}>
                    Nhận thông báo về giao dịch gia đình
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={() => handleToggle('notifications')}
                trackColor={{
                  false: theme.dark
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.1)',
                  true: `${theme.colors.secondary}40`,
                }}
                thumbColor={settings.notifications ? theme.colors.secondary : '#ccc'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon
                  name="alert-circle"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.settingIcon}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Cảnh báo chi tiêu</Text>
                  <Text style={styles.settingDesc}>
                    Cảnh báo khi sắp vượt quá ngân sách
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.spendingAlert}
                onValueChange={() => handleToggle('spendingAlert')}
                trackColor={{
                  false: theme.dark
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.1)',
                  true: `${theme.colors.secondary}40`,
                }}
                thumbColor={settings.spendingAlert ? theme.colors.secondary : '#ccc'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon
                  name="calendar"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.settingIcon}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Báo cáo hàng tháng</Text>
                  <Text style={styles.settingDesc}>
                    Nhận báo cáo tài chính cuối tháng
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.monthlyReport}
                onValueChange={() => handleToggle('monthlyReport')}
                trackColor={{
                  false: theme.dark
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.1)',
                  true: `${theme.colors.secondary}40`,
                }}
                thumbColor={settings.monthlyReport ? theme.colors.secondary : '#ccc'}
              />
            </View>
          </View>

          {/* Privacy & Control */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quyền riêng tư & điều khiển</Text>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon
                  name="check-circle"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.settingIcon}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Yêu cầu phê duyệt</Text>
                  <Text style={styles.settingDesc}>
                    Giao dịch lớn cần được chủ gia đình phê duyệt
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.approvalRequired}
                onValueChange={() => handleToggle('approvalRequired')}
                trackColor={{
                  false: theme.dark
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.1)',
                  true: `${theme.colors.secondary}40`,
                }}
                thumbColor={settings.approvalRequired ? theme.colors.secondary : '#ccc'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Icon
                  name="account-eye"
                  size={24}
                  color={theme.colors.primary}
                  style={styles.settingIcon}
                />
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Hồ sơ công khai</Text>
                  <Text style={styles.settingDesc}>
                    Cho phép người khác tìm gia đình của bạn
                  </Text>
                </View>
              </View>
              <Switch
                value={settings.publicProfile}
                onValueChange={() => handleToggle('publicProfile')}
                trackColor={{
                  false: theme.dark
                    ? 'rgba(255,255,255,0.2)'
                    : 'rgba(0,0,0,0.1)',
                  true: `${theme.colors.secondary}40`,
                }}
                thumbColor={settings.publicProfile ? theme.colors.secondary : '#ccc'}
              />
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
              Vùng nguy hiểm
            </Text>

            <Pressable
              style={styles.dangerButton}
              onPress={() =>
                Alert.alert(
                  'Xóa gia đình',
                  'Hành động này không thể hoàn tác. Tất cả dữ liệu sẽ bị xóa.',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: () =>
                        Alert.alert('Thành công', 'Gia đình đã được xóa'),
                    },
                  ]
                )
              }
            >
              <Icon
                name="trash-can"
                size={24}
                color="#EF4444"
                style={styles.dangerIcon}
              />
              <Text style={styles.dangerButtonText}>Xóa gia đình</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    infoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    infoText: {
      marginLeft: 12,
      flex: 1,
    },
    infoTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    infoSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    infoStats: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    infoStatItem: {
      flex: 1,
      alignItems: 'center',
    },
    infoStatLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    infoStatValue: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    infoStatDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    settingInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingText: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 2,
    },
    settingDesc: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      borderRadius: 12,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    dangerIcon: {
      marginRight: 8,
    },
    dangerButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#EF4444',
    },
  });
