import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, any>;

interface SecuritySettings {
  appLockEnabled: boolean;
  lockMethod: 'pin' | 'pattern' | 'biometric';
  autoLockTimeout: number; // Minutes
  biometricEnabled: boolean;
  hideBalanceInNotifications: boolean;
  hideInAppSwitcher: boolean;
  requireAuthForWallet: boolean;
  autoBackup: boolean;
  clearDataOnLogout: boolean;
  twoFactorEnabled: boolean;
}

const LOCK_TIMEOUT_OPTIONS = [
  { value: 0, label: 'Ngay lập tức' },
  { value: 1, label: '1 phút' },
  { value: 5, label: '5 phút' },
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
];

const LOCK_METHOD_OPTIONS = [
  { key: 'pin', label: 'Mã PIN', icon: '🔢', description: 'Mã PIN 4-6 chữ số' },
  { key: 'pattern', label: 'Hình vẽ', icon: '⭕', description: 'Vẽ hình để mở khóa' },
  { key: 'biometric', label: 'Sinh trắc học', icon: '👆', description: 'Vân tay / Face ID' },
];

export default function SecuritySettingsScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [settings, setSettings] = useState<SecuritySettings>({
    appLockEnabled: false,
    lockMethod: 'pin',
    autoLockTimeout: 5,
    biometricEnabled: false,
    hideBalanceInNotifications: true,
    hideInAppSwitcher: true,
    requireAuthForWallet: false,
    autoBackup: true,
    clearDataOnLogout: false,
    twoFactorEnabled: false,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleToggleSetting = (key: keyof SecuritySettings) => {
    if (key === 'appLockEnabled' && !settings.appLockEnabled) {
      // When enabling app lock, navigate to setup PIN
      Alert.alert(
        'Thiết lập khóa ứng dụng',
        'Bạn cần thiết lập mã PIN để bảo vệ ứng dụng',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Thiết lập',
            onPress: () => {
              navigation.navigate('SetupPin');
            }
          }
        ]
      );
      return;
    }

    if (key === 'biometricEnabled' && !settings.biometricEnabled) {
      Alert.alert(
        'Kích hoạt sinh trắc học',
        'Bạn có muốn sử dụng vân tay hoặc Face ID để mở khóa ứng dụng?',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Kích hoạt',
            onPress: () => {
              setSettings(prev => ({ ...prev, [key]: !prev[key] }));
            }
          }
        ]
      );
      return;
    }

    if (key === 'twoFactorEnabled' && !settings.twoFactorEnabled) {
      navigation.navigate('TwoFactorAuth');
      return;
    }

    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChangeLockMethod = (method: 'pin' | 'pattern' | 'biometric') => {
    if (method === 'pin') {
      navigation.navigate('SetupPin');
    } else if (method === 'biometric') {
      Alert.alert(
        'Sinh trắc học',
        'Tính năng sinh trắc học sẽ được kích hoạt cùng với mã PIN làm phương án dự phòng.',
        [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Tiếp tục',
            onPress: () => {
              setSettings(prev => ({ 
                ...prev, 
                lockMethod: method,
                biometricEnabled: true 
              }));
            }
          }
        ]
      );
    } else {
      setSettings(prev => ({ ...prev, lockMethod: method }));
    }
  };

  const handleChangeTimeout = (timeout: number) => {
    setSettings(prev => ({ ...prev, autoLockTimeout: timeout }));
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Đăng xuất tất cả thiết bị',
      'Thao tác này sẽ đăng xuất tài khoản khỏi tất cả thiết bị khác. Bạn có chắc chắn?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Thành công', 'Đã đăng xuất khỏi tất cả thiết bị khác');
          }
        }
      ]
    );
  };

  const handleViewLoginHistory = () => {
    navigation.navigate('LoginHistory');
  };

  const handleBackupNow = () => {
    Alert.alert(
      'Sao lưu dữ liệu',
      'Bạn có muốn sao lưu dữ liệu ngay bây giờ?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Sao lưu',
          onPress: () => {
            Alert.alert('Đang sao lưu...', 'Dữ liệu đang được sao lưu an toàn');
          }
        }
      ]
    );
  };

  const renderSettingSection = (title: string, children: React.ReactNode) => (
    <View style={styles.settingSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderSettingItem = (
    title: string, 
    subtitle: string, 
    value: boolean, 
    onToggle: () => void,
    icon?: string,
    disabled?: boolean
  ) => (
    <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
      <View style={styles.settingInfo}>
        {icon && <Text style={styles.settingIcon}>{icon}</Text>}
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, disabled && styles.disabledText]}>{title}</Text>
          <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: '#374151', true: '#6366F1' }}
        thumbColor={value ? '#FFFFFF' : '#9CA3AF'}
      />
    </View>
  );

  const renderActionItem = (
    title: string,
    subtitle: string,
    onPress: () => void,
    icon: string,
    danger?: boolean
  ) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingIcon}>{icon}</Text>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
          <Text style={[styles.settingSubtitle, danger && styles.dangerSubtext]}>{subtitle}</Text>
        </View>
      </View>
      <Text style={[styles.actionArrow, danger && styles.dangerText]}>→</Text>
    </TouchableOpacity>
  );

  const renderLockMethodSelector = () => (
    <View style={styles.lockMethodContainer}>
      <Text style={styles.lockMethodTitle}>Phương thức khóa</Text>
      <View style={styles.lockMethodOptions}>
        {LOCK_METHOD_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.lockMethodOption,
              settings.lockMethod === option.key && styles.lockMethodOptionSelected,
              !settings.appLockEnabled && styles.lockMethodOptionDisabled
            ]}
            onPress={() => settings.appLockEnabled && handleChangeLockMethod(option.key as any)}
            disabled={!settings.appLockEnabled}
          >
            <Text style={styles.lockMethodIcon}>{option.icon}</Text>
            <Text style={[
              styles.lockMethodLabel,
              !settings.appLockEnabled && styles.disabledText
            ]}>
              {option.label}
            </Text>
            <Text style={[
              styles.lockMethodDescription,
              !settings.appLockEnabled && styles.disabledText
            ]}>
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTimeoutSelector = () => (
    <View style={styles.timeoutContainer}>
      <Text style={styles.timeoutTitle}>Tự động khóa sau</Text>
      <View style={styles.timeoutOptions}>
        {LOCK_TIMEOUT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.timeoutOption,
              settings.autoLockTimeout === option.value && styles.timeoutOptionSelected,
              !settings.appLockEnabled && styles.timeoutOptionDisabled
            ]}
            onPress={() => settings.appLockEnabled && handleChangeTimeout(option.value)}
            disabled={!settings.appLockEnabled}
          >
            <Text style={[
              styles.timeoutLabel,
              !settings.appLockEnabled && styles.disabledText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bảo mật</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Security Status */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusIcon}>🛡️</Text>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Trạng thái bảo mật</Text>
            <Text style={[
              styles.statusLevel,
              { color: settings.appLockEnabled ? '#10B981' : '#F59E0B' }
            ]}>
              {settings.appLockEnabled ? 'Đã bảo vệ' : 'Cần cải thiện'}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusStats}>
          <View style={styles.statusStat}>
            <Text style={styles.statusStatNumber}>
              {Object.values(settings).filter(Boolean).length}
            </Text>
            <Text style={styles.statusStatLabel}>Tính năng đã bật</Text>
          </View>
          <View style={styles.statusStat}>
            <Text style={styles.statusStatNumber}>
              {settings.appLockEnabled ? '🔒' : '🔓'}
            </Text>
            <Text style={styles.statusStatLabel}>Khóa ứng dụng</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Lock Section */}
        {renderSettingSection('Khóa ứng dụng', (
          <>
            {renderSettingItem(
              'Khóa ứng dụng',
              'Yêu cầu xác thực khi mở ứng dụng',
              settings.appLockEnabled,
              () => handleToggleSetting('appLockEnabled'),
              '🔐'
            )}
            
            {settings.appLockEnabled && (
              <>
                {renderLockMethodSelector()}
                {renderTimeoutSelector()}
                {renderSettingItem(
                  'Sinh trắc học',
                  'Sử dụng vân tay hoặc Face ID',
                  settings.biometricEnabled,
                  () => handleToggleSetting('biometricEnabled'),
                  '👆',
                  !settings.appLockEnabled
                )}
              </>
            )}
          </>
        ))}

        {/* Privacy Section */}
        {renderSettingSection('Quyền riêng tư', (
          <>
            {renderSettingItem(
              'Ẩn số dư trong thông báo',
              'Không hiển thị số tiền trong notification',
              settings.hideBalanceInNotifications,
              () => handleToggleSetting('hideBalanceInNotifications'),
              '🔔'
            )}
            {renderSettingItem(
              'Ẩn trong App Switcher',
              'Che màn hình khi chuyển ứng dụng',
              settings.hideInAppSwitcher,
              () => handleToggleSetting('hideInAppSwitcher'),
              '📱'
            )}
            {renderSettingItem(
              'Yêu cầu xác thực cho ví',
              'Xác thực khi xem thông tin ví cá nhân',
              settings.requireAuthForWallet,
              () => handleToggleSetting('requireAuthForWallet'),
              '👛'
            )}
          </>
        ))}

        {/* Advanced Security */}
        {renderSettingSection('Bảo mật nâng cao', (
          <>
            {renderSettingItem(
              'Xác thực 2 lớp (2FA)',
              'Bảo mật bổ sung với SMS/Email',
              settings.twoFactorEnabled,
              () => handleToggleSetting('twoFactorEnabled'),
              '🔑'
            )}
            {renderActionItem(
              'Lịch sử đăng nhập',
              'Xem các lần đăng nhập gần đây',
              handleViewLoginHistory,
              '📊'
            )}
            {renderActionItem(
              'Đăng xuất tất cả thiết bị',
              'Đăng xuất khỏi các thiết bị khác',
              handleLogoutAllDevices,
              '🚪',
              true
            )}
          </>
        ))}

        {/* Data Protection */}
        {renderSettingSection('Bảo vệ dữ liệu', (
          <>
            {renderSettingItem(
              'Sao lưu tự động',
              'Tự động sao lưu dữ liệu được mã hóa',
              settings.autoBackup,
              () => handleToggleSetting('autoBackup'),
              '☁️'
            )}
            {renderActionItem(
              'Sao lưu ngay',
              'Sao lưu dữ liệu thủ công',
              handleBackupNow,
              '💾'
            )}
            {renderSettingItem(
              'Xóa dữ liệu khi đăng xuất',
              'Xóa dữ liệu local khi logout',
              settings.clearDataOnLogout,
              () => handleToggleSetting('clearDataOnLogout'),
              '🗑️'
            )}
          </>
        ))}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Security Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>💡 Mẹo bảo mật</Text>
        <Text style={styles.tipsText}>
          Kích hoạt khóa ứng dụng và 2FA để bảo vệ tối đa tài chính của bạn
        </Text>
      </View>

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusLevel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusStat: {
    alignItems: 'center',
  },
  statusStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statusStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sectionContent: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  disabledText: {
    opacity: 0.5,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionArrow: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 'bold',
  },
  dangerText: {
    color: '#EF4444',
  },
  dangerSubtext: {
    color: 'rgba(239, 68, 68, 0.6)',
  },
  lockMethodContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  lockMethodTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  lockMethodOptions: {
    gap: 8,
  },
  lockMethodOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  lockMethodOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  lockMethodOptionDisabled: {
    opacity: 0.5,
  },
  lockMethodIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  lockMethodLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  lockMethodDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  timeoutContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  timeoutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  timeoutOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeoutOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  timeoutOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  timeoutOptionDisabled: {
    opacity: 0.5,
  },
  timeoutLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  tipsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  bottomSpace: {
    height: 100,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  decorativeCircle1: {
    width: 200,
    height: 200,
    backgroundColor: '#6366F1',
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    width: 150,
    height: 150,
    backgroundColor: '#EC4899',
    bottom: -75,
    left: -75,
  },
});