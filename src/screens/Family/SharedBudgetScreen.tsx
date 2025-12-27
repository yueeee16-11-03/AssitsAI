import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { useFamilyStore } from '../../store/familyStore';
import { useSharedBudgetStore } from '../../store/sharedBudgetStore';
import SharedBudgetApi from '../../api/sharedBudgetApi';

type Props = NativeStackScreenProps<RootStackParamList, any>;

export default function SharedBudgetScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const { currentFamily } = useFamilyStore();
  const { budgets, loading, fetchBudgets, addSpending } = useSharedBudgetStore();

  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const loadBudgetsAndSummary = useCallback(async () => {
    if (!currentFamily?.id) return;

    await fetchBudgets(currentFamily.id);

    // Load summary
    setLoadingSummary(true);
    try {
      const summaryResponse = await SharedBudgetApi.getBudgetSummary(currentFamily.id);
      if (summaryResponse.success) {
        setSummary(summaryResponse.summary);
      }
    } catch (error) {
      console.error('Error loading budget summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  }, [currentFamily?.id, fetchBudgets]);

  // Load budgets on mount
  React.useEffect(() => {
    if (currentFamily?.id) {
      loadBudgetsAndSummary();
    }
  }, [currentFamily?.id, loadBudgetsAndSummary]);

  // Check if user is family owner
  const isOwner = (): boolean => {
    const currentUser = auth().currentUser;
    if (!currentUser) return false;
    return currentFamily?.ownerId === currentUser.uid;
  };

  // Handle add budget
  const handleAddBudget = () => {
    Alert.prompt(
      'Tạo ngân sách mới',
      'Nhập tên ngân sách (ví dụ: Ăn uống, Tiện ích):',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tiếp tục',
          onPress: (budgetName: string | undefined) => {
            if (!budgetName || budgetName.trim().length < 3) {
              Alert.alert('Lỗi', 'Tên ngân sách phải có ít nhất 3 ký tự');
              return;
            }
            handleCreateBudgetFlow(budgetName.trim());
          },
        },
      ]
    );
  };

  const handleCreateBudgetFlow = (budgetName: string) => {
    Alert.prompt(
      'Nhập số tiền ngân sách',
      `Ngân sách ${budgetName} bao nhiêu (VNĐ)?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tạo',
          onPress: (amountStr: string | undefined) => {
            const amount = parseFloat(amountStr || '0');
            if (isNaN(amount) || amount <= 0) {
              Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
              return;
            }
            createBudget(budgetName, amount);
          },
        },
      ]
    );
  };

  const createBudget = async (name: string, amount: number) => {
    if (!currentFamily?.id) return;

    const currentUser = auth().currentUser;
    if (!currentUser) return;

    const result = await useSharedBudgetStore.getState().createBudget(
      currentFamily.id,
      {
        familyId: currentFamily.id,
        name,
        category: name.toLowerCase(),
        amount,
        spent: 0,
        currency: 'VND',
        period: 'monthly',
        startDate: new Date(),
        members: currentFamily.memberIds || [],
        createdBy: currentUser.uid,
        alert: { enabled: true, threshold: 80 },
      }
    );

    if (result.success) {
      Alert.alert('Thành công', `Đã tạo ngân sách "${name}"`);
      loadBudgetsAndSummary();
    } else {
      Alert.alert('Lỗi', 'Không thể tạo ngân sách');
    }
  };

  // Handle add spending
  const handleAddSpending = (budgetId: string, budgetName: string) => {
    Alert.prompt(
      'Thêm chi tiêu',
      `Chi tiêu bao nhiêu cho "${budgetName}" (VNĐ)?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thêm',
          onPress: (amountStr: string | undefined) => {
            const amount = parseFloat(amountStr || '0');
            if (isNaN(amount) || amount <= 0) {
              Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
              return;
            }
            handleSpendingFlow(budgetId, budgetName, amount);
          },
        },
      ]
    );
  };

  const handleSpendingFlow = (budgetId: string, budgetName: string, amount: number) => {
    Alert.prompt(
      'Mô tả chi tiêu',
      'Nhập mô tả (ví dụ: Mua rau, Tiền nước):',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: (description: string | undefined) => {
            addSpendingTransaction(budgetId, budgetName, amount, description || '');
          },
        },
      ],
      'plain-text'
    );
  };

  const addSpendingTransaction = async (
    budgetId: string,
    budgetName: string,
    amount: number,
    description: string
  ) => {
    if (!currentFamily?.id) return;

    const result = await addSpending(
      currentFamily.id,
      budgetId,
      amount,
      description,
      budgetName.toLowerCase(),
      currentFamily.members?.find(m => m.userId === auth().currentUser?.uid)?.name || 'Thành viên'
    );

    if (result.success) {
      Alert.alert('Thành công', `Đã thêm chi tiêu ${formatCurrency(amount)}`);
      loadBudgetsAndSummary();
    } else {
      Alert.alert('Lỗi', 'Không thể thêm chi tiêu');
    }
  };

  const handleDeleteBudget = (budgetId: string, budgetName: string) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa ngân sách "${budgetName}"?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            if (!currentFamily?.id) return;
            const result = await useSharedBudgetStore.getState().deleteBudget(
              currentFamily.id,
              budgetId
            );
            if (result.success) {
              Alert.alert('Thành công', 'Đã xóa ngân sách');
              loadBudgetsAndSummary();
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `${new Intl.NumberFormat('vi-VN').format(amount)} VNĐ`;
  };

  const getPercentageUsed = (spent: number, amount: number) => {
    return amount > 0 ? (spent / amount) * 100 : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#FF6B6B';
    if (percentage >= 80) return '#FFA500';
    return theme.colors.secondary;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ngân sách chung</Text>
        <View style={styles.headerActions}>
          {isOwner() && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddBudget}>
              <Icon name="plus" size={24} color={theme.colors.onSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Summary */}
        {loadingSummary ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : summary ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Tổng hợp ngân sách</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tổng ngân sách</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                  {formatCurrency(summary.totalBudget)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Đã chi</Text>
                <Text style={[styles.summaryValue, { color: getProgressColor(summary.percentageUsed) }]}>
                  {formatCurrency(summary.totalSpent)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Còn lại</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>
                  {formatCurrency(summary.totalRemaining)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryProgress}>
              <View
                style={[
                  styles.summaryProgressFill,
                  {
                    width: `${Math.min(summary.percentageUsed, 100)}%`,
                    backgroundColor: getProgressColor(summary.percentageUsed),
                  },
                ]}
              />
            </View>
            <Text style={styles.summaryPercentage}>
              {summary.percentageUsed.toFixed(1)}% ngân sách đã chi
            </Text>
          </View>
        ) : null}

        {/* Budgets List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Các ngân sách ({budgets.length})</Text>

          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : budgets.length === 0 ? (
            <View style={[styles.budgetCard, styles.emptyBudgetContainer]}>
              <Icon name="wallet-outline" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.budgetDesc, styles.emptyBudgetText]}>Chưa có ngân sách nào</Text>
              {isOwner() && (
                <TouchableOpacity style={[styles.addButton, styles.addBudgetBtnMargin]} onPress={handleAddBudget}>
                  <Icon name="plus" size={20} color={theme.colors.onSecondary} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            budgets.map((budget) => {
              const percentageUsed = getPercentageUsed(budget.spent, budget.amount);
              const progressColor = getProgressColor(percentageUsed);

              return (
                <View key={budget.id} style={[styles.budgetCard, { borderLeftColor: progressColor }]}>
                  {/* Budget Header */}
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <Text style={styles.budgetName}>{budget.name}</Text>
                      <Text style={styles.budgetPeriod}>{budget.period === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}</Text>
                    </View>
                    <View style={styles.budgetBadge}>
                      <Text style={[styles.budgetBadgeText, { color: progressColor }]}>
                        {percentageUsed.toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* Budget Progress */}
                  <View style={styles.budgetProgress}>
                    <View
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: `${Math.min(percentageUsed, 100)}%`,
                          backgroundColor: progressColor,
                        },
                      ]}
                    />
                  </View>

                  {/* Budget Stats */}
                  <View style={styles.budgetStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Chi:</Text>
                      <Text style={styles.statValue}>{formatCurrency(budget.spent)}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Tổng:</Text>
                      <Text style={styles.statValue}>{formatCurrency(budget.amount)}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Còn:</Text>
                      <Text style={[styles.statValue, { color: theme.colors.secondary }]}>
                        {formatCurrency(budget.amount - budget.spent)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.budgetActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleAddSpending(budget.id, budget.name)}
                    >
                      <Icon name="plus" size={18} color={theme.colors.primary} style={styles.iconMarginSmall} />
                      <Text style={styles.actionBtnText}>Thêm chi</Text>
                    </TouchableOpacity>
                    {isOwner() && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnDanger]}
                        onPress={() => handleDeleteBudget(budget.id, budget.name)}
                      >
                        <Icon name="delete" size={18} color="#FF6B6B" style={styles.iconMarginSmall} />
                        <Text style={[styles.actionBtnText, styles.deleteText]}>Xóa</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    scrollView: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 16,
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 137, 123, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backIcon: { fontSize: 20, color: theme.colors.primary },
    headerTitle: { fontSize: 18, fontWeight: '800', color: theme.colors.primary },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: { padding: 16, paddingBottom: 200 },
    summaryCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
    },
    summaryTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.primary, marginBottom: 16, textAlign: 'center' },
    summaryStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
    summaryItem: { alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
    summaryValue: { fontSize: 16, fontWeight: '800' },
    summaryDivider: { width: 1, height: 40, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
    summaryProgress: { height: 8, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    summaryProgressFill: { height: '100%', borderRadius: 4 },
    summaryPercentage: { fontSize: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.primary, marginBottom: 16 },
    budgetCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    budgetInfo: { flex: 1 },
    budgetName: { fontSize: 16, fontWeight: '800', color: theme.colors.primary, marginBottom: 2 },
    budgetPeriod: { fontSize: 12, color: theme.colors.onSurfaceVariant },
    budgetBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
    budgetBadgeText: { fontSize: 14, fontWeight: '800' },
    budgetProgress: { height: 6, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
    budgetProgressFill: { height: '100%', borderRadius: 3 },
    budgetStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 11, color: theme.colors.onSurfaceVariant, marginBottom: 2 },
    statValue: { fontSize: 13, fontWeight: '700', color: theme.colors.onSurface },
    statDivider: { width: 1, height: 30, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
    budgetActions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
    actionBtnText: { color: theme.colors.primary, fontWeight: '700', fontSize: 12 },
    actionBtnDanger: { backgroundColor: theme.dark ? 'rgba(255, 107, 107, 0.1)' : 'rgba(255, 107, 107, 0.08)' },
    budgetDesc: { fontSize: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center' },
    emptyBudgetContainer: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
    emptyBudgetText: { marginTop: 8 },
    addBudgetBtnMargin: { marginTop: 16 },
    iconMarginSmall: { marginRight: 6 },
    deleteText: { color: '#FF6B6B' },
    spacer: { height: 200 },
  });
