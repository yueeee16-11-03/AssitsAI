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
  const surfaceStyle = { backgroundColor: theme.colors.surface, borderColor };
  const dangerBorder = theme.dark ? 'rgba(239,68,68,0.24)' : 'rgba(239,68,68,0.12)';
  const dangerStyle = { backgroundColor: theme.colors.surface, borderColor: dangerBorder };
  const smallButtonBg = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,137,123,0.08)';
  const dangerColor = theme.colors.error ?? '#EF4444';
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
              <Icon name="palette-outline" size={18} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
            </View>

            <View style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.primary }]}>{t('settings.darkMode')}</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.onSurface }]}>{t('settings.darkModeDesc')}</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.language')}</Text>
                <Text style={styles.settingDescription}>
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
                      <Text style={[styles.languageDropdownText, { color: theme.colors.onSurface }]}>Tiếng Việt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.languageDropdownItem} onPress={async () => { try { await i18n.changeLanguage('en'); setLanguage('en'); } catch (err) { console.warn(err); } setLanguageModalVisible(false); }}>
                      <Text style={[styles.languageDropdownText, { color: theme.colors.onSurface }]}>English</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="bell-outline" size={18} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
            </View>

            <View style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.primary }]}>{t('settings.enableNotifications')}</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.onSurface }]}>{t('settings.enableNotificationsDesc')}</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                thumbColor="#00897B"
              />
            </View>

            {notifications && (
              <>
                <View style={[styles.subSettingRow, surfaceStyle]}>
                  <Text style={[styles.subSettingLabel, { color: theme.colors.onSurface }]}>{t('settings.notificationDaily')}</Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                    thumbColor="#00897B"
                  />
                </View>

                <View style={[styles.subSettingRow, surfaceStyle]}>
                  <Text style={[styles.subSettingLabel, { color: theme.colors.onSurface }]}>{t('settings.notificationBudget')}</Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                    thumbColor="#00897B"
                  />
                </View>

                <View style={[styles.subSettingRow, surfaceStyle]}>
                  <Text style={styles.subSettingLabel}>{t('settings.notificationAI')}</Text>
                  <Switch
                    value={false}
                    onValueChange={() => {}}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                    thumbColor="#00897B"
                  />
                </View>
              </>
            )}
          </View>



          {/* Finance Management */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="credit-card-outline" size={18} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{t('settings.walletManagement')}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("WalletManagement")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.walletManagement')}</Text>
                <Text style={styles.settingDescription}>{t('settings.walletManagementDesc')}</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("CategoryManagement")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.categories')}</Text>
                <Text style={styles.settingDescription}>Tùy chỉnh danh mục chi tiêu</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("RecurringTransactions")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.recurringTransactions')}</Text>
                <Text style={styles.settingDescription}>Quản lý hóa đơn & thu nhập định kỳ</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Data & Security */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="lock-outline" size={18} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>{t('settings.dataSecurity') /* key should be added in i18n if missing */}</Text>
            </View>

            <View style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.autoBackup')}</Text>
                <Text style={styles.settingDescription}>{t('settings.autoBackupDesc')}</Text>
              </View>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                thumbColor="#00897B"
              />
            </View>

            <View style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.biometricAuth')}</Text>
                <Text style={styles.settingDescription}>{t('settings.biometricDesc')}</Text>
              </View>
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                thumbColor="#00897B"
              />
            </View>

            <TouchableOpacity style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.exportData')}</Text>
                <Text style={styles.settingDescription}>Tải về file CSV/JSON</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="information-outline" size={18} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
            </View>

            <TouchableOpacity style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.version')}</Text>
                <Text style={styles.settingDescription}>1.0.0 (Build 100)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("About")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.about')}</Text>
                <Text style={styles.settingDescription}>Team, tính năng, liên hệ</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("HelpCenter")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.helpCenter')}</Text>
                <Text style={styles.settingDescription}>FAQ & Hướng dẫn sử dụng</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.terms')}</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('settings.privacy')}</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            {/* Test Gemini API button removed */}

            <TouchableOpacity style={[styles.dangerButton, styles.dangerButtonCompact, dangerStyle]} onPress={handleClearCache}>
              <View style={styles.dangerRow}>
                <Icon name="trash-can-outline" size={16} color={dangerColor} style={styles.dangerIcon} />
                <Text style={[styles.dangerButtonText, { color: dangerColor }]}>{t('settings.clearCache')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.dangerButton, styles.dangerButtonCompact, dangerStyle]} onPress={handleResetSettings}>
              <View style={styles.dangerRow}>
                <Icon name="restore" size={16} color={dangerColor} style={styles.dangerIcon} />
                <Text style={[styles.dangerButtonText, { color: dangerColor }]}>{t('settings.resetSettings')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0, 137, 123, 0.08)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  placeholder: { width: 40 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B" },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionIcon: { marginRight: 8 },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "700", color: "#00796B", marginBottom: 4 },
  settingDescription: { fontSize: 13, color: "#999999" },
  chevron: { fontSize: 20, color: "#999999", marginLeft: 12 },
  languageToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0, 137, 123, 0.12)", alignItems: "center", justifyContent: "center" },
  languageText: { fontSize: 24 },
  languageDropdownWrap: { position: 'absolute', top: 44, right: 0, minWidth: 140, borderRadius: 8, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 8, zIndex: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  languageDropdownItem: { paddingVertical: 10, paddingHorizontal: 12 },
  languageDropdownText: { fontSize: 15 },
  languageButtonWrap: { position: 'relative' },
  subSettingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, padding: 10, marginBottom: 8, marginLeft: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" },
  subSettingLabel: { fontSize: 14, fontWeight: "600", color: "#00796B" },
  aiModeSelector: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" },
  aiModeLabel: { fontSize: 14, fontWeight: "700", color: "#00796B", marginBottom: 12 },
  aiModeButtons: { flexDirection: "row", gap: 8, marginBottom: 12 },
  aiModeButton: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 8, paddingVertical: 10, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  aiModeButtonActive: { borderColor: "#06B6D4", backgroundColor: "rgba(6,182,212,0.1)" },
  aiModeButtonText: { fontSize: 14, fontWeight: "700", color: "#999999" },
  aiModeButtonTextActive: { color: "#FFFFFF" },
  aiModeDescription: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 18 },
  dangerButton: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center", marginBottom: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.12)" },
  dangerButtonCompact: { paddingVertical: 8, paddingHorizontal: 12 },
  dangerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  dangerIcon: { marginRight: 8 },
  dangerButtonText: { color: "#EF4444", fontWeight: "700", fontSize: 14 },
});
