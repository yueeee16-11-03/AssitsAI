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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from "@react-navigation/native";
import NotificationService from '../../services/NotificationService';
import AIBudgetSuggestionService from '../../services/AIBudgetSuggestionService';
// AI helpers removed from header — suggestions are computed locally
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
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [fadeAnim] = useState(new Animated.Value(0));
  // use store-backed month selection so it persists across unmounts and navigation
  const selectedMonth = useBudgetStore(state => state.currentMonth);
  const selectedYear = useBudgetStore(state => state.currentYear);
  
  const setCurrentMonth = useBudgetStore(state => state.setCurrentMonth);
  const [suggestion, setSuggestion] = useState<null | { categoryId: string; category: string; icon?: string; amount: number; }>(null);
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
  const [modalSuggestions, setModalSuggestions] = useState<Array<{ categoryId: string; category: string; icon: string; amount: number; color: string }>>([]);
  const [showModalSuggestionButtons, setShowModalSuggestionButtons] = useState(false);
  const [modalSuggestionsLoading, setModalSuggestionsLoading] = useState(false);

  // Firebase store
  const budgets = useBudgetStore(state => state.budgets) as BudgetItem[];
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

  // Track fetch state to prevent concurrent fetches
  const fetchInProgressRef = React.useRef<boolean>(false);

  // Load budgets when screen focused - ALWAYS fetch fresh data from Firebase
  useFocusEffect(
    React.useCallback(() => {
      const year = typeof selectedYear === 'number' ? selectedYear : new Date().getFullYear();
      
      console.log('🔄 [SCREEN] onFocus - starting fetch (month:', selectedMonth, 'year:', year, ')');
      
      // Only start fetch if one isn't currently running
      if (fetchInProgressRef.current) {
        console.log('🔄 [SCREEN] onFocus - fetch already in progress, skipping');
      } else {
        fetchInProgressRef.current = true;

        // Set timeout to auto-unblock after 10s if fetch hangs
        const timeoutId = setTimeout(() => {
          if (fetchInProgressRef.current) {
            console.warn('⚠️ [SCREEN] Fetch timeout (10s) - auto-resetting flag');
            fetchInProgressRef.current = false;
          }
        }, 10000);

        console.log('   Calling fetchBudgets(', year, ',', selectedMonth, ')');
        fetchBudgets(year, selectedMonth).finally(() => {
          clearTimeout(timeoutId);
          fetchInProgressRef.current = false;
        });
      }

      // cleanup if the screen unmounts while fetch in-progress
      return () => {
        fetchInProgressRef.current = false;
      };
    }, [fetchBudgets, selectedMonth, selectedYear]
  )
  );

  // ADDITIONAL: Fetch when month or year changes (independent of focus)
  useEffect(() => {
    const year = typeof selectedYear === 'number' ? selectedYear : new Date().getFullYear();
    console.log('📅 [SCREEN] Month/Year changed - fetching for month:', selectedMonth, 'year:', year);
    
    fetchBudgets(year, selectedMonth).catch((err: any) => {
      console.error('❌ [SCREEN] Error fetching after month change:', err);
    });
  }, [selectedMonth, selectedYear, fetchBudgets]);

  // Build a simple smart suggestion after budgets load
  useEffect(() => {
    if (!budgets || budgets.length === 0) {
      setSuggestion(null);
      return;
    }

    // Prefer categories with no budget set, ordered by spent desc
    const noBudget = budgets
      .filter((b: BudgetItem) => !(b.budget && b.budget > 0))
      .slice()
      .sort((a: BudgetItem, b: BudgetItem) => (b.spent || 0) - (a.spent || 0));
    const sortedBudgets = [...budgets].sort((a: BudgetItem, b: BudgetItem) => (b.spent || 0) - (a.spent || 0));
    let candidate = noBudget[0] || sortedBudgets[0];
    if (!candidate) {
      setSuggestion(null);
      return;
    }

    const base = Math.max(candidate.spent || 0, candidate.predicted || 0);
    const amount = Math.max(1000000, Math.ceil((base || 1000000) / 1000000) * 1000000); // round to nearest million

    // Only suggest if there's meaningful spending
    if ((candidate.spent || 0) < 10000) {
      setSuggestion(null);
      return;
    }

    setSuggestion({ categoryId: candidate.categoryId, category: candidate.category, icon: candidate.icon, amount });
  }, [budgets]);

  // Debugging: log budgets whenever updated so we can track fades
  useEffect(() => {
    console.log('🔍 [SCREEN] budgets updated - length:', budgets?.length, 'month:', selectedMonth, 'year:', selectedYear, 'isLoading:', isLoading, 'error:', error);
    if (budgets && budgets.length > 0) {
      console.log('   Budget items:', budgets.map(b => `${b.category}(${b.id})`).join(', '));
    }
  }, [budgets, selectedMonth, selectedYear, isLoading, error]);
  
  // Ensure daily expense reminder is scheduled (20:00 local time)
  React.useEffect(() => {
    NotificationService.scheduleDailyExpenseReminder().catch((err: any) => {
      console.warn('BudgetPlannerScreen: failed scheduling daily expense reminder', err);
    });
    NotificationService.scheduleWeeklyMonthlyReports().catch((err: any) => {
      console.warn('BudgetPlannerScreen: failed scheduling weekly/monthly reports', err);
    });
  }, []);

  const formatCurrency = (v: number) => {
    const val = Math.round(v || 0);
    return `${val.toLocaleString('vi-VN')} VNĐ`;
  };

  const isIconName = (s?: string) => {
    if (!s) return false;
    // simple heuristic: icon names are alphanumeric with dashes/underscores
    return /^[a-z0-9-_]+$/i.test(s);
  };

  const renderBudgetIcon = (iconName?: string) => {
    const name = isIconName(iconName) ? (iconName as string) : 'briefcase-outline';
    return <Icon name={name} size={28} color="#0f1724" style={styles.budgetIcon} />;
  };

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

      console.log('🔁 [SCREEN] Adding budget:', newBudgetData.category);
      
      // Add budget to Firebase
      await addBudget({
        categoryId: newBudgetData.categoryId,
        category: newBudgetData.category,
        icon: newBudgetData.icon || "wallet",
        budget: newBudgetData.budget,
        color: newBudgetData.color,
      });

      console.log('🔁 [SCREEN] Budget added successfully; fetching fresh data for month', selectedMonth);
      // addBudget action trong store sẽ tự động fetch dữ liệu mới
      // Nhưng để chắc chắn dữ liệu hiển thị ngay, ta gọi fetchBudgets thêm lần nữa
      const year = typeof selectedYear === 'number' ? selectedYear : new Date().getFullYear();
      await fetchBudgets(year, selectedMonth);

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

  // Build modal suggestions when opening add modal
  useEffect(() => {
    if (!addModalVisible || !showModalSuggestionButtons) return;

    const compute = async () => {
      try {
        setModalSuggestionsLoading(true);

        // Gọi AI service để gợi ý 3-4 danh mục theo tháng hiện tại
        if (budgets && budgets.length > 0) {
          const response = await AIBudgetSuggestionService.suggestBudgets(
            budgets,
            selectedMonth,
            selectedYear
          );
          
          // Convert suggestions to modal suggestion format
          const colorMap: { [key: string]: string } = {
            '1': '#EC4899',   // Ăn uống
            '2': '#F59E0B',   // Mua sắm
            '3': '#8B5CF6',   // Di chuyển
            '4': '#6366F1',   // Nhà ở
            '5': '#10B981',   // Y tế
            '6': '#06B6D4',   // Giải trí
            '7': '#F59E0B',   // Lương
            '8': '#10B981',   // Thưởng
            '9': '#8B5CF6',   // Đầu tư
          };

          const suggestions = response.suggestions.map((s) => ({
            categoryId: s.categoryId,
            category: s.category,
            icon: s.icon,
            amount: s.suggestedBudget,
            color: colorMap[s.categoryId] || '#6366F1',
          }));

          setModalSuggestions(suggestions);
        }

        setModalSuggestionsLoading(false);
      } catch (err) {
        console.error('❌ [SCREEN] Error getting AI suggestion:', err);
        Alert.alert('Lỗi', 'Không thể lấy gợi ý từ AI');
        setModalSuggestionsLoading(false);
      }
    };

    compute();
  }, [addModalVisible, budgets, showModalSuggestionButtons, selectedMonth, selectedYear]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ngân sách</Text>
        {/* spacer to keep title centered; FAB used for adding budgets */}
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && budgets.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải ngân sách...</Text>
        </View>
      ) : error && budgets.length === 0 ? (
        <View style={styles.errorContainer}>
          <View style={styles.iconTextRow}>
            <Icon name="alert-circle-outline" size={18} color="#EF4444" style={styles.iconSpacingSmall} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              fetchBudgets(typeof selectedYear === 'number' ? selectedYear : new Date().getFullYear(), selectedMonth);
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : budgets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="chart-pie" size={48} color="#6366F1" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Chưa có ngân sách nào</Text>
          <Text style={styles.emptySubtext}>Nhấn nút + để thêm ngân sách mới</Text>
          <Text style={[styles.emptySubtext, styles.emptySubtextExtra]}>({monthNames[selectedMonth]} - {selectedYear})</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
          showsVerticalScrollIndicator={false}
        >
          {isLoading && (
            <View style={styles.refreshIndicatorWrap} pointerEvents="none">
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          )}
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Month Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.monthSelector, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
            >
              {monthNames.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthButton,
                    selectedMonth === index && styles.monthButtonActive,
                  ]}
                  onPress={() => setCurrentMonth(index)}
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
              <Text style={styles.overviewAmount}>{formatCurrency(totalBudget)}</Text>
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
                    {formatCurrency(totalSpent)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.statLabel}>Còn lại</Text>
                  <Text style={[styles.statValue, styles.statValueSuccess]}>
                    {formatCurrency(totalBudget - totalSpent)}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.overviewStat}>
                  <Text style={styles.statLabel}>Dự kiến</Text>
                  <Text style={[styles.statValue, styles.statValueWarning]}>
                    {formatCurrency(totalPredicted)}
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
                                  {renderBudgetIcon(item.icon)}
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
                          <Icon name="pencil" size={16} color="#0f1724" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteBudget(item.id)}
                          style={styles.actionButton}
                        >
                          <Icon name="trash-can-outline" size={16} color="#0f1724" />
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
                            <Text style={styles.amountValue}>{formatCurrency(item.budget)}</Text>
                            <Text style={styles.remainingText}>Còn {formatCurrency((item.budget || 0) - (spent || 0))}</Text>
                          </View>
                          <View style={styles.amountItem}>
                            <Text style={styles.amountLabel}>Đã chi</Text>
                            <Text style={[styles.amountValue, { color: statusColor }]}>{formatCurrency(spent)}</Text>
                          </View>
                          <View style={styles.amountItem}>
                            <Text style={styles.amountLabel}>Dự kiến</Text>
                            <Text style={[styles.amountValue, styles.statValueWarning]}>{formatCurrency(predicted)}</Text>
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
                            <View style={styles.iconTextRow}>
                              <Icon name="alert-circle-outline" size={14} color="#F59E0B" style={styles.iconSpacingSmall} />
                              <Text style={styles.predictionText}>
                                Dự kiến vượt {formatCurrency(predicted - item.budget)}
                              </Text>
                            </View>
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
                    <Icon name="lightbulb-on-outline" size={32} color="#10B981" style={styles.actionIcon} />
                    <Text style={styles.actionText}>Gợi ý tiết kiệm</Text>
                  </TouchableOpacity>
                </View>
            </View>
          </Animated.View>
            <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
        </ScrollView>
      )}

      {/* Add Budget Modal */}
      {/* Floating Add FAB */}
      <TouchableOpacity
            style={styles.fabWrap}
            onPress={() => {
              setShowModalSuggestionButtons(false);
              setAddModalVisible(true);
            }}
        activeOpacity={0.9}
      >
        <View style={styles.fabButton}>
          <Text style={styles.fabPlus}>+</Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setAddModalVisible(false);
          setShowModalSuggestionButtons(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm ngân sách mới</Text>
              <View style={styles.modalAIWrapper}>
                <TouchableOpacity
                  onPress={() => setAddModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Icon name="close" size={18} color="#0f1724" style={styles.modalCloseIcon} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.modalBody, { paddingBottom: Math.max(120, insets.bottom + TAB_BAR_HEIGHT) }]}>
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
                  placeholder="Ví dụ: silverware-fork-knife"
                  placeholderTextColor="rgba(15,23,36,0.4)"
                  value={newBudgetData.icon}
                  onChangeText={(text) =>
                    setNewBudgetData({ ...newBudgetData, icon: text })
                  }
                  maxLength={32}
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

                {/* Modal suggestions (horizontal) */}
                <View style={styles.modalSuggestionsWrap}>
                  <View style={styles.modalSuggestionsHeader}>
                      <TouchableOpacity
                        style={[styles.modalAISmall, showModalSuggestionButtons && styles.modalAISmallActive]}
                        onPress={() => setShowModalSuggestionButtons(v => !v)}
                        disabled={modalSuggestionsLoading}
                      >
                        {modalSuggestionsLoading ? (
                          <ActivityIndicator size="small" color={showModalSuggestionButtons ? '#ffffff' : '#0f1724'} />
                        ) : (
                          <Icon name="robot" size={18} color={showModalSuggestionButtons ? '#ffffff' : '#0f1724'} />
                        )}
                      </TouchableOpacity>
                    <Text style={styles.modalSuggestionsLabel}>
                      {modalSuggestionsLoading ? 'Đang phân tích...' : 'Gợi ý tạo ngân sách'}
                    </Text>
                  </View>
                  {showModalSuggestionButtons && modalSuggestions && modalSuggestions.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalSuggestionsScroll}>
                      {modalSuggestions.map((s, i) => (
                        <TouchableOpacity
                          key={`${s.categoryId}-${s.amount}-${i}`}
                          style={[styles.modalSuggestionCard, { borderColor: s.color || '#E5E7EB' }]}
                          onPress={() => {
                            setNewBudgetData({
                              category: s.category,
                              categoryId: s.categoryId,
                              icon: s.icon,
                              budget: s.amount,
                              color: s.color,
                            });
                            setShowModalSuggestionButtons(false);
                          }}
                        >
                          <Icon name={s.icon} size={28} color={s.color} style={styles.modalSuggestionIcon} />
                          <Text style={styles.modalSuggestionName} numberOfLines={1}>{s.category}</Text>
                          <Text style={styles.modalSuggestionAmount}>{formatCurrency(s.amount)}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
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
              <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setAddModalVisible(false);
                  setShowModalSuggestionButtons(false);
                }}
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

          {/* Smart Suggestion */}
          {suggestion && (
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionText} numberOfLines={2}>
                Dựa trên chi tiêu tháng trước, bạn có muốn tạo ngân sách {formatCurrency(suggestion.amount)} cho {suggestion.category} không?
              </Text>
              <View style={styles.suggestionActions}>
                <TouchableOpacity
                  style={styles.suggestionButtonSkip}
                  onPress={() => setSuggestion(null)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestionSkipText}>Bỏ qua</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.suggestionButtonAgree}
                  onPress={async () => {
                    try {
                      await addBudget({
                        categoryId: suggestion.categoryId,
                        category: suggestion.category,
                        icon: suggestion.icon || 'credit-card-outline',
                        budget: suggestion.amount,
                        color: '#6366F1',
                      });
                      Alert.alert('Thành công', 'Ngân sách đã được tạo');
                      setSuggestion(null);
                      // Force refetch to ensure latest data is displayed
                      const year = typeof selectedYear === 'number' ? selectedYear : new Date().getFullYear();
                      await fetchBudgets(year, selectedMonth);
                    } catch (err) {
                      Alert.alert('Lỗi', (err as Error).message);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.suggestionAgreeText}>Đồng ý</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Smart Budget feature removed */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#111827" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: { fontSize: 24, color: "#FFFFFF", fontWeight: "700" },
  headerSpacer: { width: 40 },
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
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(15,23,36,0.04)",
  },
  overviewLabel: { fontSize: 14, color: "rgba(15,23,36,0.7)", marginBottom: 8 },
  overviewAmount: { fontSize: 16, fontWeight: "800", color: "#0f1724", marginBottom: 8 },
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
  emptySubtextExtra: { marginTop: 6 },

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
    backgroundColor: "#FFFFFF",
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
  modalAIWrapper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalAIRightMargin: { marginRight: 6 },
  modalAIXIcon: {
    fontSize: 18,
    color: "#0f1724",
    fontWeight: "700",
    marginRight: 6,
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

  /* New UI: suggestion card, FAB, remaining text */
  suggestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  suggestionText: { color: '#0f1724', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  suggestionActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  suggestionButtonSkip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'rgba(15,23,36,0.06)' },
  suggestionSkipText: { color: '#0f1724', fontWeight: '700' },
  suggestionButtonAgree: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#10B981' },
  suggestionAgreeText: { color: '#fff', fontWeight: '800' },

  remainingText: { color: 'rgba(15,23,36,0.6)', fontSize: 12, marginTop: 6 },

  fabWrap: { position: 'absolute', right: 20, bottom: 28, zIndex: 30 },
  fabButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center', shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 12, elevation: 10 },
  fabPlus: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },

  iconTextRow: { flexDirection: 'row', alignItems: 'center' },
  iconSpacingSmall: { marginRight: 8 },
  modalSuggestionsWrap: { marginTop: 12 },
  modalSuggestionsLabel: { fontSize: 13, fontWeight: '800', color: '#0f1724', marginBottom: 8 },
  modalSuggestionsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  modalAISmall: { width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(15,23,36,0.04)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  modalAISmallActive: { backgroundColor: '#10B981' },
  modalSuggestionsScroll: { paddingLeft: 2 },
  modalSuggestionCard: { width: 140, borderRadius: 12, padding: 12, backgroundColor: '#FFFFFF', marginRight: 12, borderWidth: 1, alignItems: 'center' },
  modalSuggestionIcon: { marginBottom: 8 },
  modalSuggestionName: { fontSize: 13, fontWeight: '800', color: '#0f1724', marginBottom: 4 },
  modalSuggestionAmount: { fontSize: 13, fontWeight: '700', color: '#6366F1' },

  // small refresh spinner that sits above content
  refreshIndicatorWrap: {
    position: 'absolute',
    right: 20,
    top: 8,
    zIndex: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  // Smart Budget styles removed
} as const);
