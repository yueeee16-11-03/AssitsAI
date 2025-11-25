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
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "finance": return "#059669";
      case "health": return "#10B981";
      case "productivity": return "#34D399";
      case "lifestyle": return "#6EE7B7";
      default: return "#10B981";
    }
  };

  const getIconForCategory = (category: string): string => {
    switch (category) {
      case "finance": return "wallet";
      case "health": return "heart";
      case "productivity": return "lightning-bolt";
      case "lifestyle": return "leaf";
      default: return "lightbulb-on";
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
    const baseStyle = {
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignSelf: "flex-start" as const,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    };
    
    switch (priority) {
      case "high":
        return { ...baseStyle, backgroundColor: "#FEE2E2" };
      case "medium":
        return { ...baseStyle, backgroundColor: "#FEF3C7" };
      case "low":
      default:
        return { ...baseStyle, backgroundColor: "#DBEAFE" };
    }
  };

  const getPriorityBadgeTextStyle = (priority: string) => {
    const baseStyle = {
      fontSize: 12 as const,
      fontWeight: "700" as const,
    };

    switch (priority) {
      case "high":
        return { ...baseStyle, color: "#DC2626" };
      case "medium":
        return { ...baseStyle, color: "#D97706" };
      case "low":
      default:
        return { ...baseStyle, color: "#2563EB" };
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case "high":
        return "alert-circle";
      case "medium":
        return "alert";
      case "low":
      default:
        return "information";
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case "high":
        return "#DC2626";
      case "medium":
        return "#D97706";
      case "low":
      default:
        return "#2563EB";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Gợi ý thông minh</Text>
          <Text style={styles.headerSubtitle}>{recommendations.length} gợi ý hôm nay</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <MaterialCommunityIcons name="refresh" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Đang tải gợi ý...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadAndGenerateRecommendations}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Active Recommendations */}
            {recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
                {recommendations.map((rec, _index) => (
                  <View
                    key={rec.id}
                    style={styles.recCard}
                  >
                    {/* Header: Icon + Title + Priority */}
                    <View style={styles.recCardHeader}>
                      <View style={[
                        styles.recIconLarge,
                        { backgroundColor: `${getCategoryColor(rec.category)}15` }
                      ]}>
                        <MaterialCommunityIcons 
                          name={getIconForCategory(rec.category)} 
                          size={36} 
                          color={getCategoryColor(rec.category)}
                        />
                      </View>
                      
                      <View style={styles.recTitleSection}>
                        <Text style={styles.recTitle}>{rec.title}</Text>
                        <View style={getPriorityBadgeStyle(rec.priority)}>
                          <MaterialCommunityIcons 
                            name={getPriorityIcon(rec.priority)}
                            size={12}
                            color={getPriorityColor(rec.priority)}
                            style={styles.badgeIcon}
                          />
                          <Text style={getPriorityBadgeTextStyle(rec.priority)}>
                            {rec.priority === "high" ? "Ưu tiên cao" : rec.priority === "medium" ? "Ưu tiên TB" : "Ưu tiên thấp"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Body: Lý do + Gợi ý + Tags */}
                    <View style={styles.recCardBody}>
                      {/* Reason section - Ngắn gọn */}
                      <View style={styles.reasonSection}>
                        <Text style={styles.sectionLabel}>Chi tiết</Text>
                        <Text style={styles.reasonText}>{rec.description}</Text>
                      </View>

                      {/* Footer: Category tag */}
                      <View style={styles.recFooter}>
                        <View style={[
                          styles.categoryBadge,
                          { backgroundColor: `${getCategoryColor(rec.category)}12` }
                        ]}>
                          <MaterialCommunityIcons 
                            name={getIconForCategory(rec.category)}
                            size={12}
                            color={getCategoryColor(rec.category)}
                            style={styles.badgeIcon}
                          />
                          <Text style={[
                            styles.categoryLabel,
                            { color: getCategoryColor(rec.category) }
                          ]}>
                            {rec.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Ask AI CTA */}
            <TouchableOpacity
              style={styles.askAIButton}
              onPress={() => navigation.navigate("AIChat")}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="chat-multiple" size={22} color="#FFFFFF" />
              <Text style={styles.askAIText}>Hỏi AI chi tiết hơn</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" style={styles.askAIChevron} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  headerSubtitle: { fontSize: 13, color: "rgba(0,0,0,0.6)", marginTop: 4, fontWeight: "500" },
  filterButton: { 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "transparent",
    borderRadius: 12,
  },
  content: { padding: 16, paddingBottom: 32 },

  // ===== HERO BANNER =====
  heroBanner: {
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#6B7280",
    marginLeft: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 20,
  },
  heroHighlight: {
    color: "#059669",
    fontWeight: "800",
    fontSize: 16,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  heroStatItem: {
    alignItems: "flex-start",
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#059669",
    lineHeight: 28,
  },
  heroStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 4,
  },
  heroStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#C6F6D5",
    marginHorizontal: 20,
  },

  // ===== SECTION =====
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  // ===== REC CARD (NEW MODERN STYLE) =====
  recCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Card Header: Icon + Title + Priority
  recCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 0,
    gap: 16,
  },
  recIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  recTitleSection: {
    flex: 1,
    paddingTop: 4,
  },
  recTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 10,
    lineHeight: 24,
  },

  // Card Body: Reason + Footer
  recCardBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  reasonSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },

  // Card Footer
  recFooter: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeIcon: {
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  // ===== ASK AI BUTTON =====
  askAIButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 0,
    gap: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  askAIText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  askAIChevron: {
    marginLeft: 4,
  },
});
