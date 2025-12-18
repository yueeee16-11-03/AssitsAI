import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GoalService from '../../services/GoalService';

type Props = NativeStackScreenProps<RootStackParamList, 'GoalDetail'>;

type GoalCategory = 'saving' | 'purchase' | 'investment' | 'education';
type GoalPriority = 'high' | 'medium' | 'low';

export default function GoalEditScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = getStyles(theme);
  const TAB_BAR_HEIGHT = 70;
  // Get goal data directly from params - it's passed as the initial goal object
  const initialGoal = (route.params?.goal as any) || null;
  const goalId = initialGoal?.id ?? null;
  const onSave = route.params?.onSave as ((g: any) => void) | undefined;

  const [goal, setGoal] = useState<any>(initialGoal);
  const [loading, setLoading] = useState(!initialGoal);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState<GoalCategory>('saving');
  const [priority, setPriority] = useState<GoalPriority>('medium');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [txPage, setTxPage] = useState(0);

  useEffect(() => {
    const loadGoalData = async () => {
      try {
        setLoading(true);
        // If goal was passed directly, use it
        if (initialGoal && initialGoal.id) {
          setGoal(initialGoal);
          setTitle(initialGoal.title || '');
          setDescription(initialGoal.description || '');
          setTargetAmount(initialGoal.targetAmount?.toString() || '');
          setCurrentAmount(initialGoal.currentAmount?.toString() || '0');
          setMonthlyContribution(initialGoal.monthlyContribution?.toString() || '');
          setCategory((initialGoal.category || 'saving') as GoalCategory);
          setPriority((initialGoal.priority || 'medium') as GoalPriority);
          
          // Handle deadline - convert to MM/YYYY format
          let deadlineStr = '';
          if (initialGoal.deadline) {
            let deadlineDate: Date | null = null;
            if (initialGoal.deadline instanceof Date) {
              deadlineDate = initialGoal.deadline;
            } else if (initialGoal.deadline?.toDate instanceof Function) {
              deadlineDate = initialGoal.deadline.toDate();
            } else if (typeof initialGoal.deadline === 'string') {
              deadlineDate = new Date(initialGoal.deadline);
            }
            if (deadlineDate) {
              const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
              const year = deadlineDate.getFullYear();
              deadlineStr = `${month}/${year}`;
            }
          }
          setDeadline(deadlineStr);
          setLoading(false);
          return;
        }
        // Otherwise, fetch from service
        if (!goalId) {
          Alert.alert('Lỗi', 'Không có ID mục tiêu');
          navigation.goBack();
          return;
        }
        const goals = await GoalService.getAllGoals();
        const foundGoal = goals.find((g: any) => g.id === goalId) as any;
        if (foundGoal) {
          setGoal(foundGoal);
          setTitle(foundGoal.title || '');
          setDescription(foundGoal.description || '');
          setTargetAmount(foundGoal.targetAmount?.toString() || '');
          setCurrentAmount(foundGoal.currentAmount?.toString() || '0');
          setMonthlyContribution(foundGoal.monthlyContribution?.toString() || '');
          setCategory((foundGoal.category || 'saving') as GoalCategory);
          setPriority((foundGoal.priority || 'medium') as GoalPriority);
          
          // Handle deadline
          let deadlineStr = '';
          if (foundGoal.deadline) {
            let deadlineDate: Date | null = null;
            if (foundGoal.deadline instanceof Date) {
              deadlineDate = foundGoal.deadline;
            } else if (foundGoal.deadline?.toDate instanceof Function) {
              deadlineDate = foundGoal.deadline.toDate();
            } else if (typeof foundGoal.deadline === 'string') {
              deadlineDate = new Date(foundGoal.deadline);
            }
            if (deadlineDate) {
              const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
              const year = deadlineDate.getFullYear();
              deadlineStr = `${month}/${year}`;
            }
          }
          setDeadline(deadlineStr);
        } else {
          Alert.alert('Lỗi', 'Không tìm thấy mục tiêu');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading goal:', error);
        Alert.alert('Lỗi', 'Không thể tải mục tiêu');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadGoalData();
  }, [initialGoal, goalId, navigation]);

  const formatVND = (v: number) => {
    if (!isFinite(v)) return '0 VNĐ';
    return `${v.toLocaleString('vi-VN')} VNĐ`;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên mục tiêu');
      return;
    }
    const target = parseFloat(targetAmount.replace(/,/g, ''));
    if (isNaN(target) || target <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền mục tiêu hợp lệ');
      return;
    }
    if (!deadline) {
      Alert.alert('Lỗi', 'Vui lòng nhập hạn chót (MM/YYYY)');
      return;
    }

    try {
      setSaving(true);
      // Parse deadline from MM/YYYY format
      let deadlineIso = '';
      if (deadline && /^(0?[1-9]|1[0-2])\/(\d{4})$/.test(deadline)) {
        const parts = deadline.split('/');
        const mm = parseInt(parts[0], 10) - 1;
        const yy = parseInt(parts[1], 10);
        const deadlineDate = new Date(yy, mm, 1);
        deadlineIso = deadlineDate.toISOString();
      }

      const updatedGoal = {
        title: title.trim(),
        description: description.trim(),
        targetAmount: target,
        currentAmount: parseFloat(currentAmount) || 0,
        monthlyContribution: parseFloat(monthlyContribution.replace(/,/g, '')) || 0,
        deadline: deadlineIso,
        category,
        priority,
      };
      await GoalService.updateGoal(goalId, updatedGoal);
      const updated = { ...goal, ...updatedGoal };
      setGoal(updated);
      onSave?.(updated);
      Alert.alert('Thành công', 'Mục tiêu đã được cập nhật');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Lỗi', 'Không thể lưu mục tiêu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa mục tiêu "${title}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', onPress: () => {}, style: 'cancel' },
        {
          text: 'Xóa',
          onPress: async () => {
            try {
              setDeleting(true);
              await GoalService.deleteGoal(goalId);
              Alert.alert('Thành công', 'Mục tiêu đã được xóa');
              onSave?.(null);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Lỗi', 'Không thể xóa mục tiêu');
            } finally {
              setDeleting(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading || !goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={20} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa mục tiêu</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.containerCentered}>
          <Text>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa mục tiêu</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
            
            <Text style={styles.label}>Tên mục tiêu</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="VD: Mua xe"
              style={styles.input}
              placeholderTextColor={theme.colors.onSurfaceVariant}
            />

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mô tả (tùy chọn)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả ngắn"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                multiline
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroupHalf, styles.formGroupLeft]}> 
                <Text style={styles.label}>Số tiền mục tiêu (VNĐ)</Text>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
              </View>

              <View style={[styles.formGroupHalf, styles.formGroupRight]}> 
                <Text style={styles.label}>Tiết kiệm/tháng (VNĐ)</Text>
                <TextInput
                  value={monthlyContribution}
                  onChangeText={setMonthlyContribution}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.input}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hạn chót (tháng/năm)</Text>
              <TextInput
                value={deadline}
                onChangeText={setDeadline}
                placeholder="MM/YYYY"
                style={styles.input}
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Danh mục</Text>
              <View style={styles.categoryGridModal}>
                {([
                  { key: 'saving' as GoalCategory, label: 'Tiết kiệm', icon: 'piggy-bank' },
                  { key: 'purchase' as GoalCategory, label: 'Mua sắm', icon: 'cart' },
                  { key: 'investment' as GoalCategory, label: 'Đầu tư', icon: 'chart-line' },
                  { key: 'education' as GoalCategory, label: 'Học phí', icon: 'school' },
                ] as const).map(c => (
                  <TouchableOpacity key={c.key} style={[styles.categoryButton, category === c.key && styles.categoryButtonActive]} onPress={() => setCategory(c.key)}>
                    <Icon name={c.icon} size={20} color={category === c.key ? '#0F1724' : '#10B981'} style={styles.categoryIcon} />
                    <Text style={[styles.categoryButtonLabel, category === c.key && styles.categoryButtonLabelActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mức độ ưu tiên</Text>
              <View style={styles.priorityGroupModal}>
                {(['high', 'medium', 'low'] as const).map(p => (
                  <TouchableOpacity key={p} style={[styles.priorityButton, priority === p && styles.priorityButtonActive]} onPress={() => setPriority(p)}>
                    <Text style={[styles.priorityButtonLabel, priority === p && styles.priorityButtonLabelActive]}>{p === 'high' ? 'Cao' : p === 'medium' ? 'Trung' : 'Thấp'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Current Progress */}
          {goal && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.progressButton}
                onPress={() => setShowProgress(!showProgress)}
              >
                <View style={styles.progressButtonContent}>
                  <View>
                    <Text style={styles.progressButtonTitle}>Tiến độ hiện tại</Text>
                    <Text style={styles.progressButtonSubtitle}>
                      {formatVND(parseFloat(currentAmount) || 0)} / {formatVND(parseFloat(targetAmount) || 0)}
                    </Text>
                  </View>
                  <View style={styles.progressPercentage}>
                    <Text style={styles.progressPercentageText}>
                      {Math.min(
                        ((parseFloat(currentAmount) || 0) / (parseFloat(targetAmount) || 1)) * 100,
                        100
                      ).toFixed(0)}%
                    </Text>
                  </View>
                </View>
                <Icon
                  name={showProgress ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.progressIcon}
                />
              </TouchableOpacity>

              {showProgress && (
                <View style={styles.progressDetails}>
                  <View style={styles.metricsRow}>
                    <View style={styles.progressMetricCol}>
                      <Text style={styles.metricLabel}>Đã tiết kiệm</Text>
                      <Text style={styles.metricValue}>{formatVND(parseFloat(currentAmount) || 0)}</Text>
                    </View>
                    <View style={styles.progressMetricCol}>
                      <Text style={styles.metricLabel}>Mục tiêu</Text>
                      <Text style={styles.metricValue}>{formatVND(parseFloat(targetAmount) || 0)}</Text>
                    </View>
                    <View style={styles.progressMetricCol}>
                      <Text style={styles.metricLabel}>Tiến độ</Text>
                      <Text style={styles.metricValue}>
                        {Math.min(
                          ((parseFloat(currentAmount) || 0) / (parseFloat(targetAmount) || 1)) * 100,
                          100
                        ).toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  {/* Transaction History */}
                  {goal.transactions && goal.transactions.length > 0 && (
                    <View style={styles.transactionHistoryContainer}>
                      <Text style={styles.transactionHistoryTitle}>Lịch sử giao dịch</Text>
                      {(() => {
                        const txs = (goal.transactions || []).sort((a: any, b: any) => {
                          const dateA = new Date(typeof a.date === 'string' ? a.date : a.date?.toDate?.() || new Date()).getTime();
                          const dateB = new Date(typeof b.date === 'string' ? b.date : b.date?.toDate?.() || new Date()).getTime();
                          return dateB - dateA;
                        });
                        const totalPages = Math.ceil(txs.length / 5);
                        const startIdx = txPage * 5;
                        const endIdx = startIdx + 5;
                        const paginatedTxs = txs.slice(startIdx, endIdx);

                        return (
                          <>
                            {paginatedTxs.map((t: any) => (
                              <View key={t.id} style={styles.txRow}>
                                <View>
                                  <Text style={styles.txAmt}>{formatVND(t.amount)}</Text>
                                  <Text style={styles.txDate}>
                                    {typeof t.date === 'string' ? t.date.split('T')[0] : new Date(t.date?.toDate?.() || t.date).toISOString().split('T')[0]}
                                  </Text>
                                </View>
                                {t.note ? <Text style={styles.txNote}>{t.note}</Text> : null}
                              </View>
                            ))}
                            {totalPages > 1 && (
                              <View style={styles.paginationContainer}>
                                <TouchableOpacity
                                  style={[styles.paginationBtn, txPage === 0 && styles.paginationBtnDisabled]}
                                  onPress={() => setTxPage(Math.max(0, txPage - 1))}
                                  disabled={txPage === 0}
                                >
                                  <Icon name="chevron-left" size={18} color={txPage === 0 ? '#D1D5DB' : '#10B981'} />
                                </TouchableOpacity>
                                <Text style={styles.paginationText}>
                                  {txPage + 1} / {totalPages}
                                </Text>
                                <TouchableOpacity
                                  style={[styles.paginationBtn, txPage === totalPages - 1 && styles.paginationBtnDisabled]}
                                  onPress={() => setTxPage(Math.min(totalPages - 1, txPage + 1))}
                                  disabled={txPage === totalPages - 1}
                                >
                                  <Icon name="chevron-right" size={18} color={txPage === totalPages - 1 ? '#D1D5DB' : '#10B981'} />
                                </TouchableOpacity>
                              </View>
                            )}
                          </>
                        );
                      })()}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={handleSave}
              disabled={saving}
            >
              <Icon name="check" size={18} color="#fff" style={styles.iconMargin} />
              <Text style={styles.btnText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={handleDelete}
              disabled={deleting}
            >
              <Icon name="trash-can" size={18} color="#fff" style={styles.iconMargin} />
              <Text style={styles.btnText}>{deleting ? 'Đang xóa...' : 'Xóa mục tiêu'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => {
  const { surface, onSurface, onSurfaceVariant, outline } = theme.colors;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: surface },
    containerCentered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: outline },
    backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '800', color: onSurface },
    body: { padding: 16 },
    card: { backgroundColor: surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: outline },
    rowCenter: { flexDirection: 'row', alignItems: 'center' },
    iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 16, fontWeight: '800', color: onSurface },
    sub: { fontSize: 13, color: onSurfaceVariant, marginTop: 2 },
    metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    metricCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
    progressMetricCol: { flex: 1, alignItems: 'flex-start' },
    metricLabel: { fontSize: 12, color: onSurfaceVariant, minHeight: 18, textAlign: 'left' },
    metricValue: { fontSize: 15, fontWeight: '900', marginTop: 4, color: onSurface, textAlign: 'left' },
    section: { marginTop: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '800', color: onSurface, marginBottom: 8 },
    label: { fontSize: 12, fontWeight: '700', color: onSurfaceVariant, marginBottom: 8, marginTop: 12 },
    input: { backgroundColor: surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: outline, color: onSurface, marginBottom: 8 },
    textArea: { minHeight: 80 },
    actionsRow: { flexDirection: 'row', gap: 8 },
    btn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
    btnPrimary: { backgroundColor: '#10B981' },
    btnDanger: { backgroundColor: '#EF4444' },
    btnText: { color: '#fff', fontWeight: '800' },
    btnGhost: { backgroundColor: `${onSurface}0A` },
    btnGhostText: { color: onSurface, fontWeight: '700' },
    empty: { color: onSurfaceVariant, marginTop: 8 },
    txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: outline },
    txAmt: { fontWeight: '800', color: onSurface },
    txDate: { fontSize: 12, color: onSurfaceVariant, marginTop: 2 },
    txNote: { color: onSurfaceVariant, marginLeft: 12, maxWidth: 180, textAlign: 'right' },
    iconGridContainer: { marginBottom: 8 },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 8 },
    iconSelectBtn: { width: '23%', aspectRatio: 1, borderRadius: 12, backgroundColor: surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
    iconSelectBtnActive: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 12, marginBottom: 8 },
    colorBtn: { width: '23%', aspectRatio: 1, borderRadius: 12, borderWidth: 3, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
    colorBtnActive: { borderColor: onSurface },
    actionSection: { marginTop: 24, gap: 12 },
    spacer: { width: 40 },
    colorSectionTitle: { marginTop: 16 },
    transactionHistoryContainer: { marginTop: 12 },
    iconMargin: { marginRight: 8 },
    formGroup: { marginTop: 12 },
    formRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 },
    formGroupHalf: { flex: 1 },
    formGroupLeft: {},
    formGroupRight: {},
    categoryGridModal: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
    categoryButton: { 
      flex: 1, 
      minWidth: '48%',
      backgroundColor: surface, 
      borderRadius: 12, 
      paddingVertical: 12, 
      paddingHorizontal: 8,
      alignItems: 'center', 
      borderWidth: 2, 
      borderColor: '#10B981'
    },
    categoryButtonActive: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' },
    categoryIcon: { marginBottom: 4 },
    categoryButtonLabel: { fontSize: 12, fontWeight: '600', color: '#10B981' },
    categoryButtonLabelActive: { color: onSurface, fontWeight: '700' },
    priorityGroupModal: { flexDirection: 'row', gap: 8 },
    priorityButton: { 
      flex: 1, 
      backgroundColor: surface, 
      borderRadius: 12, 
      paddingVertical: 12,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: outline
    },
    priorityButtonActive: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: '#10B981' },
    priorityButtonLabel: { fontSize: 13, fontWeight: '600', color: onSurfaceVariant },
    priorityButtonLabelActive: { color: onSurface, fontWeight: '700' },
    progressButton: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      backgroundColor: surface,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: outline,
      marginTop: 8,
    },
    progressButtonContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    progressButtonTitle: { fontSize: 13, fontWeight: '700', color: onSurface },
    progressButtonSubtitle: { fontSize: 11, color: onSurfaceVariant, marginTop: 4 },
    progressPercentage: {
      backgroundColor: '#10B981',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 12,
    },
    progressPercentageText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    progressIcon: { marginLeft: 8 },
    progressDetails: { backgroundColor: surface, borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: outline },
    transactionHistoryTitle: { fontSize: 13, fontWeight: '700', color: onSurface, marginBottom: 8 },
    paginationContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, gap: 8 },
    paginationBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: outline },
    paginationBtnDisabled: { opacity: 0.5 },
    paginationText: { fontSize: 12, fontWeight: '600', color: onSurfaceVariant, minWidth: 40, textAlign: 'center' },
  });
};
