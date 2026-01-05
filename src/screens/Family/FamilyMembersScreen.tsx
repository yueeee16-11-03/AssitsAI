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
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
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
  const [filteredMembers, setFilteredMembers] = useState<FamilyMemberWithActions[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberWithActions | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'member' | 'admin' | 'child'>('member');
  const [isProcessing, setIsProcessing] = useState(false);

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
      setFilteredMembers(fetchedMembers);
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

  // Search and Filter effect
  React.useEffect(() => {
    let filtered = members;

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply role filter
    if (filterRole) {
      filtered = filtered.filter((m) => m.role === filterRole);
    }

    setFilteredMembers(filtered);
  }, [searchQuery, filterRole, members]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMembers();
    setRefreshing(false);
  };

  const handleAddMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return;
    }

    if (!currentFamily?.id) return;

    try {
      setIsProcessing(true);
      await FamilyMemberManagementService.inviteMemberByEmail(
        currentFamily.id,
        inviteEmail.trim()
      );
      Alert.alert('Thành công', 'Đã gửi lời mời thành công');
      setShowAddModal(false);
      setInviteEmail('');
      await loadMembers();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi lời mời');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedMember || !currentFamily?.id) return;

    if (!selectedMember.canEdit) {
      Alert.alert('Không có quyền', 'Bạn không có quyền chỉnh sửa thành viên này');
      return;
    }

    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên');
      return;
    }

    try {
      setIsProcessing(true);
      let updated = false;

      // Update name if changed
      if (editName !== selectedMember.name) {
        await FamilyMemberManagementService.updateFamilyMember(
          currentFamily.id,
          selectedMember.userId,
          { name: editName }
        );
        updated = true;
      }

      // Update role if changed and user has permission
      if (editRole !== selectedMember.role) {
        if (selectedMember.canChangeRole) {
          await FamilyMemberManagementService.updateMemberRole(
            currentFamily.id,
            selectedMember.userId,
            editRole
          );
          updated = true;
        } else {
          Alert.alert('Cảnh báo', 'Bạn không có quyền thay đổi vai trò của thành viên này');
        }
      }

      if (updated) {
        Alert.alert('Thành công', 'Đã cập nhật thông tin thành viên');
        setShowEditModal(false);
        setSelectedMember(null);
        await loadMembers();
      } else {
        setShowEditModal(false);
        setSelectedMember(null);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMember = (member: FamilyMemberWithActions) => {
    if (!currentFamily?.id) return;

    if (!member.canDelete) {
      Alert.alert('Không có quyền', 'Bạn không có quyền xóa thành viên này');
      return;
    }

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
              await loadMembers();
              Alert.alert('Thành công', `${member.name} đã bị xóa khỏi gia đình`);
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa thành viên');
            }
          },
        },
      ]
    );
  };

  const handleEditMember = (member: FamilyMemberWithActions) => {
    if (!member.canEdit) {
      Alert.alert('Không có quyền', 'Bạn không có quyền chỉnh sửa thành viên này');
      return;
    }
    setSelectedMember(member);
    setEditName(member.name);
    setEditRole(member.role as 'member' | 'admin' | 'child');
    setShowEditModal(true);
  };

  const handleViewMember = (member: FamilyMemberWithActions) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };

  const clearFilter = () => {
    setFilterRole(null);
  };

  const getRoleCount = (role: string) => {
    return members.filter((m) => m.role === role).length;
  };

  const getRoleIcon = (role: string) => {
    const icons: { [key: string]: string } = {
      owner: 'crown',
      admin: 'shield-account',
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
        <Pressable 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="plus" size={24} color="#fff" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={theme.colors.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm thành viên..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            )}
          </View>

          {/* Role Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              style={[styles.filterChip, !filterRole && styles.filterChipActive]}
              onPress={clearFilter}
            >
              <Text style={[styles.filterChipText, !filterRole && styles.filterChipTextActive]}>
                Tất cả ({members.length})
              </Text>
            </Pressable>
            {['owner', 'admin', 'member', 'child']
              .filter((role) => getRoleCount(role) > 0)
              .map((role) => {
                const count = getRoleCount(role);
                return (
                  <Pressable
                    key={role}
                    style={[styles.filterChip, filterRole === role && styles.filterChipActive]}
                    onPress={() => setFilterRole(filterRole === role ? null : role)}
                  >
                    <Icon
                      name={getRoleIcon(role)}
                      size={14}
                      color={filterRole === role ? '#fff' : getRoleColor(role)}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        filterRole === role && styles.filterChipTextActive,
                      ]}
                    >
                      {getMemberRoleDisplay(role)} ({count})
                    </Text>
                  </Pressable>
                );
              })}
          </ScrollView>

          <View style={styles.headerContent}>
            <Text style={styles.memberCount}>
              {filteredMembers.length} / {members.length} thành viên
            </Text>
          </View>
        </Animated.View>

        <View style={styles.membersContainer}>
          {filteredMembers.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Icon name="account-multiple-outline" size={48} color={theme.colors.outline} />
              <Text style={styles.emptyStateText}>
                {searchQuery || filterRole ? 'Không tìm thấy thành viên' : 'Chưa có thành viên nào'}
              </Text>
            </View>
          ) : (
            filteredMembers.map((member) => (
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
                    <Pressable
                      style={[styles.actionButton, styles.viewButton]}
                      onPress={() => handleViewMember(member)}
                    >
                      <Icon name="eye" size={18} color="#9B59B6" />
                    </Pressable>
                    
                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.editButton,
                        !member.canEdit && styles.disabledButton,
                      ]}
                      onPress={() => handleEditMember(member)}
                    >
                      <Icon
                        name="pencil"
                        size={18}
                        color={member.canEdit ? '#3498DB' : '#95A5A6'}
                      />
                    </Pressable>

                    <Pressable
                      style={[
                        styles.actionButton,
                        styles.deleteButton,
                        !member.canDelete && styles.disabledButton,
                      ]}
                      onPress={() => handleDeleteMember(member)}
                    >
                      <Icon
                        name="trash-can"
                        size={18}
                        color={member.canDelete ? '#E74C3C' : '#95A5A6'}
                      />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
      {/* Add Member Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => !isProcessing && setShowAddModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mời thành viên mới</Text>
              <Pressable
                onPress={() => setShowAddModal(false)}
                disabled={isProcessing}
              >
                <Icon name="close" size={24} color={theme.colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Email thành viên</Text>
              <View style={styles.inputContainer}>
                <Icon name="email-outline" size={20} color={theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isProcessing}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                  disabled={isProcessing}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAddMember}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="send" size={18} color="#fff" />
                      <Text style={styles.submitButtonText}>Gửi lời mời</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => !isProcessing && setShowEditModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thành viên</Text>
              <Pressable
                onPress={() => setShowEditModal(false)}
                disabled={isProcessing}
              >
                <Icon name="close" size={24} color={theme.colors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Tên thành viên</Text>
              <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color={theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={editName}
                  onChangeText={setEditName}
                  editable={!isProcessing}
                />
              </View>

              {selectedMember?.canChangeRole && (
                <>
                  <Text style={[styles.inputLabel, styles.roleLabel]}>Vai trò</Text>
                  <View style={styles.roleOptions}>
                    {(['admin', 'member', 'child'] as const).map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleOption,
                          editRole === role && styles.roleOptionActive,
                          { borderColor: getRoleColor(role) },
                        ]}
                        onPress={() => setEditRole(role)}
                        disabled={isProcessing}
                      >
                        <Icon
                          name={getRoleIcon(role)}
                          size={20}
                          color={editRole === role ? '#fff' : getRoleColor(role)}
                        />
                        <Text
                          style={[
                            styles.roleOptionText,
                            editRole === role && styles.roleOptionTextActive,
                          ]}
                        >
                          {getMemberRoleDisplay(role)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEditModal(false)}
                  disabled={isProcessing}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSaveEdit}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#fff" />
                      <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* View Member Details Modal */}
      <Modal
        visible={showViewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowViewModal(false)}
          />
          <View style={[styles.viewModalContent, { backgroundColor: theme.colors.surface }]}>
            {selectedMember && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header with Avatar */}
                <View style={styles.viewModalHeader}>
                  <View
                    style={[
                      styles.viewModalAvatar,
                      { backgroundColor: selectedMember.color || '#4ECDC4' },
                    ]}
                  >
                    <Text style={styles.viewModalAvatarText}>
                      {selectedMember.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.viewModalName}>{selectedMember.name}</Text>
                  <Text style={styles.viewModalEmail}>{selectedMember.email}</Text>
                  
                  {/* Role Badge */}
                  <View
                    style={[
                      styles.viewModalRoleBadge,
                      { backgroundColor: getRoleColor(selectedMember.role) },
                    ]}
                  >
                    <Icon
                      name={getRoleIcon(selectedMember.role)}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.viewModalRoleBadgeText}>
                      {getMemberRoleDisplay(selectedMember.role)}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.viewModalDivider} />

                {/* Status Section */}
                <View style={styles.viewModalSection}>
                  <Text style={styles.viewModalSectionTitle}>Trạng thái hoạt động</Text>
                  <View style={styles.viewModalStatusCard}>
                    <View style={styles.viewModalStatusItem}>
                      <View style={styles.viewModalStatusIconContainer}>
                        <Icon name="check-circle" size={24} color="#2ECC71" />
                      </View>
                      <View style={styles.viewModalStatusInfo}>
                        <Text style={styles.viewModalStatusLabel}>Trạng thái</Text>
                        <Text style={styles.viewModalStatusValue}>Đang hoạt động</Text>
                      </View>
                    </View>
                    <View style={styles.viewModalStatusItem}>
                      <View style={styles.viewModalStatusIconContainer}>
                        <Icon name="clock-outline" size={24} color="#3498DB" />
                      </View>
                      <View style={styles.viewModalStatusInfo}>
                        <Text style={styles.viewModalStatusLabel}>Tham gia</Text>
                        <Text style={styles.viewModalStatusValue}>
                          {selectedMember.joinedAt
                            ? new Date(selectedMember.joinedAt).toLocaleDateString('vi-VN')
                            : 'Không rõ'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Permissions Section */}
                <View style={styles.viewModalSection}>
                  <Text style={styles.viewModalSectionTitle}>Quyền hạn</Text>
                  <View style={styles.viewModalPermissionsCard}>
                    <View
                      style={[
                        styles.viewModalPermissionItem,
                        selectedMember.canEdit && styles.viewModalPermissionActive,
                      ]}
                    >
                      <Icon
                        name="pencil"
                        size={20}
                        color={selectedMember.canEdit ? '#3498DB' : '#95A5A6'}
                      />
                      <Text
                        style={[
                          styles.viewModalPermissionText,
                          selectedMember.canEdit && styles.viewModalPermissionTextActive,
                        ]}
                      >
                        Chỉnh sửa thông tin
                      </Text>
                      {selectedMember.canEdit && (
                        <Icon name="check" size={16} color="#2ECC71" />
                      )}
                    </View>

                    <View
                      style={[
                        styles.viewModalPermissionItem,
                        selectedMember.canDelete && styles.viewModalPermissionActive,
                      ]}
                    >
                      <Icon
                        name="trash-can"
                        size={20}
                        color={selectedMember.canDelete ? '#E74C3C' : '#95A5A6'}
                      />
                      <Text
                        style={[
                          styles.viewModalPermissionText,
                          selectedMember.canDelete && styles.viewModalPermissionTextActive,
                        ]}
                      >
                        Xóa thành viên
                      </Text>
                      {selectedMember.canDelete && (
                        <Icon name="check" size={16} color="#2ECC71" />
                      )}
                    </View>

                    <View
                      style={[
                        styles.viewModalPermissionItem,
                        selectedMember.canChangeRole && styles.viewModalPermissionActive,
                      ]}
                    >
                      <Icon
                        name="shield-account"
                        size={20}
                        color={selectedMember.canChangeRole ? '#F39C12' : '#95A5A6'}
                      />
                      <Text
                        style={[
                          styles.viewModalPermissionText,
                          selectedMember.canChangeRole && styles.viewModalPermissionTextActive,
                        ]}
                      >
                        Thay đổi vai trò
                      </Text>
                      {selectedMember.canChangeRole && (
                        <Icon name="check" size={16} color="#2ECC71" />
                      )}
                    </View>
                  </View>
                </View>

                {/* Actions */}
                {(selectedMember.canEdit || selectedMember.canDelete) && (
                  <View style={styles.viewModalActions}>
                    {selectedMember.canEdit && (
                      <TouchableOpacity
                        style={[styles.viewModalButton, styles.viewModalEditButton]}
                        onPress={() => {
                          setShowViewModal(false);
                          setTimeout(() => handleEditMember(selectedMember), 300);
                        }}
                      >
                        <Icon name="pencil" size={18} color="#fff" />
                        <Text style={styles.viewModalButtonText}>Chỉnh sửa</Text>
                      </TouchableOpacity>
                    )}
                    {selectedMember.canDelete && (
                      <TouchableOpacity
                        style={[styles.viewModalButton, styles.viewModalDeleteButton]}
                        onPress={() => {
                          setShowViewModal(false);
                          setTimeout(() => handleDeleteMember(selectedMember), 300);
                        }}
                      >
                        <Icon name="trash-can" size={18} color="#fff" />
                        <Text style={styles.viewModalButtonText}>Xóa</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.viewModalCloseButton}
                  onPress={() => setShowViewModal(false)}
                >
                  <Text style={styles.viewModalCloseButtonText}>Đóng</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
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
      backgroundColor: '#9B59B615',
      borderColor: '#9B59B650',
    },
    editButton: {
      backgroundColor: '#3498DB20',
      borderColor: '#3498DB60',
    },
    deleteButton: {
      backgroundColor: '#E74C3C15',
      borderColor: '#E74C3C50',
    },
    disabledButton: {
      backgroundColor: '#95A5A610',
      borderColor: '#95A5A630',
      opacity: 0.5,
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    searchInput: {
      flex: 1,
      marginLeft: 12,
      fontSize: 15,
      color: theme.colors.onSurface,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
      paddingRight: 16,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    filterChipActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    filterChipTextActive: {
      color: '#fff',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 32,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    modalBody: {
      padding: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    roleLabel: {
      marginTop: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    },
    input: {
      flex: 1,
      marginLeft: 12,
      fontSize: 15,
      color: theme.colors.onSurface,
    },
    roleOptions: {
      gap: 10,
    },
    roleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 12,
      borderWidth: 2,
      backgroundColor: theme.colors.surface,
    },
    roleOptionActive: {
      backgroundColor: theme.colors.primary,
    },
    roleOptionText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    roleOptionTextActive: {
      color: '#fff',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
    },
    cancelButton: {
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    submitButton: {
      backgroundColor: theme.colors.primary,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    submitButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    viewModalContent: {
      width: '90%',
      maxHeight: '85%',
      borderRadius: 24,
      padding: 24,
      marginHorizontal: '5%',
    },
    viewModalHeader: {
      alignItems: 'center',
      marginBottom: 20,
    },
    viewModalAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    viewModalAvatarText: {
      fontSize: 32,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    viewModalName: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
    },
    viewModalEmail: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 12,
    },
    viewModalRoleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    viewModalRoleBadgeText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#fff',
    },
    viewModalDivider: {
      height: 1,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      marginVertical: 20,
    },
    viewModalSection: {
      marginBottom: 20,
    },
    viewModalSectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    viewModalStatusCard: {
      gap: 12,
    },
    viewModalStatusItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 12,
      padding: 14,
      gap: 12,
    },
    viewModalStatusIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewModalStatusInfo: {
      flex: 1,
    },
    viewModalStatusLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    viewModalStatusValue: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    viewModalPermissionsCard: {
      gap: 10,
    },
    viewModalPermissionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    viewModalPermissionActive: {
      backgroundColor: theme.dark ? 'rgba(46,204,113,0.1)' : 'rgba(46,204,113,0.08)',
      borderColor: '#2ECC7140',
    },
    viewModalPermissionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    },
    viewModalPermissionTextActive: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    viewModalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
      marginBottom: 12,
    },
    viewModalButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    viewModalEditButton: {
      backgroundColor: '#3498DB',
    },
    viewModalDeleteButton: {
      backgroundColor: '#E74C3C',
    },
    viewModalButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    viewModalCloseButton: {
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
    },
    viewModalCloseButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
  });
