/**
 * ╔════════════════════════════════════════════════════════════════════════════╗
 * ║         FAMILY BUDGET MANAGEMENT SCREEN                                    ║
 * ║           Quản lý ngân sách của gia đình                                   ║
 * ╚════════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FamilyMemberService, { FamilyMember } from '../../services/FamilyMemberService';
import FamilyBudgetManagementService from '../../services/admin/FamilyBudgetManagementService';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

type BudgetData = {
  id: string;
  name: string;
  limit: number;
  spent: number;
  currency: string;
  period: 'weekly' | 'monthly' | 'yearly';
  memberId: string;
  memberName: string;
  memberRole?: 'owner' | 'admin' | 'member' | 'child';
  createdAt: Date;
  updatedAt: Date;
};

export default function FamilyBudgetScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();

  // ─────────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────────

  const [refreshing, setRefreshing] = useState(false);
  const [budgets, setBudgets] = useState<BudgetData[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [_familyId, setFamilyId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    limit: '',
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    memberId: '',
    memberName: '',
  });

  // ─────────────────────────────────────────────────────────────────
  // HOOKS & DATA
  // ─────────────────────────────────────────────────────────────────

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Get user's family
      const userFamily = await FamilyMemberService.getUserFamily();
      if (!userFamily) {
        Alert.alert('Lỗi', 'Bạn chưa tham gia gia đình nào');
        setLoading(false);
        return;
      }

      const fId = userFamily.familyId;
      setFamilyId(fId);

      // 2. Fetch all family members
      console.log('🔵 [SCREEN] Fetching members for family:', fId);
      const fetchedMembers = await FamilyMemberService.getFamilyMembers(fId);
      setMembers(fetchedMembers);
      console.log('✅ [SCREEN] Members fetched:', fetchedMembers.length);

      // 3. Fetch budgets cá nhân cho mỗi member
      console.log('🔵 [SCREEN] Fetching personal budgets for each member');
      const budgetDataList: BudgetData[] = [];
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      // Lặp qua từng member và lấy budgets cá nhân
      for (const member of fetchedMembers) {
        try {
          // Lấy budgets cá nhân của member từ families/{familyId}/members/{userId}/budgets
          const memberBudgets = await FamilyBudgetManagementService.getMemberPersonalBudgets(
            fId as string,
            member.userId,
            currentYear,
            currentMonth
          );
          
          console.log(`  📊 [SCREEN] Member "${member.name}" (${member.userId}):`, {
            budgetCount: memberBudgets.length,
            details: memberBudgets.map((b: any) => ({
              id: b.id,
              category: b.category,
              budget: b.budget,
              spent: b.spent,
            }))
          });
          
          memberBudgets.forEach((budget: any) => {
            console.log(`    └─ Adding budget: ${budget.category} (limit: ${budget.budget}, spent: ${budget.spent})`);
            budgetDataList.push({
              id: budget.id,
              name: budget.category,
              limit: budget.budget || 0,
              spent: budget.spent || 0,
              currency: 'VND',
              period: 'monthly',
              memberId: member.userId,
              memberName: member.name,
              memberRole: member.role,
              createdAt: new Date(budget.createdAt || Date.now()),
              updatedAt: new Date(budget.updatedAt || Date.now()),
            });
          });
        } catch (err) {
          console.warn(`  ❌ [SCREEN] Error fetching budgets for ${member.name}:`, err);
        }
      }
      
      setBudgets(budgetDataList);
      console.log('✅ [SCREEN] Total budgets loaded:', {
        count: budgetDataList.length,
        byMember: fetchedMembers.map(m => ({
          name: m.name,
          budgetCount: budgetDataList.filter(b => b.memberId === m.userId).length
        })),
        allBudgets: budgetDataList.map(b => ({ name: b.name, limit: b.limit, spent: b.spent, member: b.memberName }))
      });
    } catch (error) {
      console.error('❌ [SCREEN] Error fetching budgets:', error);
      Alert.alert('❌ Lỗi', (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchBudgets();
    } finally {
      setRefreshing(false);
    }
  }, [fetchBudgets]);

  const openEditBudgetModal = useCallback((budget: BudgetData) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      limit: budget.limit.toString(),
      period: budget.period as 'weekly' | 'monthly' | 'yearly',
      memberId: budget.memberId,
      memberName: budget.memberName,
    });
    setBudgetModalVisible(true);
  }, []);

  const handleSaveBudget = useCallback(async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên ngân sách');
        return;
      }

      if (!formData.limit.trim() || parseInt(formData.limit, 10) <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập giới hạn ngân sách hợp lệ');
        return;
      }

      if (!formData.memberId) {
        Alert.alert('Lỗi', 'Vui lòng chọn thành viên');
        return;
      }

      setSubmitLoading(true);

      if (editingBudget) {
        // Update budget
        const updatedBudget: BudgetData = {
          ...editingBudget,
          name: formData.name,
          limit: parseInt(formData.limit, 10),
          period: formData.period,
          memberId: formData.memberId,
          memberName: formData.memberName,
          updatedAt: new Date(),
        };

        // Update in local state (TODO: Call actual API when available)
        setBudgets(budgets.map(b => b.id === editingBudget.id ? updatedBudget : b));
        Alert.alert('✅ Thành công', 'Cập nhật ngân sách');
      } else {
        // Add new budget
        const newBudget: BudgetData = {
          id: `budget-${Date.now()}`,
          name: formData.name,
          limit: parseInt(formData.limit, 10),
          spent: 0,
          currency: 'VND',
          period: formData.period,
          memberId: formData.memberId,
          memberName: formData.memberName,
          memberRole: members.find(m => m.userId === formData.memberId)?.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        setBudgets([...budgets, newBudget]);
        Alert.alert('✅ Thành công', 'Thêm ngân sách mới');
      }

      setBudgetModalVisible(false);
      resetForm();
    } catch (error) {
      console.error('❌ [SCREEN] Error saving budget:', error);
      Alert.alert('❌ Lỗi', (error as Error).message);
    } finally {
      setSubmitLoading(false);
    }
  }, [formData, editingBudget, budgets, members]);

  const handleDeleteBudget = useCallback((budget: BudgetData) => {
    Alert.alert('⚠️ Xác nhận', `Bạn chắc chắn muốn xóa ngân sách "${budget.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          // Delete from local state (TODO: Call actual API when available)
          setBudgets(budgets.filter(b => b.id !== budget.id));
          Alert.alert('✅ Thành công', 'Xóa ngân sách');
        },
      },
    ]);
  }, [budgets]);

  const resetForm = () => {
    setFormData({
      name: '',
      limit: '',
      period: 'monthly',
      memberId: '',
      memberName: '',
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // RENDER MEMBERS WITH BUDGETS
  // ─────────────────────────────────────────────────────────────────

  const getMemberBudgets = (memberId: string): BudgetData[] => {
    return budgets.filter(b => b.memberId === memberId);
  };

  const renderMembersList = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      contentContainerStyle={styles.scrollContentContainer}
    >
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="account-multiple" size={20} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>
            Thành viên ({members.length})
          </Text>
        </View>

        {members.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="account-multiple-outline" size={48} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>Chưa có thành viên nào</Text>
            <Text style={styles.emptySubText}>Mời thành viên để quản lý ngân sách</Text>
          </View>
        ) : (
          members.map((member) => {
            const memberBudgets = getMemberBudgets(member.userId);
            const isExpanded = expandedMemberId === member.userId;

            return (
              <View key={member.userId} style={styles.memberSection}>
                {/* Member Header */}
                <Pressable
                  style={styles.memberHeader}
                  onPress={() => setExpandedMemberId(isExpanded ? null : member.userId)}
                >
                  <View style={styles.memberHeaderContent}>
                    <View style={[
                      styles.memberAvatar,
                      member.role === 'owner' ? styles.memberAvatarOwner :
                      member.role === 'admin' ? styles.memberAvatarAdmin :
                      styles.memberAvatarDefault
                    ]}>
                      <Icon name="account" size={20} color="#FFF" />
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
                  </View>
                  <View style={styles.memberBadge}>
                    <Text style={styles.memberBudgetCount}>{memberBudgets.length}</Text>
                    <Icon 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={20} 
                      color={theme.colors.primary} 
                    />
                  </View>
                </Pressable>

                {/* Budgets List */}
                {isExpanded && (
                  <View style={styles.budgetsContainer}>
                    {memberBudgets.length === 0 ? (
                      <View style={styles.noBudgetsContainer}>
                        <Text style={styles.noBudgetsText}>Chưa có ngân sách nào</Text>
                      </View>
                    ) : (
                      memberBudgets.map((budget) => (
                        <BudgetCard
                          key={budget.id}
                          budget={budget}
                          onEdit={() => openEditBudgetModal(budget)}
                          onDelete={() => handleDeleteBudget(budget)}
                          theme={theme}
                          styles={styles}
                        />
                      ))
                    )}
                    <Pressable
                      style={styles.addBudgetBtn}
                      onPress={() => {
                        resetForm();
                        setFormData({
                          name: '',
                          limit: '',
                          period: 'monthly' as 'weekly' | 'monthly' | 'yearly',
                          memberId: member.userId,
                          memberName: member.name,
                        });
                        setBudgetModalVisible(true);
                      }}
                      android_ripple={{ color: `${theme.colors.primary}20` }}
                    >
                      <Icon name="plus" size={18} color={theme.colors.primary} />
                      <Text style={styles.addBudgetBtnText}>Thêm ngân sách</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </View>
    </ScrollView>
  );

  // ─────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={24} color={theme.colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Icon name="cash-multiple" size={24} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Ngân sách</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          renderMembersList()
        )}
      </View>

      {/* Budget Form Modal */}
      <Modal visible={budgetModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setBudgetModalVisible(false)}>
              <Icon name="close" size={24} color={theme.colors.primary} />
            </Pressable>
            <View style={styles.headerCenter}>
              <Icon name={editingBudget ? 'pencil' : 'plus-circle'} size={20} color={theme.colors.primary} />
              <Text style={styles.modalTitle}>
                {editingBudget ? 'Chỉnh sửa ngân sách' : 'Thêm ngân sách mới'}
              </Text>
            </View>
            <View style={styles.headerRight} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên ngân sách *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ví dụ: Ngân sách ăn uống"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Giới hạn chi tiêu (VND) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập số tiền"
                value={formData.limit}
                onChangeText={(text) => setFormData({ ...formData, limit: text })}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Chu kỳ</Text>
              <View style={styles.periodSelector}>
                {(['weekly', 'monthly', 'yearly'] as const).map((period) => (
                  <Pressable
                    key={period}
                    style={[
                      styles.periodOption,
                      formData.period === period && styles.periodOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, period })}
                  >
                    <Text
                      style={[
                        styles.periodOptionText,
                        formData.period === period && styles.periodOptionTextActive,
                      ]}
                    >
                      {period === 'weekly' ? 'Tuần' : period === 'monthly' ? 'Tháng' : 'Năm'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Gán cho thành viên *</Text>
              <View style={styles.memberSelector}>
                {members.map((member) => (
                  <Pressable
                    key={member.userId}
                    style={[
                      styles.memberOption,
                      formData.memberId === member.userId && styles.memberOptionActive,
                    ]}
                    onPress={() => setFormData({ ...formData, memberId: member.userId, memberName: member.name })}
                  >
                    <View style={[
                      styles.memberOptionAvatar,
                      member.role === 'owner' ? styles.memberAvatarOwner :
                      member.role === 'admin' ? styles.memberAvatarAdmin :
                      styles.memberAvatarDefault
                    ]}>
                      <Icon name="account" size={18} color="#FFF" />
                    </View>
                    <View style={styles.memberOptionTextContainer}>
                      <Text
                        style={[
                          styles.memberOptionText,
                          formData.memberId === member.userId && styles.memberOptionTextActive,
                        ]}
                      >
                        {member.name}
                      </Text>
                      <Text style={styles.memberOptionSubText}>{member.email}</Text>
                    </View>
                    {formData.memberId === member.userId && (
                      <Icon name="check-circle" size={20} color={theme.colors.primary} />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formButtons}>
              <Pressable
                style={[styles.formButton, styles.formButtonCancel]}
                onPress={() => setBudgetModalVisible(false)}
              >
                <Icon name="close" size={20} color={theme.colors.primary} />
                <Text style={styles.formButtonText}>Hủy</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.formButton,
                  styles.formButtonSubmit,
                  submitLoading && styles.submitLoading,
                ]}
                onPress={handleSaveBudget}
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Icon name={editingBudget ? 'pencil' : 'plus'} size={20} color="#FFF" />
                    <Text style={[styles.formButtonText, styles.submitButtonText]}>
                      {editingBudget ? 'Cập nhật' : 'Thêm mới'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

interface BudgetCardProps {
  budget: BudgetData;
  onEdit: () => void;
  onDelete: () => void;
  theme: any;
  styles: any;
}

function BudgetCard({
  budget,
  onEdit,
  onDelete,
  theme,
  styles,
}: BudgetCardProps) {
  const remaining = budget.limit - budget.spent;
  const percentage = (budget.spent / budget.limit) * 100;

  return (
    <View style={[styles.budgetCard, styles.budgetCardCompact]}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetInfo}>
          <View style={[styles.budgetIcon, styles.budgetIconSmall]}>
            <Icon name="cash-multiple" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.budgetDetails}>
            <Text style={styles.budgetNameCompact}>{budget.name}</Text>
            <Text style={styles.budgetPeriodText}>
              {budget.period === 'weekly' ? 'Tuần' : budget.period === 'monthly' ? 'Tháng' : 'Năm'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.budgetStatsCompact}>
        <View style={styles.statItemCompact}>
          <Text style={styles.statLabelCompact}>Giới hạn</Text>
          <Text style={styles.statValueCompact}>{budget.limit.toLocaleString('vi-VN')} ₫</Text>
        </View>
        <View style={styles.statItemCompact}>
          <Text style={styles.statLabelCompact}>Đã chi</Text>
          <Text style={[styles.statValueCompact, styles.statValueDanger]}>{budget.spent.toLocaleString('vi-VN')} ₫</Text>
        </View>
        <View style={styles.statItemCompact}>
          <Text style={styles.statLabelCompact}>Còn lại</Text>
          <Text style={[styles.statValueCompact, styles.statValueSuccess]}>{remaining.toLocaleString('vi-VN')} ₫</Text>
        </View>
      </View>

      <View style={styles.budgetProgressContainer}>
        <View style={styles.budgetProgressBar}>
          <View
            style={[
              styles.budgetProgressFill,
              {
                width: `${Math.min(percentage, 100)}%`,
              },
              percentage > 80 ? styles.progressDanger : styles.progressNormal,
            ]}
          />
        </View>
      </View>

      <View style={styles.budgetActions}>
        <Pressable 
          style={[styles.actionBtn, styles.actionBtnEdit]}
          onPress={onEdit}
          android_ripple={{ color: `${theme.colors.primary}30` }}
        >
          <Icon name="pencil-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.actionBtnTextSmall}>Sửa</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.actionBtnDelete]}
          onPress={onDelete}
          android_ripple={{ color: '#EF444430' }}
        >
          <Icon name="trash-can-outline" size={16} color="#EF4444" />
          <Text style={[styles.actionBtnTextSmall, styles.deleteText]}>Xóa</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,137,123,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: -0.3,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 10,
      marginBottom: 14,
      paddingHorizontal: 2,
    },

    bottomSpacer: {
      height: 100,
    },

    scrollContentContainer: {
      paddingBottom: 40,
    },

    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    headerRight: {
      width: 0,
    },

    section: {
      marginBottom: 20,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: theme.colors.primary,
      marginBottom: 0,
      letterSpacing: -0.3,
      lineHeight: 20,
    },

    centerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginTop: 16,
    },

    emptySubText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    },

    memberSection: {
      marginBottom: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    },

    memberHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    memberHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    memberAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    memberAvatarOwner: {
      backgroundColor: '#9333EA',
    },

    memberAvatarAdmin: {
      backgroundColor: theme.colors.primary,
    },

    memberAvatarDefault: {
      backgroundColor: '#6B7280',
    },

    memberInfo: {
      flex: 1,
    },

    memberName: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.primary,
    },

    memberEmail: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },

    memberBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    memberBudgetCount: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
      minWidth: 20,
      textAlign: 'center',
    },

    budgetsContainer: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },

    noBudgetsContainer: {
      paddingVertical: 16,
      alignItems: 'center',
    },

    noBudgetsText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },

    addBudgetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      marginTop: 8,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.08)' : 'rgba(0,137,123,0.06)',
      borderRadius: 8,
      gap: 6,
    },

    addBudgetBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },

    budgetCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      overflow: 'hidden',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },

    budgetCardCompact: {
      marginBottom: 8,
      paddingVertical: 0,
    },

    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 14,
    },

    budgetInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    budgetIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    budgetIconSmall: {
      width: 36,
      height: 36,
      borderRadius: 8,
      marginRight: 8,
    },

    budgetDetails: {
      flex: 1,
    },

    budgetName: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 2,
    },

    budgetNameCompact: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.primary,
    },

    budgetMemberInfo: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },

    budgetDivider: {
      height: 1,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
    },

    budgetStats: {
      flexDirection: 'row',
      paddingHorizontal: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },

    budgetStatsCompact: {
      flexDirection: 'row',
      paddingHorizontal: 10,
      paddingVertical: 8,
      gap: 8,
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    statItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    statIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.15)' : 'rgba(0,137,123,0.1)',
      marginRight: 8,
    },

    statTextContainer: {
      flex: 1,
    },

    statLabel: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
      fontWeight: '500',
    },

    statValue: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },

    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)',
      marginHorizontal: 6,
    },

    budgetProgressContainer: {
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    budgetProgressBar: {
      height: 6,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 6,
    },

    budgetProgressFill: {
      height: '100%',
      borderRadius: 3,
    },

    budgetPercentage: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },

    budgetPeriod: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 6,
    },

    budgetPeriodText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },

    budgetActions: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },

    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 11,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    },

    actionBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },

    actionBtnTextSmall: {
      fontSize: 10,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    actionBtnEdit: {
      borderRightWidth: 1,
      borderRightColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.25)' : 'rgba(0,137,123,0.03)',
    },

    actionBtnDelete: {
      backgroundColor: theme.dark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.03)',
    },

    deleteText: {
      color: '#FFFFFF',
    },

    content: {
      flex: 1,
    },

    floatingButton: {
      position: 'absolute',
      bottom: 20,
      right: 16,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 10,
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 6,
    },

    modal: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: -0.3,
    },

    modalContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },

    formGroup: {
      marginBottom: 16,
    },

    formLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 8,
      letterSpacing: -0.2,
    },

    formInput: {
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: theme.colors.onSurface,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.8)',
    },

    periodSelector: {
      flexDirection: 'row',
      gap: 8,
    },

    periodOption: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1.5,
      borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
    },

    periodOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.15)' : 'rgba(0,137,123,0.08)',
      borderWidth: 2,
    },

    periodOptionText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
    },

    periodOptionTextActive: {
      color: theme.colors.primary,
    },

    memberSelector: {
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
      borderRadius: 10,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
      overflow: 'hidden',
    },

    memberOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      gap: 10,
    },

    memberOptionActive: {
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.1)' : 'rgba(0,137,123,0.05)',
    },

    memberOptionAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },

    memberOptionTextContainer: {
      flex: 1,
    },

    memberOptionText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },

    memberOptionTextActive: {
      color: theme.colors.primary,
    },

    memberOptionSubText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },

    statItemCompact: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    statLabelCompact: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.dark ? '#E0E0E0' : theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },

    statValueCompact: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.dark ? '#FFFFFF' : theme.colors.primary,
    },

    statValueDanger: {
      color: theme.dark ? '#FF6B6B' : '#EF4444',
    },

    statValueSuccess: {
      color: theme.dark ? '#51CF66' : '#22C55E',
    },

    formButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 28,
      marginBottom: 32,
    },

    formButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    formButtonCancel: {
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
      borderWidth: 1.5,
      borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
    },

    formButtonSubmit: {
      backgroundColor: theme.colors.secondary,
      elevation: 4,
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },

    formButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },

    submitLoading: {
      opacity: 0.8,
    },

    submitButtonText: {
      color: '#FFF',
      fontWeight: '700',
    },
  });

