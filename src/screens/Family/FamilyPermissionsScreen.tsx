import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, any>;

type PermissionLevel = 'none' | 'view' | 'edit' | 'admin';
type MemberRole = 'admin' | 'parent' | 'child' | 'viewer';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar: string;
  isCurrentUser: boolean;
}

interface PermissionSettings {
  // Finance permissions
  viewPersonalWallets: boolean;
  viewIncomeDetails: PermissionLevel;
  editSharedBudget: PermissionLevel;
  addSharedTransactions: boolean;
  viewFamilyFinanceReport: boolean;
  
  // Habit permissions
  viewPersonalHabits: boolean;
  editSharedGoals: PermissionLevel;
  viewHabitReports: boolean;
  
  // AI permissions
  aiAnalyzeSharedData: boolean;
  aiPersonalRecommendations: boolean;
  
  // General permissions
  inviteMembers: boolean;
  changePermissions: boolean;
  removeMembers: boolean;
}

const ROLE_PRESETS: Record<MemberRole, PermissionSettings> = {
  admin: {
    viewPersonalWallets: true,
    viewIncomeDetails: 'edit',
    editSharedBudget: 'admin',
    addSharedTransactions: true,
    viewFamilyFinanceReport: true,
    viewPersonalHabits: true,
    editSharedGoals: 'admin',
    viewHabitReports: true,
    aiAnalyzeSharedData: true,
    aiPersonalRecommendations: true,
    inviteMembers: true,
    changePermissions: true,
    removeMembers: true,
  },
  parent: {
    viewPersonalWallets: true,
    viewIncomeDetails: 'view',
    editSharedBudget: 'edit',
    addSharedTransactions: true,
    viewFamilyFinanceReport: true,
    viewPersonalHabits: true,
    editSharedGoals: 'edit',
    viewHabitReports: true,
    aiAnalyzeSharedData: true,
    aiPersonalRecommendations: true,
    inviteMembers: false,
    changePermissions: false,
    removeMembers: false,
  },
  child: {
    viewPersonalWallets: false,
    viewIncomeDetails: 'none',
    editSharedBudget: 'view',
    addSharedTransactions: false,
    viewFamilyFinanceReport: false,
    viewPersonalHabits: false,
    editSharedGoals: 'view',
    viewHabitReports: false,
    aiAnalyzeSharedData: false,
    aiPersonalRecommendations: true,
    inviteMembers: false,
    changePermissions: false,
    removeMembers: false,
  },
  viewer: {
    viewPersonalWallets: false,
    viewIncomeDetails: 'none',
    editSharedBudget: 'view',
    addSharedTransactions: false,
    viewFamilyFinanceReport: false,
    viewPersonalHabits: false,
    editSharedGoals: 'none',
    viewHabitReports: false,
    aiAnalyzeSharedData: false,
    aiPersonalRecommendations: false,
    inviteMembers: false,
    changePermissions: false,
    removeMembers: false,
  },
};

