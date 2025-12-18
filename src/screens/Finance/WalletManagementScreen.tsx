import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/types';
import useWalletStore from '../../store/walletStore';

type Props = NativeStackScreenProps<RootStackParamList, 'WalletManagement'>;

interface Wallet {
  id?: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet';
  balance: number;
  icon?: string;
  color?: string;
  isHidden?: boolean;
  bankName?: string;
  accountNumber?: string;
}

const WALLET_TYPES = [
  { key: 'cash', label: 'Tiền mặt', icon: 'cash' },
  { key: 'bank', label: 'Ngân hàng', icon: 'bank' },
  { key: 'ewallet', label: 'Ví điện tử', icon: 'cellphone' },
];

const WALLET_ICONS = ['cash', 'bank', 'cellphone', 'credit-card', 'target', 'diamond-stone', 'fire', 'star'];
const WALLET_COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

export default function WalletManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const [fadeAnim] = useState(new Animated.Value(0));
  const theme = useTheme();
  const styles = getStyles(theme);
  // Use wallet store for data & actions
  const {
    wallets,
    fetchWallets,
    addWallet,
    updateWallet,
    deleteWallet,
    toggleVisibility,
    transfer,
  } = useWalletStore();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form states
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<'cash' | 'bank' | 'ewallet'>('cash');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletIcon, setWalletIcon] = useState('cash');
  const [walletColor, setWalletColor] = useState('#6366F1');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  // Transfer states
  const [transferFrom, setTransferFrom] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // load wallets
    fetchWallets().catch(() => {});
  }, [fadeAnim, fetchWallets]);

  const formatCurrency = (amount: number) => {
    // Format numbers as Vietnamese locale without symbol and append ' VNĐ'
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount) + ' VNĐ';
  };

  const getTotalBalance = () => {
    return wallets.reduce((total, wallet) => total + (wallet.isHidden ? 0 : wallet.balance), 0);
  };

  const resetForm = () => {
    setWalletName('');
    setWalletType('cash');
    setWalletBalance('');
    setWalletIcon('cash');
    setWalletColor('#6366F1');
    setBankName('');
    setAccountNumber('');
    setEditingWallet(null);
  };

  const handleAddWallet = async () => {
    if (!walletName.trim() || !walletBalance.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const newWallet: Wallet = {
      id: Date.now().toString(),
      name: walletName.trim(),
      type: walletType,
      balance: parseFloat(walletBalance.replace(/,/g, '')),
      icon: walletIcon,
      color: walletColor,
      isHidden: false,
      bankName: walletType === 'bank' ? bankName : undefined,
      accountNumber: walletType === 'bank' ? accountNumber : undefined,
    };

    try {
      if (editingWallet) {
        await updateWallet(editingWallet?.id || '', {
          name: newWallet.name,
          type: newWallet.type,
          balance: newWallet.balance,
          icon: newWallet.icon,
          color: newWallet.color,
          bankName: newWallet.bankName,
          accountNumber: newWallet.accountNumber,
        });
      } else {
        await addWallet(newWallet as any);
      }
      // ensure store has fresh data after add/update
      try { await fetchWallets(); } catch {}
    } catch (err) {
      Alert.alert('Lỗi', (err as any)?.message || 'Có lỗi khi lưu ví');
      return;
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setWalletName(wallet.name);
    setWalletType(wallet.type);
    setWalletBalance(wallet.balance.toString());
    setWalletIcon(wallet.icon || 'cash');
    setWalletColor(wallet.color || '#6366F1');
    setBankName(wallet.bankName || '');
    setAccountNumber(wallet.accountNumber || '');
    setShowAddModal(true);
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    Alert.alert(
      'Xóa ví',
      'Bạn có chắc chắn muốn xóa ví này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const walletId = wallet.id;
            setDeletingId(walletId || null);
            try {
              if (!walletId) {
                const fallback = wallets.find(w => w.name === wallet.name && w.balance === wallet.balance);
                if (fallback?.id) {
                  await deleteWallet(fallback.id);
                } else {
                  Alert.alert('Lỗi', 'Không tìm thấy id ví để xóa');
                  setDeletingId(null);
                  return;
                }
              } else {
                await deleteWallet(walletId);
              }
              try { await fetchWallets(); } catch {}
              Alert.alert('Đã xóa', 'Ví đã được xóa');
            } catch (err) {
              console.error('[WalletManagement] delete error', err);
              Alert.alert('Lỗi', (err as any)?.message || 'Xóa thất bại');
            } finally {
              setDeletingId(null);
            }
          }
        }
      ]
    );
  };

  const handleToggleVisibility = async (walletId: string) => {
    try {
      await toggleVisibility(walletId);
    } catch (err) {
      Alert.alert('Lỗi', (err as any)?.message || 'Không thể đổi trạng thái');
    }
  };

  const handleTransfer = async () => {
    if (!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin chuyển tiền');
      return;
    }

    const amount = parseFloat(transferAmount.replace(/,/g, ''));
    const fromWallet = wallets.find(w => w.id === transferFrom);
    
    if (!fromWallet || fromWallet.balance < amount) {
      Alert.alert('Lỗi', 'Số dư không đủ để chuyển');
      return;
    }

    try {
      await transfer(transferFrom, transferTo, amount);
    } catch (err) {
      Alert.alert('Lỗi', (err as any)?.message || 'Chuyển tiền thất bại');
      return;
    }

    setShowTransferModal(false);
    setTransferFrom('');
    setTransferTo('');
    setTransferAmount('');
    
    Alert.alert('Thành công', 'Chuyển tiền thành công');
  };

  const renderWalletCard = (wallet: Wallet) => (
    <View key={wallet.id} style={[styles.walletCard, { borderLeftColor: wallet.color }]}>
      <View style={styles.walletHeader}>
        <View style={styles.walletInfo}>
          <Icon name={(wallet.icon as any) || 'cash'} size={24} color={wallet.color || '#10B981'} style={styles.walletIcon} />
          <View style={styles.walletDetails}>
            <Text style={[styles.walletName, wallet.isHidden && styles.hiddenText]}>
              {wallet.name} {wallet.isHidden && '(Ẩn)'}
            </Text>
            {wallet.bankName && (
              <Text style={styles.walletSubtitle}>
                {wallet.bankName} • {wallet.accountNumber}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.walletActions}>
          <TouchableOpacity
            style={[styles.actionButton, wallet.isHidden ? styles.actionButtonSuccess : styles.actionButtonSecondary]}
            onPress={() => wallet.id && handleToggleVisibility(wallet.id)}
          >
            <Icon name={wallet.isHidden ? 'eye' : 'eye-off'} size={14} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => handleEditWallet(wallet)}
          >
            <Icon name="pencil" size={14} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger, deletingId === wallet.id && styles.actionButtonDeleting]}
            onPress={() => handleDeleteWallet(wallet)}
            disabled={deletingId === wallet.id}
          >
            <Icon name="trash-can-outline" size={14} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.walletBalance}>
        {formatCurrency(wallet.balance)}
      </Text>
      
      <View style={styles.walletTypeContainer}>
        <Text style={styles.walletType}>
          {WALLET_TYPES.find(t => t.key === wallet.type)?.label}
        </Text>
      </View>
    </View>
  );

  const renderAddWalletModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}
    >
      <SafeAreaView style={styles.fullscreenModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingWallet ? 'Chỉnh sửa ví' : 'Thêm ví mới'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Icon name="close" size={20} color="rgba(0,0,0,0.6)" />
            </TouchableOpacity>
          </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={[styles.modalBodyContent, { paddingBottom: Math.max(120, insets.bottom + TAB_BAR_HEIGHT) }]}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên ví *</Text>
              <TextInput
                style={styles.formInput}
                value={walletName}
                onChangeText={setWalletName}
                placeholder="Ví dụ: Tiền mặt, Vietcombank..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Loại ví *</Text>
              <View style={styles.typeSelector}>
                {WALLET_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      walletType === type.key && styles.typeOptionSelected
                    ]}
                    onPress={() => setWalletType(type.key as any)}
                  >
                    <Icon name={type.icon as any} size={20} color={theme.colors.onSurface} style={styles.typeIconIcon} />
                    <Text style={styles.typeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {walletType === 'bank' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Tên ngân hàng</Text>
                  <TextInput
                    style={styles.formInput}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="Ví dụ: Vietcombank, Techcombank..."
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Số tài khoản</Text>
                  <TextInput
                    style={styles.formInput}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Ví dụ: **** 1234"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                </View>
              </>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Số dư ban đầu *</Text>
              <TextInput
                style={styles.formInput}
                value={walletBalance}
                onChangeText={setWalletBalance}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Biểu tượng</Text>
              <View style={styles.iconSelector}>
                {WALLET_ICONS.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      walletIcon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => setWalletIcon(icon)}
                  >
                    <Icon name={icon as any} size={20} color={theme.colors.onSurface} style={styles.iconText} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Màu sắc</Text>
              <View style={styles.colorSelector}>
                {WALLET_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      walletColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setWalletColor(color)}
                  />
                ))}
              </View>
            </View>
              <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
            </ScrollView>

          <View style={[styles.modalFooter, styles.modalFooterFixed]}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleAddWallet}
            >
              <Text style={styles.modalButtonTextPrimary}>
                {editingWallet ? 'Cập nhật' : 'Thêm ví'}
              </Text>
            </TouchableOpacity>
          </View>
      </SafeAreaView>
    </Modal>
  );

  const renderTransferModal = () => (
    <Modal
      visible={showTransferModal}
      animationType="slide"
      transparent={false}
      onRequestClose={() => setShowTransferModal(false)}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.surface }}>
      <KeyboardAvoidingView
        style={styles.fullscreenModalContent}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chuyển tiền giữa ví</Text>
            <TouchableOpacity onPress={() => setShowTransferModal(false)}>
              <Icon name="close" size={20} color="rgba(0,0,0,0.6)" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={[styles.modalBodyScroll, { paddingBottom: Math.max(120, insets.bottom + TAB_BAR_HEIGHT) }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Từ ví *</Text>
              <View style={styles.walletPicker}>
                {wallets.map(wallet => (
                  <TouchableOpacity
                    key={`from-${wallet.id}`}
                    style={[
                      styles.walletPickerOption,
                      styles.walletPickerOptionGray,
                      transferFrom === wallet.id && styles.walletPickerOptionGraySelected
                    ]}
                    onPress={() => setTransferFrom(wallet.id || '')}
                  >
                    <Icon name={(wallet.icon as any) || 'cash'} size={20} color={wallet.color || '#10B981'} style={styles.walletPickerIcon} />
                    <View>
                      <Text style={styles.walletPickerName}>{wallet.name}</Text>
                      <Text style={styles.walletPickerBalance}>
                        {formatCurrency(wallet.balance)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Đến ví *</Text>
              <View style={styles.walletPicker}>
                {wallets.map(wallet => (
                  <TouchableOpacity
                    key={`to-${wallet.id}`}
                    style={[
                      styles.walletPickerOption,
                      styles.walletPickerOptionGray,
                      transferTo === wallet.id && styles.walletPickerOptionGraySelected,
                      transferFrom === wallet.id && styles.walletPickerOptionDisabled
                    ]}
                    onPress={() => transferFrom !== wallet.id && setTransferTo(wallet.id || '')}
                    disabled={transferFrom === wallet.id}
                  >
                    <Icon name={(wallet.icon as any) || 'cash'} size={20} color={wallet.color || '#10B981'} style={styles.walletPickerIcon} />
                    <View>
                      <Text style={styles.walletPickerName}>{wallet.name}</Text>
                      <Text style={styles.walletPickerBalance}>
                        {formatCurrency(wallet.balance)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Số tiền *</Text>
              <TextInput
                style={styles.formInput}
                value={transferAmount}
                onChangeText={setTransferAmount}
                placeholder="Nhập số tiền cần chuyển"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />
            </View>
            <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
          </ScrollView>

          <View style={[styles.modalFooter, styles.modalFooterFixed, styles.modalFooterSticky]}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonGray]}
              onPress={() => setShowTransferModal(false)}
            >
              <Text style={styles.modalButtonTextGray}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonGray]}
              onPress={handleTransfer}
            >
              <Text style={styles.modalButtonTextGray}>Chuyển tiền</Text>
            </TouchableOpacity>
          </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý ví</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="plus" size={20} color={theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tổng số dư (hiển thị)</Text>
        <Text style={styles.summaryAmount}>{formatCurrency(getTotalBalance())}</Text>
        <Text style={styles.summarySubtext}>
          {wallets.filter(w => !w.isHidden).length}/{wallets.length} ví đang hiển thị
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => setShowAddModal(true)}
        >
          <Icon name="plus" size={16} color={theme.colors.onSurface} style={styles.actionBtnIcon} />
          <Text style={styles.actionBtnText}>Thêm ví</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => setShowTransferModal(true)}
          disabled={wallets.length < 2}
        >
          <Icon name="swap-horizontal" size={16} color={theme.colors.onSurface} style={styles.actionBtnIcon} />
          <Text style={styles.actionBtnText}>Chuyển tiền</Text>
        </TouchableOpacity>
      </View>

      {/* Wallets List */}
      <ScrollView style={styles.walletsList} showsVerticalScrollIndicator={false} contentContainerStyle={[{ paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}>
        {wallets.map(renderWalletCard)}
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
      </ScrollView>

      {/* Modals */}
      {renderAddWalletModal()}
      {renderTransferModal()}

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
    </Animated.View>
  );
}

const getStyles = (theme: any) => {
  const { surface, onSurface, onSurfaceVariant, outline, primary } = theme.colors;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: surface,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
      marginTop: 0,
      borderRadius: 0,
      backgroundColor: surface,
      borderBottomWidth: 1,
      borderBottomColor: outline,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      fontSize: 20,
      color: onSurface,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: onSurface,
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      fontSize: 24,
      color: onSurface,
      fontWeight: 'bold',
    },
    summaryCard: {
      margin: 20,
      padding: 24,
      borderRadius: 16,
      backgroundColor: surface,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: outline,
    },
    summaryLabel: {
      fontSize: 14,
      color: onSurfaceVariant,
      marginBottom: 8,
    },
    summaryAmount: {
      fontSize: 20,
      fontWeight: 'bold',
      color: onSurface,
      marginBottom: 4,
    },
    summarySubtext: {
      fontSize: 12,
      color: onSurfaceVariant,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 12,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
    },
    actionBtnPrimary: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: outline,
    },
    actionBtnSecondary: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: outline,
    },
    actionBtnIcon: {
      marginRight: 8,
      color: onSurface,
    },
    actionBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: onSurface,
    },
    walletsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    walletCard: {
      padding: 20,
      borderRadius: 16,
      backgroundColor: surface,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: outline,
      borderLeftWidth: 4,
    },
    walletHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    walletInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    walletIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    walletDetails: {
      flex: 1,
    },
    walletName: {
      fontSize: 16,
      fontWeight: '600',
      color: onSurface,
      marginBottom: 2,
    },
    hiddenText: {
      opacity: 0.5,
    },
    walletSubtitle: {
      fontSize: 12,
      color: onSurfaceVariant,
    },
    walletActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: outline,
    },
    actionButtonDeleting: {
      opacity: 0.5,
    },
    actionButtonText: {
      fontSize: 14,
      color: onSurface,
    },
    walletBalance: {
      fontSize: 18,
      fontWeight: 'bold',
      color: onSurface,
      marginBottom: 8,
    },
    walletTypeContainer: {
      alignSelf: 'flex-start',
    },
    walletType: {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.6)',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    bottomSpace: {
      height: 100,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: surface,
      flex: 1,
      paddingTop: 24,
      paddingBottom: 0,
    },

    fullscreenModalContent: {
      flex: 1,
      backgroundColor: surface,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: outline,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: onSurface,
    },
    modalClose: {
        fontSize: 24,
        color: 'rgba(0,0,0,0.6)',
    },
    modalBody: {
      flex: 1,
      padding: 20,
    },
    modalBodyScroll: {
      paddingBottom: 220,
    },

    modalBodyContent: {
      paddingBottom: 40,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: onSurface,
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: surface,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: onSurface,
      borderWidth: 1,
      borderColor: outline,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: 12,
    },
    typeOption: {
      flex: 1,
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: outline,
    },
    typeOptionSelected: {
      borderColor: primary,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
    },
    typeIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    typeLabel: {
      fontSize: 12,
      color: onSurface,
      textAlign: 'center',
    },
    iconSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    iconOption: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: outline,
    },
    iconOptionSelected: {
      borderColor: primary,
      backgroundColor: 'rgba(99, 102, 241, 0.12)',
    },
    iconText: {
      fontSize: 20,
    },
    colorSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    colorOption: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: '#FFFFFF',
    },
    walletPicker: {
      gap: 12,
    },
    walletPickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    walletPickerOptionSelected: {
      borderColor: primary,
      backgroundColor: 'rgba(99, 102, 241, 0.2)',
    },
    walletPickerOptionDisabled: {
      opacity: 0.5,
    },
    walletPickerIcon: {
      fontSize: 20,
      marginRight: 12,
    },
    /* gray framed style used in transfer modal */
    walletPickerOptionGray: {
      backgroundColor: surface,
      borderColor: outline,
    },
    walletPickerOptionGraySelected: {
      borderColor: primary,
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
    },
    walletPickerName: {
      fontSize: 14,
      fontWeight: '600',
      color: onSurface,
      marginBottom: 2,
    },
    walletPickerBalance: {
      fontSize: 12,
      color: onSurfaceVariant,
    },
    modalFooter: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },

    modalFooterFixed: {
      borderTopWidth: 1,
      borderTopColor: outline,
      backgroundColor: surface,
    },
    modalFooterSticky: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingBottom: 28,
      backgroundColor: surface,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonSecondary: {
      backgroundColor: surface,
      borderWidth: 1,
      borderColor: outline,
    },
    modalButtonGray: {
      backgroundColor: outline,
      borderWidth: 0,
    },
    modalButtonTextGray: {
      fontSize: 16,
      fontWeight: '600',
      color: onSurface,
    },
    modalButtonPrimary: {
      backgroundColor: onSurface,
    },
    modalButtonTextSecondary: {
      fontSize: 16,
      fontWeight: '600',
      color: onSurface,
    },
    modalButtonTextPrimary: {
      fontSize: 16,
      fontWeight: '600',
      color: surface,
    },
    decorativeCircle: {
      position: 'absolute',
      borderRadius: 100,
      opacity: 0.1,
    },
    decorativeCircle1: {
      width: 200,
      height: 200,
      backgroundColor: primary,
      top: -100,
      right: -100,
    },
    actionButtonPrimary: {
      backgroundColor: surface,
      borderColor: primary,
      borderWidth: 1,
    },
    actionButtonDanger: {
      backgroundColor: surface,
      borderColor: '#EF4444',
      borderWidth: 1,
    },
    actionButtonSuccess: {
      backgroundColor: surface,
      borderColor: '#10B981',
      borderWidth: 1,
    },
    actionButtonSecondary: {
      backgroundColor: surface,
      borderColor: onSurfaceVariant,
      borderWidth: 1,
    },
    typeIconIcon: {
      marginBottom: 8,
    },
    decorativeCircle2: {
      width: 150,
      height: 150,
      backgroundColor: '#EC4899',
      bottom: -75,
      left: -75,
    },
  });
};