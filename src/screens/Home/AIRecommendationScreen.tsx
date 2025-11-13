import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import {
  generateDailyRecommendations,
  loadTodayRecommendations,
  DailyRecommendation,
} from "../../services/AIRecommendationService";

type Props = NativeStackScreenProps<RootStackParamList, "AIRecommendation">;

// Use DailyRecommendation type from service
type Recommendation = DailyRecommendation;

export default function AIRecommendationScreen({ navigation }: Props) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadAndGenerateRecommendations();
    }, [])
  );

  const loadAndGenerateRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const user = auth().currentUser;
      if (!user) {
        setError("Vui lòng đăng nhập");
        setIsLoading(false);
        return;
      }

      // First, try to load today's recommendations
      const loadResult = await loadTodayRecommendations(user.uid);

      if (loadResult.success && loadResult.recommendations.length > 0) {
        // Already have recommendations for today
        console.log("✅ Loaded today's recommendations:", loadResult.recommendations.length);
        setRecommendations(loadResult.recommendations);
        setIsLoading(false);
      } else {
        // No recommendations yet, generate new ones
        console.log("📝 No recommendations found, generating new ones...");

        const goal = "Tối ưu hóa chi tiêu và đạt mục tiêu tài chính";
        const generateResult = await generateDailyRecommendations(user.uid, goal);

        if (generateResult.success) {
          console.log("✅ Generated recommendations:", generateResult.recommendations.length);
          setRecommendations(generateResult.recommendations);
        } else {
          throw new Error(generateResult.error || "Không thể tạo gợi ý");
        }

        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "Không thể tải gợi ý");
      setIsLoading(false);
    }
  };

  const getImpactColor = (priority: string) => {
    switch (priority) {
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
          <Text style={styles.headerSubtitle}>{recommendations.length} gợi ý hôm nay</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Đang tải gợi ý...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadAndGenerateRecommendations}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                <Text style={styles.statValue}>{recommendations.length}</Text>
                <Text style={styles.statLabel}>Gợi ý</Text>
              </View>
            </View>
          </View>

          {/* Active Recommendations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gợi ý ưu tiên</Text>
            {recommendations.map((rec, _index) => (
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
                      { backgroundColor: `${getImpactColor(rec.priority)}22` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.impactText,
                        { color: getImpactColor(rec.priority) },
                      ]}
                    >
                      {rec.priority === "high" ? "Cao" : rec.priority === "medium" ? "TB" : "Thấp"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recDescription}>{rec.description}</Text>
                <View style={styles.recFooter}>
                  <View style={styles.categoryBadge}>
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: getCategoryColor(rec.category) },
                      ]}
                    >
                      {rec.category}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Ask AI */}
          <TouchableOpacity
            style={styles.askAIButton}
            onPress={() => navigation.navigate("AIChat")}
            activeOpacity={0.9}
          >
            <Text style={styles.askAIIcon}>💬</Text>
            <Text style={styles.askAIText}>Hỏi AI về gợi ý khác</Text>
          </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: "rgba(15,23,36,0.7)",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "700",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#0f1724",
    fontWeight: "700",
  },
  emptySubtext: {
    fontSize: 13,
    color: "rgba(15,23,36,0.6)",
  },
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
  content: { padding: 16, paddingBottom: 24 },
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
    justifyContent: "center",
    alignItems: "center",
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#333333", marginBottom: 4 },
  statLabel: { fontSize: 12, color: "#999999" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#00796B", marginBottom: 16 },
  recCard: {
    backgroundColor: "rgba(0, 137, 123, 0.06)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  recHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
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
  recFooter: { flexDirection: "row", justifyContent: "flex-start", alignItems: "center" },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryLabel: { fontSize: 12, fontWeight: "600" },
  askAIButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
    marginBottom: 16,
  },
  askAIIcon: { fontSize: 20, marginRight: 8 },
  askAIText: { color: "#6366F1", fontSize: 16, fontWeight: "700" },
});
