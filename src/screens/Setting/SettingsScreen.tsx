import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ThemeContext } from '../../context/ThemeProvider';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const headerPaddingTop = Math.max(8, insets.top);
  
  // Settings state
  // Use global theme provider
  // const [darkMode, setDarkMode] = useState(true);
  const { isDark, setIsDark } = React.useContext(ThemeContext);
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const borderColor = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const dangerBorder = theme.dark ? 'rgba(239,68,68,0.24)' : 'rgba(239,68,68,0.12)';
  const smallButtonBg = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.08)';
  const dangerColor = theme.colors.error ?? '#EF4444';
  const cardShadowColor = theme.dark ? '#000000' : theme.colors.primary;
  const [language, setLanguage] = useState<"vi" | "en">((i18n.language && i18n.language.startsWith('en')) ? 'en' : 'vi');
  const [notifications, setNotifications] = useState(true);
  // AI mode state removed (section removed)
  // const [aiMode, setAIMode] = useState<"basic" | "advanced">("advanced");
  const [autoBackup, setAutoBackup] = useState(true);
  const [biometric, setBiometric] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);



  const handleClearCache = () => {
    Alert.alert(
      "Xóa bộ nhớ đệm",
      "Bạn có chắc muốn xóa bộ nhớ đệm? Điều này sẽ giải phóng dung lượng nhưng có thể làm chậm ứng dụng lần đầu sử dụng.",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Xóa", onPress: () => Alert.alert("Thành công", "Đã xóa 128MB") },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      "Đặt lại cài đặt",
      "Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Đặt lại", 
          style: "destructive",
          onPress: () => {
            setIsDark(true);
            setLanguage("vi");
            setNotifications(true);
            // setAIMode("advanced"); // removed (AI settings were removed)
            setAutoBackup(true);
            setBiometric(false);
            Alert.alert("Thành công", "Đã đặt lại cài đặt");
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }] }>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, paddingTop: headerPaddingTop }] }>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: smallButtonBg }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Appearance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="palette" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{t('settings.appearance')}</Text>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.settingCardRow}>
                <View style={[styles.iconWrapper, styles.iconBgPurple]}>
                  <Icon name="theme-light-dark" size={24} color="#8B5CF6" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>{t('settings.darkMode')}</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>{t('settings.darkModeDesc')}</Text>
                </View>
                <Switch
                  value={isDark}
                  onValueChange={setIsDark}
                  trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                  thumbColor={isDark ? "#FFFFFF" : theme.dark ? "#888" : "#F3F4F6"}
                  ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                />
              </View>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.settingCardRow}>
                <View style={[styles.iconWrapper, styles.iconBgBlue]}>
                  <Icon name="translate" size={24} color="#3B82F6" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>{t('settings.language')}</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>
                    {language === "vi" ? "Tiếng Việt" : "English"}
                  </Text>
                </View>
                <View style={styles.languageButtonWrap}>
                  <TouchableOpacity
                    style={[styles.languageToggle, { backgroundColor: smallButtonBg }]}
                    onPress={() => setLanguageModalVisible(true)}
                  >
                    <Text style={styles.languageText}>
                      {language === "vi" ? "🇻🇳" : "🇬🇧"}
                    </Text>
                  </TouchableOpacity>

                  {languageModalVisible && (
                    <View style={[styles.languageDropdownWrap, { backgroundColor: theme.colors.surface, borderColor }]}>
                      <TouchableOpacity style={styles.languageDropdownItem} onPress={async () => { try { await i18n.changeLanguage('vi'); setLanguage('vi'); } catch (err) { console.warn(err); } setLanguageModalVisible(false); }}>
                        <Text style={[styles.languageDropdownText, { color: theme.colors.onSurface }]}>🇻🇳 Tiếng Việt</Text>
                      </TouchableOpacity>
                      <View style={[styles.divider, { backgroundColor: borderColor }]} />
                      <TouchableOpacity style={styles.languageDropdownItem} onPress={async () => { try { await i18n.changeLanguage('en'); setLanguage('en'); } catch (err) { console.warn(err); } setLanguageModalVisible(false); }}>
                        <Text style={[styles.languageDropdownText, { color: theme.colors.onSurface }]}>🇬🇧 English</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="bell-ring" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{t('settings.notifications')}</Text>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.settingCardRow}>
                <View style={[styles.iconWrapper, styles.iconBgGreen]}>
                  <Icon name="bell-ring" size={24} color="#10B981" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>{t('settings.enableNotifications')}</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>{t('settings.enableNotificationsDesc')}</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                  thumbColor={notifications ? "#FFFFFF" : theme.dark ? "#888" : "#F3F4F6"}
                  ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                />
              </View>
            </View>

            {notifications && (
              <View style={[styles.subSettingsContainer, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
                <View style={styles.subSettingRow}>
                  <Icon name="alarm" size={20} color={theme.colors.onSurfaceVariant} style={styles.subSettingIcon} />
                  <Text style={[styles.subSettingLabel, { color: theme.colors.onSurface }]}>{t('settings.notificationDaily')}</Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: borderColor }]} />

                <View style={styles.subSettingRow}>
                  <Icon name="wallet-outline" size={20} color={theme.colors.onSurfaceVariant} style={styles.subSettingIcon} />
                  <Text style={[styles.subSettingLabel, { color: theme.colors.onSurface }]}>{t('settings.notificationBudget')}</Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                  />
                </View>

                <View style={[styles.divider, { backgroundColor: borderColor }]} />

                <View style={styles.subSettingRow}>
                  <Icon name="robot-outline" size={20} color={theme.colors.onSurfaceVariant} style={styles.subSettingIcon} />
                  <Text style={[styles.subSettingLabel, { color: theme.colors.onSurface }]}>{t('settings.notificationAI')}</Text>
                  <Switch
                    value={false}
                    onValueChange={() => {}}
                    trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                  />
                </View>
              </View>
            )}
          </View>



          {/* Finance Management */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="wallet" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Quản lý tài chính</Text>
            </View>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}
              onPress={() => navigation.navigate("WalletManagement")}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgCyan]}>
                <Icon name="wallet" size={24} color="#06B6D4" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>{t('settings.walletManagement')}</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>{t('settings.walletManagementDesc')}</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}
              onPress={() => navigation.navigate("CategoryManagement")}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgOrange]}>
                <Icon name="shape" size={24} color="#F59E0B" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>{t('settings.categories')}</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Tùy chỉnh danh mục chi tiêu</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}
              onPress={() => navigation.navigate("RecurringTransactions")}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgPink]}>
                <Icon name="repeat" size={24} color="#EC4899" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>{t('settings.recurringTransactions')}</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Quản lý hóa đơn & thu nhập định kỳ</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Data & Security */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="shield-lock" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Dữ liệu & Bảo mật</Text>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.settingCardRow}>
                <View style={[styles.iconWrapper, styles.iconBgBlue]}>
                  <Icon name="backup-restore" size={24} color="#3B82F6" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>{t('settings.autoBackup')}</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>{t('settings.autoBackupDesc')}</Text>
                </View>
                <Switch
                  value={autoBackup}
                  onValueChange={setAutoBackup}
                  trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                  thumbColor={autoBackup ? "#FFFFFF" : theme.dark ? "#888" : "#F3F4F6"}
                  ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                />
              </View>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.settingCardRow}>
                <View style={[styles.iconWrapper, styles.iconBgOrange]}>
                  <Icon name="fingerprint" size={24} color="#F59E0B" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>{t('settings.biometricAuth')}</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>{t('settings.biometricDesc')}</Text>
                </View>
                <Switch
                  value={biometric}
                  onValueChange={setBiometric}
                  trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                  thumbColor={biometric ? "#FFFFFF" : theme.dark ? "#888" : "#F3F4F6"}
                  ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgGreen]}>
                <Icon name="download" size={24} color="#10B981" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>{t('settings.exportData')}</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Tải về file CSV/JSON</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="information" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{t('settings.about')}</Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.infoRow}>
                <View style={[styles.iconWrapper, styles.iconBgPurple]}>
                  <Icon name="information-variant" size={24} color="#8B5CF6" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>{t('settings.version')}</Text>
                  <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>1.0.0 (Build 100)</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}
              onPress={() => navigation.navigate("About")}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgBlue]}>
                <Icon name="information" size={24} color="#3B82F6" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>{t('settings.about')}</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Team, tính năng, liên hệ</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}
              onPress={() => navigation.navigate("HelpCenter")}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgGreen]}>
                <Icon name="help-circle" size={24} color="#10B981" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>{t('settings.helpCenter')}</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>FAQ & Hướng dẫn sử dụng</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgCyan]}>
                <Icon name="file-document" size={24} color="#06B6D4" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>{t('settings.terms')}</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Điều khoản sử dụng</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgOrange]}>
                <Icon name="shield-account" size={24} color="#F59E0B" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>{t('settings.privacy')}</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Chính sách bảo mật</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="alert" size={24} color={dangerColor} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: dangerColor }]}>Vùng nguy hiểm</Text>
            </View>

            <TouchableOpacity 
              style={[styles.dangerCard, { backgroundColor: theme.colors.surface, borderColor: dangerBorder, shadowColor: cardShadowColor }]} 
              onPress={handleClearCache}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgDanger]}>
                <Icon name="trash-can" size={24} color={dangerColor} />
              </View>
              <View style={styles.dangerText}>
                <Text style={[styles.dangerLabel, { color: dangerColor }]}>{t('settings.clearCache')}</Text>
                <Text style={[styles.dangerDescription, { color: theme.colors.onSurfaceVariant }]}>Xóa dữ liệu tạm thời</Text>
              </View>
              <Icon name="chevron-right" size={24} color={dangerColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.dangerCard, { backgroundColor: theme.colors.surface, borderColor: dangerBorder, shadowColor: cardShadowColor }]} 
              onPress={handleResetSettings}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrapper, styles.iconBgDanger]}>
                <Icon name="restore" size={24} color={dangerColor} />
              </View>
              <View style={styles.dangerText}>
                <Text style={[styles.dangerLabel, { color: dangerColor }]}>{t('settings.resetSettings')}</Text>
                <Text style={[styles.dangerDescription, { color: theme.colors.onSurfaceVariant }]}>Đặt lại cài đặt mặc định</Text>
              </View>
              <Icon name="chevron-right" size={24} color={dangerColor} />
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingHorizontal: 20, 
    paddingBottom: 12, 
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backIcon: { fontSize: 22, fontWeight: "bold" },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  placeholder: { width: 44 },
  content: { padding: 20 },
  
  // Section
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    marginRight: 10,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  
  // Setting Cards
  settingCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingCardRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingInfo: { flex: 1, marginRight: 12 },
  settingLabel: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  settingDescription: { 
    fontSize: 13,
    letterSpacing: 0.1,
  },
  
  // Icon Wrappers
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconBgPurple: { backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  iconBgBlue: { backgroundColor: 'rgba(59, 130, 246, 0.08)' },
  iconBgGreen: { backgroundColor: 'rgba(16, 185, 129, 0.08)' },
  iconBgOrange: { backgroundColor: 'rgba(245, 158, 11, 0.08)' },
  iconBgCyan: { backgroundColor: 'rgba(6, 182, 212, 0.08)' },
  iconBgPink: { backgroundColor: 'rgba(236, 72, 153, 0.08)' },
  iconBgDanger: { backgroundColor: 'rgba(239, 68, 68, 0.08)' },
  
  // Language Selector
  languageToggle: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  languageText: { fontSize: 24 },
  languageButtonWrap: { position: 'relative' },
  languageDropdownWrap: { 
    position: 'absolute', 
    top: 50, 
    right: 0, 
    minWidth: 160, 
    borderRadius: 12, 
    overflow: 'hidden', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 16, 
    elevation: 12, 
    zIndex: 20, 
    borderWidth: 1,
  },
  languageDropdownItem: { paddingVertical: 14, paddingHorizontal: 16 },
  languageDropdownText: { 
    fontSize: 15, 
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  // Sub Settings
  subSettingsContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  subSettingRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 10,
  },
  subSettingIcon: { marginRight: 12 },
  subSettingLabel: { 
    flex: 1,
    fontSize: 15, 
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  
  // Link Cards
  linkCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  linkText: { flex: 1 },
  linkLabel: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  linkDescription: { 
    fontSize: 13,
    letterSpacing: 0.1,
  },
  
  // Info Card
  infoCard: { 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: { 
    fontSize: 12, 
    fontWeight: "700", 
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  infoValue: { 
    fontSize: 16, 
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  
  // Danger Cards
  dangerCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    borderRadius: 16, 
    padding: 18, 
    marginBottom: 12,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerText: { flex: 1 },
  dangerLabel: { 
    fontSize: 16, 
    fontWeight: "700", 
    marginBottom: 3,
    letterSpacing: 0.2,
  },
  dangerDescription: { 
    fontSize: 13,
    letterSpacing: 0.1,
  },
  
  // Divider
  divider: {
    height: 1,
    marginVertical: 4,
  },
});