export default function FamilyPermissionsScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [selectedTab, setSelectedTab] = useState<'finance' | 'habits' | 'ai' | 'general'>('finance');
  const [selectedMember, setSelectedMember] = useState<string>('1');
  
  const [familyMembers] = useState<FamilyMember[]>([
    {
      id: '1',
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@gmail.com',
      role: 'admin',
      avatar: 'account',
      isCurrentUser: true,
    },
    {
      id: '2',
      name: 'Nguyễn Thị B',
      email: 'nguyenthib@gmail.com',
      role: 'parent',
      avatar: 'account-outline',
      isCurrentUser: false,
    },
    {
      id: '3',
      name: 'Nguyễn Văn C',
      email: 'nguyenvanc@gmail.com',
      role: 'child',
      avatar: 'human-child',
      isCurrentUser: false,
    },
  ]);

  const [permissions, setPermissions] = useState<Record<string, PermissionSettings>>({
    '1': ROLE_PRESETS.admin,
    '2': ROLE_PRESETS.parent,
    '3': ROLE_PRESETS.child,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const currentMember = familyMembers.find(m => m.id === selectedMember);
  const currentPermissions = permissions[selectedMember] || ROLE_PRESETS.viewer;
  const isCurrentUserAdmin = familyMembers.find(m => m.isCurrentUser)?.role === 'admin';

  const handlePermissionChange = (key: keyof PermissionSettings, value: any) => {
    if (!isCurrentUserAdmin && selectedMember !== familyMembers.find(m => m.isCurrentUser)?.id) {
      Alert.alert('Không có quyền', 'Bạn không có quyền thay đổi cài đặt của thành viên khác');
      return;
    }

    setPermissions(prev => ({
      ...prev,
      [selectedMember]: {
        ...prev[selectedMember],
        [key]: value
      }
    }));
  };

  const handleRoleChange = (memberId: string, newRole: MemberRole) => {
    if (!isCurrentUserAdmin) {
      Alert.alert('Không có quyền', 'Chỉ quản trị viên mới có thể thay đổi vai trò');
      return;
    }

    if (memberId === familyMembers.find(m => m.isCurrentUser)?.id && newRole !== 'admin') {
      Alert.alert('Cảnh báo', 'Bạn không thể tự hủy quyền quản trị viên của mình');
      return;
    }

    Alert.alert(
      'Thay đổi vai trò',
      `Thay đổi vai trò thành "${getRoleLabel(newRole)}"? Quyền hạn sẽ được cập nhật theo vai trò mới.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            setPermissions(prev => ({
              ...prev,
              [memberId]: ROLE_PRESETS[newRole]
            }));
          }
        }
      ]
    );
  };

  const getRoleLabel = (role: MemberRole) => {
    switch (role) {
      case 'admin': return 'Quản trị viên';
      case 'parent': return 'Phụ huynh';
      case 'child': return 'Con cái';
      case 'viewer': return 'Người xem';
      default: return role;
    }
  };

  const getPermissionLevelLabel = (level: PermissionLevel) => {
    switch (level) {
      case 'none': return 'Không cho phép';
      case 'view': return 'Chỉ xem';
      case 'edit': return 'Có thể chỉnh sửa';
      case 'admin': return 'Toàn quyền';
      default: return level;
    }
  };

  const renderMemberTabs = () => (
    <View style={styles.memberTabs}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {familyMembers.map(member => (
          <TouchableOpacity
            key={member.id}
            style={[
              styles.memberTab,
              selectedMember === member.id && styles.memberTabActive
            ]}
            onPress={() => setSelectedMember(member.id)}
          >
              <Text style={styles.memberAvatar}><Icon name={member.avatar as any} size={24} color="#00796B" /></Text>
            <Text style={[
              styles.memberTabName,
              selectedMember === member.id && styles.memberTabNameActive
            ]}>
              {member.name}
              {member.isCurrentUser && ' (Bạn)'}
            </Text>
            <View style={styles.memberRoleBadge}>
              <Text style={styles.memberRoleText}>{getRoleLabel(member.role)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderPermissionTabs = () => (
    <View style={styles.permissionTabs}>
      <TouchableOpacity
        style={[styles.permissionTab, selectedTab === 'finance' && styles.permissionTabActive]}
        onPress={() => setSelectedTab('finance')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="currency-usd" size={14} color={selectedTab === 'finance' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} style={{ marginRight: 4 }} />
          <Text style={[styles.permissionTabText, selectedTab === 'finance' && styles.permissionTabTextActive]}>
            Tài chính
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.permissionTab, selectedTab === 'habits' && styles.permissionTabActive]}
        onPress={() => setSelectedTab('habits')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="target" size={14} color={selectedTab === 'habits' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} style={{ marginRight: 4 }} />
          <Text style={[styles.permissionTabText, selectedTab === 'habits' && styles.permissionTabTextActive]}>
            Thói quen
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.permissionTab, selectedTab === 'ai' && styles.permissionTabActive]}
        onPress={() => setSelectedTab('ai')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="robot" size={14} color={selectedTab === 'ai' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} style={{ marginRight: 4 }} />
          <Text style={[styles.permissionTabText, selectedTab === 'ai' && styles.permissionTabTextActive]}>
            AI
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.permissionTab, selectedTab === 'general' && styles.permissionTabActive]}
        onPress={() => setSelectedTab('general')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="cog" size={14} color={selectedTab === 'general' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} style={{ marginRight: 4 }} />
          <Text style={[styles.permissionTabText, selectedTab === 'general' && styles.permissionTabTextActive]}>
            Chung
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderTogglePermission = (
    key: keyof PermissionSettings,
    title: string,
    description: string,
    icon: string
  ) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionInfo}>
        <Icon name={icon as any} size={20} color="#00796B" style={{ marginRight: 12 }} />
        <View style={styles.permissionText}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={currentPermissions[key] as boolean}
        onValueChange={(value) => handlePermissionChange(key, value)}
        trackColor={{ false: '#374151', true: '#6366F1' }}
        thumbColor={currentPermissions[key] ? '#00897B' : '#9CA3AF'}
      />
    </View>
  );

  const renderLevelPermission = (
    key: keyof PermissionSettings,
    title: string,
    description: string,
    icon: string
  ) => (
    <View style={styles.permissionItem}>
      <View style={styles.permissionInfo}>
        <Icon name={icon as any} size={20} color="#00796B" style={{ marginRight: 12 }} />
        <View style={styles.permissionText}>
          <Text style={styles.permissionTitle}>{title}</Text>
          <Text style={styles.permissionDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.levelSelector}>
        {(['none', 'view', 'edit', 'admin'] as PermissionLevel[]).map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.levelOption,
              currentPermissions[key] === level && styles.levelOptionActive
            ]}
            onPress={() => handlePermissionChange(key, level)}
          >
            <Text style={[
              styles.levelOptionText,
              currentPermissions[key] === level && styles.levelOptionTextActive
            ]}>
              {getPermissionLevelLabel(level)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderFinancePermissions = () => (
    <View style={styles.permissionsSection}>
      {renderTogglePermission(
        'viewPersonalWallets',
        'Xem ví cá nhân',
        'Cho phép xem thông tin ví cá nhân của nhau',
        'wallet'
      )}
      
      {renderLevelPermission(
        'viewIncomeDetails',
        'Thông tin thu nhập',
        'Mức độ truy cập thông tin thu nhập',
        'currency-usd'
      )}
      
      {renderLevelPermission(
        'editSharedBudget',
        'Ngân sách chung',
        'Quyền chỉnh sửa ngân sách gia đình',
        'chart-bar'
      )}
      
      {renderTogglePermission(
        'addSharedTransactions',
        'Thêm giao dịch chung',
        'Cho phép thêm giao dịch vào ví chung',
        'credit-card'
      )}
      
      {renderTogglePermission(
        'viewFamilyFinanceReport',
        'Báo cáo tài chính',
        'Xem báo cáo tài chính tổng hợp gia đình',
        'chart-line'
      )}
    </View>
  );

  const renderHabitsPermissions = () => (
    <View style={styles.permissionsSection}>
      {renderTogglePermission(
        'viewPersonalHabits',
        'Xem thói quen cá nhân',
        'Cho phép xem thói quen của thành viên khác',
        'notebook'
      )}
      
      {renderLevelPermission(
        'editSharedGoals',
        'Mục tiêu chung',
        'Quyền chỉnh sửa mục tiêu gia đình',
        'target'
      )}
      
      {renderTogglePermission(
        'viewHabitReports',
        'Báo cáo thói quen',
        'Xem báo cáo tiến độ thói quen của gia đình',
        'chart-bar'
      )}
    </View>
  );

  const renderAIPermissions = () => (
    <View style={styles.permissionsSection}>
      {renderTogglePermission(
        'aiAnalyzeSharedData',
        'Phân tích dữ liệu chung',
        'Cho phép AI phân tích dữ liệu gia đình',
        'robot'
      )}
      
      {renderTogglePermission(
        'aiPersonalRecommendations',
        'Gợi ý cá nhân',
        'Nhận gợi ý AI dựa trên dữ liệu cá nhân',
        'lightbulb-on'
      )}
    </View>
  );

  const renderGeneralPermissions = () => (
    <View style={styles.permissionsSection}>
      {renderTogglePermission(
        'inviteMembers',
        'Mời thành viên',
        'Cho phép mời thành viên mới vào gia đình',
        'account-group'
      )}
      
      {renderTogglePermission(
        'changePermissions',
        'Thay đổi quyền hạn',
        'Có thể thay đổi quyền hạn của thành viên khác',
        'cog'
      )}
      
      {renderTogglePermission(
        'removeMembers',
        'Xóa thành viên',
        'Có thể xóa thành viên khỏi gia đình',
        'door'
      )}
    </View>
  );

  const renderRolePresets = () => (
    <View style={styles.rolePresetsSection}>
      <Text style={styles.sectionTitle}>Vai trò có sẵn</Text>
      <View style={styles.rolePresets}>
        {(['admin', 'parent', 'child', 'viewer'] as MemberRole[]).map(role => (
          <TouchableOpacity
            key={role}
            style={[
              styles.rolePreset,
              currentMember?.role === role && styles.rolePresetActive
            ]}
            onPress={() => currentMember && handleRoleChange(currentMember.id, role)}
          >
            <Text style={styles.rolePresetTitle}>{getRoleLabel(role)}</Text>
            <Text style={styles.rolePresetDescription}>
              {role === 'admin' && 'Toàn quyền quản lý gia đình'}
              {role === 'parent' && 'Quyền cao, quản lý con cái'}
              {role === 'child' && 'Quyền hạn chế, phù hợp trẻ em'}
              {role === 'viewer' && 'Chỉ xem, không chỉnh sửa'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quyền truy cập</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Member Selection */}
      {renderMemberTabs()}

      {/* Permission Categories */}
      {renderPermissionTabs()}

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
        {/* Current Member Info */}
        {currentMember && (
          <View style={styles.memberInfoCard}>
            <Icon name={currentMember.avatar as any} size={32} color="#00796B" style={{ marginRight: 12 }} />
            <View style={styles.memberInfoDetails}>
              <Text style={styles.memberInfoName}>
                {currentMember.name}
                {currentMember.isCurrentUser && ' (Bạn)'}
              </Text>
              <Text style={styles.memberInfoEmail}>{currentMember.email}</Text>
              <Text style={styles.memberInfoRole}>{getRoleLabel(currentMember.role)}</Text>
            </View>
          </View>
        )}

        {/* Role Presets */}
        {isCurrentUserAdmin && renderRolePresets()}

        {/* Permissions */}
        {selectedTab === 'finance' && renderFinancePermissions()}
        {selectedTab === 'habits' && renderHabitsPermissions()}
        {selectedTab === 'ai' && renderAIPermissions()}
        {selectedTab === 'general' && renderGeneralPermissions()}

        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>

      {/* Warning */}
      <View style={styles.warningCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name="alert" size={14} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={styles.warningTitle}>Lưu ý bảo mật</Text>
        </View>
        <Text style={styles.warningText}>
          Cài đặt quyền hạn cẩn thận để bảo vệ thông tin tài chính và riêng tư của gia đình
        </Text>
      </View>

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
      </Animated.View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F2F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  headerPlaceholder: {
    width: 40,
  },
  memberTabs: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  memberTab: {
    alignItems: 'center',
    padding: 12,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 120,
  },
  memberTabActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  memberAvatar: {
    fontSize: 24,
    marginBottom: 4,
  },
  memberTabName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    textAlign: 'center',
  },
  memberTabNameActive: {
    color: theme.colors.primary,
  },
  memberRoleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberRoleText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  permissionTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  permissionTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 2,
    alignItems: 'center',
  },
  permissionTabActive: {
    backgroundColor: theme.colors.secondary,
  },
  permissionTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  permissionTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memberInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 24,
  },
  memberInfoAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  memberInfoDetails: {
    flex: 1,
  },
  memberInfoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  memberInfoEmail: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  memberInfoRole: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  rolePresetsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  rolePresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  rolePreset: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rolePresetActive: {
    borderColor: theme.colors.secondary,
    backgroundColor: `${theme.colors.secondary}33`,
  },
  rolePresetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  rolePresetDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 14,
  },
  permissionsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  permissionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 14,
  },
  levelSelector: {
    flexDirection: 'column',
    gap: 4,
  },
  levelOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  levelOptionActive: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  levelOptionText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  levelOptionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpace: {
    height: 100,
  },
  warningCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  decorativeCircle1: {
    width: 200,
    height: 200,
    backgroundColor: '#6366F1',
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    width: 150,
    height: 150,
    backgroundColor: '#EC4899',
    bottom: -75,
    left: -75,
  },
});