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
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { useFamilyStore } from "../../store/familyStore";
import { useFamilyMembers, useFamilyMemberStore } from "../../store/familyMemberStore";
import { FamilyDataService, type FamilyMemberWithStats } from "../../services/admin/FamilyDataService";

type Props = NativeStackScreenProps<RootStackParamList, "FamilyOverview">;

export default function FamilyOverviewScreen({ navigation, route }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sharedWalletBalance, setSharedWalletBalance] = useState<number>(0);
  const [familyGoalsCount, setFamilyGoalsCount] = useState<number>(0);
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberWithStats[]>([]);
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
  
  // ✅ Get base family members
  const baseFamilyMembers = React.useMemo(() => {
    return familyMembersFromStore && familyMembersFromStore.length > 0 
      ? familyMembersFromStore 
      : [];
  }, [familyMembersFromStore]);

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

  // 📊 Fetch shared wallet balance and family goals
  React.useEffect(() => {
    const fetchFamilyFinancialData = async () => {
      if (!selectedFamily?.id || baseFamilyMembers.length === 0) return;

      try {
        const [walletBalance, goalsCount] = await Promise.all([
          FamilyDataService.getSharedWalletBalance(selectedFamily.id),
          FamilyDataService.getFamilyGoalsCount(selectedFamily.id, baseFamilyMembers),
        ]);

        setSharedWalletBalance(walletBalance);
        setFamilyGoalsCount(goalsCount);
      } catch (error) {
        console.error('Error fetching family financial data:', error);
      }
    };

    fetchFamilyFinancialData();
  }, [selectedFamily?.id, baseFamilyMembers]);

  // 🔧 Enrich members with REAL finance & habits data using service
  React.useEffect(() => {
    const enrichMembers = async () => {
      if (baseFamilyMembers.length === 0) {
        setFamilyMembers([]);
        return;
      }

      try {
        const enriched = await FamilyDataService.enrichMembersWithRealData(baseFamilyMembers);
        setFamilyMembers(enriched);
      } catch (error) {
        console.error('Error enriching members:', error);
        // Fallback to mock data
        const mockEnriched = FamilyDataService.enrichMembersWithMockData(baseFamilyMembers);
        setFamilyMembers(mockEnriched);
      }
    };

    enrichMembers();
  }, [baseFamilyMembers]);
  
  // 📊 Calculate family overview statistics using service
  const familyStats = React.useMemo(() => {
    const stats = FamilyDataService.calculateFamilyStats(familyMembers);
    // Override walletBalance with real shared wallet data
    return {
      ...stats,
      walletBalance: sharedWalletBalance,
      totalGoals: familyGoalsCount,
    };
  }, [familyMembers, sharedWalletBalance, familyGoalsCount]);

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
            <View style={styles.summaryHeader}>
              <Icon name="home-heart" size={28} color={theme.colors.primary} />
              <Text style={styles.summaryTitle}>Tổng quan gia đình</Text>
            </View>
            <View style={styles.summaryStats}>
              <View style={styles.summaryItemSmall}>
                <Icon name="account-multiple" size={32} color={theme.colors.primary} style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>Thành viên</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                  {familyStats.totalMembers}
                </Text>
              </View>
              <View style={styles.summaryItemLarge}>
                <Icon name="wallet" size={40} color={theme.colors.secondary} style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>Ví chung</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.secondary }]}>
                  {FamilyDataService.formatCurrency(familyStats.walletBalance)}
                </Text>
              </View>
              <View style={styles.summaryItemSmall}>
                <Icon name="bullseye-arrow" size={32} color={theme.colors.primary} style={styles.summaryIcon} />
                <Text style={styles.summaryLabel}>Mục tiêu</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                  {familyStats.totalGoals}
                </Text>
              </View>
            </View>
          </View>

          {/* Members List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thành viên ({familyStats.totalMembers})</Text>
            {familyMembers.length === 0 ? (
              <View style={styles.emptyMemberCard}>
                <Icon name="account-multiple-plus" size={48} color={theme.colors.primary} />
                <Text style={styles.emptyMemberText}>Chưa có thành viên nào</Text>
              </View>
            ) : (
              familyMembers.map((member) => {
                const habitRate = FamilyDataService.calculateMemberHabitRate(member);
                const defaultColor = member.color || "#6366F1";
                const roleDisplay = FamilyDataService.getMemberRoleDisplay(member.role);
                const avatarIcon = FamilyDataService.getMemberAvatarIcon(member.role);

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
                            {roleDisplay}
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
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingTop: 8, 
    paddingHorizontal: 20, 
    paddingBottom: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', 
    backgroundColor: theme.colors.surface,
    shadowColor: theme.dark ? '#000' : '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  spacer: { width: 40 },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: theme.dark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)', 
    alignItems: "center", 
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
  },
  backIcon: { 
    fontSize: 22, 
    color: theme.colors.primary, 
    fontWeight: "bold" 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "800", 
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },
  familyNameSubtitle: { 
    fontSize: 13, 
    color: theme.colors.onSurfaceVariant, 
    marginLeft: 8, 
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  headerTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerPermButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  headerActions: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 10 
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.dark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.12)',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.2)',
  },
  addButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: theme.colors.primary, 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addIcon: { fontSize: 24, color: "#FFFFFF", fontWeight: "700" },
  content: { padding: 20 },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
    shadowColor: theme.dark ? '#000' : theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 10,
  },
  summaryTitle: { 
    fontSize: 19, 
    fontWeight: "800", 
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },
  summaryStats: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    gap: 12,
  },
  summaryItemSmall: { 
    alignItems: "center",
    flex: 0.85,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.04)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.08)',
  },
  summaryItemLarge: { 
    alignItems: "center",
    flex: 1.3,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.04)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.08)',
  },
  summaryIcon: {
    marginBottom: 10,
  },
  summaryItem: { 
    alignItems: "center",
    flex: 1,
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(99, 102, 241, 0.04)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.08)',
  },
  summaryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryLabel: { 
    fontSize: 12, 
    color: theme.colors.onSurfaceVariant, 
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  summaryValue: { 
    fontSize: 20, 
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  section: { marginBottom: 28 },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: theme.colors.primary, 
    marginBottom: 18,
    letterSpacing: 0.4,
  },
  memberCard: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 18, 
    borderLeftWidth: 5,
    shadowColor: theme.dark ? '#000' : theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  memberHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 18 
  },
  memberInfo: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  memberAvatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    alignItems: "center", 
    justifyContent: "center", 
    marginRight: 14 
  },
  memberAvatarText: { fontSize: 32 },
  memberDetails: { flex: 1 },
  memberName: { 
    fontSize: 19, 
    fontWeight: "800", 
    color: theme.colors.onSurface, 
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  memberRole: { 
    fontSize: 13, 
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  memberBadge: { 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    paddingVertical: 8 
  },
  memberBadgeText: { 
    fontSize: 16, 
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  memberStats: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 18,
    gap: 8,
  },
  statRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    flex: 1 
  },
  statIcon: { marginRight: 7 },
  statInfo: { flex: 1 },
  statLabel: { 
    fontSize: 12, 
    color: theme.colors.onSurfaceVariant, 
    marginBottom: 3,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statValue: { 
    fontSize: 14, 
    fontWeight: "800", 
    color: theme.colors.onSurface,
    letterSpacing: 0.2,
  },
  memberHabits: { marginBottom: 14 },
  habitInfo: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 10 
  },
  habitLabel: { 
    fontSize: 14, 
    color: theme.colors.primary, 
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  habitValue: { 
    fontSize: 14, 
    color: theme.colors.onSurface, 
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  habitProgress: { 
    height: 8, 
    backgroundColor: theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(99, 102, 241, 0.12)', 
    borderRadius: 4, 
    overflow: "hidden", 
    marginBottom: 10 
  },
  habitProgressFill: { 
    height: "100%", 
    borderRadius: 4 
  },
  habitMeta: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  habitStreak: { 
    fontSize: 13, 
    color: theme.colors.onSurface, 
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  habitGoals: { 
    fontSize: 13, 
    color: theme.colors.onSurface, 
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  memberActions: { 
    flexDirection: "row", 
    gap: 10, 
    marginTop: 6 
  },
  actionBtn: { 
    flex: 1, 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    borderRadius: 14, 
    paddingVertical: 12, 
    paddingHorizontal: 12, 
    borderWidth: 1.5, 
    gap: 6 
  },
  actionBtnIcon: {},
  actionBtnDefault: { 
    backgroundColor: theme.dark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)', 
    borderColor: theme.dark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)' 
  },
  actionBtnText: { 
    color: theme.colors.primary, 
    fontWeight: "700", 
    fontSize: 13,
    letterSpacing: 0.2,
  },
  actionBtnSecondary: { 
    backgroundColor: theme.colors.primary, 
    borderColor: theme.colors.primary 
  },
  actionBtnTextSecondary: { 
    color: "#FFFFFF", 
    fontWeight: "700", 
    fontSize: 13,
    letterSpacing: 0.2,
  },
  actionBtnDanger: { 
    backgroundColor: 'rgba(239, 68, 68, 0.12)', 
    borderColor: 'rgba(239, 68, 68, 0.4)' 
  },
  actionBtnTextDanger: { 
    color: '#EF4444', 
    fontWeight: "700", 
    fontSize: 13,
    letterSpacing: 0.2,
  },
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
  actionsGrid: { 
    flexDirection: "row", 
    gap: 14, 
    flexWrap: "wrap" 
  },
  actionCard: { 
    flex: 1, 
    minWidth: "30%", 
    backgroundColor: theme.colors.surface, 
    borderRadius: 14, 
    padding: 14, 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(99, 102, 241, 0.1)',
    shadowColor: theme.dark ? '#000' : theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  actionIcon: { fontSize: 26, marginBottom: 6 },
  actionText: { 
    fontSize: 11, 
    color: theme.colors.onSurface, 
    fontWeight: "700", 
    textAlign: "center",
    letterSpacing: 0.2,
  },
  actionIconMargin: { marginBottom: 6 },
  emptyMemberCard: { 
    backgroundColor: theme.colors.surface, 
    borderRadius: 20, 
    padding: 24, 
    borderLeftWidth: 5, 
    borderLeftColor: theme.colors.primary,
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  },
  emptyMemberText: { 
    fontSize: 14, 
    color: theme.colors.onSurfaceVariant, 
    marginTop: 10, 
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  habitMetaRow: { flexDirection: 'row', alignItems: 'center' },
  habitMetaIcon: { marginRight: 4 },
  aiRow: { flexDirection: 'row', marginBottom: 8 },
  aiRowLast: { flexDirection: 'row', marginBottom: 0 },
  aiRowIcon: { marginRight: 6, marginTop: 2 },
  aiIconMargin: { marginRight: 8 },
  errorContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 28 
  },
  errorText: { 
    color: theme.colors.onSurface, 
    textAlign: 'center', 
    fontSize: 16, 
    marginBottom: 24,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 24,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    color: theme.colors.onSurface, 
    marginTop: 16, 
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  retryButton: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 32, 
    paddingVertical: 14, 
    borderRadius: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
