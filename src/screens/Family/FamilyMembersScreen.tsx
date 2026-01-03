import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFamilyStore } from '../../store/familyStore';
import FamilyMemberManagementService, {
  FamilyMemberWithActions,
} from '../../services/admin/FamilyMemberManagementService';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

export default function FamilyMembersScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { currentFamily } = useFamilyStore();

  const [members, setMembers] = useState<FamilyMemberWithActions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const loadMembers = React.useCallback(async () => {
    if (!currentFamily?.id) return;

    try {
      setLoading(true);
      const fetchedMembers = await FamilyMemberManagementService.getFamilyMembersWithActions(
        currentFamily.id
      );
      setMembers(fetchedMembers);
    } catch (_error) {
      console.error('Error loading members:', _error);
      Alert.alert('Lỗi', 'Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  }, [currentFamily?.id]);

  // Load members on mount
  React.useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleDeleteMember = (member: FamilyMemberWithActions) => {
    if (!currentFamily?.id) return;

    Alert.alert(
      'Xóa thành viên',
      `Bạn có chắc chắn muốn xóa ${member.name} khỏi gia đình?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const familyId = currentFamily?.id;
              if (!familyId) return;
              await FamilyMemberManagementService.removeFamilyMember(
                familyId,
                member.userId
              );
              loadMembers();
              Alert.alert('Thành công', `${member.name} đã bị xóa khỏi gia đình`);
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa thành viên');
            }
          },
        },
      ]
    );
  };

  const handleEditMember = (member: FamilyMemberWithActions) => {
    // For now, show member details
    Alert.alert(member.name, `Email: ${member.email}\nĐã tham gia: ${member.joinedAt || 'N/A'}`);
  };

  const getRoleIcon = (role: string) => {
    const icons: { [key: string]: string } = {
      owner: 'crown',
      admin: 'shield-admin',
      child: 'baby-face',
      member: 'account',
    };
    return icons[role] || 'account';
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      owner: '#FF6B6B',
      admin: '#FFD93D',
      child: '#96CEB4',
      member: '#4ECDC4',
    };
    return colors[role] || '#4ECDC4';
  };

  const getMemberRoleDisplay = (role: string): string => {
    const roleMap: { [key: string]: string } = {
      owner: 'Chủ hộ',
      admin: 'Quản lý',
      child: 'Con em',
      member: 'Thành viên',
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách thành viên...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Back Button */}
      <View style={styles.headerTop}>
        <Pressable 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={theme.colors.primary} />
        </Pressable>
        <Text style={styles.headerTopTitle}>Thành viên gia đình</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerContent}>
            <Text style={styles.memberCount}>{members.length} thành viên</Text>
          </View>
        </Animated.View>

        <View style={styles.membersContainer}>
          {members.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Icon name="account-multiple-outline" size={48} color={theme.colors.outline} />
              <Text style={styles.emptyStateText}>Chưa có thành viên nào</Text>
            </View>
          ) : (
            members.map((member) => (
              <Animated.View
                key={member.userId}
                style={[
                  styles.memberCard,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateY: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.memberContent}>
                  {/* Avatar and Info Section */}
                  <View style={styles.memberInfoSection}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: member.color || '#4ECDC4' },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {member.name.charAt(0).toUpperCase()}
                      </Text>
                      {/* Status Indicator */}
                      <View style={styles.statusIndicator}>
                        <Icon 
                          name="check-circle" 
                          size={14} 
                          color="#2ECC71" 
                        />
                      </View>
                    </View>

                    <View style={styles.memberDetails}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                      <View style={styles.roleAndStatusRow}>
                        <View
                          style={[
                            styles.roleBadge,
                            { backgroundColor: getRoleColor(member.role) + '20' },
                          ]}
                        >
                          <Icon
                            name={getRoleIcon(member.role)}
                            size={11}
                            color={getRoleColor(member.role)}
                          />
                          <Text
                            style={[
                              styles.roleBadgeText,
                              { color: getRoleColor(member.role) },
                            ]}
                          >
                            {getMemberRoleDisplay(member.role)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Actions Section */}
                  <View style={styles.actionsSection}>
                    {member.canEdit && (
                      <Pressable
                        style={[styles.actionButton, styles.viewButton]}
                        onPress={() => handleEditMember(member)}
                      >
                        <Icon name="eye" size={18} color="#3498DB" />
                      </Pressable>
                    )}

                    {member.canDelete && (
                      <Pressable
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteMember(member)}
                      >
                        <Icon name="trash-can" size={18} color="#E74C3C" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    headerTopTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      paddingBottom: 32,
    },
    header: {
      marginBottom: 20,
    },
    headerContent: {
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    memberCount: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
    },
    membersContainer: {
      gap: 12,
    },
    memberCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    memberContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    memberInfoSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      position: 'relative',
    },
    statusIndicator: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 2,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    memberDetails: {
      flex: 1,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    memberEmail: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
    },
    roleAndStatusRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    roleBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    actionsSection: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 38,
      height: 38,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.2,
    },
    viewButton: {
      backgroundColor: '#3498DB15',
      borderColor: '#3498DB50',
    },
    editButton: {
      backgroundColor: '#3498DB20',
      borderColor: '#3498DB60',
    },
    deleteButton: {
      backgroundColor: '#E74C3C15',
      borderColor: '#E74C3C50',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    emptyStateContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    emptyStateText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
  });
