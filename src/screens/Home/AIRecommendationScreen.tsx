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
import type { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AIRecommendation">;

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "finance" | "health" | "productivity" | "lifestyle";
  icon: string;
  actionText: string;
  estimatedBenefit: string;
}

export default function AIRecommendationScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const recommendations: Recommendation[] = [
    {
      id: "1",
      title: "Tiết kiệm 10% chi tiêu hôm nay",
      description: "Giảm chi tiêu không cần thiết để đạt mục tiêu tiết kiệm tháng này",
      impact: "high",
      category: "finance",
      icon: "💰",
      actionText: "Xem chi tiết",
      estimatedBenefit: "₫500,000/tháng",
    },
    {
      id: "2",
      title: "Đi ngủ sớm hơn 30 phút",
      description: "Cải thiện chất lượng giấc ngủ và tăng năng suất làm việc",
      impact: "high",
      category: "health",
      icon: "😴",
      actionText: "Đặt nhắc nhở",
      estimatedBenefit: "+2h năng suất",
    },
    {
      id: "3",
      title: "Uống 2 cốc nước nữa",
      description: "Bạn mới uống 6/8 cốc nước hôm nay",
      impact: "medium",
      category: "health",
      icon: "💧",
      actionText: "Hoàn thành",
      estimatedBenefit: "100% mục tiêu",
    },
    {
      id: "4",
      title: "Hoàn thành báo cáo trước 3PM",
      description: "Tập trung vào công việc quan trọng nhất trong ngày",
      impact: "high",
      category: "productivity",
      icon: "📝",
      actionText: "Bắt đầu ngay",
      estimatedBenefit: "3h tiết kiệm",
    },
    {
      id: "5",
      title: "Đi bộ 2000 bước nữa",
      description: "Đạt mục tiêu 8000 bước hôm nay",
      impact: "medium",
      category: "health",
      icon: "🚶",
      actionText: "Theo dõi",
      estimatedBenefit: "100% mục tiêu",
    },
    {
      id: "6",
      title: "Chuẩn bị bữa trưa tại nhà",
      description: "Tiết kiệm ₫150,000 và ăn uống lành mạnh hơn",
      impact: "medium",
      category: "finance",
      icon: "🍱",
      actionText: "Lên kế hoạch",
      estimatedBenefit: "₫150,000",
    },
  ];

  const handleComplete = (id: string) => {
    setCompletedIds(prev => [...prev, id]);
  };

  const handleAction = (rec: Recommendation) => {
    if (rec.category === "finance") {
      navigation.navigate("AIInsight");
    } else {
      handleComplete(rec.id);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "#EC4899";
      case "medium": return "#F59E0B";
      case "low": return "#10B981";
      default: return "#6366F1";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "finance": return "#6366F1";
      case "health": return "#10B981";
      case "productivity": return "#8B5CF6";
      case "lifestyle": return "#EC4899";
      default: return "#6366F1";
    }
  };

  const activeRecs = recommendations.filter(r => !completedIds.includes(r.id));
  const completedRecs = recommendations.filter(r => completedIds.includes(r.id));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gợi ý thông minh</Text>
          <Text style={styles.headerSubtitle}>{activeRecs.length} gợi ý hôm nay</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* AI Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryIcon}>🎯</Text>
              <Text style={styles.summaryTitle}>Tổng quan hôm nay</Text>
            </View>
            <Text style={styles.summaryText}>
              AI đã phân tích và tạo ra <Text style={styles.highlight}>{recommendations.length} gợi ý</Text> giúp 
              bạn tối ưu hóa thời gian, tiết kiệm chi phí và cải thiện sức khỏe.
            </Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₫650K</Text>
                <Text style={styles.statLabel}>Tiết kiệm</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>5h</Text>
                <Text style={styles.statLabel}>Năng suất</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>85%</Text>
                <Text style={styles.statLabel}>Hoàn thành</Text>
              </View>
            </View>
          </View>

          {/* Active Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gợi ý ưu tiên</Text>
            {activeRecs.map((rec, _index) => (
              <View
                key={rec.id}
                style={[
                  styles.recCard,
                  { borderLeftColor: getCategoryColor(rec.category) },
                ]}
              >
                <View style={styles.recHeader}>
                  <View style={styles.recIconContainer}>
                    <Text style={styles.recIcon}>{rec.icon}</Text>
                  </View>
                  <View
                    style={[
                      styles.impactBadge,
                      { backgroundColor: `${getImpactColor(rec.impact)}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.impactText,
                        { color: getImpactColor(rec.impact) },
                      ]}
                    >
                      {rec.impact === "high" ? "Cao" : rec.impact === "medium" ? "TB" : "Thấp"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDescription}>{rec.description}</Text>
                <View style={styles.recFooter}>
                  <View style={styles.benefitContainer}>
                    <Text style={styles.benefitLabel}>Lợi ích:</Text>
                    <Text style={styles.benefitValue}>{rec.estimatedBenefit}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: getCategoryColor(rec.category) },
                    ]}
                    onPress={() => handleAction(rec)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionButtonText}>{rec.actionText}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Completed Recommendations */}
          {completedRecs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đã hoàn thành</Text>
              {completedRecs.map((rec) => (
                <View key={rec.id} style={styles.completedCard}>
                  <Text style={styles.completedIcon}>✓</Text>
                  <View style={styles.completedContent}>
                    <Text style={styles.completedTitle}>{rec.title}</Text>
                    <Text style={styles.completedBenefit}>{rec.estimatedBenefit}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Ask AI */}
          <TouchableOpacity
            style={styles.askAIButton}
            onPress={() => navigation.navigate("AIChat")}
            activeOpacity={0.9}
          >
            <Text style={styles.askAIIcon}>💬</Text>
            <Text style={styles.askAIText}>Hỏi AI về gợi ý khác</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#00897B" },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#00796B" },
  headerSubtitle: { fontSize: 12, color: "#999999" },
  filterButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  filterIcon: { fontSize: 20 },
  content: { padding: 16 },
  summaryCard: {
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.2)",
  },
  summaryHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  summaryIcon: { fontSize: 24, marginRight: 8 },
  summaryTitle: { fontSize: 16, fontWeight: "800", color: "#00796B" },
  summaryText: {
    fontSize: 14,
    color: "#333333",
    lineHeight: 20,
    marginBottom: 16,
  },
  highlight: { color: "#6366F1", fontWeight: "800" },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#333333", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#999999" },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(0, 137, 123, 0.15)" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16 },
  recCard: {
    backgroundColor: "rgba(0, 137, 123, 0.06)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  recHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  recIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 137, 123, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  recIcon: { fontSize: 24 },
  impactBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  impactText: { fontSize: 12, fontWeight: "700" },
  recTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 8 },
  recDescription: { fontSize: 13, color: "#999999", lineHeight: 18, marginBottom: 12 },
  recFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  benefitContainer: { flex: 1 },
  benefitLabel: { fontSize: 11, color: "#999999", marginBottom: 2 },
  benefitValue: { fontSize: 14, fontWeight: "700", color: "#333333" },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  completedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  completedIcon: { fontSize: 20, marginRight: 12, color: "#10B981" },
  completedContent: { flex: 1 },
  completedTitle: { fontSize: 14, fontWeight: "700", color: "#00796B", marginBottom: 2 },
  completedBenefit: { fontSize: 12, color: "#999999" },
  askAIButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  askAIIcon: { fontSize: 20, marginRight: 8 },
  askAIText: { color: "#6366F1", fontSize: 16, fontWeight: "700" },
});
