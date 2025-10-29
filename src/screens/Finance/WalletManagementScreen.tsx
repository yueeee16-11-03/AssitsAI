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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WalletManagement'>;

interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet';
  balance: number;
  icon: string;
  color: string;
  isHidden: boolean;
  bankName?: string;
  accountNumber?: string;
}

const WALLET_TYPES = [
  { key: 'cash', label: 'Tiền mặt', icon: '💵' },
  { key: 'bank', label: 'Ngân hàng', icon: '🏦' },
  { key: 'ewallet', label: 'Ví điện tử', icon: '📱' },
];

const WALLET_ICONS = ['💵', '🏦', '📱', '💳', '🎯', '💎', '🔥', '⭐'];
const WALLET_COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

export default function WalletManagementScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [wallets, setWallets] = useState<Wallet[]>([
    {
      id: '1',
      name: 'Tiền mặt',
      type: 'cash',
      balance: 2500000,
      icon: '💵',
      color: '#10B981',
      isHidden: false,
    },
    {
      id: '2',
      name: 'Vietcombank',
      type: 'bank',
      balance: 45000000,
      icon: '🏦',
      color: '#6366F1',
      isHidden: false,
      bankName: 'Vietcombank',
      accountNumber: '**** 1234',
    },
    {
      id: '3',
      name: 'Momo',
      type: 'ewallet',
      balance: 850000,
      icon: '📱',
      color: '#EC4899',
      isHidden: false,
    },
  ]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  
  // Form states
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<'cash' | 'bank' | 'ewallet'>('cash');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletIcon, setWalletIcon] = useState('💵');
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
  }, [fadeAnim]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getTotalBalance = () => {
    return wallets.reduce((total, wallet) => total + (wallet.isHidden ? 0 : wallet.balance), 0);
  };

  const resetForm = () => {
    setWalletName('');
    setWalletType('cash');
    setWalletBalance('');
    setWalletIcon('💵');
    setWalletColor('#6366F1');
    setBankName('');
    setAccountNumber('');
    setEditingWallet(null);
  };

  const handleAddWallet = () => {
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

    if (editingWallet) {
      setWallets(prev => prev.map(w => w.id === editingWallet.id ? { ...newWallet, id: editingWallet.id } : w));
    } else {
      setWallets(prev => [...prev, newWallet]);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setWalletName(wallet.name);
    setWalletType(wallet.type);
    setWalletBalance(wallet.balance.toString());
    setWalletIcon(wallet.icon);
    setWalletColor(wallet.color);
    setBankName(wallet.bankName || '');
    setAccountNumber(wallet.accountNumber || '');
    setShowAddModal(true);
  };

  const handleDeleteWallet = (walletId: string) => {
    Alert.alert(
      'Xóa ví',
      'Bạn có chắc chắn muốn xóa ví này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => setWallets(prev => prev.filter(w => w.id !== walletId))
        }
      ]
    );
  };

  const handleToggleVisibility = (walletId: string) => {
    setWallets(prev => prev.map(w => 
      w.id === walletId ? { ...w, isHidden: !w.isHidden } : w
    ));
  };

  const handleTransfer = () => {
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

    setWallets(prev => prev.map(w => {
      if (w.id === transferFrom) {
        return { ...w, balance: w.balance - amount };
      }
      if (w.id === transferTo) {
        return { ...w, balance: w.balance + amount };
      }
      return w;
    }));

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
          <Text style={styles.walletIcon}>{wallet.icon}</Text>
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
            onPress={() => handleToggleVisibility(wallet.id)}
          >
            <Text style={styles.actionButtonText}>
              {wallet.isHidden ? '👁️' : '🙈'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary]}
            onPress={() => handleEditWallet(wallet)}
          >
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonDanger]}
            onPress={() => handleDeleteWallet(wallet.id)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
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
      transparent={true}
      onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
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
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tên ví *</Text>
              <TextInput
                style={styles.formInput}
                value={walletName}
                onChangeText={setWalletName}
                placeholder="Ví dụ: Tiền mặt, Vietcombank..."
                placeholderTextColor="#6B7280"
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
                    <Text style={styles.typeIcon}>{type.icon}</Text>
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
                    placeholderTextColor="#6B7280"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Số tài khoản</Text>
                  <TextInput
                    style={styles.formInput}
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                    placeholder="Ví dụ: **** 1234"
                    placeholderTextColor="#6B7280"
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
                placeholderTextColor="#6B7280"
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
                    <Text style={styles.iconText}>{icon}</Text>
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
          </ScrollView>

          <View style={styles.modalFooter}>
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
        </View>
      </View>
    </Modal>
  );

  const renderTransferModal = () => (
    <Modal
      visible={showTransferModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowTransferModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chuyển tiền giữa ví</Text>
            <TouchableOpacity onPress={() => setShowTransferModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Từ ví *</Text>
              <View style={styles.walletPicker}>
                {wallets.map(wallet => (
                  <TouchableOpacity
                    key={`from-${wallet.id}`}
                    style={[
                      styles.walletPickerOption,
                      transferFrom === wallet.id && styles.walletPickerOptionSelected
                    ]}
                    onPress={() => setTransferFrom(wallet.id)}
                  >
                    <Text style={styles.walletPickerIcon}>{wallet.icon}</Text>
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
                      transferTo === wallet.id && styles.walletPickerOptionSelected,
                      transferFrom === wallet.id && styles.walletPickerOptionDisabled
                    ]}
                    onPress={() => transferFrom !== wallet.id && setTransferTo(wallet.id)}
                    disabled={transferFrom === wallet.id}
                  >
                    <Text style={styles.walletPickerIcon}>{wallet.icon}</Text>
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
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setShowTransferModal(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleTransfer}
            >
              <Text style={styles.modalButtonTextPrimary}>Chuyển tiền</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý ví</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
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
          <Text style={styles.actionBtnIcon}>+</Text>
          <Text style={styles.actionBtnText}>Thêm ví</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => setShowTransferModal(true)}
          disabled={wallets.length < 2}
        >
          <Text style={styles.actionBtnIcon}>↔️</Text>
          <Text style={styles.actionBtnText}>Chuyển tiền</Text>
        </TouchableOpacity>
      </View>

      {/* Wallets List */}
      <ScrollView style={styles.walletsList} showsVerticalScrollIndicator={false}>
        {wallets.map(renderWalletCard)}
        <View style={styles.bottomSpace} />
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

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  summaryCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
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
    backgroundColor: '#6366F1',
  },
  actionBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  walletsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  walletCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 16,
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
    color: '#FFFFFF',
    marginBottom: 2,
  },
  hiddenText: {
    opacity: 0.5,
  },
  walletSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
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
  },
  actionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    backgroundColor: '#1A1D3A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalClose: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  typeOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
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
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  walletPickerOptionDisabled: {
    opacity: 0.5,
  },
  walletPickerIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  walletPickerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  walletPickerBalance: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtonPrimary: {
    backgroundColor: '#6366F1',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  actionButtonPrimary: {
    backgroundColor: '#6366F1',
  },
  actionButtonDanger: {
    backgroundColor: '#EF4444',
  },
  actionButtonSuccess: {
    backgroundColor: '#10B981',
  },
  actionButtonSecondary: {
    backgroundColor: '#6B7280',
  },
  decorativeCircle2: {
    width: 150,
    height: 150,
    backgroundColor: '#EC4899',
    bottom: -75,
    left: -75,
  },
});