import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import auth from '@react-native-firebase/auth';
import { useFamilyStore } from "../../store/familyStore";
import SharedWalletApi from '../../api/sharedWalletApi';

type Props = NativeStackScreenProps<RootStackParamList, "SharedWallet">;

interface SharedWallet {
  id: string;
  familyId: string;
  name: string;
  currency: string;
  balance: number;
  createdBy: string;
  settings: {
    requireApprove: boolean;
    dailyLimit: number;
  };
  createdAt: Date;
}

export default function SharedWalletScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const styles = getStyles(theme);
  const { currentFamily } = useFamilyStore();

  const [sharedWallets, setSharedWallets] = useState<SharedWallet[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);

  // Hàm tải dữ liệu
  const loadSharedWallets = useCallback(async () => {
    if (!currentFamily?.id) return;
    
    setLoadingWallets(true);
    try {
      const response = await SharedWalletApi.getSharedWallets(currentFamily.id);
      if (response.success && response.wallets) {
        setSharedWallets(response.wallets as any);
      }
    } catch (error) {
      console.error('Lỗi tải ví chung:', error);
    } finally {
      setLoadingWallets(false);
    }
  }, [currentFamily?.id]);

  // Load shared wallets from Firebase
  React.useEffect(() => {
    if (currentFamily?.id) {
      loadSharedWallets();
    }
  }, [currentFamily?.id, loadSharedWallets]);

  // Check if user is family member
  React.useEffect(() => {
    const currentUser = auth().currentUser;
    
    if (!currentUser) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập');
      navigation.goBack();
      return;
    }

    if (!currentFamily?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy gia đình');
      navigation.goBack();
      return;
    }

    const isMemberOfFamily = currentFamily?.memberIds?.includes(currentUser.uid) || 
                             currentFamily?.ownerId === currentUser.uid;
    
    if (!isMemberOfFamily) {
      Alert.alert(
        'Quyền hạn chế',
        'Bạn không phải thành viên của gia đình này.',
        [{ text: 'Quay lại', onPress: () => navigation.goBack() }]
      );
      return;
    }
  }, [currentFamily?.id, currentFamily?.memberIds, currentFamily?.ownerId, navigation]);

  const isOwner = (): boolean => {
    const currentUser = auth().currentUser;
    if (!currentUser) return false;
    return currentFamily?.ownerId === currentUser.uid;
  };

  const totalBalance = sharedWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  const formatCurrency = (amount: number, currency?: string) => {
    // Default: VNĐ as requested
    if (!currency || currency === 'VND') {
      return `${new Intl.NumberFormat('vi-VN').format(amount)} VNĐ`;
    }

    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    }

    if (currency === 'EUR') {
      return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    }

    // Fallback: number + currency code
    return `${new Intl.NumberFormat('vi-VN').format(amount)} ${currency}`;
  };

  const handleEditWallet = (wallet: SharedWallet) => {
    Alert.prompt(
      'Sửa ví chung',
      `Nhập tên mới cho ví "${wallet.name}":`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Cập nhật',
          onPress: (newName: string | undefined) => {
            if (!newName || newName.trim().length < 3) {
              Alert.alert('Lỗi', 'Tên ví phải có ít nhất 3 ký tự');
              return;
            }
            Alert.alert('Thành công', `Đã cập nhật ví thành "${newName.trim()}"`);
          },
        },
      ],
      'plain-text',
      wallet.name
    );
  };

  const handleDepositMoney = (wallet: SharedWallet) => {
    Alert.prompt(
      'Nạp tiền',
      `Nhập số tiền nạp vào "${wallet.name}" (${wallet.currency === 'VND' ? 'VNĐ' : wallet.currency}):`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Nạp',
          onPress: (amount: string | undefined) => {
            if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
              Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
              return;
            }
            const amountNum = Number(amount);
            Alert.alert(
              'Xác nhận',
              `Nạp ${formatCurrency(amountNum, wallet.currency)} vào "${wallet.name}"?`,
              [
                { text: 'Hủy', style: 'cancel' },
                {
                  text: 'Xác nhận',
                  onPress: () => {
                    Alert.alert('Thành công', `Đã nạp ${formatCurrency(amountNum, wallet.currency)}`);
                    loadSharedWallets();
                  },
                },
              ]
            );
          },
        },
      ],
      'plain-text',
      '',
      'decimal-pad'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví chung</Text>
        <View style={styles.headerActions}>
          {isOwner() && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateSharedWallet')}
            >
              <Icon name="plus" size={24} color={theme.colors.onSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        // QUAN TRỌNG: Thêm flex: 1 để ScrollView bung hết chiều cao màn hình
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loadingWallets ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Đang tải ví chung...</Text>
          </View>
        ) : (
          // ĐÃ SỬA: Dùng View thường thay vì Animated.View
          <View>
            
            {/* Total Balance Card */}
            <View style={styles.totalCard}>
              <View style={styles.totalHeader}>
                <Text style={styles.totalLabel}>Tổng số dư</Text>
                <Icon name="information-outline" size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <Text style={styles.totalAmount}>
                {formatCurrency(totalBalance, 'VND')}
              </Text>
              <Text style={styles.totalDesc}>
                Từ {sharedWallets.length} ví chung
              </Text>
            </View>

            {/* Wallets List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ví chung ({sharedWallets.length})</Text>
              
              {sharedWallets.length === 0 ? (
                // Trường hợp CHƯA CÓ ví nào
                <View style={[styles.walletCard, styles.emptyWalletCard]}>
                  <Icon name="wallet-outline" size={48} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.walletDesc, styles.emptyWalletText]}>
                    Chưa có ví chung nào
                  </Text>
                  {isOwner() && (
                    <TouchableOpacity 
                      style={[styles.addButton, styles.createBtnWithMargin]}
                      onPress={() => navigation.navigate('CreateSharedWallet')}
                    >
                      <Icon name="plus" size={20} color={theme.colors.onSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                // Trường hợp ĐÃ CÓ ví (Map danh sách)
                sharedWallets.map((wallet) => (
                  <TouchableOpacity
                    key={wallet.id}
                    style={[styles.walletCard, { borderLeftColor: theme.colors.primary }]}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('SharedWalletTransaction', {
                      walletId: wallet.id,
                      walletName: wallet.name,
                    })}
                  >
                    <View style={styles.walletHeader}>
                      <View style={[styles.walletIconBg, { backgroundColor: theme.colors.surface }] }>
                        <Icon name="wallet" size={28} color={theme.colors.primary} />
                      </View>
                      <View style={styles.walletInfo}>
                        <Text style={styles.walletName}>{wallet.name}</Text>
                        <Text style={styles.walletDesc}>{wallet.currency === 'VND' ? 'VNĐ' : wallet.currency}</Text>
                      </View>
                      <View style={styles.walletBalance}>
                        <Text style={[styles.walletBalanceAmount, { color: theme.colors.primary }]}>
                          {formatCurrency(wallet.balance, wallet.currency)}
                        </Text>
                      </View>
                    </View>

                    {/* Quick Stats */}
                    <View style={styles.walletStats}>
                      <View style={styles.statItem}>
                        <Icon name={wallet.settings?.requireApprove ? 'check-circle' : 'check-circle-outline'} size={16} color={theme.colors.secondary} style={styles.iconMarginSmall} />
                        <Text style={styles.statText}>{wallet.settings?.requireApprove ? 'Cần duyệt' : 'Không duyệt'}</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statItem}>
                        <Icon name="calendar" size={16} color={theme.colors.secondary} style={styles.iconMarginSmall} />
                        <Text style={styles.statText}>
                          {wallet.createdAt ? new Date(wallet.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.walletActions}>
                      <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => handleEditWallet(wallet)}>
                        <View style={[styles.iconBg, styles.iconBgEdit]}>
                          <Icon name="pencil" size={16} color="#fff" />
                        </View>
                        <Text style={[styles.actionBtnText, styles.actionBtnPrimaryText]}>Sửa</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]} onPress={() => handleDepositMoney(wallet)}>
                        <View style={[styles.iconBg, styles.iconBgDeposit]}>
                          <Icon name="plus-circle" size={18} color="#fff" />
                        </View>
                        <Text style={[styles.actionBtnText, styles.actionBtnSecondaryText]}>Nạp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.actionBtnOutline]}
                        onPress={() => navigation.navigate('SharedWalletTransaction', {
                          walletId: wallet.id,
                          walletName: wallet.name,
                        })}
                      >
                        <View style={[styles.iconBg, styles.iconBgHistory]}>
                          <Icon name="history" size={18} color="#fff" />
                        </View>
                        <Text style={[styles.actionBtnText, styles.actionBtnOutlineText]}>Lịch sử</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Tips Section */}
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Icon name="lightbulb" size={20} color={theme.colors.secondary} style={styles.iconMarginMedium} />
                <Text style={styles.tipsTitle}>Mẹo sử dụng</Text>
              </View>
              <Text style={styles.tipsText}>
                💡 Tạo ví chung riêng cho từng mục đích (ăn uống, tiện ích) để quản lý dễ hơn.
              </Text>
              <Text style={styles.tipsText}>
                👥 Tất cả thành viên gia đình đều có thể xem và chi tiêu từ ví chung.
              </Text>
            </View>

            {/* Spacer so users can scroll past content and see whitespace */}
            <View style={{ height: Math.max(80, insets.bottom + 80) }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollView: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16, // Đã chỉnh lại padding top cho cân đối với SafeAreaView
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
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: theme.colors.primary },
  headerTitle: { fontSize: 18, fontWeight: "800", color: theme.colors.primary },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, paddingBottom: 200 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
  },
  totalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  totalLabel: { fontSize: 14, color: theme.colors.onSurfaceVariant, fontWeight: "600" },
  totalAmount: { fontSize: 32, fontWeight: "900", color: theme.colors.primary, marginBottom: 4 },
  totalDesc: { fontSize: 12, color: theme.colors.onSurfaceVariant },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.primary, marginBottom: 16 },
  walletCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    // Thêm shadow nhẹ cho đẹp
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walletHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  walletIconBg: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  walletInfo: { flex: 1 },
  walletName: { fontSize: 16, fontWeight: "800", color: theme.colors.primary, marginBottom: 2 },
  walletDesc: { fontSize: 12, color: theme.colors.onSurfaceVariant },
  walletBalance: { alignItems: "flex-end" },
  walletBalanceAmount: { fontSize: 18, fontWeight: "900" },
  walletStats: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center" },
  statText: { fontSize: 12, color: theme.colors.onSurfaceVariant, fontWeight: "600" },
  statDivider: { width: 1, height: 20, backgroundColor: theme.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
  walletActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    zIndex: 0,
    shadowColor: 'transparent',
  },
  iconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  iconBgEdit: {
    backgroundColor: '#FF6B6B',
  },
  iconBgDeposit: {
    backgroundColor: '#4ECDC4',
  },
  iconBgHistory: {
    backgroundColor: '#95E1D3',
  },
  actionBtnText: { color: theme.colors.onSurface, fontWeight: "700", fontSize: 12 },
  actionBtnPrimary: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  actionBtnPrimaryText: {
    color: theme.colors.onSurface,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  actionBtnSecondaryText: {
    color: theme.colors.onSurface,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  actionBtnOutlineText: {
    color: theme.colors.onSurface,
  },
  tipsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  tipsHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  tipsTitle: { fontSize: 14, fontWeight: "800", color: theme.colors.primary },
  tipsText: { fontSize: 13, color: theme.colors.onSurface, lineHeight: 18, marginBottom: 8 },
  emptyWalletCard: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  emptyWalletText: { marginTop: 8, textAlign: 'center', color: theme.colors.onSurfaceVariant },
  createBtnWithMargin: { marginTop: 16 },
  iconMarginSmall: { marginRight: 6 },
  iconMarginMedium: { marginRight: 8 },
});