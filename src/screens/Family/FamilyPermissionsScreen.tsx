import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import { useFamilyStore } from '../../store/familyStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getFamilyPermissionColors } from '../../theme/familyPermissionColors';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;


type MemberRole = 'owner' | 'admin' | 'parent' | 'child' | 'viewer';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  avatar: string;
  isCurrentUser: boolean;
}





export default function FamilyPermissionsScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const COLORS = getFamilyPermissionColors(theme);
  const styles = getStyles(theme, COLORS);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [monitoringModalVisible, setMonitoringModalVisible] = useState(false);
  const [modalMemberFilter, setModalMemberFilter] = useState<string | undefined>(undefined);
  const [modalMemberSearch, setModalMemberSearch] = useState<string>('');
  const [modalTimeRange, setModalTimeRange] = useState<string | undefined>(undefined);
  const [monitoringViewMode, setMonitoringViewMode] = useState<'filters' | 'results'>('filters');
  const [activeForm, setActiveForm] = useState<'overview' | 'requests' | 'limits' | 'monitoring' | 'habits' | 'rules' | 'audit' | 'permissions'>('overview');
  const initialMemberId = (route?.params as { memberId?: string })?.memberId ?? '1';
  const [selectedMember, setSelectedMember] = useState<string>(initialMemberId);
  const { currentFamily } = useFamilyStore();
  const removeMemberStore = useFamilyStore(state => state.removeMember);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // --- Demo / local state for new sections ---
  const [pendingRequests, setPendingRequests] = useState<Array<any>>([
    { id: 'r1', requesterName: 'Lan T.', memberId: '2', amount: 250000, reason: 'Mua đồ học', time: '2 giờ trước', status: 'pending', note: '' },
    { id: 'r2', requesterName: 'Nam P.', memberId: '3', amount: 1200000, reason: 'Sửa xe', time: '1 ngày trước', status: 'pending', note: '' },
  ]);

  const [memberLimits, setMemberLimits] = useState<Record<string, any>>(() => {
    // default limits (demo)
    const map: Record<string, any> = {};
    // Use fallback demo data since members doesn't exist in FamilyModel
    const demoMembers = [
      { userId: '1', name: 'Oai Bui' },
      { userId: '2', name: 'Lan T.' },
      { userId: '3', name: 'Nam P.' },
    ];
    
    demoMembers.forEach((m: any) => {
      map[m.userId] = { limit: 1000000, period: 'month', enabled: true };
    });
    // fallback demo
    map['1'] = map['1'] || { limit: 1500000, period: 'month', enabled: true };
    map['2'] = map['2'] || { limit: 500000, period: 'month', enabled: true };
    map['3'] = map['3'] || { limit: 200000, period: 'month', enabled: false };
    return map;
  });

  const [transactions, setTransactions] = useState<Array<any>>([
    { id: 't1', memberId: '1', memberName: 'Oai Bui', amount: 1500000, category: 'Ăn uống', time: 'Hôm nay', flagged: false, status: 'normal' },
    { id: 't2', memberId: '2', memberName: 'Lan T.', amount: 250000, category: 'Giáo dục', time: 'Hôm qua', flagged: false, status: 'pending' },
    { id: 't3', memberId: '3', memberName: 'Nam P.', amount: 1200000, category: 'Sửa chữa', time: '2 ngày trước', flagged: true, status: 'normal' },
  ]);

  // Family habits state (demo)
  const [habits, setHabits] = useState<Array<any>>([
    { id: 'h1', title: 'Dọn dẹp phòng', assignedTo: ['1','2'], completedBy: { '1': false, '2': false }, missedDays: { '1': 0, '2': 2 } },
    { id: 'h2', title: 'Học 30 phút', assignedTo: ['3'], completedBy: { '3': false }, missedDays: { '3': 1 } },
  ]);


  // Transaction dropdown filters (user + time range)
  const [transactionUserFilter, setTransactionUserFilter] = useState<string | undefined>(undefined);
  const [transactionTimeRange, setTransactionTimeRange] = useState<string | undefined>(undefined);
  const [userPickerVisible, setUserPickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [userPickerSearch, setUserPickerSearch] = useState<string>('');



  const [auditLogs, setAuditLogs] = useState<Array<any>>([
    { id: 'a1', action: 'Tạo gia đình', by: 'Oai Bui', time: '2 ngày trước' },
    { id: 'a2', action: 'Thay đổi hạn mức của Lan T.', by: 'Oai Bui', time: '1 ngày trước' },
  ]);
  const [auditPage, setAuditPage] = useState<number>(0);
  const AUDIT_PAGE_SIZE = 3;

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil((auditLogs.length || 0) / AUDIT_PAGE_SIZE));
    if (auditPage >= totalPages) {
      setAuditPage(Math.max(0, totalPages - 1));
    }
  }, [auditLogs.length, auditPage]);

  // Transaction history modal state
  const [txHistoryVisible, setTxHistoryVisible] = useState(false);
  const [txHistoryTxId, setTxHistoryTxId] = useState<string | undefined>(undefined);

  // Habit editor / detail modals (Admin features)
  const [habitEditorVisible, setHabitEditorVisible] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | undefined>(undefined);
  const [habitForm, setHabitForm] = useState<{ title: string; assignedTo: string[]; frequency: 'daily'|'weekly'|'custom' }>(() => ({ title: '', assignedTo: [], frequency: 'daily' }));
  const [habitDetailVisible, setHabitDetailVisible] = useState(false);
  const [habitDetailId, setHabitDetailId] = useState<string | undefined>(undefined);

  // Handlers
  const approveRequest = (id: string) => {
    const req = pendingRequests.find(r => r.id === id);
    if (!req) return;
    setPendingRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Duyệt yêu cầu ${req.requesterName} (${req.amount})`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
    Alert.alert('Đã duyệt', `Yêu cầu của ${req.requesterName} đã được duyệt`);
  };

  const denyRequest = (id: string) => {
    const req = pendingRequests.find(r => r.id === id);
    if (!req) return;
    setPendingRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'denied' } : r));
    setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Từ chối yêu cầu ${req.requesterName} (${req.amount})`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
    Alert.alert('Đã từ chối', `Yêu cầu của ${req.requesterName} đã bị từ chối`);
  };

  const editLimit = (memberId: string) => {
    Alert.prompt?.('Sửa hạn mức', 'Nhập hạn mức mới (VNĐ)', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Lưu', onPress: (text?: string) => {
        const value = Number(text || 0);
        if (isNaN(value) || value <= 0) { Alert.alert('Giá trị không hợp lệ'); return; }
        setMemberLimits(prev => ({ ...prev, [memberId]: { ...prev[memberId], limit: value } }));
        setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Sửa hạn mức ${memberId} -> ${value}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
      }}
    ], 'plain-text');
  };

  const toggleLimitEnabled = (memberId: string) => {
    const priorEnabled = !!memberLimits[memberId]?.enabled;
    setMemberLimits(prev => ({ ...prev, [memberId]: { ...prev[memberId], enabled: !priorEnabled } }));
    setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `${priorEnabled ? 'Tắt' : 'Bật'} quyền chi cho ${memberId}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
  };

  const removeMember = (memberId: string) => {
    if (!isCurrentUserAdmin) {
      Alert.alert('Không có quyền', 'Chỉ quản trị viên mới có thể gỡ thành viên');
      return;
    }
    if (memberId === familyMembers.find(m => m.isCurrentUser)?.id) {
      Alert.alert('Không thể', 'Bạn không thể tự gỡ mình khỏi gia đình ở đây');
      return;
    }
    Alert.alert('Xác nhận', 'Bạn có chắc muốn gỡ thành viên khỏi gia đình?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Gỡ', style: 'destructive', onPress: async () => {
        try {
          if (!currentFamily?.id) throw new Error('Không có gia đình hiện tại');
          await removeMemberStore(currentFamily.id, memberId);
          setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Gỡ thành viên ${memberId}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
          Alert.alert('Đã gỡ', 'Thành viên đã được gỡ khỏi gia đình');
          // if removed member was selected, pick another
          if (selectedMember === memberId) {
            const remaining = familyMembers.filter(fm => fm.id !== memberId);
            setSelectedMember(remaining[0]?.id || '');
          }
        } catch (err: any) {
          Alert.alert('Lỗi', err?.message || 'Không thể gỡ thành viên');
        }
      } }
    ]);
  };

  // --- Transaction admin actions: Approve / Deny / Flag / View history ---
  const approveTransaction = (txId: string) => {
    if (!isCurrentUserAdmin) {
      Alert.alert('Không có quyền', 'Chỉ quản trị viên mới có thể duyệt chi');
      return;
    }
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'approved' } : t));
    setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Duyệt chi ${txId}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
    Alert.alert('Đã duyệt', 'Giao dịch đã được duyệt');
  };

  const denyTransaction = (txId: string) => {
    if (!isCurrentUserAdmin) {
      Alert.alert('Không có quyền', 'Chỉ quản trị viên mới có thể từ chối chi');
      return;
    }
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, status: 'denied' } : t));
    setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Từ chối chi ${txId}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
    Alert.alert('Đã từ chối', 'Giao dịch đã bị từ chối');
  };

  const toggleFlagTransaction = (txId: string) => {
    setTransactions(prev => prev.map(t => t.id === txId ? { ...t, flagged: !t.flagged } : t));
    const nowFlag = !transactions.find(t => t.id === txId)?.flagged;
    setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `${nowFlag ? 'Gắn cờ' : 'Bỏ cờ'} giao dịch ${txId}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
  };

  const viewTransactionHistory = (txId: string) => {
    setTxHistoryTxId(txId);
    setTxHistoryVisible(true);
  };

  const closeTransactionHistory = () => {
    setTxHistoryVisible(false);
    setTxHistoryTxId(undefined);
  }; 

  // Habits handlers
  const currentUserId = auth().currentUser?.uid || '1';

  const toggleHabitCompletion = (habitId: string, memberId?: string) => {
    const userId = memberId || currentUserId;
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const completedBy = { ...(h.completedBy || {}) };
      completedBy[userId] = !completedBy[userId];
      return { ...h, completedBy };
    }));
    setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Cập nhật habit ${habitId} bởi ${userId}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
  };

  const openCreateHabitModal = () => {
    setEditingHabitId(undefined);
    setHabitForm({ title: '', assignedTo: [], frequency: 'daily' });
    setHabitEditorVisible(true);
  };



  const openEditHabitModal = (habitId: string) => {
    const h = habits.find(x => x.id === habitId);
    if (!h) return;
    setEditingHabitId(habitId);
    setHabitForm({ title: h.title || '', assignedTo: h.assignedTo || [], frequency: h.frequency || 'daily' });
    setHabitEditorVisible(true);
  };

  // keep old exported name for other callers


  const cycleAssign = (habitId: string) => {
    // Simple demo: cycle assignment through members
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const next = (familyMembers || []);
      const currentAssigned = h.assignedTo || [];
      const nextMember = next.find(m => !currentAssigned.includes(m.id))?.id || (next[0]?.id);
      return { ...h, assignedTo: nextMember ? [nextMember] : [] };
    }));
  };

  const saveHabit = () => {
    if (!habitForm.title || !habitForm.title.trim()) { Alert.alert('Lỗi', 'Tên thói quen không được trống'); return; }
    if (editingHabitId) {
      setHabits(prev => prev.map(h => h.id === editingHabitId ? { ...h, title: habitForm.title, assignedTo: habitForm.assignedTo, frequency: habitForm.frequency } : h));
      setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Sửa habit ${editingHabitId} -> ${habitForm.title}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
    } else {
      const id = `h${Date.now()}`;
      setHabits(prev => [{ id, title: habitForm.title, assignedTo: habitForm.assignedTo, completedBy: {}, missedDays: {}, frequency: habitForm.frequency }, ...prev]);
      setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Thêm habit: ${habitForm.title}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
    }
    setHabitEditorVisible(false);
    setEditingHabitId(undefined);
  };

  const deleteHabit = (habitId?: string) => {
    const id = habitId || editingHabitId;
    if (!id) return;
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa thói quen này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: () => {
        setHabits(prev => prev.filter(h => h.id !== id));
        setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Xóa habit ${id}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
        setHabitEditorVisible(false);
        setHabitDetailVisible(false);
        setEditingHabitId(undefined);
      } }
    ]);
  };



  // Helper to match simplistic demo time strings to ranges
  const matchesTimeRange = (itemTime: string, range?: string) => {
    if (!range) return true;
    const t = itemTime || '';
    if (range === 'Hôm nay') return t.includes('Hôm nay');
    if (range === 'Tuần') {
      if (t.includes('Hôm')) return true;
      const dayMatch = t.match(/(\d+)\s*ngày/);
      if (dayMatch && Number(dayMatch[1]) <= 6) return true;
      if (t.includes('tuần')) return true;
      return false;
    }
    if (range === 'Tháng') {
      if (t.includes('tháng')) return true;
      if (t.includes('tuần')) return true;
      const dayMatch = t.match(/(\d+)\s*ngày/);
      if (dayMatch && Number(dayMatch[1]) <= 30) return true;
      return false;
    }
    if (range === 'Năm') return true;
    return true;
  };

  // Reset modal view state when modal is opened/closed
  useEffect(() => {
    if (!monitoringModalVisible) {
      setMonitoringViewMode('filters');
      setModalMemberFilter(undefined);
      setModalTimeRange(undefined);
    }
  }, [monitoringModalVisible]);

  // Validate route param -> selectedMember
  useEffect(() => {
    if ((route?.params as { memberId?: string })?.memberId) {
      setSelectedMember((route.params as { memberId?: string })!.memberId!);
    }
  }, [route?.params]);

  // Access control: only owner or admin can view/modify permissions
  useEffect(() => {
    const user = auth().currentUser;

    if (!user) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập');
      setHasAccess(false);
      navigation.goBack();
      return;
    }

    if (!currentFamily) {
      // No family loaded yet — delay decision until family is available
      return;
    }

    const isOwner = currentFamily.ownerId === user.uid;

    if (!isOwner) {
      setHasAccess(false);
      Alert.alert(
        'Quyền hạn chế',
        'Chỉ chủ nhóm mới có thể xem trang này',
        [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
      );
      return;
    }

    setHasAccess(true);
  }, [currentFamily, navigation]);
  
  // Build UI family members from store if available, else fallback to demo members
  const fallbackMembers: FamilyMember[] = [
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
  ];

  const familyMembers: FamilyMember[] = fallbackMembers;

  // If the incoming route param doesn't match any ID in the current list, default to the first member
  useEffect(() => {
    const routeMemberId = (route?.params as { memberId?: string })?.memberId;

    // If we have a family from store and a route memberId that is actually a userId
    if (currentFamily && routeMemberId) {
      const found = familyMembers.find(m => m.id === routeMemberId);
      if (found) {
        setSelectedMember(found.id);
        return;
      }
    }

    // Fallback: ensure selectedMember exists in our visible list
    if (!familyMembers.find(m => m.id === selectedMember) && familyMembers.length > 0) {
      setSelectedMember(familyMembers[0].id);
    }
  }, [route?.params, currentFamily, familyMembers, selectedMember]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const isCurrentUserAdmin = familyMembers.find(m => m.isCurrentUser)?.role === 'admin';

  // demo per-member active status (replace with real data in production)
  const [memberStatus, _setMemberStatus] = useState<Record<string, 'active' | 'inactive'>>({ '1': 'active', '2': 'inactive', '3': 'active' });



  // Local UI mapping for member roles (demo, should be persisted server-side in production)
  const [memberRoles, setMemberRoles] = useState<Record<string, MemberRole>>(() => {
    const map: Record<string, MemberRole> = {};
    // Use fallback demo data since members doesn't exist in FamilyModel
    const demoMembers = [
      { userId: '1', role: 'owner' },
      { userId: '2', role: 'parent' },
      { userId: '3', role: 'child' },
    ];
    
    demoMembers.forEach((m: any) => {
      map[m.userId] = m.role;
    });
    // fallback demo
    map['1'] = map['1'] || 'owner';
    map['2'] = map['2'] || 'parent';
    map['3'] = map['3'] || 'child';
    return map;
  });

  // Role picker modal state
  const [rolePickerFor, setRolePickerFor] = useState<string | null>(null);
  // Member search (dashboard)
  const [userSearch, setUserSearch] = useState('');
  const filteredMembers = (familyMembers || []).filter(m => (m.name || '').toLowerCase().includes(userSearch.toLowerCase()));

  const openRolePicker = (memberId: string) => {
    if (!isCurrentUserAdmin) {
      Alert.alert('Không có quyền', 'Chỉ quản trị viên mới có thể thay đổi vai trò');
      return;
    }
    setRolePickerFor(memberId);
  };

  const changeMemberRole = (memberId: string, newRole: MemberRole) => {
    // If setting owner, confirm
    if (newRole === 'owner') {
      Alert.alert('Chuyển chủ gia đình', 'Bạn có chắc muốn chuyển chủ gia đình cho thành viên này?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xác nhận', style: 'destructive', onPress: () => {
          setMemberRoles(prev => ({ ...prev, [memberId]: 'owner' }));
          setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Chuyển chủ gia đình -> ${memberId}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
          setRolePickerFor(null);
        } }
      ]);
      return;
    }

    setMemberRoles(prev => ({ ...prev, [memberId]: newRole }));
    setAuditLogs(prev => [{ id: `a${Date.now()}`, action: `Thay vai trò ${memberId} -> ${newRole}`, by: auth().currentUser?.displayName || 'Hệ thống', time: 'vừa xong' }, ...prev]);
    setRolePickerFor(null);
  };

  const getRoleIcon = (role: MemberRole) => {
    switch (role) {
      case 'owner': return 'crown';
      case 'admin': return 'shield-account';
      case 'parent': return 'account-tie';
      case 'child': return 'human-child';
      case 'viewer': return 'account';
      default: return 'account';
    }
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







  

  if (hasAccess === false) {
    return (
      <SafeAreaView style={styles.container}>
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
        <View style={styles.accessDeniedContainer}>
          <Text style={styles.accessDeniedText}>Bạn không có quyền xem trang này.</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>{activeForm === 'overview' ? 'Quyền truy cập' : activeForm}</Text>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setMonitoringModalVisible(true)} accessibilityLabel="Giám sát chi tiêu">
          <Icon name="chart-line" size={20} color={COLORS.brand} />
        </TouchableOpacity>
      </View>

      {/* Monitoring modal - full screen with filters + results */}
      {monitoringModalVisible && (
        <Modal transparent animationType="slide" visible={monitoringModalVisible} onRequestClose={() => { setMonitoringModalVisible(false); setMonitoringViewMode('filters'); }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerFull}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{monitoringViewMode === 'filters' ? 'Lọc Giám sát' : 'Kết quả Giám sát'}</Text>
                <View style={styles.rowCenter}>
                  {monitoringViewMode === 'results' ? (
                    <TouchableOpacity onPress={() => { setMonitoringViewMode('filters'); }} style={styles.modalCloseBtn} accessibilityLabel="Thay đổi bộ lọc">
                      <Icon name="filter" size={18} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={() => { setMonitoringModalVisible(false); setMonitoringViewMode('filters'); }} style={styles.modalCloseBtn} accessibilityLabel="Đóng">
                    <Icon name="close" size={18} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              {monitoringViewMode === 'filters' ? (
                <View style={styles.modalBody}>
                  <View style={styles.filtersRow}>
                    <View style={styles.filterColumn}>
                      <Text style={styles.modalLabel}>Thành viên</Text>
                      <TextInput placeholder="Tìm thành viên..." value={modalMemberSearch} onChangeText={setModalMemberSearch} style={styles.modalSearchInput} />

                      <ScrollView style={styles.modalMemberList}>
                        <TouchableOpacity style={[styles.modalMemberItem, !modalMemberFilter && styles.modalMemberItemActive]} onPress={() => { setModalMemberFilter(undefined); setModalMemberSearch(''); }}>
                          <View style={styles.memberLeft}><Icon name="account" size={18} color={COLORS.textMuted} /></View>
                          <Text style={styles.modalMemberName}>Tất cả</Text>
                          {!modalMemberFilter && <Icon name="check" size={16} color={COLORS.secondary} />}
                        </TouchableOpacity>

                        {familyMembers.filter(m => (m.name || '').toLowerCase().includes(modalMemberSearch.toLowerCase())).map(m => (
                          <TouchableOpacity key={m.id} style={[styles.modalMemberItem, modalMemberFilter === m.id && styles.modalMemberItemActive]} onPress={() => setModalMemberFilter(m.id)}>
                            <View style={styles.memberLeft}><Icon name={getRoleIcon(m.role) as any} size={18} color={COLORS.brand} /></View>
                            <Text style={styles.modalMemberName}>{m.name}</Text>
                            {modalMemberFilter === m.id && <Icon name="check" size={16} color={COLORS.secondary} />}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>


                    </View>

                    <View style={styles.filterColumn}>
                      <Text style={[styles.modalLabel, styles.modalLabelSpacing]}>Khoảng thời gian</Text>
                      <View style={styles.chipsRow}>
                        {(['Hôm nay','Tuần','Tháng','Năm','Tất cả'] as const).map(r => (
                          <TouchableOpacity key={r} style={[styles.modalChip, (r === 'Tất cả' ? (modalTimeRange === undefined) : modalTimeRange === r) && styles.modalChipActive]} onPress={() => setModalTimeRange(r === 'Tất cả' ? undefined : r)}>
                            <Text style={(r === 'Tất cả' ? (modalTimeRange === undefined) : modalTimeRange === r) ? styles.modalChipTextActive : styles.modalChipText}>{r}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>


                    </View>
                  </View>


                </View>
              ) : (
                <View style={styles.modalBody}>
                  {(() => {
                    const filteredTx = transactions.filter(t => (!modalMemberFilter || t.memberId === modalMemberFilter) && matchesTimeRange(t.time, modalTimeRange));
                    const total = filteredTx.reduce((s, t) => s + t.amount, 0);
                    // Show personal habits: either the chosen member or current user
                    const memberForHabits = modalMemberFilter || currentUserId;
                    const habitsFiltered = habits.filter(h => (h.assignedTo || []).includes(memberForHabits));
                    const assignedCount = habitsFiltered.length;
                    const completedCount = habitsFiltered.reduce((s: number, h: any) => s + ((h.completedBy && h.completedBy[memberForHabits]) ? 1 : 0), 0);
                    const bestStreak = habitsFiltered.reduce((best: number, h: any) => {
                      const miss = h.missedDays?.[memberForHabits] || 0;
                      return Math.max(best, Math.max(0, 7 - miss));
                    }, 0);

                    return (
                      <View style={styles.modalStack}>
                        <View style={styles.modalStackSection}>
                          <View style={styles.totalCard}>
                            <Text style={styles.totalLabel}>Tổng chi</Text>
                            <Text style={styles.totalAmount}>{`${(total/1000).toFixed(0)}K VNĐ`}</Text>
                            <Text style={styles.totalSub}>{modalTimeRange || 'Tất cả khoảng thời gian'} • {modalMemberFilter ? (familyMembers.find(m => m.id === modalMemberFilter)?.name || '') : 'Tất cả thành viên'}</Text>
                          </View>

                          <Text style={[styles.sectionTitle, styles.modalSectionTitleSpacing]}>Giao dịch</Text>
                          <ScrollView style={styles.modalResultsListShort}>
                            {filteredTx.map(tx => (
                              <View key={tx.id} style={styles.txCard}>
                                <View style={styles.txCardLeft}>
                                  <Text style={styles.txTitle}>{tx.memberName}</Text>
                                  <Text style={styles.txMeta}>{tx.category} • {tx.time}</Text>
                                </View>
                                <View style={styles.txCardRight}>
                                  <Text style={styles.txCardAmount}>{(tx.amount/1000).toFixed(0)}K VNĐ</Text>
                                  {tx.flagged && <Text style={styles.txFlag}>⚠️</Text>}
                                </View>
                              </View>
                            ))}
                          </ScrollView>
                        </View>

                        <View style={styles.modalStackSection}>
                          <View style={styles.habitSummaryCard}>
                            <Text style={styles.habitSummaryTitle}>Thói quen hoàn thành (Cá nhân)</Text>
                            <Text style={styles.habitSummaryValue}>{`${completedCount}/${assignedCount} hoàn thành`}</Text>
                            <Text style={styles.habitStreakLabel}>Streak tốt nhất</Text>
                            <Text style={styles.habitStreakValue}>{bestStreak} ngày</Text>
                          </View>

                          <Text style={[styles.sectionTitle, styles.modalSectionTitleSpacing]}>{modalMemberFilter ? `Thói quen của ${familyMembers.find(m => m.id === modalMemberFilter)?.name?.split(' ')[0] || 'thành viên'}` : 'Thói quen của bạn'}</Text>
                          <ScrollView style={styles.modalResultsListSmall}>
                            {habitsFiltered.map(h => (
                              <View key={h.id} style={[styles.habitCard, styles.modalHabitCard]}>
                                <View style={styles.flex1}>
                                  <Text style={styles.habitTitle}>{h.title}</Text>
                                  <Text style={styles.habitMeta}>Gán: {(h.assignedTo || []).map((id: string) => (familyMembers.find(m => m.id === id)?.name?.split(' ')[0] || id)).join(', ') || 'Chưa gán'}</Text>
                                </View>
                                <View style={styles.habitActions}>
                                  <Text style={styles.habitMeta}>{(h.completedBy && h.completedBy[modalMemberFilter || currentUserId]) ? 'Hoàn thành' : 'Chưa'}</Text>
                                </View>
                              </View>
                            ))} 
                          </ScrollView>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              )}

              <View style={styles.modalActions}>
                {monitoringViewMode === 'filters' ? (
                  <>
                    <TouchableOpacity style={styles.modalBtn} onPress={() => { setMonitoringModalVisible(false); setModalMemberFilter(undefined); setModalTimeRange(undefined); }}>
                      <Text style={styles.modalBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => { setMonitoringViewMode('results'); }}>
                      <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>Áp dụng</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => { setMonitoringModalVisible(false); setMonitoringViewMode('filters'); }}>
                    <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>Đóng</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: Math.max(200, insets.bottom + TAB_BAR_HEIGHT) }} showsVerticalScrollIndicator={false}>

      {/* OVERVIEW CARD - stacked rows */}
      {isCurrentUserAdmin && (
        <View style={styles.adminGrid}>
          <View style={styles.adminCardGrid}>
            <View style={styles.cardTopRow}>
              <Icon name="cash-multiple" size={20} color={COLORS.brand} style={styles.cardIcon} />
              <Text style={styles.adminCardLabel}>Tổng chi tháng</Text>
            </View>
            <Text style={styles.adminCardValueLarge}>{(transactions.reduce((s, t) => s + t.amount, 0) / 1000).toFixed(0)}K VNĐ</Text>
          </View>

          <View style={styles.adminCardGrid}>
            <View style={styles.cardTopRow}>
              <Icon name="inbox" size={20} color={COLORS.brand} style={styles.cardIcon} />
              <Text style={styles.adminCardLabel}>Yêu cầu chờ</Text>
            </View>
            <Text style={styles.adminCardValueLarge}>{pendingRequests.filter(r => r.status === 'pending').length}</Text>
          </View>

          <View style={styles.adminCardGrid}>
            <View style={styles.cardTopRow}>
              <Icon name="check-all" size={20} color={COLORS.brand} style={styles.cardIcon} />
              <Text style={styles.adminCardLabel}>Tỷ lệ hoàn thành</Text>
            </View>
            {(() => {
              const totalAssigned = habits.reduce((s, h) => s + (h.assignedTo || []).length, 0);
              const totalCompleted = habits.reduce((s, h) => s + Object.values(h.completedBy || {}).filter(Boolean).length, 0);
              const pct = totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
              return <Text style={styles.adminCardValueLarge}>{pct}%</Text>;
            })()}
          </View>

          <View style={styles.adminCardGrid}>
            <View style={styles.cardTopRow}>
              <Icon name="alert-circle" size={20} color={COLORS.danger} style={styles.cardIcon} />
              <Text style={styles.adminCardLabel}>Cảnh báo</Text>
            </View>
            {(() => {
              const txAlerts = transactions.filter(t => t.flagged).length;
              const habitAlerts = habits.filter(h => Object.values(h.missedDays || {}).some((d: any) => Number(d) >= 2)).length;
              return <Text style={styles.adminCardValueLarge}>{txAlerts + habitAlerts}</Text>;
            })()}
          </View>
        </View>
      )}

      <View style={styles.overviewCard}>
        <TouchableOpacity style={styles.overviewStatRow} onPress={() => setActiveForm('monitoring')}>
          <View style={styles.overviewItemRow}>
            <Text style={styles.overviewLabel}>Thu chi tháng</Text>
            <Text style={styles.overviewValue}>{(transactions.reduce((s, t) => s + t.amount, 0) / 1000).toFixed(0)}K VNĐ</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.overviewStatRow} onPress={() => setActiveForm('monitoring')}>
          <View style={styles.overviewItemRow}>
            <Text style={styles.overviewLabel}>% so với ngân sách</Text>
            <Text style={styles.overviewValue}>78%</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.overviewStatRow} onPress={() => setActiveForm('monitoring')}>
          <View style={styles.overviewItemRow}>
            <Text style={styles.overviewLabel}>Người chi nhiều nhất</Text>
            <Text style={styles.overviewValue}>Oai Bui</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.overviewStatRow, pendingRequests.filter(r => r.status === 'pending').length === 0 && styles.noBadge]} onPress={() => isCurrentUserAdmin ? setActiveForm('requests') : setActiveForm('monitoring')}>
          <View style={styles.overviewItemRow}>
            <Text style={styles.overviewLabel}>Yêu cầu chờ</Text>
            <View style={styles.overviewBadgeGroup}>
              <Text style={styles.overviewValue}>{pendingRequests.filter(r => r.status === 'pending').length}</Text>
              {isCurrentUserAdmin && pendingRequests.filter(r => r.status === 'pending').length > 0 && (
                <View style={styles.smallBadge}><Text style={styles.smallBadgeText}>{pendingRequests.filter(r => r.status === 'pending').length}</Text></View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* PENDING REQUESTS */}
      {isCurrentUserAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="inbox" size={18} color={COLORS.brand} style={styles.iconMR8} />
            <Text style={styles.sectionTitle}>Yêu cầu chờ duyệt</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{pendingRequests.filter(r => r.status === 'pending').length}</Text></View>
          </View>
          {pendingRequests.filter(r => r.status === 'pending').length === 0 ? (
            <Text style={styles.emptyText}>Không có yêu cầu chờ duyệt</Text>
          ) : (
            pendingRequests.filter(r => r.status === 'pending').map(req => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestLeft}>
                  <View style={styles.requestHeaderRow}>
                    <Icon name="account-circle" size={32} color={COLORS.brand} style={styles.requestAvatar} />
                    <View style={styles.requestHeaderText}>
                      <Text style={styles.requestName}>{req.requesterName}</Text>
                      <Text style={styles.requestMetaSmall}>{req.reason} • {req.time}</Text>
                    </View>
                    <View style={[styles.statusBadge, styles.statusPending]}>
                      <Text style={styles.statusText}>Chờ duyệt</Text>
                    </View>
                  </View>

                  <View style={styles.amountRow}>
                    <Text style={styles.requestAmount}>{(req.amount/1000).toFixed(0)}K VNĐ</Text>
                    {req.note ? <Text style={styles.requestNote}>Ghi chú: {req.note}</Text> : null}
                  </View>
                </View>

                <View style={styles.requestActions}>
                  <TouchableOpacity style={[styles.actionBtn, styles.btnApprove]} onPress={() => approveRequest(req.id)}>
                    <Icon name="check" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.btnDeny]} onPress={() => denyRequest(req.id)}>
                    <Icon name="close" size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* MEMBER LIMITS WITH PROGRESS */}
      {isCurrentUserAdmin && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="currency-usd" size={18} color={COLORS.brand} style={styles.iconMR8} />
            <Text style={styles.sectionTitle}>Hạn mức chi tiêu</Text>
          </View>
          {familyMembers.map(m => {
            const limit = memberLimits[m.id]?.limit || 1000000;
            const usage = Math.random() * limit * 0.8; // Demo usage
            const percentage = Math.round((usage / limit) * 100);
            const isNearLimit = percentage > 80;
            return (
              <View key={m.id} style={styles.limitCard}>
                <View style={styles.limitTopRow}>
                  <View style={styles.limitLeft}>
                    <Icon name={getRoleIcon(m.role) as any} size={36} color={COLORS.brand} style={styles.limitAvatar} />
                    <View>
                      <Text style={styles.limitName}>{m.name}</Text>
                      <Text style={styles.limitRole}>{getRoleLabel(m.role)}</Text>
                    </View>
                  </View>

                  <View style={styles.limitRight}>
                    <Text style={styles.limitAmountSmall}>Hạn mức</Text>
                    <Text style={styles.limitAmount}>{(limit/1000).toFixed(0)}K VNĐ</Text>
                    {isNearLimit && (
                      <View style={styles.limitAlert}>
                        <Icon name="alert-circle" size={14} color={COLORS.danger} />
                        <Text style={styles.limitAlertText}> Gần giới hạn</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.progressRow}>
                  <View style={styles.progressContainerCompact}>
                    <View style={[styles.progressBar, { width: `${Math.min(percentage, 100)}%`, backgroundColor: isNearLimit ? COLORS.danger : COLORS.success }]} />
                  </View>
                  <Text style={[styles.percentText, isNearLimit ? { color: COLORS.danger } : {}]}>{percentage}%</Text>
                </View>

                <View style={styles.limitFooterClean}>
                  <Text style={styles.limitUsageClean}>Đã dùng {(usage/1000).toFixed(0)}K / {(limit/1000).toFixed(0)}K VNĐ</Text>

                  <View style={styles.limitActionsRow}>
                    <TouchableOpacity style={[styles.limitToggle, !memberLimits[m.id]?.enabled && styles.disabled]} onPress={() => toggleLimitEnabled(m.id)}>
                      <Icon name={memberLimits[m.id]?.enabled ? 'lock-open' : 'lock'} size={16} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.limitActionBtn, styles.limitActionEdit]} onPress={() => editLimit(m.id)}>
                      <Icon name="pencil" size={16} color={COLORS.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.limitActionBtn]} onPress={() => { /* future: open member detail */ }}>
                      <Icon name="dots-vertical" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* RECENT SPENDING - "Chi tiêu gần đây" */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="cash" size={18} color={COLORS.brand} style={styles.iconMR8} />
          <Text style={styles.sectionTitle}>Chi tiêu gần đây</Text>
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setUserPickerVisible(true)}>
            <Text style={styles.filterText}>{transactionUserFilter ? (familyMembers.find(m => m.id === transactionUserFilter)?.name.split(' ')[0] || 'Người dùng') : 'Tất cả'}</Text>
            <Icon name="chevron-down" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.dropdownBtn} onPress={() => setTimePickerVisible(true)}>
            <Text style={styles.filterText}>{transactionTimeRange || 'Khoảng thời gian'}</Text>
            <Icon name="chevron-down" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
        {(transactions.filter(t => (!transactionUserFilter || t.memberId === transactionUserFilter) && matchesTimeRange(t.time, transactionTimeRange))).map(tx => (
          <View key={tx.id} style={styles.txCard}>
            <View style={styles.txCardLeft}>
              <Text style={styles.txTitle}>{tx.memberName}</Text>
              <Text style={styles.txMeta}>{tx.category} • {tx.time}</Text>
            </View>
            <View style={styles.txCardRight}>
              <Text style={styles.txCardAmount}>{(tx.amount/1000).toFixed(0)}K VNĐ</Text>
              {tx.flagged && <Text style={styles.txFlag}>⚠️</Text>}
              <View style={styles.txActions}>
                {tx.status === 'pending' && isCurrentUserAdmin && (
                  <>
                    <TouchableOpacity style={[styles.txActionBtn, styles.txApproveBtn]} onPress={() => approveTransaction(tx.id)}>
                      <Text style={styles.txActionText}>Duyệt</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.txActionBtn, styles.txDenyBtn]} onPress={() => denyTransaction(tx.id)}>
                      <Text style={styles.txActionText}>Từ chối</Text>
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity style={styles.smallIconBtn} onPress={() => toggleFlagTransaction(tx.id)}>
                  <Icon name={tx.flagged ? 'flag' : 'flag-outline'} size={16} color={tx.flagged ? COLORS.danger : COLORS.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallIconBtn} onPress={() => viewTransactionHistory(tx.id)}>
                  <Icon name="history" size={16} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Transaction history modal (full-screen) */}
        <Modal visible={txHistoryVisible} transparent animationType="slide" onRequestClose={closeTransactionHistory}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerFull}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Lịch sử giao dịch</Text>
                <View style={styles.rowCenter}>
                  <TouchableOpacity style={[styles.modalBtn, styles.modalBtnMR8]} onPress={closeTransactionHistory}>
                    <Text style={styles.modalBtnText}>Đóng</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView style={styles.modalBody}>
                {(() => {
                  const tx = transactions.find(t => t.id === txHistoryTxId);
                  if (!tx) return <Text style={styles.emptyText}>Không tìm thấy giao dịch</Text>;
                  const related = auditLogs.filter(a => a.action.includes(tx.id) || a.action.includes(tx.memberName) || a.action.includes(tx.category));
                  return (
                    <>
                      <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>{tx.memberName}</Text>
                        <Text style={styles.totalAmount}>{(tx.amount/1000).toFixed(0)}K VNĐ</Text>
                        <Text style={styles.totalSub}>{tx.category} • {tx.time}</Text>
                      </View>

                      <View style={styles.spacer12} />

                      {/* In-modal actions */}
                      <View style={styles.txActions}>
                        {tx.status === 'pending' && isCurrentUserAdmin && (
                          <>
                            <TouchableOpacity style={[styles.txActionBtn, styles.txApproveBtn]} onPress={() => { approveTransaction(tx.id); }}>
                              <Text style={styles.txActionText}>Duyệt</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.txActionBtn, styles.txDenyBtn]} onPress={() => { denyTransaction(tx.id); }}>
                              <Text style={styles.txActionText}>Từ chối</Text>
                            </TouchableOpacity>
                          </>
                        )}

                        <TouchableOpacity style={[styles.txActionBtn]} onPress={() => { toggleFlagTransaction(tx.id); }}>
                          <Text style={[styles.txActionText, tx.flagged ? styles.txActionTextFlagOn : styles.txActionTextFlagOff, styles.txActionTextStrong]}>{tx.flagged ? 'Bỏ cờ' : 'Gắn cờ'}</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.spacer12} />

                      <Text style={[styles.sectionTitle, styles.modalSectionTitleSpacing]}>Hoạt động liên quan</Text>
                      {related.length === 0 ? (
                        <Text style={styles.emptyText}>Chưa có hoạt động liên quan</Text>
                      ) : (
                        related.map(r => (
                          <View key={r.id} style={styles.auditRow}>
                            <View style={styles.flex1}>
                              <Text style={styles.auditText}>{r.action}</Text>
                              <Text style={styles.auditMeta}>{r.by} • {r.time}</Text>
                            </View>
                          </View>
                        ))
                      )}
                    </>
                  );
                })()}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={closeTransactionHistory}>
                  <Text style={styles.modalBtnText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      {/* FAMILY HABITS (Create / Assign / Track) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="heart" size={18} color={COLORS.brand} style={styles.iconMR8} />
          <Text style={styles.sectionTitle}>Thói quen gia đình</Text>
          <View style={styles.rowCenter}>
            {isCurrentUserAdmin && (
              <TouchableOpacity style={[styles.smallIconBtn, styles.smallIconMR8]} onPress={() => openCreateHabitModal()}>
                <Icon name="plus" size={16} color={COLORS.textPrimary} />
              </TouchableOpacity>
            )} 
          </View>
        </View>

        {habits.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có thói quen nào</Text>
        ) : (
          habits.map(h => {
            const missed = Math.max(...Object.values(h.missedDays || {}).map((d: any) => Number(d) || 0));
            const iconName = (h.title || '').toLowerCase().includes('dọn') ? 'broom' : (h.title || '').toLowerCase().includes('học') ? 'book-open' : 'star-outline';
            return (
              <TouchableOpacity key={h.id} style={styles.habitCard} activeOpacity={0.85} onPress={() => { setHabitDetailId(h.id); setHabitDetailVisible(true); }}>
                <View style={styles.habitLeft}>
                  <Icon name={iconName as any} size={20} color={COLORS.brand} style={styles.habitLeftIcon} />
                  <View style={styles.habitText}>
                    <View style={styles.habitRowTop}>
                      <Text style={[styles.habitTitle, styles.habitTitleSingle]} numberOfLines={1} ellipsizeMode="tail">{h.title}</Text>
                    </View>
                    <Text style={styles.habitMeta}>Gán: { (h.assignedTo || []).map((id: string) => (familyMembers.find(m => m.id === id)?.name?.split(' ')[0] || id)).join(', ') || 'Chưa gán' }</Text>
                  </View>
                </View>

                <View style={styles.habitActionsRight}>
                  {missed > 0 && (
                    <View style={[styles.habitBadge, styles.habitBadgeInline]}>
                      <Text style={styles.habitBadgeText}>{`Bỏ ${missed} ngày`}</Text>
                    </View>
                  )}

                  <TouchableOpacity onPress={() => toggleHabitCompletion(h.id)} style={[styles.smallIconBtn, h.completedBy && h.completedBy[currentUserId] && styles.smallIconActive]}>
                    <Icon name={h.completedBy && h.completedBy[currentUserId] ? 'checkbox-marked' : 'checkbox-blank-outline'} size={16} color={COLORS.textPrimary} />
                  </TouchableOpacity> 

                  {isCurrentUserAdmin && (
                    <>
                      <TouchableOpacity style={[styles.smallIconBtn, styles.smallIconML8]} onPress={(e) => { e.stopPropagation(); openEditHabitModal(h.id); }}>
                        <Icon name="pencil" size={16} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallIconBtn, styles.smallIconML8]} onPress={(e) => { e.stopPropagation(); cycleAssign(h.id); }}>
                        <Icon name="account-switch" size={16} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )} 

        {/* Habit Editor Modal */}
        <Modal visible={habitEditorVisible} transparent animationType="slide" onRequestClose={() => setHabitEditorVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerFull}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingHabitId ? 'Chỉnh sửa thói quen' : 'Tạo thói quen'}</Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setHabitEditorVisible(false)}><Icon name="close" size={16} color={COLORS.textPrimary} /></TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Tên thói quen</Text>
                <TextInput value={habitForm.title} onChangeText={(t) => setHabitForm(s => ({ ...s, title: t }))} style={styles.input} placeholder="Ví dụ: Dọn dẹp phòng" />

                <Text style={[styles.modalLabel, styles.modalLabelSpacing]}>Gán cho</Text>
                <View style={styles.modalRow}>
                  {familyMembers.map(m => {
                    const active = habitForm.assignedTo.includes(m.id);
                    return (
                      <TouchableOpacity key={m.id} style={[styles.memberToggle, active && styles.memberToggleActive]} onPress={() => {
                        setHabitForm(s => ({ ...s, assignedTo: active ? s.assignedTo.filter(id => id !== m.id) : [...s.assignedTo, m.id] }));
                      }}>
                        <Text style={{ color: active ? COLORS.textPrimary : COLORS.textMuted }}>{m.name.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.modalLabel, styles.modalLabelSpacing]}>Tần suất</Text>
                <View style={styles.modalRow}>
                  {(['daily','weekly','custom'] as const).map(f => (
                    <TouchableOpacity key={f} style={[styles.modalOption, habitForm.frequency === f && styles.modalOptionActive]} onPress={() => setHabitForm(s => ({ ...s, frequency: f }))}>
                      <Text style={[styles.modalOptionText, habitForm.frequency === f && styles.modalOptionTextActive]}>{f === 'daily' ? 'Hằng ngày' : f === 'weekly' ? 'Hàng tuần' : 'Tùy chỉnh'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                {editingHabitId && (
                  <TouchableOpacity style={[styles.modalBtn, { backgroundColor: COLORS.danger }]} onPress={() => deleteHabit(editingHabitId)}>
                    <Text style={[styles.modalBtnText, styles.modalBtnTextWhite]}>Xóa</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.modalBtn} onPress={() => setHabitEditorVisible(false)}>
                  <Text style={styles.modalBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveHabit}>
                  <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* User picker modal (for Recent Spending filter) */}
        <Modal visible={userPickerVisible} transparent animationType="fade" onRequestClose={() => setUserPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, styles.modalContainerCentered]}>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.modalTitle, styles.modalTitleSpacing]}>Chọn người dùng</Text>
                <TouchableOpacity style={styles.dropdownCloseBtn} onPress={() => setUserPickerVisible(false)}>
                  <Icon name="close" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <TextInput placeholder="Tìm tên..." value={userPickerSearch} onChangeText={setUserPickerSearch} style={styles.dropdownSearchInput} />

              <ScrollView style={styles.dropdownList}>
                <TouchableOpacity style={[styles.dropdownItem, !transactionUserFilter && styles.dropdownItemActive]} onPress={() => { setTransactionUserFilter(undefined); setUserPickerVisible(false); setUserPickerSearch(''); }}>
                  <View style={styles.dropdownItemLeft}><Icon name="account" size={18} color={COLORS.textMuted} /></View>
                  <Text style={styles.dropdownItemName}>Tất cả</Text>
                  { !transactionUserFilter && <Icon name="check" size={16} color={COLORS.secondary} /> }
                </TouchableOpacity>

                {familyMembers.filter(m => (m.name || '').toLowerCase().includes(userPickerSearch.toLowerCase())).map(m => (
                  <TouchableOpacity key={m.id} style={[styles.dropdownItem, transactionUserFilter === m.id && styles.dropdownItemActive]} onPress={() => { setTransactionUserFilter(m.id); setUserPickerVisible(false); setUserPickerSearch(''); }}>
                    <View style={styles.dropdownItemLeft}><Icon name={getRoleIcon(m.role) as any} size={18} color={COLORS.brand} /></View>
                    <Text style={styles.dropdownItemName}>{m.name}</Text>
                    { transactionUserFilter === m.id && <Icon name="check" size={16} color={COLORS.secondary} /> }
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Time range picker modal (simplified) */}
        <Modal visible={timePickerVisible} transparent animationType="fade" onRequestClose={() => setTimePickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, styles.modalContainerCentered]}>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.modalTitle, styles.modalTitleSpacing]}>Khoảng thời gian</Text>
                <TouchableOpacity style={styles.dropdownCloseBtn} onPress={() => setTimePickerVisible(false)}>
                  <Icon name="close" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.dropdownList}>
                {(['Hôm nay','Tuần','Tháng','Năm','Tất cả']).map(r => (
                  <TouchableOpacity key={r} style={[styles.dropdownItem, (r === 'Tất cả' ? (transactionTimeRange === undefined) : transactionTimeRange === r) && styles.dropdownItemActive]} onPress={() => { setTransactionTimeRange(r === 'Tất cả' ? undefined : r); setTimePickerVisible(false); }}>
                    <Text style={styles.dropdownItemName}>{r}</Text>
                    { ((r === 'Tất cả' && transactionTimeRange === undefined) || (r !== 'Tất cả' && transactionTimeRange === r)) && <Icon name="check" size={16} color={COLORS.secondary} /> }
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
        <Modal visible={habitDetailVisible} transparent animationType="slide" onRequestClose={() => setHabitDetailVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainerFull}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chi tiết thói quen</Text>
                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setHabitDetailVisible(false)}><Icon name="close" size={16} color={COLORS.textPrimary} /></TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {(() => {
                  const h = habits.find(x => x.id === habitDetailId);
                  if (!h) return <Text style={styles.emptyText}>Không tìm thấy thói quen</Text>;
                  return (
                    <>
                      <View style={styles.totalCard}>
                        <Text style={styles.totalLabel}>{h.title}</Text>
                        <Text style={styles.habitMeta}>Tần suất: {h.frequency === 'daily' ? 'Hằng ngày' : h.frequency === 'weekly' ? 'Hàng tuần' : 'Tùy chỉnh'}</Text>
                      </View>

                      <View style={styles.spacer12} />

                      <Text style={[styles.sectionTitle, styles.modalSectionTitleSpacing]}>Thành viên được gán</Text>
                      { (h.assignedTo || []).length === 0 ? (
                        <Text style={styles.emptyText}>Chưa gán thành viên</Text>
                      ) : (
                        (h.assignedTo || []).map((id: string) => {
                          const member = familyMembers.find(m => m.id === id);
                          const missed = h.missedDays?.[id] || 0;
                          const currentStreak = Math.max(0, 7 - missed);
                          return (
                            <View key={id} style={[styles.memberCard, styles.assignedMemberRow]}> 
                              <View style={styles.memberCardLeft}>
                                <Icon name={getRoleIcon((member && member.id && (memberRoles[member.id] || member.role)) || 'viewer') as any} size={20} color={COLORS.brand} style={styles.roleIcon} />
                                <View>
                                  <Text style={styles.memberName}>{member?.name || id}</Text>
                                  <Text style={styles.memberEmail}>{currentStreak} ngày liên tiếp</Text>
                                </View>
                              </View>
                              <View style={styles.memberCardRight}>
                                <TouchableOpacity style={[styles.smallIconBtn, h.completedBy && h.completedBy[id] && styles.smallIconActive]} onPress={() => { toggleHabitCompletion(h.id, id); }}>
                                  <Icon name={h.completedBy && h.completedBy[id] ? 'checkbox-marked' : 'checkbox-blank-outline'} size={16} color={COLORS.textPrimary} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })
                      )}

                      <View style={styles.spacer12} />

                      {isCurrentUserAdmin && (
                        <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={() => { setHabitEditorVisible(true); setEditingHabitId(h.id); setHabitForm({ title: h.title, assignedTo: h.assignedTo || [], frequency: h.frequency || 'daily' }); }}>
                          <Text style={[styles.modalBtnText, styles.modalBtnPrimaryText]}>Chỉnh sửa</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  );
                })()}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setHabitDetailVisible(false)}>
                  <Text style={styles.modalBtnText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>



      {/* AUDIT LOG (recent) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="history" size={18} color={COLORS.brand} style={styles.iconMR8} />
          <Text style={styles.sectionTitle}>Nhật ký hoạt động</Text>
        </View>
        {auditLogs.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil((auditLogs.length || 0) / AUDIT_PAGE_SIZE));
            const start = auditPage * AUDIT_PAGE_SIZE;
            const slice = auditLogs.slice(start, start + AUDIT_PAGE_SIZE);
            return (
              <>
                <View style={styles.auditList}>
                  {slice.map(a => (
                    <TouchableOpacity key={a.id} style={styles.auditListItem} activeOpacity={0.85} onPress={() => { /* TODO: open detail view if needed */ }}>
                      <Text style={styles.auditListTitle} numberOfLines={2} ellipsizeMode="tail">{a.action}</Text>
                      <Text style={styles.auditListMeta}>{a.by} • {a.time}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {auditLogs.length > AUDIT_PAGE_SIZE && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity disabled={auditPage === 0} style={[styles.paginationBtn, auditPage === 0 && styles.paginationBtnDisabled]} onPress={() => setAuditPage(p => Math.max(0, p - 1))}>
                      <Text style={styles.paginationBtnText}>Trước</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationInfo}>{auditPage + 1}/{totalPages}</Text>
                    <TouchableOpacity disabled={auditPage >= totalPages - 1} style={[styles.paginationBtn, auditPage >= totalPages - 1 && styles.paginationBtnDisabled]} onPress={() => setAuditPage(p => Math.min(totalPages - 1, p + 1))}>
                      <Text style={styles.paginationBtnText}>Sau</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            );
          })()
        )}
      </View> 

      {/* ADMIN ONLY: Permission Management Section */}
      {isCurrentUserAdmin && (
        <>
          <View style={styles.divider} />




          {/* Member Management (Admin) */}
          {isCurrentUserAdmin && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="account-group" size={18} color={COLORS.brand} style={styles.iconMR8} />
                <Text style={styles.sectionTitle}>Quản lý thành viên</Text>
              </View>
              <TextInput placeholder="Tìm thành viên..." value={userSearch} onChangeText={setUserSearch} style={styles.input} />
              {filteredMembers.map(m => (
                <View key={m.id} style={styles.memberCard}>
                  <View style={styles.memberCardLeft}>
                    <Icon name={getRoleIcon(m.role) as any} size={24} color={COLORS.brand} style={styles.roleIcon} />
                    <TouchableOpacity style={styles.memberInfoButton} onPress={() => openRolePicker(m.id)} activeOpacity={0.8}>
                      <Text style={styles.memberNameLarge} numberOfLines={1} ellipsizeMode="tail">{m.name}</Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>{getRoleLabel(memberRoles[m.id] || m.role)}</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.memberCardRight}>
                    <View style={styles.rowCenter}>
                      <View style={[styles.statusDot, memberStatus[m.id] === 'active' ? styles.statusActive : styles.statusInactive]} />
                      <Text style={styles.memberStatusText}>{memberStatus[m.id] === 'active' ? 'On' : 'Off'}</Text>
                      <TouchableOpacity style={[styles.smallIconBtn, styles.smallIconMR8]} onPress={() => toggleLimitEnabled(m.id)}>
                        <Icon name={memberLimits[m.id]?.enabled ? 'lock-open' : 'lock'} size={16} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallIconBtn, styles.smallIconMR8]} onPress={() => editLimit(m.id)}>
                        <Icon name="pencil" size={16} color={COLORS.textPrimary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallIconBtn]} onPress={() => removeMember(m.id)}>
                        <Icon name="account-remove" size={18} color={COLORS.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}


        </>
      )}

      {/* Security Notice */}
      <View style={styles.warningCard}>
        <View style={styles.rowCenter}>
          <Icon name="alert" size={14} color={COLORS.danger} style={styles.iconMR6} />
          <Text style={styles.warningTitle}>Lưu ý bảo mật</Text>
        </View>
        <Text style={styles.warningText}>
          Cài đặt quyền hạn cẩn thận để bảo vệ thông tin tài chính và riêng tư của gia đình
        </Text>
      </View>
      <View style={{ height: Math.max(200, insets.bottom + TAB_BAR_HEIGHT) }} />
      </ScrollView>

        {/* Role picker modal */}
        <Modal visible={!!rolePickerFor} transparent animationType="fade" onRequestClose={() => setRolePickerFor(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, styles.modalContainerCentered]}>
              <Text style={[styles.modalTitle, styles.modalTitleSpacing]}>Chọn vai trò</Text>
              {rolePickerFor && (
                <View>
                  {(['owner','admin','parent','child','viewer'] as MemberRole[]).map(r => (
                    <TouchableOpacity key={r} style={[styles.roleOption, (rolePickerFor ? memberRoles[rolePickerFor] === r : false) && styles.roleOptionActive]} onPress={() => changeMemberRole(rolePickerFor!, r)}>
                      <View style={styles.rowCenter}>
                        <Icon name={getRoleIcon(r) as any} size={16} color={(rolePickerFor ? memberRoles[rolePickerFor] === r : false) ? COLORS.textPrimary : COLORS.textMuted} style={styles.iconMR8} />
                        <Text style={memberRoles[rolePickerFor] === r ? styles.roleOptionTextActive : styles.roleOptionText}>{r === 'owner' ? 'Chủ gia đình' : r === 'admin' ? 'Quản trị viên' : r === 'parent' ? 'Phụ huynh' : r === 'child' ? 'Con cái' : 'Người xem'}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.rolePickerActions}>
                    <TouchableOpacity style={styles.modalBtn} onPress={() => setRolePickerFor(null)}>
                      <Text style={styles.modalBtnText}>Hủy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>



      {/* Decorative Elements */}
      <View pointerEvents="none" style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View pointerEvents="none" style={[styles.decorativeCircle, styles.decorativeCircle2]} />
      </Animated.View>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceSoft,
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


  content: {
    paddingHorizontal: 0,
  },

  rolePresetsSection: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceDivider,
    marginVertical: 24,
    marginHorizontal: 20,
  },

  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    flex: 1,
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  requestCard: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary,
  },
  requestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestLeft: {
    flex: 1,
  },
  requestAvatar: {
    marginRight: 12,
  },
  requestHeaderText: {
    flex: 1,
  },
  requestMetaSmall: {
    fontSize: 12,
    color: colors.textMuted,
  },
  amountRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestName: {
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  statusApproved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusRejected: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  memberStatusText: { fontSize: 12, color: colors.textMuted, marginRight: 8 },
  roleOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8, backgroundColor: colors.surface },
  roleOptionActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  roleOptionText: { color: colors.textPrimary },
  roleOptionTextActive: { color: colors.textPrimary, fontWeight: '700' },
  memberInfoButton: { flex: 1 },
  roleBadge: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: colors.surfaceLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  requestAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 4,
  },
  requestMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  requestNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  requestActions: {
    marginLeft: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  btnApprove: {
    backgroundColor: colors.success,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  btnDeny: {
    backgroundColor: colors.dangerStrong,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  /* New professional request card */
  requestCardNew: { backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.surfaceBorder },
  requestMain: { flexDirection: 'row', alignItems: 'center' },
  requestAvatarNew: { marginRight: 12 },
  requestContent: { flex: 1 },
  requestHeaderRowNew: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  requestTime: { fontSize: 12, color: colors.textMuted },
  requestReason: { color: colors.textPrimary, fontSize: 13, marginBottom: 4 },
  requestNoteSmall: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  requestAmountBadge: { alignItems: 'flex-end', marginLeft: 12 },
  requestAmountLarge: { fontSize: 16, fontWeight: '800', color: colors.secondary },
  requestAmountSub: { fontSize: 11, color: colors.textMuted },
  requestActionsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, justifyContent: 'flex-end' },
  requestActionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  requestActionApprove: { backgroundColor: colors.success },
  requestActionDeny: { backgroundColor: colors.dangerStrong },
  requestActionText: { fontSize: 12, fontWeight: '700', marginLeft: 8, color: colors.textPrimary },
  requestActionMore: { marginLeft: 8, padding: 6, borderRadius: 8, backgroundColor: colors.surfaceLight },
  btnNote: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  btnNoteText: {
    color: colors.textPrimary,
  },
  limitCard: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  limitTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  limitLeft: { flexDirection: 'row', alignItems: 'center' },
  limitAvatar: { marginRight: 12 },
  limitName: { fontWeight: '800', color: colors.textPrimary, fontSize: 15 },
  limitRole: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  limitRight: { alignItems: 'flex-end' },
  limitAmountSmall: { fontSize: 11, color: colors.textMuted },
  limitAmount: { fontWeight: '700', color: colors.secondary, fontSize: 14, marginTop: 2 },
  limitAlert: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  limitAlertText: { color: colors.danger, fontSize: 12, marginLeft: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  progressContainerCompact: { flex: 1, height: 8, backgroundColor: colors.surfaceSoft, borderRadius: 6, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 6 },
  percentText: { width: 44, textAlign: 'right', marginLeft: 8, fontWeight: '700', color: colors.textPrimary },
  limitFooterClean: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  limitUsageClean: { fontSize: 12, color: colors.textMuted },
  limitActionsRow: { flexDirection: 'row', alignItems: 'center' },
  limitToggle: { backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8, marginLeft: 8 },
  limitActionBtn: { backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8, marginLeft: 8 },
  limitActionEdit: { borderWidth: 1, borderColor: colors.surfaceBorder },
  disabled: { backgroundColor: colors.disabledBg },
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  rolePresetActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  rolePresetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  rolePresetDescription: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 14,
  },
  permissionsSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },

  /* utility styles */
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  iconMR4: { marginRight: 4 },
  iconMR6: { marginRight: 6 },
  iconMR8: { marginRight: 8 },
  iconMR12: { marginRight: 12 },
  iconML8: { marginLeft: 8 },
  smallIconMR8: { marginRight: 8 },
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
    color: colors.textMuted,
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
    backgroundColor: colors.levelOptionBg,
    borderWidth: 1,
    borderColor: colors.levelOptionBorder,
  },
  levelOptionActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  levelOptionText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  levelOptionTextActive: {
    color: colors.tabTextActive,
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
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerStrong,
  },
  adminGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16, gap: 12 },
  adminCardGrid: { width: '48%', backgroundColor: colors.surface, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.surfaceBorder },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardIcon: { marginRight: 10 },
  adminCardLabel: { fontSize: 12, color: colors.textMuted },
  adminCardValueLarge: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginTop: 6 },
  memberCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.surfaceBorder },
  memberCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  memberCardRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  roleIcon: { marginRight: 12 },
  memberName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  memberNameLarge: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  memberNameWrap: { flex: 1 },
  memberEmail: { fontSize: 12, color: colors.textMuted },

  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusActive: { backgroundColor: colors.success },
  statusInactive: { backgroundColor: colors.textMuted },
  overviewCard: { backgroundColor: colors.surface, marginHorizontal: 20, borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
  overviewStatRow: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceDivider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overviewItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  overviewLabel: { fontSize: 13, color: colors.textAlt },
  overviewValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  overviewBadgeGroup: { flexDirection: 'row', alignItems: 'center' },
  smallBadge: { backgroundColor: colors.danger, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', marginLeft: 8, paddingHorizontal: 4 },
  smallBadgeText: { color: colors.textPrimary, fontSize: 10, fontWeight: '700' },
  noBadge: { opacity: 0.95 },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'stretch', justifyContent: 'flex-start' },
  modalContainerFull: { flex: 1, width: '100%', backgroundColor: colors.surface, borderRadius: 0, padding: 16, paddingTop: 20 },
  modalContainer: { width: '90%', backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  totalCard: { backgroundColor: colors.surfaceLight, padding: 12, borderRadius: 12, alignItems: 'flex-start' },
  totalLabel: { fontSize: 12, color: colors.textMuted },
  totalAmount: { fontSize: 20, fontWeight: '800', color: colors.secondary, marginTop: 6 },
  totalSub: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  modalCloseBtn: { padding: 6 },
  modalBody: { paddingVertical: 8 },
  modalLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  modalRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  modalOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.surfaceLight, borderWidth: 1, borderColor: colors.surfaceBorder, marginRight: 8, marginBottom: 8 },
  modalOptionActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  modalOptionText: { color: colors.textSecondary },
  modalOptionTextActive: { color: colors.textPrimary, fontWeight: '600' },
  modalLabelSpacing: { marginTop: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },

  /* Monitoring filters enhancements */
  filtersRow: { flexDirection: 'row', gap: 12 },
  filterColumn: { flex: 1 },
  modalSearchInput: { backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 8 },
  modalMemberList: { maxHeight: 220, marginBottom: 8 },
  modalMemberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceDivider },
  modalMemberItemActive: { backgroundColor: colors.surfaceSoft },
  memberLeft: { width: 28, alignItems: 'center', marginRight: 8 },
  modalMemberName: { flex: 1, color: colors.textPrimary },
  clearBtn: { alignSelf: 'flex-start', marginTop: 8 },
  clearBtnText: { color: colors.textMuted },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modalChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.surface },
  modalChipActive: { backgroundColor: colors.secondary },
  modalChipText: { color: colors.textPrimary },
  modalChipTextActive: { color: colors.textPrimary, fontWeight: '700' },
  filterPreviewRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  previewCard: { flex: 1, backgroundColor: colors.surfaceLight, padding: 10, borderRadius: 8, alignItems: 'flex-start' },
  previewLabel: { fontSize: 12, color: colors.textMuted },
  previewValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  modalBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8, backgroundColor: colors.surfaceLight },
  modalBtnPrimary: { backgroundColor: colors.secondary },
  modalBtnText: { color: colors.textPrimary },
  modalBtnPrimaryText: { color: colors.textPrimary, fontWeight: '700' },
  modalSectionTitleSpacing: { marginTop: 12 },
  modalResultsListShort: { maxHeight: 220, marginBottom: 8 },
  modalResultsListSmall: { maxHeight: 160 },
  modalStack: { flexDirection: 'column' },
  modalStackSection: { marginBottom: 12, paddingHorizontal: 4 },
  habitSummaryCard: { backgroundColor: colors.surfaceLight, padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'flex-start' },
  habitSummaryTitle: { fontSize: 12, color: colors.textMuted },
  habitSummaryValue: { fontSize: 20, fontWeight: '800', color: colors.secondary, marginTop: 6 },
  habitStreakLabel: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  habitStreakValue: { fontSize: 16, fontWeight: '700', color: colors.success },
  filterRow: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  filterBtn: { backgroundColor: colors.surface, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8 },
  filterText: { color: colors.textPrimary },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, minWidth: 140 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceDivider },
  dropdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  dropdownCloseBtn: { padding: 6 },
  dropdownSearchInput: { backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 8 },
  dropdownList: { maxHeight: 240 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceDivider },
  dropdownItemActive: { backgroundColor: colors.surfaceSoft },
  dropdownItemLeft: { width: 28, alignItems: 'center', marginRight: 8 },
  dropdownItemName: { flex: 1, color: colors.textPrimary },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  presetChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.surface },
  presetChipActive: { backgroundColor: colors.secondary },
  txCard: { backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.surfaceBorder },
  txCardLeft: { flex: 1, paddingRight: 8 },
  txCardRight: { alignItems: 'flex-end' },
  txCardAmount: { fontWeight: '700', color: colors.secondary },
  modalHabitCard: { borderWidth: 1, borderColor: colors.surfaceBorder },
  /* Habits */
  habitCard: { backgroundColor: colors.surface, padding: 12, borderRadius: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  habitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  habitTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginRight: 8 },
  habitTitleSingle: { flexShrink: 1, flex: 1 },
  habitMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  habitBadge: { backgroundColor: 'rgba(239,68,68,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8, alignItems: 'center', justifyContent: 'center', minHeight: 24 },
  habitBadgeText: { color: colors.danger, fontWeight: '700', fontSize: 12, lineHeight: 14 },
  habitLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  habitLeftIcon: { marginRight: 10 },
  habitText: { flex: 1 },
  habitRowTop: { flexDirection: 'row', alignItems: 'center' },
  habitActionsRight: { flexDirection: 'row', alignItems: 'center' },
  habitBadgeInline: { marginRight: 8, alignSelf: 'center' },
  smallIconML8: { marginLeft: 8 },
  input: { backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 12 },
  memberToggle: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface },
  memberToggleActive: { backgroundColor: colors.secondarySoft },
  modalBtnMR8: { marginRight: 8 },
  modalBtnML8: { marginLeft: 8 },
  /* Transaction actions */
  txActions: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  txActionBtn: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, marginLeft: 6, borderWidth: 1, borderColor: 'transparent' },
  txApproveBtn: { backgroundColor: colors.success, borderColor: colors.success },
  txDenyBtn: { backgroundColor: colors.danger, borderColor: colors.danger },
  txActionText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  txFlag: { marginTop: 6, color: colors.danger, fontSize: 14, fontWeight: '700' },
  spacer12: { height: 12 },
  txActionTextFlagOn: { color: colors.danger },
  txActionTextFlagOff: { color: colors.textPrimary },
  txActionTextStrong: { fontWeight: '700' },
  habitActions: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  assignedMemberRow: { padding: 12, marginBottom: 8 },
  modalBtnTextWhite: { color: '#fff' },
  smallIconBtn: { backgroundColor: colors.surfaceLight, padding: 8, borderRadius: 8 },
  smallIconActive: { backgroundColor: colors.success },
  modalContainerCentered: { alignSelf: 'center', marginTop: 120 },
  modalTitleSpacing: { marginBottom: 8 },
  rolePickerActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  txTitle: { fontWeight: '700', color: colors.textPrimary },
  txMeta: { fontSize: 12, color: colors.textMuted },
  ruleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceDivider },
  ruleLabel: { color: colors.textPrimary, fontWeight: '700' },
  ruleValue: { color: colors.textSecondary },
  switchBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.surface },
  switchOn: { backgroundColor: colors.secondarySoft },
  switchText: { color: colors.textPrimary },
  auditRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.surfaceDivider },
  auditText: { color: colors.textPrimary },
  auditMeta: { color: colors.textMuted, fontSize: 12 },
  auditList: { flexDirection: 'column' },
  auditListItem: { backgroundColor: colors.surface, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.surfaceBorder, marginBottom: 8 },
  auditListTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 6 },
  auditListMeta: { color: colors.textMuted, fontSize: 12 },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  paginationBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.surfaceLight },
  paginationBtnDisabled: { opacity: 0.5, backgroundColor: colors.surfaceLight },
  paginationBtnText: { color: colors.textPrimary, fontWeight: '600' },
  paginationInfo: { color: colors.textMuted, fontSize: 12 },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  accessDeniedText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  decorativeCircle: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.1,
  },
  decorativeCircle1: {
    width: 200,
    height: 200,
    backgroundColor: colors.secondary,
    top: -100,
    right: -100,
  },
  decorativeCircle2: {
    width: 150,
    height: 150,
    backgroundColor: colors.accent,
    bottom: -75,
    left: -75,
  },
});