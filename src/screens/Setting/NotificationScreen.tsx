import React, { useState } from "react";
import useNotificationStore from '../../store/notificationStore';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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

  // persisted notifications are stored in Firestore: users/{uid}/notifications
  const notifications = useNotificationStore(state => state.notifications);
  const initialize = useNotificationStore(state => state.initialize);
  const markAsRead = useNotificationStore(state => state.markAsRead);
  const markAllRead = useNotificationStore(state => state.markAllRead);

  const handleMarkAsRead = async (id: string) => {
    try { await markAsRead(id); } catch (e: any) { console.warn('Failed to mark read', e.message || e); }
  };

  const handleMarkAllAsRead = async () => {
    try { await markAllRead(); } catch (e: any) { console.warn('Failed markAll read', e.message || e); }
  };

  const handleNotificationPress = (notif: Notification) => {
    handleMarkAsRead(notif.id);
    if (notif.actionRoute) {
      navigation.navigate(notif.actionRoute as any);
    }
  };

  React.useEffect(() => {
    initialize();
    return () => { useNotificationStore.getState().cleanup(); };
  }, [initialize]);

  const filteredNotifications = selectedTab === 'all' ? notifications : notifications.filter((n: Notification) => !n.read);

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

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
          <Icon name="chevron-left" size={20} color="#111827" />
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
            <Icon name="bell-check" size={16} color="#111827" style={styles.iconMarginRight} />
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
              <Icon name="bell-outline" size={64} color="#00796B" style={styles.emptyIcon} />
              <Text style={styles.emptyTitle}>Không có thông báo</Text>
              <Text style={styles.emptyText}>
                {selectedTab === "unread"
                  ? "Bạn đã đọc hết thông báo"
                  : "Chưa có thông báo nào"}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notif: Notification) => {
              const leftAccentColor =
                notif.type === 'warning' || notif.type === 'ai'
                  ? '#10B981'
                  : notif.type === 'reminder' || notif.type === 'achievement'
                  ? '#F59E0B'
                  : notif.color;
              return (
              <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.notificationCard,
                    !notif.read && styles.notificationCardUnread,
                    { borderLeftColor: leftAccentColor },
                  ]}
                onPress={() => handleNotificationPress(notif)}
                activeOpacity={0.8}
              >
                <View style={[styles.notificationIcon, { backgroundColor: `${leftAccentColor}22` }]}>
                <Icon name={notif.icon as any} size={22} color={leftAccentColor} />
              </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notif.title}</Text>
                    <Text style={styles.notificationTime}>{getTimeAgo(notif.timestamp)}</Text>
                  </View>
                  <Text style={styles.notificationMessage}>{notif.message}</Text>
                      <View style={styles.notificationFooter}>
                        <View style={[styles.typeBadge, { backgroundColor: `${leftAccentColor}22` }]}>
                          <Text style={[styles.typeBadgeText, { color: leftAccentColor }]}>
                            {notif.type === "ai" ? "AI" :
                             notif.type === "reminder" ? "Nhắc nhở" :
                             notif.type === "warning" ? "Cảnh báo" : "Thành tích"}
                          </Text>
                        </View>
                        {notif.actionRoute ? (
                          <TouchableOpacity
                            style={[styles.ctaButton, { borderColor: leftAccentColor }]}
                            onPress={() => handleNotificationPress(notif)}
                            activeOpacity={0.85}
                          >
                            <Text style={[styles.ctaText, { color: leftAccentColor }]}>Xem chi tiết</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.actionHint}>Nhấn để xem chi tiết →</Text>
                        )}
                      </View>
                </View>
              </TouchableOpacity>
            );
            })
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'transparent', alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: "#111827" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  unreadBadge: { backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 },
  unreadBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  markAllButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', marginLeft: 8 },
  markAllText: { color: "#111827", fontSize: 13, fontWeight: "700" },
  tabSelector: { flexDirection: "row", backgroundColor: "rgba(0, 137, 123, 0.08)", margin: 16, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#E5E7EB" },
  tabText: { fontSize: 14, color: "#999999", fontWeight: "700" },
  tabTextActive: { color: "#6B7280" },
  content: { padding: 16, paddingTop: 0 },
  emptyState: { alignItems: "center", paddingTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#00796B", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#999999", textAlign: "center" },
  notificationCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(31,41,55,0.12)', borderLeftWidth: 3, borderLeftColor: "transparent" },
  notificationCardUnread: { backgroundColor: "#FFFFFF", borderLeftColor: "transparent", borderWidth: 1, borderColor: 'rgba(31,41,55,0.12)' },
  notificationIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 12, position: "relative" },
  notificationEmoji: { fontSize: 24 },
  // removed unread dot indicator
  notificationContent: { flex: 1 },
  notificationHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  notificationTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: "#374151", marginRight: 8 },
  notificationTime: { fontSize: 12, color: "#999999" },
  notificationMessage: { fontSize: 14, color: "#333333", lineHeight: 20, marginBottom: 8 },
  notificationFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 11, fontWeight: "700" },
  actionHint: { fontSize: 12, color: "#999999", fontWeight: "600" },
  ctaButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ctaText: { fontSize: 12, fontWeight: '700' },
  iconMarginRight: { marginRight: 8 },
});
