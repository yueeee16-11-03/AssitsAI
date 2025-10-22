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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isEditing, setIsEditing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const [profile, setProfile] = useState({
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0912345678",
    dateOfBirth: "01/01/1990",
    avatar: "👤",
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
    { label: "Mục tiêu", value: "5", icon: "🎯" },
    { label: "Thói quen", value: "8", icon: "✓" },
    { label: "Streak", value: "15", icon: "🔥" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
        >
          <Text style={styles.editText}>{isEditing ? "Lưu" : "Sửa"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{profile.avatar}</Text>
              <TouchableOpacity style={styles.cameraButton}>
                <Text style={styles.cameraIcon}>📷</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{profile.name}</Text>
            <Text style={styles.userEmail}>{profile.email}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsCard}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Họ và tên</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled]}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                editable={isEditing}
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Email</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled]}
                value={profile.email}
                onChangeText={(text) => setProfile({ ...profile, email: text })}
                editable={isEditing}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled]}
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                editable={isEditing}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Ngày sinh</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled]}
                value={profile.dateOfBirth}
                onChangeText={(text) => setProfile({ ...profile, dateOfBirth: text })}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Finance Config */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cấu hình tài chính</Text>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Thu nhập tháng</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled]}
                value={`₫${financeConfig.monthlyIncome.toLocaleString("vi-VN")}`}
                editable={isEditing}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Mục tiêu tiết kiệm (%)</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled]}
                value={`${financeConfig.savingGoal}%`}
                editable={isEditing}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Đơn vị tiền tệ</Text>
              <TextInput
                style={[styles.infoInput, !isEditing && styles.infoInputDisabled]}
                value={financeConfig.currency}
                editable={isEditing}
              />
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cài đặt</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🔔</Text>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Thông báo</Text>
                  <Text style={styles.settingDescription}>Nhận nhắc nhở và cập nhật</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🔐</Text>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Xác thực sinh học</Text>
                  <Text style={styles.settingDescription}>Face ID / Touch ID</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "#6366F1" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Quick Links */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate("AISetting")}>
              <Text style={styles.linkIcon}>🤖</Text>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>Cài đặt AI</Text>
                <Text style={styles.linkDescription}>Tùy chỉnh trợ lý AI</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate("GoalTracking")}>
              <Text style={styles.linkIcon}>🎯</Text>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>Mục tiêu của tôi</Text>
                <Text style={styles.linkDescription}>Quản lý mục tiêu cá nhân</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate("HabitDashboard")}>
              <Text style={styles.linkIcon}>✓</Text>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>Thói quen</Text>
                <Text style={styles.linkDescription}>Theo dõi thói quen hàng ngày</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
                { text: "Hủy", style: "cancel" },
                { text: "Đăng xuất", onPress: () => navigation.replace("Login") },
              ])
            }
          >
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
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
  editButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: "#6366F1" },
  editText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  content: { padding: 16 },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatarContainer: { position: "relative", marginBottom: 16 },
  avatar: { fontSize: 80, width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(99,102,241,0.2)", textAlign: "center", lineHeight: 120, borderWidth: 3, borderColor: "rgba(99,102,241,0.3)" },
  cameraButton: { position: "absolute", bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#0A0E27" },
  cameraIcon: { fontSize: 16 },
  userName: { fontSize: 24, fontWeight: "900", color: "#fff", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "rgba(255,255,255,0.6)" },
  statsCard: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, marginBottom: 24, justifyContent: "space-around" },
  statItem: { alignItems: "center" },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: "900", color: "#6366F1", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 12 },
  infoCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12 },
  infoLabel: { fontSize: 12, fontWeight: "700", color: "rgba(255,255,255,0.6)", marginBottom: 8 },
  infoInput: { fontSize: 16, fontWeight: "700", color: "#fff", padding: 0 },
  infoInputDisabled: { color: "rgba(255,255,255,0.8)" },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12 },
  settingInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  settingIcon: { fontSize: 24, marginRight: 12 },
  settingText: { flex: 1 },
  settingLabel: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 2 },
  settingDescription: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  linkCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12 },
  linkIcon: { fontSize: 28, marginRight: 12 },
  linkText: { flex: 1 },
  linkLabel: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 2 },
  linkDescription: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  linkArrow: { fontSize: 20, color: "rgba(255,255,255,0.5)" },
  logoutButton: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)" },
  logoutText: { color: "#EF4444", fontWeight: "700", fontSize: 16 },
});
