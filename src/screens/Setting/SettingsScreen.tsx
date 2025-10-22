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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Settings state
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [notifications, setNotifications] = useState(true);
  const [aiMode, setAIMode] = useState<"basic" | "advanced">("advanced");
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
            setDarkMode(true);
            setLanguage("vi");
            setNotifications(true);
            setAIMode("advanced");
            setAutoBackup(true);
            setBiometric(false);
            Alert.alert("Thành công", "Đã đặt lại cài đặt");
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Appearance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Giao diện</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Chế độ tối</Text>
                <Text style={styles.settingDescription}>Giao diện tối dễ nhìn hơn</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Ngôn ngữ</Text>
                <Text style={styles.settingDescription}>
                  {language === "vi" ? "Tiếng Việt" : "English"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.languageToggle}
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
            <Text style={styles.sectionTitle}>🔔 Thông báo</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Bật thông báo</Text>
                <Text style={styles.settingDescription}>Nhận nhắc nhở và cập nhật</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>

            {notifications && (
              <>
                <View style={styles.subSettingRow}>
                  <Text style={styles.subSettingLabel}>Thói quen hàng ngày</Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={styles.subSettingRow}>
                  <Text style={styles.subSettingLabel}>Nhắc nhở ngân sách</Text>
                  <Switch
                    value={true}
                    onValueChange={() => {}}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={styles.subSettingRow}>
                  <Text style={styles.subSettingLabel}>Cập nhật từ AI</Text>
                  <Switch
                    value={false}
                    onValueChange={() => {}}
                    trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                    thumbColor="#fff"
                  />
                </View>
              </>
            )}
          </View>

          {/* AI Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 Trợ lý AI</Text>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => navigation.navigate("AISetting")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Cấu hình AI chi tiết</Text>
                <Text style={styles.settingDescription}>Tính cách, giọng nói, ngôn ngữ</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <View style={styles.aiModeSelector}>
              <Text style={styles.aiModeLabel}>Chế độ AI</Text>
              <View style={styles.aiModeButtons}>
                <TouchableOpacity
                  style={[styles.aiModeButton, aiMode === "basic" && styles.aiModeButtonActive]}
                  onPress={() => setAIMode("basic")}
                >
                  <Text style={[styles.aiModeButtonText, aiMode === "basic" && styles.aiModeButtonTextActive]}>
                    Cơ bản
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.aiModeButton, aiMode === "advanced" && styles.aiModeButtonActive]}
                  onPress={() => setAIMode("advanced")}
                >
                  <Text style={[styles.aiModeButtonText, aiMode === "advanced" && styles.aiModeButtonTextActive]}>
                    Nâng cao
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.aiModeDescription}>
                {aiMode === "basic" 
                  ? "AI đưa ra gợi ý đơn giản, dễ hiểu" 
                  : "AI phân tích sâu và đưa ra gợi ý chi tiết"}
              </Text>
            </View>
          </View>

          {/* Finance Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💳 Quản lý tài chính</Text>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => navigation.navigate("WalletManagement")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Quản lý ví</Text>
                <Text style={styles.settingDescription}>Thêm, sửa, xóa ví & tài khoản</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => navigation.navigate("CategoryManagement")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Danh mục chi tiêu</Text>
                <Text style={styles.settingDescription}>Tùy chỉnh danh mục chi tiêu</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
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
            <Text style={styles.sectionTitle}>🔒 Dữ liệu & Bảo mật</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Tự động sao lưu</Text>
                <Text style={styles.settingDescription}>Sao lưu mỗi ngày lúc 2AM</Text>
              </View>
              <Switch
                value={autoBackup}
                onValueChange={setAutoBackup}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Xác thực sinh học</Text>
                <Text style={styles.settingDescription}>Face ID / Touch ID</Text>
              </View>
              <Switch
                value={biometric}
                onValueChange={setBiometric}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Xuất dữ liệu</Text>
                <Text style={styles.settingDescription}>Tải về file CSV/JSON</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ℹ️ Thông tin</Text>

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Phiên bản</Text>
                <Text style={styles.settingDescription}>1.0.0 (Build 100)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => navigation.navigate("About")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Giới thiệu ứng dụng</Text>
                <Text style={styles.settingDescription}>Team, tính năng, liên hệ</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => navigation.navigate("HelpCenter")}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Trung tâm trợ giúp</Text>
                <Text style={styles.settingDescription}>FAQ & Hướng dẫn sử dụng</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Điều khoản dịch vụ</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Chính sách bảo mật</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Danger Zone */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.dangerButton} onPress={handleClearCache}>
              <Text style={styles.dangerButtonText}>🗑️ Xóa bộ nhớ đệm</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dangerButton} onPress={handleResetSettings}>
              <Text style={styles.dangerButtonText}>🔄 Đặt lại cài đặt</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E27" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  placeholder: { width: 40 },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 12 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  settingDescription: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
  chevron: { fontSize: 20, color: "rgba(255,255,255,0.5)", marginLeft: 12 },
  languageToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  languageText: { fontSize: 24 },
  subSettingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 12, marginBottom: 8, marginLeft: 16 },
  subSettingLabel: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.8)" },
  aiModeSelector: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 },
  aiModeLabel: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.8)", marginBottom: 12 },
  aiModeButtons: { flexDirection: "row", gap: 8, marginBottom: 12 },
  aiModeButton: { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, paddingVertical: 12, alignItems: "center", borderWidth: 2, borderColor: "transparent" },
  aiModeButtonActive: { borderColor: "#6366F1", backgroundColor: "rgba(99,102,241,0.1)" },
  aiModeButtonText: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.6)" },
  aiModeButtonTextActive: { color: "#fff" },
  aiModeDescription: { fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 18 },
  dangerButton: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  dangerButtonText: { color: "#EF4444", fontWeight: "700", fontSize: 15 },
});
