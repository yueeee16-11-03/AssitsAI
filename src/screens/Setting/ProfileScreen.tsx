import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type { RootStackParamList } from "../../navigation/types";
import { useTheme } from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isEditing, setIsEditing] = useState(false);
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Theme setup
  const theme = useTheme();
  const borderColor = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const borderBottomColor = borderColor;
  const secondaryBg = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,137,123,0.08)';
  const avatarBg = theme.dark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)';
  const avatarBorder = theme.dark ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.3)';
  const logoutBg = theme.dark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)';
  const logoutBorder = theme.dark ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.3)';
  const dangerColor = '#EF4444';

  const [profile, setProfile] = useState({
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0912345678",
    dateOfBirth: "01/01/1990",
    avatar: 'account-circle',
  });

  const [financeConfig, _setFinanceConfig] = useState({
    monthlyIncome: 25000000,
    savingGoal: 20,
    currency: "VND",
  });

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân");
  };

  const stats = [
    { label: "Mục tiêu", value: "5", icon: "bullseye" },
    { label: "Thói quen", value: "8", icon: "check" },
    { label: "Streak", value: "15", icon: "fire" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: secondaryBg }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Hồ sơ</Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
        >
          <Text style={styles.editText}>{isEditing ? "Lưu" : "Sửa"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatarVisual, { backgroundColor: avatarBg, borderColor: avatarBorder }]}>
                <Icon name={profile.avatar as string} size={80} color={theme.colors.primary} />
              </View>
              <TouchableOpacity style={[styles.cameraButton, { backgroundColor: theme.colors.primary, borderColor: avatarBorder }]}>
                <Icon name="camera" size={16} color={theme.colors.onSurface} style={styles.cameraIcon} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.userName, { color: theme.colors.primary }]}>{profile.name}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>{profile.email}</Text>
          </View>

          {/* Stats */}
          <View style={[styles.statsCard, { backgroundColor: secondaryBg }]}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Icon name={stat.icon as string} size={28} color={theme.colors.primary} style={styles.statIcon} />
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Thông tin cá nhân</Text>
            
            <View style={[styles.infoCard, { backgroundColor: secondaryBg }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Họ và tên</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                editable={isEditing}
              />
            </View>

            <View style={[styles.infoCard, { backgroundColor: secondaryBg }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Email</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                value={profile.email}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
                editable={isEditing}
                keyboardType="email-address"
              />
            </View>

            <View style={[styles.infoCard, { backgroundColor: secondaryBg }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Số điện thoại</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.infoCard, { backgroundColor: secondaryBg }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Ngày sinh</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                value={profile.dateOfBirth}
                onChangeText={(text) => setProfile({ ...profile, dateOfBirth: text })}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Finance Config */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Cấu hình tài chính</Text>

            <View style={[styles.infoCard, { backgroundColor: secondaryBg }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Thu nhập tháng</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                value={`₫${financeConfig.monthlyIncome.toLocaleString("vi-VN")}`}
                editable={isEditing}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.infoCard, { backgroundColor: secondaryBg }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Mục tiêu tiết kiệm (%)</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                value={`${financeConfig.savingGoal}%`}
                editable={isEditing}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.infoCard, { backgroundColor: secondaryBg }]}>
              <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Đơn vị tiền tệ</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                value={financeConfig.currency}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Cài đặt</Text>

            <View style={[styles.settingRow, { backgroundColor: secondaryBg }]}>
              <View style={styles.settingInfo}>
                <Icon name="bell-outline" size={20} color={theme.colors.onSurface} style={styles.settingIcon} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Thông báo</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>Nhận nhắc nhở và cập nhật</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                thumbColor="#00897B"
              />
            </View>

            <View style={[styles.settingRow, { backgroundColor: secondaryBg }]}>
              <View style={styles.settingInfo}>
                <Icon name="lock-outline" size={20} color={theme.colors.onSurface} style={styles.settingIcon} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Xác thực sinh học</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>Face ID / Touch ID</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#06B6D4" }}
                thumbColor="#00897B"
              />
            </View>
          </View>

          {/* Quick Links */}
          <View style={styles.section}>
            <TouchableOpacity style={[styles.linkCard, { backgroundColor: secondaryBg }]} onPress={() => navigation.navigate("AISetting")}>
              <Icon name="robot" size={28} color={theme.colors.primary} style={styles.linkIcon} />
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>Cài đặt AI</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Tùy chỉnh trợ lý AI</Text>
              </View>
              <Text style={[styles.linkArrow, { color: theme.colors.onSurfaceVariant }]}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.linkCard, { backgroundColor: secondaryBg }]} onPress={() => navigation.navigate("GoalTracking")}>
              <Icon name="bullseye" size={28} color={theme.colors.primary} style={styles.linkIcon} />
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>Mục tiêu của tôi</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Quản lý mục tiêu cá nhân</Text>
              </View>
              <Text style={[styles.linkArrow, { color: theme.colors.onSurfaceVariant }]}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.linkCard, { backgroundColor: secondaryBg }]} onPress={() => navigation.navigate("HabitDashboard")}>
              <Icon name="check" size={28} color={theme.colors.primary} style={styles.linkIcon} />
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>Thói quen</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Theo dõi thói quen hàng ngày</Text>
              </View>
              <Text style={[styles.linkArrow, { color: theme.colors.onSurfaceVariant }]}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: logoutBg, borderColor: logoutBorder }]}
            onPress={() =>
              Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
                { text: "Hủy", style: "cancel" },
                { text: "Đăng xuất", onPress: () => navigation.replace("Login") },
              ])
            }
          >
            <Text style={[styles.logoutText, { color: dangerColor }]}>Đăng xuất</Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20 },
  headerTitle: { fontSize: 18, fontWeight: "800" },
  editButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  editText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  content: { padding: 16 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: { fontSize: 80, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(99,102,241,0.2)", textAlign: "center", lineHeight: 120, borderWidth: 3, borderColor: "rgba(99,102,241,0.3)" },
  avatarVisual: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  cameraButton: { position: "absolute", bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 3 },
  cameraIcon: { fontSize: 16 },
  userName: { fontSize: 24, fontWeight: "900", marginBottom: 4 },
  userEmail: { fontSize: 14 },
  statsCard: { borderRadius: 16, padding: 20, marginBottom: 24, justifyContent: "space-around", flexDirection: "row" },
  statItem: { alignItems: "center" },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: "900", marginBottom: 4 },
  statLabel: { fontSize: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12 },
  infoCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  infoLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  infoInput: { fontSize: 16, fontWeight: "700", padding: 0 },
  infoInputDisabled: { opacity: 0.6 },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, padding: 16, marginBottom: 12 },
  settingInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingIcon: { fontSize: 24, marginRight: 12 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  settingDescription: { fontSize: 12 },
  linkCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, padding: 16, marginBottom: 12 },
  linkIcon: { fontSize: 28, marginRight: 12 },
  linkText: { flex: 1 },
  linkLabel: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  linkDescription: { fontSize: 12 },
  linkArrow: { fontSize: 20 },
  logoutButton: { borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1 },
  logoutText: { fontWeight: "700", fontSize: 16 },
});
