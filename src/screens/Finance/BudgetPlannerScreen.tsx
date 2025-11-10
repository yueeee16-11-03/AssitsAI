import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useBudgetStore } from "../../store/budgetStore";

type Props = NativeStackScreenProps<RootStackParamList, "BudgetPlanner">;

interface BudgetItem {
  id: string;
  categoryId: string;
  category: string;
  icon: string;
  budget: number;
  spent?: number;
  predicted?: number;
  color: string;
}

const monthNames = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

export default function BudgetPlannerScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newBudgetData, setNewBudgetData] = useState({
    category: "",
    categoryId: "",
    icon: "",
    budget: 0,
    color: "#6366F1",
  });

  // Firebase store
  const budgets = useBudgetStore(state => state.budgets);
  const isLoading = useBudgetStore(state => state.isLoading);
  const error = useBudgetStore(state => state.error);
  const fetchBudgets = useBudgetStore(state => state.fetchBudgets);
  const addBudget = useBudgetStore(state => state.addBudget);
  const updateBudget = useBudgetStore(state => state.updateBudget);
  const deleteBudget = useBudgetStore(state => state.deleteBudget);

  // Animation effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Load budgets when screen focused
  useFocusEffect(
    React.useCallback(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      fetchBudgets(year, month);
    }, [fetchBudgets])
  );

  const totalBudget = budgets.reduce((sum: number, item: BudgetItem): number => sum + item.budget, 0);
  const totalSpent = budgets.reduce((sum: number, item: BudgetItem): number => sum + (item.spent || 0), 0);
  const totalPredicted = budgets.reduce((sum: number, item: BudgetItem): number => sum + (item.predicted || 0), 0);

  const getStatusColor = (spent: number, budget: number, predicted: number) => {
    if (spent > budget || predicted > budget) return "#EF4444";
    if (spent > budget * 0.8) return "#F59E0B";
    return "#10B981";
  };

  const getPercentage = (spent: number, budget: number) => {
    return Math.min((spent / budget) * 100, 100);
  };

  const handleUpdateBudget = async (id: string) => {
    try {
      const newBudgetAmount = parseInt(editingValue.replace(/[^0-9]/g, ""), 10) || 0;
      if (newBudgetAmount <= 0) {
        Alert.alert("Lỗi", "Ngân sách phải lớn hơn 0");
        return;
      }

      await updateBudget(id, { budget: newBudgetAmount });
      Alert.alert("Thành công", "Cập nhật ngân sách thành công");
      setEditingId(null);
      setEditingValue("");
    } catch (err) {
      Alert.alert("Lỗi", (err as Error).message);
    }
  };

  const handleStartEdit = (id: string, currentBudget: number) => {
    setEditingId(id);
    setEditingValue(currentBudget.toString());
  };

  const handleDeleteBudget = async (id: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa ngân sách này?",
      [
        { text: "Hủy", onPress: () => {}, style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await deleteBudget(id);
              Alert.alert("Thành công", "Xóa ngân sách thành công");
            } catch (err) {
              Alert.alert("Lỗi", (err as Error).message);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleAddBudget = async () => {
    try {
      if (!newBudgetData.category || !newBudgetData.categoryId || newBudgetData.budget <= 0) {
        Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
        return;
      }

      await addBudget({
        categoryId: newBudgetData.categoryId,
        category: newBudgetData.category,
        icon: newBudgetData.icon || "💰",
        budget: newBudgetData.budget,
        color: newBudgetData.color,
      });

      Alert.alert("Thành công", "Thêm ngân sách thành công");
      setAddModalVisible(false);
      setNewBudgetData({
        category: "",
        categoryId: "",
        icon: "",
        budget: 0,
        color: "#6366F1",
      });
    } catch (err) {
      Alert.alert("Lỗi", (err as Error).message);
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
        <Text style={styles.headerTitle}>Ngân sách</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setAddModalVisible(true)}
        >
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải ngân sách...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              const now = new Date();
              fetchBudgets(now.getFullYear(), now.getMonth());
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>Chưa có ngân sách nào</Text>
          <Text style={styles.emptySubtext}>Nhấn nút + để thêm ngân sách mới</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Month Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthSelector}
            >
              {monthNames.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthButton,
                    selectedMonth === index && styles.monthButtonActive,
                  ]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text
                    style={[
                      styles.monthText,
                      selectedMonth === index && styles.monthTextActive,
                    ]}
                  >
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Overview Card */}
            <View style={styles.overviewCard}>
              <Text style={styles.overviewLabel}>Tổng ngân sách tháng</Text>
              <Text style={styles.overviewAmount}>₫{totalBudget.toLocaleString("vi-VN")}</Text>
              <View style={styles.overviewStats}>
                <View style={styles.overviewStat}>
                  <Text style={styles.statLabel}>Đã chi</Text>
                  <Text
                    style={
                      totalSpent > totalBudget
                        ? [styles.statValue, styles.statValueDanger]
                        : styles.statValue
                    }
                  >
                    ₫{(totalSpent / 1000000).toFixed(1)}M
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.statLabel}>Còn lại</Text>
                  <Text style={[styles.statValue, styles.statValueSuccess]}>
                    ₫{((totalBudget - totalSpent) / 1000000).toFixed(1)}M
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.statLabel}>Dự kiến</Text>
                  <Text style={[styles.statValue, styles.statValueWarning]}>
                    ₫{(totalPredicted / 1000000).toFixed(1)}M
                  </Text>
                </View>
              </View>
              <View style={styles.totalProgress}>
                <View
                  style={[
                    styles.totalProgressFill,
                    totalSpent > totalBudget
                      ? styles.totalProgressFillDanger
                      : styles.totalProgressFillNormal,
                    { width: `${getPercentage(totalSpent, totalBudget)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Budget Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chi tiết theo danh mục</Text>
              {budgets.map((item: BudgetItem) => {
                const spent = item.spent || 0;
                const predicted = item.predicted || 0;
                const percentage = getPercentage(spent, item.budget);
                const statusColor = getStatusColor(spent, item.budget, predicted);
                const isOverBudget = spent > item.budget || predicted > item.budget;

                return (
                  <View key={item.id} style={styles.budgetCard}>
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetInfo}>
                        <Text style={styles.budgetIcon}>{item.icon}</Text>
                        <Text style={styles.budgetCategory}>{item.category}</Text>
                        {isOverBudget && (
                          <View style={styles.warningBadge}>
                            <Text style={styles.warningBadgeText}>!</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.budgetActions}>
                        <TouchableOpacity
                          onPress={() => handleStartEdit(item.id, item.budget)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.editIcon}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteBudget(item.id)}
                          style={styles.actionButton}
                        >
                          <Text style={styles.deleteIcon}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {editingId === item.id ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={styles.editInput}
                          value={editingValue}
                          onChangeText={setEditingValue}
                          keyboardType="numeric"
                          onBlur={() => handleUpdateBudget(item.id)}
                          autoFocus
                        />
                      </View>
                    ) : (
                      <>
                        <View style={styles.budgetAmounts}>
                          <View style={styles.amountItem}>
                            <Text style={styles.amountLabel}>Ngân sách</Text>
                            <Text style={styles.amountValue}>
                              ₫{(item.budget / 1000000).toFixed(1)}M
                            </Text>
                          </View>
                          <View style={styles.amountItem}>
                            <Text style={styles.amountLabel}>Đã chi</Text>
                            <Text style={[styles.amountValue, { color: statusColor }]}>
                              ₫{(spent / 1000000).toFixed(1)}M
                            </Text>
                          </View>
                          <View style={styles.amountItem}>
                            <Text style={styles.amountLabel}>Dự kiến</Text>
                            <Text style={[styles.amountValue, styles.statValueWarning]}>
                              ₫{(predicted / 1000000).toFixed(1)}M
                            </Text>
                          </View>
                        </View>

                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${percentage}%`,
                                  backgroundColor: statusColor,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.progressText}>{percentage.toFixed(0)}%</Text>
                        </View>

                        {predicted > item.budget && (
                          <View style={styles.predictionAlert}>
                            <Text style={styles.predictionText}>
                              ⚠️ Dự kiến vượt ₫{(((predicted - item.budget) / 1000).toFixed(0))}K
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <View style={styles.actionsGrid}>
                <TouchableOpacity
                  style={styles.actionCard}
                  onPress={() => navigation.navigate("AIRecommendation")}
                >
                  <Text style={styles.actionIcon}>💡</Text>
                  <Text style={styles.actionText}>Gợi ý tiết kiệm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      )}

      {/* Add Budget Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm ngân sách mới</Text>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Tên danh mục *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Ăn uống"
                  placeholderTextColor="rgba(15,23,36,0.4)"
                  value={newBudgetData.category}
                  onChangeText={(text) =>
                    setNewBudgetData({ ...newBudgetData, category: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>ID danh mục *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 1"
                  placeholderTextColor="rgba(15,23,36,0.4)"
                  value={newBudgetData.categoryId}
                  onChangeText={(text) =>
                    setNewBudgetData({ ...newBudgetData, categoryId: text })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Biểu tượng</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 🍔"
                  placeholderTextColor="rgba(15,23,36,0.4)"
                  value={newBudgetData.icon}
                  onChangeText={(text) =>
                    setNewBudgetData({ ...newBudgetData, icon: text })
                  }
                  maxLength={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Ngân sách (VNĐ) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: 5000000"
                  placeholderTextColor="rgba(15,23,36,0.4)"
                  keyboardType="numeric"
                  value={newBudgetData.budget.toString()}
                  onChangeText={(text) =>
                    setNewBudgetData({
                      ...newBudgetData,
                      budget: parseInt(text, 10) || 0,
                    })
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Màu sắc</Text>
                <View style={styles.colorGrid}>
                  {["#EC4899", "#8B5CF6", "#6366F1", "#F59E0B", "#10B981", "#EF4444"].map(
                    (color) => {
                      const isSelected = newBudgetData.color === color;
                      return (
                        <TouchableOpacity
                          key={color}
                          style={[
                            styles.colorOption,
                            { backgroundColor: color },
                            isSelected && styles.colorOptionSelected,
                          ]}
                          onPress={() =>
                            setNewBudgetData({ ...newBudgetData, color })
                          }
                        />
                      );
                    }
                  )}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddBudget}
              >
                <Text style={styles.saveButtonText}>Thêm ngân sách</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Smart Budget feature removed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    backgroundColor: "rgba(15,23,36,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f1724" },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: { fontSize: 24, color: "#fff", fontWeight: "700" },
  content: { padding: 16 },
  monthSelector: { paddingBottom: 16, gap: 8 },
  monthButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,36,0.06)",
  },
  monthButtonActive: { backgroundColor: "#6366F1" },
  monthText: { color: "rgba(15,23,36,0.6)", fontWeight: "700", fontSize: 13 },
  monthTextActive: { color: "#0f1724" },
  overviewCard: {
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  overviewLabel: { fontSize: 14, color: "rgba(15,23,36,0.7)", marginBottom: 8 },
  overviewAmount: { fontSize: 36, fontWeight: "900", color: "#0f1724", marginBottom: 16 },
  overviewStats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  overviewStat: { alignItems: "center" },
  statLabel: { fontSize: 12, color: "rgba(15,23,36,0.6)", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#0f1724" },
  statDivider: { width: 1, height: 40, backgroundColor: "rgba(15,23,36,0.1)" },
  totalProgress: {
    height: 8,
    backgroundColor: "rgba(15,23,36,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  totalProgressFill: { height: "100%", borderRadius: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#0f1724", marginBottom: 16 },
  budgetCard: {
    backgroundColor: "rgba(15,23,36,0.04)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetInfo: { flexDirection: "row", alignItems: "center" },
  budgetIcon: { fontSize: 28, marginRight: 10 },
  budgetCategory: { fontSize: 16, fontWeight: "800", color: "#0f1724" },
  warningBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  warningBadgeText: { color: "#fff", fontSize: 12, fontWeight: "900" },
  editContainer: { marginBottom: 12 },
  editInput: {
    backgroundColor: "rgba(15,23,36,0.08)",
    borderRadius: 12,
    padding: 12,
    color: "#0f1724",
    fontSize: 16,
    fontWeight: "700",
  },
  budgetAmounts: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  amountItem: { alignItems: "center" },
  amountLabel: { fontSize: 11, color: "rgba(15,23,36,0.5)", marginBottom: 4 },
  amountValue: { fontSize: 14, fontWeight: "800", color: "#0f1724" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(15,23,36,0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: "700", color: "rgba(15,23,36,0.7)", minWidth: 40 },
  predictionAlert: {
    marginTop: 8,
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: 8,
    padding: 8,
  },
  predictionText: { fontSize: 12, color: "#F59E0B", fontWeight: "700" },
  actionsGrid: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: "rgba(15,23,36,0.04)",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15,23,36,0.1)",
  },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: "rgba(15,23,36,0.8)", fontWeight: "600", textAlign: "center" },
  statValueDanger: { color: "#EF4444" },
  statValueSuccess: { color: "#10B981" },
  statValueWarning: { color: "#F59E0B" },
  totalProgressFillDanger: { backgroundColor: "#EF4444" },
  totalProgressFillNormal: { backgroundColor: "#6366F1" },

  // Loading, Error, Empty states
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

  // Budget actions
  budgetActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  editIcon: {
    fontSize: 16,
  },
  deleteIcon: {
    fontSize: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#E0F2F1",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,36,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f1724",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,36,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseIcon: {
    fontSize: 18,
    color: "#0f1724",
    fontWeight: "700",
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f1724",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(15,23,36,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f1724",
    borderWidth: 1,
    borderColor: "rgba(15,23,36,0.1)",
  },
  colorGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
  },
  colorOption: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 8,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#0f1724",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(15,23,36,0.1)",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#0f1724",
    fontWeight: "700",
    fontSize: 14,
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Smart Budget styles removed
} as const);
