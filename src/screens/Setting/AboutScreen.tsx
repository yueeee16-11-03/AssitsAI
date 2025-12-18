import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useTheme } from 'react-native-paper';

type Props = NativeStackScreenProps<RootStackParamList, "About">;

export default function AboutScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const theme = useTheme();

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const appInfo = {
    name: "AssistAI",
    version: "1.0.0",
    build: "100",
    releaseDate: "15/12/2024",
  };

  const features = [
    { icon: "💰", title: "Quản lý tài chính", description: "Theo dõi thu chi thông minh" },
    { icon: "✓", title: "Thói quen tích cực", description: "Xây dựng lối sống lành mạnh" },
    { icon: "🤖", title: "AI Assistant", description: "Trợ lý AI cá nhân hóa" },
    { icon: "👨‍👩‍👧‍👦", title: "Quản lý gia đình", description: "Kết nối và chia sẻ mục tiêu" },
    { icon: "🎯", title: "Mục tiêu thông minh", description: "AI giúp lập kế hoạch đạt mục tiêu" },
    { icon: "📊", title: "Báo cáo chi tiết", description: "Phân tích dữ liệu trực quan" },
  ];

  const team = [
    { role: "Product Designer", name: "AI Team", icon: "🎨" },
    { role: "AI Engineer", name: "AI Team", icon: "🤖" },
    { role: "Backend Developer", name: "AI Team", icon: "⚙️" },
    { role: "Mobile Developer", name: "AI Team", icon: "📱" },
  ];

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert("Lỗi", "Không thể mở liên kết")
    );
  };

  const handleFeedback = () => {
    Alert.alert(
      "Gửi phản hồi",
      "Bạn muốn gửi phản hồi qua email hay chat?",
      [
        { text: "Hủy", style: "cancel" },
        { text: "Email", onPress: () => handleOpenLink("mailto:support@assistai.com") },
        { text: "Chat", onPress: () => navigation.navigate("HelpCenter") },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: theme.colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>Giới thiệu</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* App Logo & Info */}
          <View style={styles.logoSection}>
            <View style={[styles.logoContainer, { backgroundColor: `${theme.colors.primary}20`, borderColor: `${theme.colors.primary}30` }]}>
              <Text style={styles.logo}>🤖</Text>
            </View>
            <Text style={[styles.appName, { color: theme.colors.primary }]}>{appInfo.name}</Text>
            <Text style={styles.appTagline}>AI Assistant cho cuộc sống thông minh</Text>
            <View style={styles.versionCard}>
              <Text style={[styles.versionText, { color: theme.colors.primary }]}> 
                Version {appInfo.version} ({appInfo.build})
              </Text>
              <Text style={styles.releaseDate}>Released {appInfo.releaseDate}</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Tính năng nổi bật</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <Text style={styles.featureIcon}>{feature.icon}</Text>
                  <Text style={[styles.featureTitle, { color: theme.colors.primary }]}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Team */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Đội ngũ phát triển</Text>
            {team.map((member, index) => (
              <View key={index} style={styles.teamCard}>
                <Text style={styles.teamIcon}>{member.icon}</Text>
                <View style={styles.teamInfo}>
                  <Text style={styles.teamRole}>{member.role}</Text>
                  <Text style={styles.teamName}>{member.name}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Links */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Liên kết</Text>

            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => handleOpenLink("https://assistai.com")}
            >
              <Text style={styles.linkIcon}>🌐</Text>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>Website</Text>
                <Text style={styles.linkUrl}>assistai.com</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkCard}>
              <Text style={styles.linkIcon}>📄</Text>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>Điều khoản dịch vụ</Text>
                <Text style={styles.linkUrl}>Xem chi tiết</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkCard}>
              <Text style={styles.linkIcon}>🔒</Text>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>Chính sách bảo mật</Text>
                <Text style={styles.linkUrl}>Xem chi tiết</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkCard}>
              <Text style={styles.linkIcon}>⚖️</Text>
              <View style={styles.linkInfo}>
                <Text style={styles.linkTitle}>Giấy phép</Text>
                <Text style={styles.linkUrl}>Open source licenses</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Social */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theo dõi chúng tôi</Text>
            <View style={styles.socialGrid}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>📘</Text>
                <Text style={styles.socialText}>Facebook</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>📷</Text>
                <Text style={styles.socialText}>Instagram</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>🐦</Text>
                <Text style={styles.socialText}>Twitter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>▶️</Text>
                <Text style={styles.socialText}>YouTube</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Feedback */}
          <TouchableOpacity style={[styles.feedbackButton, { backgroundColor: `${theme.colors.primary}15`, borderColor: `${theme.colors.primary}20` }]} onPress={handleFeedback}>
            <Text style={styles.feedbackIcon}>💬</Text>
            <Text style={[styles.feedbackText, { color: theme.colors.primary }]}>Gửi phản hồi</Text>
          </TouchableOpacity>

          {/* Copyright */}
          <Text style={styles.copyright}>
            © 2024 AssistAI. All rights reserved.
          </Text>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  placeholder: { width: 40 },
  content: { padding: 16 },
  logoSection: { alignItems: "center", marginBottom: 32 },
  logoContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(99,102,241,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 3, borderColor: "rgba(99,102,241,0.4)" },
  logo: { fontSize: 56 },
  appName: { fontSize: 32, fontWeight: "900", color: "#00796B", marginBottom: 8 },
  appTagline: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 16, textAlign: "center" },
  versionCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, alignItems: "center" },
  versionText: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  releaseDate: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16 },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  featureCard: { flex: 1, minWidth: "45%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  featureIcon: { fontSize: 32, marginBottom: 8 },
  featureTitle: { fontSize: 14, fontWeight: "700", color: "#00796B", marginBottom: 4, textAlign: "center" },
  featureDescription: { fontSize: 11, color: "rgba(255,255,255,0.6)", textAlign: "center" },
  teamCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12 },
  teamIcon: { fontSize: 32, marginRight: 12 },
  teamInfo: { flex: 1 },
  teamRole: { fontSize: 14, fontWeight: "700", color: "#00796B", marginBottom: 2 },
  teamName: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  linkCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, marginBottom: 12 },
  linkIcon: { fontSize: 28, marginRight: 12 },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 16, fontWeight: "700", color: "#00796B", marginBottom: 2 },
  linkUrl: { fontSize: 12, color: "rgba(255,255,255,0.6)" },
  linkArrow: { fontSize: 20, color: "rgba(255,255,255,0.5)" },
  socialGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  socialButton: { flex: 1, minWidth: "45%", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  socialIcon: { fontSize: 32, marginBottom: 8 },
  socialText: { fontSize: 13, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  feedbackButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(99,102,241,0.15)", borderRadius: 16, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: "rgba(99,102,241,0.3)" },
  feedbackIcon: { fontSize: 24, marginRight: 8 },
  feedbackText: { fontSize: 16, fontWeight: "700" },
  copyright: { fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 16 },
});
