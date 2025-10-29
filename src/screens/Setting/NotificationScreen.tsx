import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Notification">;

interface Notification {
  id: string;
  type: "ai" | "reminder" | "warning" | "achievement";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: string;
  color: string;
  actionRoute?: "BudgetPlanner" | "AIRecommendation" | "DailyCheckIn" | "HabitDashboard" | "AIInsight" | "SharedGoal";
}

export default function NotificationScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedTab, setSelectedTab] = useState<"all" | "unread">("all");

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "warning",
      title: "Cảnh báo vượt ngân sách",
      message: "Chi tiêu 'Mua sắm' đã vượt ₫500K so với ngân sách tháng này",
      timestamp: new Date(Date.now() - 300000),
      read: false,
      icon: "🚨",
      color: "#EF4444",
      actionRoute: "BudgetPlanner",
    },
    {
      id: "2",
      type: "ai",
      title: "Gợi ý tiết kiệm từ AI",
      message: "Bạn có thể tiết kiệm thêm ₫2M nếu giảm chi tiêu ăn uống 20%",
      timestamp: new Date(Date.now() - 1800000),
      read: false,
      icon: "🤖",
      color: "#8B5CF6",
      actionRoute: "AIRecommendation",
    },
    {
      id: "3",
      type: "reminder",
      title: "Nhắc nhở check-in thói quen",
      message: "Đã đến giờ hoàn thành thói quen 'Uống nước' hôm nay",
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      icon: "⏰",
      color: "#F59E0B",
      actionRoute: "DailyCheckIn",
    },
    {
      id: "4",
      type: "achievement",
      title: "Chúc mừng! Streak mới",
      message: "Bạn đã duy trì thói quen 'Đọc sách' được 15 ngày liên tiếp 🔥",
      timestamp: new Date(Date.now() - 7200000),
      read: true,
      icon: "🏆",
      color: "#10B981",
      actionRoute: "HabitDashboard",
    },
    {
      id: "5",
      type: "ai",
      title: "Phân tích chi tiêu tuần",
      message: "AI phát hiện bạn đã giảm 15% chi tiêu so với tuần trước. Làm tốt lắm!",
      timestamp: new Date(Date.now() - 86400000),
      read: true,
      icon: "📊",
      color: "#8B5CF6",
      actionRoute: "AIInsight",
    },
    {
      id: "6",
      type: "warning",
      title: "Sắp hết ngân sách tháng",
      message: "Chỉ còn ₫1.2M trong ngân sách 'Giải trí' - còn 10 ngày",
      timestamp: new Date(Date.now() - 172800000),
      read: true,
      icon: "⚠️",
      color: "#F59E0B",
    },
    {
      id: "7",
      type: "reminder",
      title: "Mục tiêu 'Du lịch Đà Lạt'",
      message: "Hãy đóng góp thêm ₫500K để đạt mục tiêu chung gia đình",
      timestamp: new Date(Date.now() - 259200000),
      read: true,
      icon: "🎯",
      color: "#6366F1",
      actionRoute: "SharedGoal",
    },
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleNotificationPress = (notif: Notification) => {
    handleMarkAsRead(notif.id);
    if (notif.actionRoute) {
      navigation.navigate(notif.actionRoute as any);
    }
  };

  const filteredNotifications =
    selectedTab === "all"
      ? notifications
      : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTimeAgo = (timestamp: Date) => {
    const seconds = Math.floor((Date.now() - timestamp.getTime()) / 1000);
    if (seconds < 60) return "Vừa xong";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return `${Math.floor(seconds / 86400)} ngày trước`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "all" && styles.tabActive]}
          onPress={() => setSelectedTab("all")}
        >
          <Text style={[styles.tabText, selectedTab === "all" && styles.tabTextActive]}>
            Tất cả
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "unread" && styles.tabActive]}
          onPress={() => setSelectedTab("unread")}
        >
          <Text style={[styles.tabText, selectedTab === "unread" && styles.tabTextActive]}>
            Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptyText}>
                {selectedTab === "unread"
                  ? "Bạn đã đọc hết thông báo"
                  : "Chưa có thông báo nào"}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notificationCard, !notif.read && styles.notificationCardUnread]}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.8}
              >
                <View style={[styles.notificationIcon, { backgroundColor: `${notif.color}22` }]}>
                  <Text style={styles.notificationEmoji}>{notif.icon}</Text>
                  {!notif.read && <View style={styles.unreadDot} />}
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notif.title}</Text>
                    <Text style={styles.notificationTime}>{getTimeAgo(notif.timestamp)}</Text>
                  </View>
                  <Text style={styles.notificationMessage}>{notif.message}</Text>
                  <View style={styles.notificationFooter}>
                    <View style={[styles.typeBadge, { backgroundColor: `${notif.color}22` }]}>
                      <Text style={[styles.typeBadgeText, { color: notif.color }]}>
                        {notif.type === "ai" ? "AI" :
                         notif.type === "reminder" ? "Nhắc nhở" :
                         notif.type === "warning" ? "Cảnh báo" : "Thành tích"}
                      </Text>
                    </View>
                    {notif.actionRoute && (
                      <Text style={styles.actionHint}>Nhấn để xem chi tiết →</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 48, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0, 137, 123, 0.08)", alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  unreadBadge: { backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  unreadBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  markAllButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "rgba(99,102,241,0.2)" },
  markAllText: { color: "#6366F1", fontSize: 13, fontWeight: "700" },
  tabSelector: { flexDirection: "row", backgroundColor: "rgba(0, 137, 123, 0.08)", margin: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#6366F1" },
  tabText: { fontSize: 14, color: "#999999", fontWeight: "700" },
  tabTextActive: { color: "#FFFFFF" },
  content: { padding: 16, paddingTop: 0 },
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#00796B", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#999999", textAlign: "center" },
  notificationCard: { flexDirection: "row", backgroundColor: "rgba(0, 137, 123, 0.06)", borderRadius: 16, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: "transparent" },
  notificationCardUnread: { backgroundColor: "rgba(99,102,241,0.08)", borderLeftColor: "#6366F1" },
  notificationIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 12, position: "relative" },
  notificationEmoji: { fontSize: 24 },
  unreadDot: { position: "absolute", top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: "#EF4444", borderWidth: 2, borderColor: "#0A0E27" },
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  notificationTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: "#00796B", marginRight: 8 },
  notificationTime: { fontSize: 12, color: "#999999" },
  notificationMessage: { fontSize: 14, color: "#333333", lineHeight: 20, marginBottom: 8 },
  notificationFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  actionHint: { fontSize: 12, color: "#999999", fontWeight: "600" },
});
