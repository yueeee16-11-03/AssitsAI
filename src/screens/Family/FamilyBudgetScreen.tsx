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

// Type declaration for __DEV__
declare const __DEV__: boolean;

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
      console.log('✅ [SCREEN] Members fetched:', {
        count: fetchedMembers.length,
        members: fetchedMembers.map(m => ({ userId: m.userId, name: m.name, role: m.role }))
      });

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
      period: budget.period || 'monthly',
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

      if (!_familyId) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin gia đình');
        return;
      }

      setSubmitLoading(true);

      if (editingBudget) {
        // ✏️ Update existing budget via API
        console.log('🔵 [SCREEN] Updating budget:', editingBudget.id);
        await FamilyBudgetManagementService.updateMemberPersonalBudget(
          _familyId,
          formData.memberId,
          editingBudget.id,
          {
            category: formData.name,
            allocatedAmount: parseInt(formData.limit, 10),
            period: formData.period,
          }
        );
        console.log('✅ [SCREEN] Budget updated successfully');
        Alert.alert('✅ Thành công', 'Cập nhật ngân sách');
      } else {
        // ➕ Create new budget via API
        console.log('🔵 [SCREEN] Creating new budget for member:', formData.memberId);
        await FamilyBudgetManagementService.createMemberPersonalBudget(
          _familyId,
          formData.memberId,
          {
            category: formData.name,
            allocatedAmount: parseInt(formData.limit, 10),
            period: formData.period,
            currency: 'VND',
          }
        );
        console.log('✅ [SCREEN] Budget created successfully');
        Alert.alert('✅ Thành công', 'Thêm ngân sách mới');
      }

      // Reload budgets from server
      await fetchBudgets();

      setBudgetModalVisible(false);
      resetForm();
      setEditingBudget(null);
    } catch (error) {
      console.error('❌ [SCREEN] Error saving budget:', error);
      Alert.alert('❌ Lỗi', (error as Error).message);
    } finally {
      setSubmitLoading(false);
    }
  }, [formData, editingBudget, _familyId, fetchBudgets]);

  const handleDeleteBudget = useCallback((budget: BudgetData) => {
    Alert.alert('⚠️ Xác nhận', `Bạn chắc chắn muốn xóa ngân sách "${budget.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!_familyId) {
              Alert.alert('Lỗi', 'Không tìm thấy thông tin gia đình');
              return;
            }

            console.log('🔵 [SCREEN] Deleting budget:', budget.id);
            await FamilyBudgetManagementService.deleteMemberPersonalBudget(
              _familyId,
              budget.memberId,
              budget.id
            );
            console.log('✅ [SCREEN] Budget deleted successfully');

            // Reload budgets from server
            await fetchBudgets();

            Alert.alert('✅ Thành công', 'Xóa ngân sách');
          } catch (error) {
            console.error('❌ [SCREEN] Error deleting budget:', error);
            Alert.alert('❌ Lỗi', (error as Error).message);
          }
        },
      },
    ]);
  }, [_familyId, fetchBudgets]);

  const resetForm = () => {
    setFormData({
      name: '',
      limit: '',
      period: 'monthly',
      memberId: '',
      memberName: '',
    });
  };

  const handleCancelModal = useCallback(() => {
    setBudgetModalVisible(false);
    resetForm();
    setEditingBudget(null);
  }, []);

  // 🔧 DEV: Tạo budget test
  const createTestBudget = useCallback(async (memberId: string, _memberName: string) => {
    try {
      if (!_familyId) {
        Alert.alert('Lỗi', 'Không tìm thấy familyId');
        return;
      }

      console.log('🧪 [TEST] Creating test budget for member:', memberId);
      const result = await FamilyBudgetManagementService.createMemberPersonalBudget(
        _familyId,
        memberId,
        {
          category: `Test Budget ${Date.now()}`,
          allocatedAmount: 1000000,
          period: 'monthly',
          currency: 'VND',
        }
      );
      console.log('✅ [TEST] Test budget created:', result);
      
      // Reload
      await fetchBudgets();
      Alert.alert('✅ Thành công', 'Đã tạo budget test');
    } catch (error) {
      console.error('❌ [TEST] Error creating test budget:', error);
      Alert.alert('❌ Lỗi', (error as Error).message);
    }
  }, [_familyId, fetchBudgets]);

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
                        {__DEV__ && (
                          <Pressable
                            style={[styles.addBudgetBtn, styles.testBudgetBtn]}
                            onPress={() => createTestBudget(member.userId, member.name)}
                          >
                            <Icon name="flask" size={14} color="#FFF" />
                            <Text style={styles.testBudgetBtnText}>
                              🧪 Tạo Budget Test
                            </Text>
                          </Pressable>
                        )}
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
            <Pressable onPress={handleCancelModal}>
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
                onPress={handleCancelModal}
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
      paddingHorizontal: 20,
      paddingBottom: 16,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },

    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(0,137,123,0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: -0.5,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 12,
      marginBottom: 20,
      paddingHorizontal: 4,
    },

    bottomSpacer: {
      height: 120,
    },

    scrollContentContainer: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 60,
    },

    headerCenter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    headerRight: {
      width: 44,
    },

    section: {
      marginBottom: 24,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: -0.4,
      lineHeight: 24,
    },

    centerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyContainer: {
      paddingVertical: 60,
      paddingHorizontal: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      marginHorizontal: 4,
    },

    emptyText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.colors.primary,
      marginTop: 20,
      textAlign: 'center',
    },

    emptySubText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    },

    memberSection: {
      marginBottom: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.dark ? 0.2 : 0.08,
      shadowRadius: 4,
    },

    memberHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: theme.dark 
        ? 'rgba(255,255,255,0.02)' 
        : 'rgba(0,137,123,0.02)',
    },

    memberHeaderContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    memberAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
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
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: -0.3,
      marginBottom: 2,
    },

    memberEmail: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      letterSpacing: -0.1,
    },

    memberBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: theme.dark
        ? 'rgba(0,137,123,0.15)'
        : 'rgba(0,137,123,0.08)',
    },

    memberBudgetCount: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.primary,
      minWidth: 24,
      textAlign: 'center',
    },

    budgetsContainer: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderTopWidth: 1,
      borderTopColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      backgroundColor: theme.dark
        ? 'rgba(0,0,0,0.2)'
        : 'rgba(0,0,0,0.01)',
    },

    noBudgetsContainer: {
      paddingVertical: 24,
      alignItems: 'center',
    },

    noBudgetsText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },

    addBudgetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      marginTop: 12,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.1)' : 'rgba(0,137,123,0.06)',
      borderRadius: 12,
      gap: 8,
    },

    addBudgetBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: -0.2,
    },

    testBudgetBtn: {
      marginTop: 12,
      backgroundColor: '#FF6B6B',
      borderColor: '#FF6B6B',
    },

    testBudgetBtnText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFF',
      letterSpacing: -0.2,
    },

    budgetCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      overflow: 'hidden',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },

    budgetCardCompact: {
      marginBottom: 12,
    },

    budgetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },

    budgetInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    budgetIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
      backgroundColor: theme.dark
        ? 'rgba(0,137,123,0.15)'
        : 'rgba(0,137,123,0.1)',
    },

    budgetIconSmall: {
      width: 44,
      height: 44,
      borderRadius: 12,
      marginRight: 12,
    },

    budgetDetails: {
      flex: 1,
    },

    budgetName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 4,
      letterSpacing: -0.3,
    },

    budgetNameCompact: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: -0.2,
      marginBottom: 2,
    },

    budgetMemberInfo: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
    },

    budgetDivider: {
      height: 1,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },

    budgetStats: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
    },

    budgetStatsCompact: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 12,
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    statItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    statIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.15)' : 'rgba(0,137,123,0.1)',
      marginRight: 10,
    },

    statTextContainer: {
      flex: 1,
    },

    statLabel: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 3,
      fontWeight: '600',
    },

    statValue: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.primary,
    },

    statDivider: {
      width: 1,
      height: 44,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      marginHorizontal: 8,
    },

    budgetProgressContainer: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },

    budgetProgressBar: {
      height: 8,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      borderRadius: 4,
      overflow: 'hidden',
    },

    budgetProgressFill: {
      height: '100%',
      borderRadius: 4,
    },

    progressNormal: {
      backgroundColor: theme.colors.primary,
    },

    progressDanger: {
      backgroundColor: '#EF4444',
    },

    budgetPercentage: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
      marginTop: 6,
    },

    budgetPeriod: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 6,
    },

    budgetPeriodText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
      letterSpacing: -0.1,
    },

    budgetActions: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    },

    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    },

    actionBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },

    actionBtnTextSmall: {
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -0.1,
    },

    actionBtnEdit: {
      borderRightWidth: 1,
      borderRightColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.25)' : 'rgba(0,137,123,0.05)',
    },

    actionBtnDelete: {
      backgroundColor: theme.dark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.05)',
    },

    deleteText: {
      color: '#FFFFFF',
    },

    content: {
      flex: 1,
    },

    floatingButton: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 12,
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },

    modal: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.06)',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: theme.colors.primary,
      letterSpacing: -0.4,
    },

    modalContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 16,
    },

    formGroup: {
      marginBottom: 24,
    },

    formLabel: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 10,
      letterSpacing: -0.2,
    },

    formInput: {
      borderWidth: 1.5,
      borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: theme.colors.onSurface,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.9)',
      fontWeight: '600',
    },

    periodSelector: {
      flexDirection: 'row',
      gap: 10,
    },

    periodOption: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1.5,
      borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
    },

    periodOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.2)' : 'rgba(0,137,123,0.1)',
      borderWidth: 2,
    },

    periodOptionText: {
      fontSize: 13,
      fontWeight: '800',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: -0.2,
    },

    periodOptionTextActive: {
      color: theme.colors.primary,
    },

    memberSelector: {
      borderWidth: 1.5,
      borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
      borderRadius: 12,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)',
      overflow: 'hidden',
    },

    memberOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
      gap: 12,
    },

    memberOptionActive: {
      backgroundColor: theme.dark ? 'rgba(0,137,123,0.15)' : 'rgba(0,137,123,0.08)',
    },

    memberOptionAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },

    memberOptionTextContainer: {
      flex: 1,
    },

    memberOptionText: {
      fontSize: 14,
      fontWeight: '800',
      color: theme.colors.onSurface,
      letterSpacing: -0.2,
    },

    memberOptionTextActive: {
      color: theme.colors.primary,
    },

    memberOptionSubText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 3,
      letterSpacing: -0.1,
    },

    statItemCompact: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },

    statLabelCompact: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.dark ? '#E0E0E0' : theme.colors.onSurfaceVariant,
      marginBottom: 6,
      letterSpacing: -0.1,
    },

    statValueCompact: {
      fontSize: 14,
      fontWeight: '900',
      color: theme.dark ? '#FFFFFF' : theme.colors.primary,
      letterSpacing: -0.3,
    },

    statValueDanger: {
      color: theme.dark ? '#FF6B6B' : '#EF4444',
    },

    statValueSuccess: {
      color: theme.dark ? '#51CF66' : '#22C55E',
    },

    formButtons: {
      flexDirection: 'row',
      gap: 14,
      marginTop: 32,
      marginBottom: 40,
    },

    formButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    formButtonCancel: {
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      borderWidth: 1.5,
      borderColor: theme.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
    },

    formButtonSubmit: {
      backgroundColor: theme.colors.secondary,
      elevation: 6,
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.35,
      shadowRadius: 5,
    },

    formButtonText: {
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.onSurface,
      letterSpacing: -0.2,
    },

    submitLoading: {
      opacity: 0.8,
    },

    submitButtonText: {
      color: '#FFF',
      fontWeight: '800',
    },
  });

