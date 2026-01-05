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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { RootStackParamList } from "../../navigation/types";
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/userStore';

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const headerPaddingTop = Math.max(8, insets.top);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  
  // Theme setup
  const theme = useTheme();
  const { t } = useTranslation();
  const borderColor = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const borderBottomColor = borderColor;
  const secondaryBg = theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,137,123,0.08)';
  const avatarBg = theme.dark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)';
  const avatarBorder = theme.dark ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.3)';
  const logoutBg = theme.colors.surface;
  const logoutBorder = 'rgba(239,68,68,0.12)';
  const dangerColor = '#EF4444';
  const avatarBgColor = theme.dark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.06)';
  const cardShadowColor = theme.dark ? '#000000' : theme.colors.primary;

  const [profile, setProfile] = useState({
    name: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phone: "0912345678",
    dateOfBirth: "01/01/1990",
    avatar: 'account',
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

  // Load authenticated user's profile from Firestore (if available)
  const [_loadingProfile, setLoadingProfile] = useState(true);
  React.useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      try {
        const current = auth().currentUser;
        if (!current) {
          setLoadingProfile(false);
          return;
        }
        const doc = await firestore().collection('users').doc(current.uid).get();
        if (!mounted) return;
        if (doc && typeof doc.exists === 'function' ? doc.exists() : doc.exists) {
          const data = doc.data ? (doc.data() || {}) : {};
          // Only use photoURL if it's an icon name, not a URL
          const avatarIcon = (data.photoURL && !data.photoURL.startsWith('http')) 
            ? data.photoURL 
            : 'account';
          setProfile(prev => ({
            ...prev,
            name: data.name || current.displayName || prev.name,
            email: data.email || current.email || prev.email,
            phone: data.phoneNumber || prev.phone,
            avatar: avatarIcon,
            dateOfBirth: data.dateOfBirth || prev.dateOfBirth,
          }));
        } else {
          // Fallback to auth() user fields
          setProfile(prev => ({
            ...prev,
            name: current.displayName || prev.name,
            email: current.email || prev.email,
            phone: current.phoneNumber || prev.phone,
            avatar: 'account',
          }));
        }
      } catch (err) {
        console.warn('Error fetching user profile:', err);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    fetchProfile();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const current = auth().currentUser;
      if (!current) {
        Alert.alert("Lỗi", "Người dùng chưa đăng nhập");
        return;
      }

      // Persist phone and dateOfBirth to Firestore (merge existing fields)
      await firestore().collection('users').doc(current.uid).set({
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
      }, { merge: true });

      setIsEditing(false);

      // Update global user state so other screens reflect the change immediately
      try {
        const currentStoreUser = useUserStore.getState().user || {};
        useUserStore.getState().setUser({
          ...currentStoreUser,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
        });
      } catch (err) {
        console.warn('Error updating user store:', err);
      }

      Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân");
    } catch (err) {
      console.warn('Error saving profile:', err);
      Alert.alert("Lỗi", "Không thể lưu thông tin. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const stats = [
    { label: "Mục tiêu", value: "5", icon: "target", color: "#10B981" },
    { label: "Thói quen", value: "8", icon: "calendar-check", color: "#F59E0B" },
    { label: "Streak", value: "15", icon: "fire", color: "#EF4444" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor, paddingTop: headerPaddingTop }] }>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: secondaryBg }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>{t('profile.title')}</Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.editText}>{isEditing ? t('common.save') : t('common.edit')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarBg, { backgroundColor: avatarBgColor }]}>
              <View style={styles.avatarContainer}>
                <View style={[styles.avatarVisual, { backgroundColor: avatarBg, borderColor: avatarBorder }]}>
                  <Icon name={profile.avatar as string} size={80} color={theme.colors.primary} />
                </View>
                <TouchableOpacity style={[styles.cameraButton, { backgroundColor: theme.colors.primary, borderColor: theme.colors.surface }]}>
                  <Icon name="camera" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={[styles.userName, { color: theme.colors.onSurface }]}>{profile.name}</Text>
              <Text style={[styles.userEmail, { color: theme.colors.onSurfaceVariant }]}>{profile.email}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => {
              const statShadowColor = theme.dark ? '#000000' : stat.color;
              return (
                <View key={index} style={[styles.statCard, { 
                  backgroundColor: theme.colors.surface,
                  shadowColor: statShadowColor,
                }]}>
                  <View style={[styles.statIconWrapper, { backgroundColor: `${stat.color}15` }]}>
                    <Icon name={stat.icon as string} size={32} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>{stat.label}</Text>
                </View>
              );
            })}
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="account-circle" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Thông tin cá nhân</Text>
            </View>
            
            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.infoRow}>
                <Icon name="account" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Họ và tên</Text>
                  <TextInput
                    style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                    value={profile.name}
                    onChangeText={(text) => setProfile({ ...profile, name: text })}
                    editable={isEditing}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.infoRow}>
                <Icon name="email" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Email</Text>
                  <TextInput
                    style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                    value={profile.email}
                    onChangeText={(text) => setProfile({ ...profile, email: text })}
                    editable={isEditing}
                    keyboardType="email-address"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.infoRow}>
                <Icon name="phone" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Số điện thoại</Text>
                  <TextInput
                    style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                    value={profile.phone}
                    onChangeText={(text) => setProfile({ ...profile, phone: text })}
                    editable={isEditing}
                    keyboardType="phone-pad"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.infoRow}>
                <Icon name="cake-variant" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Ngày sinh</Text>
                  <TextInput
                    style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                    value={profile.dateOfBirth}
                    onChangeText={(text) => setProfile({ ...profile, dateOfBirth: text })}
                    editable={isEditing}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Finance Config */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="cash-multiple" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Cấu hình tài chính</Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.infoRow}>
                <Icon name="wallet" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Thu nhập tháng</Text>
                  <TextInput
                    style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                    value={`₫${financeConfig.monthlyIncome.toLocaleString("vi-VN")}`}
                    editable={isEditing}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.infoRow}>
                <Icon name="piggy-bank" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Mục tiêu tiết kiệm (%)</Text>
                  <TextInput
                    style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                    value={`${financeConfig.savingGoal}%`}
                    editable={isEditing}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.infoRow}>
                <Icon name="currency-usd" size={20} color={theme.colors.primary} style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Đơn vị tiền tệ</Text>
                  <TextInput
                    style={[styles.infoInput, !isEditing && styles.infoInputDisabled, { color: theme.colors.onSurface }]}
                    value={financeConfig.currency}
                    editable={isEditing}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Settings */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="cog" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Cài đặt</Text>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.settingRow}>
                <View style={[styles.settingIconWrapper, styles.settingIconBgGreen]}>
                  <Icon name="bell-ring" size={24} color="#10B981" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Thông báo</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>Nhận nhắc nhở và cập nhật</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                  thumbColor={notificationsEnabled ? "#FFFFFF" : theme.dark ? "#888" : "#F3F4F6"}
                  ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                />
              </View>
            </View>

            <View style={[styles.settingCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]}>
              <View style={styles.settingRow}>
                <View style={[styles.settingIconWrapper, styles.settingIconBgOrange]}>
                  <Icon name="fingerprint" size={24} color="#F59E0B" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>Xác thực sinh học</Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.onSurfaceVariant }]}>Face ID / Touch ID</Text>
                </View>
                <Switch
                  value={biometricEnabled}
                  onValueChange={setBiometricEnabled}
                  trackColor={{ false: theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)", true: theme.colors.primary }}
                  thumbColor={biometricEnabled ? "#FFFFFF" : theme.dark ? "#888" : "#F3F4F6"}
                  ios_backgroundColor={theme.dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"}
                />
              </View>
            </View>
          </View>

          {/* Quick Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="link-variant" size={24} color={theme.colors.primary} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Truy cập nhanh</Text>
            </View>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]} 
              onPress={() => navigation.navigate("AISetting")}
              activeOpacity={0.7}
            >
              <View style={[styles.linkIconWrapper, styles.linkIconBgPurple]}>
                <Icon name="robot" size={28} color="#8B5CF6" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>Cài đặt AI</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Tùy chỉnh trợ lý AI</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]} 
              onPress={() => navigation.navigate("GoalTracking")}
              activeOpacity={0.7}
            >
              <View style={[styles.linkIconWrapper, styles.linkIconBgGreen]}>
                <Icon name="target" size={28} color="#10B981" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>Mục tiêu của tôi</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Quản lý mục tiêu cá nhân</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.linkCard, { backgroundColor: theme.colors.surface, shadowColor: cardShadowColor }]} 
              onPress={() => navigation.navigate("HabitDashboard")}
              activeOpacity={0.7}
            >
              <View style={[styles.linkIconWrapper, styles.linkIconBgOrange]}>
                <Icon name="calendar-check" size={28} color="#F59E0B" />
              </View>
              <View style={styles.linkText}>
                <Text style={[styles.linkLabel, { color: theme.colors.onSurface }]}>Thói quen</Text>
                <Text style={[styles.linkDescription, { color: theme.colors.onSurfaceVariant }]}>Theo dõi thói quen hàng ngày</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
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
            <View style={styles.logoutRow}>
              <Icon name="logout" size={16} color={dangerColor} style={styles.logoutIcon} />
              <Text style={[styles.logoutText, { color: dangerColor }]}>Đăng xuất</Text>
            </View>
          </TouchableOpacity>  
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
  editButton: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 14,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  editText: { 
    color: "#FFFFFF", 
    fontWeight: "700", 
    fontSize: 15,
    letterSpacing: 0.2,
  },
  content: { padding: 20 },
  
  // Avatar Section
  avatarSection: { 
    alignItems: "center", 
    marginBottom: 24,
  },
  avatarBg: {
    width: '100%',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarContainer: { 
    position: "relative", 
    marginBottom: 20,
  },
  avatarVisual: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  cameraButton: { 
    position: "absolute", 
    bottom: 0, 
    right: 0, 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 3,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  userName: { 
    fontSize: 26, 
    fontWeight: "900", 
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  userEmail: { 
    fontSize: 15,
    letterSpacing: 0.2,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  statIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: { 
    fontSize: 28, 
    fontWeight: "900", 
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  statLabel: { 
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  
  // Sections
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
  
  // Info Cards
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
  infoIcon: {
    marginRight: 14,
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
  infoInput: { 
    fontSize: 16, 
    fontWeight: "600", 
    padding: 0,
    letterSpacing: 0.2,
  },
  infoInputDisabled: { opacity: 0.7 },
  
  // Settings
  settingCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  settingIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingIconBgGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  settingIconBgOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
  },
  settingInfo: { 
    flex: 1,
  },
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
  
  // Quick Links
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
  linkIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  linkIconBgPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  linkIconBgGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  linkIconBgOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
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
  
  // Logout
  logoutButton: { 
    borderRadius: 16, 
    padding: 18, 
    alignItems: "center", 
    borderWidth: 1.5,
    marginBottom: 20,
  },
  logoutRow: { 
    flexDirection: "row", 
    alignItems: "center",
  },
  logoutIcon: { marginRight: 10 },
  logoutText: { 
    fontWeight: "700", 
    fontSize: 16,
    letterSpacing: 0.3,
  },
  
  // Deprecated/unused
  avatar: { display: 'none' },
  cameraIcon: { display: 'none' },
  statsCard: { display: 'none' },
  statItem: { display: 'none' },
  statItemLight: { display: 'none' },
  statItemDark: { display: 'none' },
  statIconWrap: { display: 'none' },
  statIcon: { display: 'none' },
  settingIcon: { display: 'none' },
  settingText: { display: 'none' },
  linkIcon: { display: 'none' },
  linkArrow: { display: 'none' },
});
