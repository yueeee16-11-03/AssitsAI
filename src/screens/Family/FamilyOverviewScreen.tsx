import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import type { FamilyMember } from "../../services/FamilyMemberService";
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { useFamilyStore } from "../../store/familyStore";
import { useFamilyMembers, useFamilyMemberStore } from "../../store/familyMemberStore";

type Props = NativeStackScreenProps<RootStackParamList, "FamilyOverview">;

// Using FamilyMember from FamilyService
interface FamilyMemberUI extends FamilyMember {
  finance?: {
    income: number;
    expense: number;
    saving: number;
  };
  habits?: {
    completed: number;
    total: number;
    streak: number;
  };
  goals?: number;
}

export default function FamilyOverviewScreen({ navigation, route }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const theme = useTheme();
  const styles = getStyles(theme);
  const { familyId } = route.params;
  const { families, currentFamily, setCurrentFamily, fetchFamilyById } = useFamilyStore();
  const { fetchFamilyMembers } = useFamilyMemberStore();
  
  // Load the specific family based on familyId from route
  const selectedFamily = React.useMemo(() => {
    return families.find(f => f.id === familyId) || currentFamily;
  }, [familyId, families, currentFamily]);

  const familyMembersFromStore = useFamilyMembers(selectedFamily?.id || '');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // 🔐 Load the specific family if not in store
  React.useEffect(() => {
    const loadFamily = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Nếu familyId không có, báo lỗi ngay
        if (!familyId) {
          setLoadError('Không tìm thấy mã gia đình');
          setIsLoading(false);
          return;
        }

        // Nếu family đã có trong store, không cần fetch
        const existingFamily = families.find(f => f.id === familyId);
        if (existingFamily) {
          setCurrentFamily(existingFamily);
          setIsLoading(false);
          return;
        }

        // Fetch family từ DB nếu chưa có
        if (familyId && selectedFamily?.id !== familyId) {
          await fetchFamilyById(familyId);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Failed to fetch family:', err);
        setLoadError('Không thể tải gia đình. Vui lòng thử lại.');
        setIsLoading(false);
      }
    };

    loadFamily();
  }, [familyId, fetchFamilyById, setCurrentFamily, families, selectedFamily?.id]);

  // 📥 Fetch family members when selectedFamily changes
  React.useEffect(() => {
    console.log('📥 useEffect triggered for fetchFamilyMembers:', {
      selectedFamilyId: selectedFamily?.id,
      hasFamilyId: !!selectedFamily?.id,
    });

    if (selectedFamily?.id) {
      console.log('🔄 Calling fetchFamilyMembers with familyId:', selectedFamily.id);
      const familyIdToFetch = selectedFamily.id;
      fetchFamilyMembers(familyIdToFetch)
        .then(() => {
          console.log('✅ Members fetched successfully');
          const allMembers = useFamilyMemberStore.getState().members;
          const fromStore = allMembers ? allMembers[familyIdToFetch] : undefined;
          console.log('📦 Members in store after fetch:', {
            familyId: familyIdToFetch,
            count: fromStore?.length || 0,
            data: fromStore,
          });
        })
        .catch(err => {
          console.error('❌ Failed to fetch family members:', err);
        });
    } else {
      console.log('⚠️ selectedFamily.id is empty or undefined');
    }
  }, [selectedFamily?.id, fetchFamilyMembers]);

  // 🔐 CRITICAL: Check if user is member of this family
  React.useEffect(() => {
    // Không check nếu đang loading hoặc có lỗi
    if (isLoading || loadError || !selectedFamily?.id) {
      return;
    }

    const currentUser = auth().currentUser;
    
    // Check 1: User must be logged in
    if (!currentUser) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập');
      navigation.goBack();
      return;
    }

    // Check 3: ⭐ User MUST be member of family (either owner or member)
    const isMemberOfFamily = selectedFamily?.memberIds?.includes(currentUser.uid) || 
                             selectedFamily?.ownerId === currentUser.uid;
    
    if (!isMemberOfFamily) {
      Alert.alert(
        'Quyền hạn chế',
        'Bạn không phải thành viên của gia đình này. Vui lòng join bằng mã mời.',
        [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [selectedFamily?.id, selectedFamily?.memberIds, selectedFamily?.ownerId, navigation, isLoading, loadError]);

  // ✅ Check if current user is owner
  const isOwner = (): boolean => {
    const currentUser = auth().currentUser;
    if (!currentUser) return false;
    return selectedFamily?.ownerId === currentUser.uid;
  };

  // 🔐 If somehow we got here but selectedFamily is null/empty, show loading or error
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gia đình</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loadError || !selectedFamily?.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lỗi</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {loadError || 'Không tìm thấy gia đình. Vui lòng quay lại.'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }


  // ✅ Handle remove member
  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!isOwner()) {
      Alert.alert('Quyền hạn chế', 'Chỉ chủ nhóm mới có quyền xóa thành viên');
      return;
    }
    
    Alert.alert(
      'Xóa thành viên',
      `Bạn có chắc chắn muốn xóa ${memberName} khỏi gia đình?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            // TODO: Call API to remove member
            Alert.alert('Thành công', `${memberName} đã được xóa khỏi gia đình`);
          },
        },
      ]
    );
  };

  // ✅ Handle invite button with permission check
  const handleInviteMemberPress = () => {
    if (!isOwner()) {
      Alert.alert(
        'Quyền hạn chế',
        'Chỉ chủ nhóm mới có quyền mời thành viên',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate("InviteMember" as any, { familyId: selectedFamily?.id || "", inviteCode: "" });
  };

  // ✅ Filter family members - chỉ hiển thị những member thuộc gia đình này
  // familyMembersFromStore đã là những member của selectedFamily (được fetch từ DB)
  // Không cần filter thêm vì dữ liệu đã đúng từ API
  let familyMembers: FamilyMemberUI[] = familyMembersFromStore && familyMembersFromStore.length > 0 
    ? familyMembersFromStore 
    : [];
  
  console.log('🎯 familyMembersFromStore before mapping:', {
    isArray: Array.isArray(familyMembersFromStore),
    length: familyMembersFromStore?.length || 0,
    data: familyMembersFromStore,
  });
  
  // 🔧 Thêm finance & habits data từ mock (chờ API trả về đầy đủ dữ liệu)
  familyMembers = familyMembers.map(m => ({
    ...m,
    finance: m.finance || {
      income: Math.random() * 50000000,
      expense: Math.random() * 30000000,
      saving: Math.random() * 20000000,
    },
    habits: m.habits || {
      completed: Math.floor(Math.random() * 10),
      total: 10,
      streak: Math.floor(Math.random() * 30),
    },
  }));
  
  console.log('📊 Final Family Members after mapping:', {
    selectedFamilyId: selectedFamily?.id,
    membersCount: familyMembers.length,
    members: familyMembers.map(m => ({ id: m.userId, name: m.name, role: m.role })),
  });
  
  // Calculate totals from actual members
  const totalIncome = familyMembers.reduce((sum, m) => sum + (m.finance?.income || 0), 0);
  const totalExpense = familyMembers.reduce((sum, m) => sum + (m.finance?.expense || 0), 0);
  const totalSaving = familyMembers.reduce((sum, m) => sum + (m.finance?.saving || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Gia đình</Text>
          {selectedFamily?.name && (
            <Text style={styles.familyNameSubtitle}>{selectedFamily.name}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {isOwner() && (
            <TouchableOpacity 
              style={styles.headerActionButton}
              onPress={handleInviteMemberPress}
            >
              <Icon name="account-plus" size={22} color={(theme.colors as any).onSecondaryContainer ?? (theme.dark ? '#FFFFFF' : theme.colors.onSurface)} />
            </TouchableOpacity>
          )}

          {isOwner() && (
            <TouchableOpacity
              style={[styles.headerActionButton, styles.headerPermButton]}
              onPress={() => navigation.navigate("FamilyPermissions" as any)}
            >
              <Icon name="shield-account" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate("CreateFamily")}
          >
            <Icon name="plus" size={24} color={(theme.colors as any).onSecondaryContainer ?? (theme.dark ? '#FFFFFF' : theme.colors.onSurface)} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Family Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Tổng quan gia đình</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Thu nhập</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>
                  ₫{(totalIncome / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Chi tiêu</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.onSurfaceVariant }]}>
                  ₫{(totalExpense / 1000000).toFixed(1)}M
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tiết kiệm</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                  ₫{(totalSaving / 1000000).toFixed(1)}M
                </Text>
              </View>
            </View>
            <View style={styles.summaryProgress}>
              <View style={[styles.summaryProgressFill, { width: `${(totalSaving / totalIncome) * 100}%` }]} />
            </View>
            <Text style={styles.summaryPercentage}>
              {((totalSaving / totalIncome) * 100).toFixed(1)}% tỷ lệ tiết kiệm
            </Text>
          </View>

          {/* Family Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thành viên ({familyMembers.length})</Text>
            {familyMembers.length === 0 ? (
              <View style={styles.emptyMemberCard}>
                <Icon name="account-multiple-outline" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyMemberText}>
                  Chưa có thành viên nào trong gia đình
                </Text>
              </View>
            ) : (
              familyMembers.map((member) => {
                const habitRate = member.habits ? (member.habits.completed / member.habits.total) * 100 : 0;
                const defaultColor = member.color || "#6366F1";
                
                // Get role display with emoji
                const getRoleDisplay = () => {
                  switch (member.role) {
                    case 'owner':
                      return '👑 Chủ nhóm';
                    case 'admin':
                      return '⭐ Quản trị viên';
                    case 'child':
                      return '👶 Con em';
                    default:
                      return '👤 Thành viên';
                  }
                };

                const avatarIcon = member.role === 'owner' ? 'account' : 'account-outline';

                return (
                  <TouchableOpacity
                    key={member.userId}
                    style={[styles.memberCard, { borderLeftColor: defaultColor }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("MemberDetail")}
                  >
                    <View style={styles.memberHeader}>
                      <View style={styles.memberInfo}>
                        <View style={[styles.memberAvatar, { backgroundColor: `${defaultColor}22` }]}>
                          <Icon name={avatarIcon} size={32} color={defaultColor} />
                        </View>
                        <View style={styles.memberDetails}>
                          <Text style={styles.memberName}>{member.name || 'Không rõ tên'}</Text>
                          <Text style={[styles.memberRole, { color: defaultColor }]}>
                            {getRoleDisplay()}
                          </Text>
                        </View>
                      </View>
                      {member.habits && (
                        <View style={[styles.memberBadge, { backgroundColor: `${defaultColor}22` }]}>
                          <Text style={[styles.memberBadgeText, { color: defaultColor }]}>
                            {habitRate.toFixed(0)}%
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Finance Stats */}
                    {member.finance && (
                      <View style={styles.memberStats}>
                        <View style={styles.statRow}>
                          <Icon name="currency-usd" size={20} color={theme.colors.secondary} style={styles.statIcon} />
                          <View style={styles.statInfo}>
                            <Text style={styles.statLabel}>Thu nhập</Text>
                            <Text style={styles.statValue}>
                              ₫{(member.finance.income / 1000000).toFixed(1)}M
                            </Text>
                          </View>
                        </View>
                        <View style={styles.statRow}>
                          <Icon name="cash-remove" size={20} color={theme.colors.onSurfaceVariant} style={styles.statIcon} />
                          <View style={styles.statInfo}>
                            <Text style={styles.statLabel}>Chi tiêu</Text>
                            <Text style={styles.statValue}>
                              ₫{(member.finance.expense / 1000000).toFixed(1)}M
                            </Text>
                          </View>
                        </View>
                        <View style={styles.statRow}>
                          <Icon name="piggy-bank" size={20} color={defaultColor} style={styles.statIcon} />
                          <View style={styles.statInfo}>
                            <Text style={styles.statLabel}>Tiết kiệm</Text>
                            <Text style={[styles.statValue, { color: defaultColor }]}>
                              ₫{(member.finance.saving / 1000000).toFixed(1)}M
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Habits Progress */}
                    {member.habits && (
                      <View style={styles.memberHabits}>
                        <View style={styles.habitInfo}>
                          <Text style={styles.habitLabel}>Thói quen</Text>
                          <Text style={styles.habitValue}>
                            {member.habits.completed}/{member.habits.total}
                          </Text>
                        </View>
                        <View style={styles.habitProgress}>
                          <View
                            style={[
                              styles.habitProgressFill,
                              { width: `${habitRate}%`, backgroundColor: defaultColor },
                            ]}
                          />
                        </View>
                        <View style={styles.habitMeta}>
                          <View style={styles.habitMetaRow}>
                            <Icon name="fire" size={12} color={theme.colors.secondary} style={styles.habitMetaIcon} />
                            <Text style={styles.habitStreak}>{member.habits.streak} ngày</Text>
                          </View>
                          <View style={styles.habitMetaRow}>
                            <Icon name="target" size={12} color={theme.colors.primary} style={styles.habitMetaIcon} />
                            <Text style={styles.habitGoals}>{member.goals || 0} mục tiêu</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Quick Actions */}
                    <View style={styles.memberActions}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.actionBtnDefault]}
                        onPress={() => navigation.navigate("MemberDetail") }
                      >
                        <Icon name="information-outline" size={16} color={theme.colors.primary} style={styles.actionBtnIcon} />
                        <Text style={styles.actionBtnText}>Chi tiết</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.actionBtnSecondary]}
                        activeOpacity={0.7}
                      >
                        <Icon name="bell-outline" size={16} color="#FFFFFF" style={styles.actionBtnIcon} />
                        <Text style={styles.actionBtnTextSecondary}>Nhắc nhở</Text>
                      </TouchableOpacity>
                      {isOwner() && member.userId !== auth().currentUser?.uid && (
                        <TouchableOpacity 
                          style={[styles.actionBtn, styles.actionBtnDanger]}
                          onPress={() => handleRemoveMember(member.userId, member.name || 'Thành viên')}
                          activeOpacity={0.7}
                        >
                          <Icon name="trash-can-outline" size={16} color="#EF4444" style={styles.actionBtnIcon} />
                          <Text style={styles.actionBtnTextDanger}>Xóa</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {/* AI Family Insights */}
         

          {/* Quick Actions */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("SharedWallet" as any)}>
              <Icon name="wallet" size={32} color={theme.colors.primary} style={styles.actionIconMargin} />
              <Text style={styles.actionText}>Ví chung</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("SharedBudget" as any)}>
              <Icon name="cash-multiple" size={32} color={theme.colors.secondary} style={styles.actionIconMargin} />
              <Text style={styles.actionText}>Ngân sách</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate("SharedGoal" as any)}>
              <Icon name="target" size={32} color={theme.colors.primary} style={styles.actionIconMargin} />
              <Text style={styles.actionText}>Mục tiêu chung</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingHorizontal: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', backgroundColor: theme.colors.surface },
  spacer: { width: 40 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 137, 123, 0.08)', alignItems: "center", justifyContent: "center" },
  backIcon: { fontSize: 20, color: theme.colors.primary },
  headerTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.primary },
  familyNameSubtitle: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginLeft: 8, fontStyle: 'italic' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerPermButton: { marginLeft: 8, width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(99, 102, 241, 0.06)' },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    // use secondaryContainer if available
    backgroundColor: (() => {
      const container = (theme.colors as any).secondaryContainer;
      if (container) return container;
      const sec = theme.colors.secondary;
      if (typeof sec === 'string' && sec.startsWith('#')) {
        let c = sec.replace('#', '');
        if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return theme.dark ? `rgba(${r}, ${g}, ${b}, 0.4)` : `rgba(${r}, ${g}, ${b}, 0.12)`;
      }
      return theme.dark ? 'rgba(99, 102, 241, 0.4)' : `${theme.colors.secondary}20`;
    })(),
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.secondary, alignItems: "center", justifyContent: "center" },
  addIcon: { fontSize: 24, color: "#00897B", fontWeight: "700" },
  content: { padding: 16 },
  summaryCard: {
    // Use theme.secondaryContainer if available; else compute safe rgba fallback from secondary
    backgroundColor: (() => {
      const container = (theme.colors as any).secondaryContainer;
      if (container) return container;
      const sec = theme.colors.secondary;
      if (typeof sec === 'string' && sec.startsWith('#')) {
        let c = sec.replace('#', '');
        if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return theme.dark ? `rgba(${r}, ${g}, ${b}, 0.15)` : `rgba(${r}, ${g}, ${b}, 0.16)`;
      }
      return theme.dark ? 'rgba(99, 102, 241, 0.15)' : `${theme.colors.secondary}26`;
    })(),
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: (() => {
      const container = (theme.colors as any).secondaryContainer;
      if (container) return container;
      const sec = theme.colors.secondary;
      if (typeof sec === 'string' && sec.startsWith('#')) {
        let c = sec.replace('#', '');
        if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return theme.dark ? `rgba(${r}, ${g}, ${b}, 0.32)` : `rgba(${r}, ${g}, ${b}, 0.3)`;
      }
      return theme.dark ? 'rgba(99, 102, 241, 0.4)' : `${theme.colors.secondary}4D`;
    })(),
  },
  summaryTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.primary, marginBottom: 16, textAlign: "center" },
  summaryStats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 16 },
  summaryItem: { alignItems: "center" },
  summaryLabel: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryDivider: { width: 1, height: 40, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 137, 123, 0.15)' },
  summaryProgress: { height: 8, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 137, 123, 0.15)', borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  summaryProgressFill: { height: "100%", backgroundColor: theme.colors.secondary, borderRadius: 4 },
  summaryPercentage: { fontSize: 13, color: theme.colors.onSurfaceVariant, textAlign: "center" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.primary, marginBottom: 16, backgroundColor: theme.colors.background },
  memberCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderTopColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderTopWidth: 1 },
  memberHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  memberInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  memberAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginRight: 12 },
  memberAvatarText: { fontSize: 32 },
  memberDetails: { flex: 1 },
  memberName: { fontSize: 18, fontWeight: "800", color: theme.colors.primary, marginBottom: 4 },
  memberRole: { fontSize: 13, color: theme.colors.onSurfaceVariant },
  memberBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  memberBadgeText: { fontSize: 16, fontWeight: "800" },
  memberStats: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  statRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  statIcon: { marginRight: 6 },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 11, color: theme.colors.onSurfaceVariant, marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: "700", color: theme.colors.onSurface },
  memberHabits: { marginBottom: 12 },
  habitInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  habitLabel: { fontSize: 13, color: theme.colors.primary, fontWeight: "700" },
  habitValue: { fontSize: 13, color: theme.colors.onSurface, fontWeight: "700" },
  habitProgress: { height: 6, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 137, 123, 0.15)', borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  habitProgressFill: { height: "100%", borderRadius: 3 },
  habitMeta: { flexDirection: "row", justifyContent: "space-between" },
  habitStreak: { fontSize: 12, color: theme.colors.primary, fontWeight: "700" },
  habitGoals: { fontSize: 12, color: theme.colors.primary, fontWeight: "700" },
  memberActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 12, paddingVertical: 11, paddingHorizontal: 10, borderWidth: 1, gap: 6 },
  actionBtnIcon: { marginRight: 2 },
  actionBtnDefault: { backgroundColor: theme.dark ? 'rgba(0, 137, 123, 0.15)' : 'rgba(0, 137, 123, 0.1)', borderColor: theme.dark ? 'rgba(0, 137, 123, 0.3)' : 'rgba(0, 137, 123, 0.2)' },
  actionBtnText: { color: theme.colors.primary, fontWeight: "700", fontSize: 12 },
  actionBtnSecondary: { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
  actionBtnTextSecondary: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  actionBtnDanger: { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' },
  actionBtnTextDanger: { color: '#EF4444', fontWeight: "700", fontSize: 12 },
  aiCard: {
    // Use theme.secondaryContainer if available; else compute a safe rgba fallback from secondary
    backgroundColor: (() => {
      const container = (theme.colors as any).secondaryContainer;
      if (container) return container;
      const sec = theme.colors.secondary;
      if (typeof sec === 'string' && sec.startsWith('#')) {
        let c = sec.replace('#', '');
        if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return theme.dark ? `rgba(${r}, ${g}, ${b}, 0.12)` : `rgba(${r}, ${g}, ${b}, 0.12)`;
      }
      return theme.dark ? 'rgba(99, 102, 241, 0.12)' : `${theme.colors.secondary}19`;
    })(),
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: (() => {
      const container = (theme.colors as any).secondaryContainer;
      if (container) return container;
      const sec = theme.colors.secondary;
      if (typeof sec === 'string' && sec.startsWith('#')) {
        let c = sec.replace('#', '');
        if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return theme.dark ? `rgba(${r}, ${g}, ${b}, 0.26)` : `rgba(${r}, ${g}, ${b}, 0.3)`;
      }
      return theme.dark ? 'rgba(99, 102, 241, 0.3)' : `${theme.colors.secondary}4D`;
    })(),
  },
  aiHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  aiIcon: { fontSize: 24, marginRight: 8 },
  aiTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.primary },
  aiText: { fontSize: 14, color: theme.colors.onSurface, lineHeight: 20, marginBottom: 8 },
  aiBold: { fontWeight: "800", color: theme.colors.primary },
  aiHighlight: { color: theme.colors.secondary, fontWeight: "900" },
  actionsGrid: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  actionCard: { flex: 1, minWidth: "31%", backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20, alignItems: "center", borderWidth: 1, borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0, 137, 123, 0.15)' },
  actionIcon: { fontSize: 32, marginBottom: 8 },
  actionText: { fontSize: 13, color: theme.colors.primary, fontWeight: "600", textAlign: "center" },
  actionIconMargin: { marginBottom: 8 },
  emptyMemberCard: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, borderLeftWidth: 4, borderTopColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderTopWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  emptyMemberText: { fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' },
  habitMetaRow: { flexDirection: 'row', alignItems: 'center' },
  habitMetaIcon: { marginRight: 4 },
  aiRow: { flexDirection: 'row', marginBottom: 8 },
  aiRowLast: { flexDirection: 'row', marginBottom: 0 },
  aiRowIcon: { marginRight: 6, marginTop: 2 },
  aiIconMargin: { marginRight: 8 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  errorText: { color: theme.colors.onSurface, textAlign: 'center', fontSize: 16, marginBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.colors.onSurface, marginTop: 12, fontSize: 14 },
  retryButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});
