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

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  
  // Settings state
  // Use global theme provider
  // const [darkMode, setDarkMode] = useState(true);
  const { isDark, setIsDark } = React.useContext(ThemeContext);
  const theme = useTheme();
  const borderColor = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const surfaceStyle = { backgroundColor: theme.colors.surface, borderColor };
  const dangerStyle = { backgroundColor: theme.colors.surface, borderColor: 'rgba(239,68,68,0.12)' };
  const smallButtonBg = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,137,123,0.08)';
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [notifications, setNotifications] = useState(true);
  // AI mode state removed (section removed)
  // const [aiMode, setAIMode] = useState<"basic" | "advanced">("advanced");
  const [autoBackup, setAutoBackup] = useState(true);
  const [biometric, setBiometric] = useState(false);

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
      <View style={[styles.header, { backgroundColor: theme.colors.surface }] }>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: smallButtonBg }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Cài đặt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Appearance */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="palette-outline" size={18} color="#00796B" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Giao diện</Text>
            </View>

            <View style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.primary }]}>Chế độ tối</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.onSurface }]}>Giao diện tối dễ nhìn hơn</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={setIsDark}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Ngôn ngữ</Text>
                <Text style={styles.settingDescription}>
                  {language === "vi" ? "Tiếng Việt" : "English"}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.languageToggle, { backgroundColor: smallButtonBg }]}
                onPress={() => setLanguage(language === "vi" ? "en" : "vi")}
              >
                <Text style={styles.languageText}>
                  {language === "vi" ? "🇻🇳" : "🇬🇧"}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Notifications */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="bell-outline" size={18} color="#00796B" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Thông báo</Text>
            </View>

            <View style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: theme.colors.primary }]}>Bật thông báo</Text>
                <Text style={[styles.settingDescription, { color: theme.colors.onSurface }]}>Nhận nhắc nhở và cập nhật</Text>
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
                  <Text style={[styles.subSettingLabel, { color: theme.colors.onSurface }]}>Thói quen hàng ngày</Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                    thumbColor="#00897B"
                  />
                </View>

                <View style={[styles.subSettingRow, surfaceStyle]}>
                  <Text style={[styles.subSettingLabel, { color: theme.colors.onSurface }]}>Nhắc nhở ngân sách</Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                    thumbColor="#00897B"
                  />
                </View>

                <View style={[styles.subSettingRow, surfaceStyle]}>
                  <Text style={styles.subSettingLabel}>Cập nhật từ AI</Text>
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
              <Icon name="credit-card-outline" size={18} color="#00796B" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Quản lý tài chính</Text>
            </View>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("WalletManagement")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Quản lý ví</Text>
                <Text style={styles.settingDescription}>Thêm, sửa, xóa ví & tài khoản</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("CategoryManagement")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Danh mục chi tiêu</Text>
                <Text style={styles.settingDescription}>Tùy chỉnh danh mục chi tiêu</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("RecurringTransactions")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Giao dịch lặp lại</Text>
                <Text style={styles.settingDescription}>Quản lý hóa đơn & thu nhập định kỳ</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Data & Security */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="lock-outline" size={18} color="#00796B" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Dữ liệu & Bảo mật</Text>
            </View>

            <View style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Tự động sao lưu</Text>
                <Text style={styles.settingDescription}>Sao lưu mỗi ngày lúc 2AM</Text>
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
                <Text style={styles.settingLabel}>Xác thực sinh học</Text>
                <Text style={styles.settingDescription}>Face ID / Touch ID</Text>
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
                <Text style={styles.settingLabel}>Xuất dữ liệu</Text>
                <Text style={styles.settingDescription}>Tải về file CSV/JSON</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="information-outline" size={18} color="#00796B" style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Thông tin</Text>
            </View>

            <TouchableOpacity style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Phiên bản</Text>
                <Text style={styles.settingDescription}>1.0.0 (Build 100)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("About")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Giới thiệu ứng dụng</Text>
                <Text style={styles.settingDescription}>Team, tính năng, liên hệ</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, surfaceStyle]}
              onPress={() => navigation.navigate("HelpCenter")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Trung tâm trợ giúp</Text>
                <Text style={styles.settingDescription}>FAQ & Hướng dẫn sử dụng</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Điều khoản dịch vụ</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingRow, surfaceStyle]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Chính sách bảo mật</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            {/* Test Gemini API button removed */}

            <TouchableOpacity style={[styles.dangerButton, styles.dangerButtonCompact, dangerStyle]} onPress={handleClearCache}>
              <View style={styles.sectionHeader}>
                <Icon name="trash-can-outline" size={16} color="#EF4444" style={styles.sectionIcon} />
                <Text style={styles.dangerButtonText}>Xóa bộ nhớ đệm</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.dangerButton, styles.dangerButtonCompact, dangerStyle]} onPress={handleResetSettings}>
              <View style={styles.sectionHeader}>
                <Icon name="restore" size={16} color="#EF4444" style={styles.sectionIcon} />
                <Text style={styles.dangerButtonText}>Đặt lại cài đặt</Text>
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
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
  dangerIcon: { marginRight: 8 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "700", color: "#00796B", marginBottom: 4 },
  settingDescription: { fontSize: 13, color: "#999999" },
  chevron: { fontSize: 20, color: "#999999", marginLeft: 12 },
  languageToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0, 137, 123, 0.12)", alignItems: "center", justifyContent: "center" },
  languageText: { fontSize: 24 },
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
  dangerButton: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.12)" },
  dangerButtonCompact: { paddingVertical: 8, paddingHorizontal: 12 },
  dangerButtonText: { color: "#EF4444", fontWeight: "700", fontSize: 14 },
});
