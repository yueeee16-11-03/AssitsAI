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
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, any>;

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  walletId: string;
  walletName: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  dueDate: number; // Day of month (1-31) or day of week (1-7 for weekly)
  isAutomatic: boolean;
  isActive: boolean;
  lastPaid?: string; // ISO date string
  nextDue: string; // ISO date string
  reminderDays: number; // Days before due date to remind
  type: 'expense' | 'income';
  notes?: string;
}

const FREQUENCY_OPTIONS = [
  { key: 'weekly', label: 'Hàng tuần', icon: '📅' },
  { key: 'monthly', label: 'Hàng tháng', icon: '🗓️' },
  { key: 'quarterly', label: 'Hàng quý', icon: '📊' },
  { key: 'yearly', label: 'Hàng năm', icon: '🎯' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'Không nhắc' },
  { value: 1, label: '1 ngày trước' },
  { value: 3, label: '3 ngày trước' },
  { value: 7, label: '7 ngày trước' },
];

export default function RecurringTransactionsScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([
    {
      id: '1',
      name: 'Tiền nhà',
      amount: 8000000,
      categoryId: 'housing',
      categoryName: 'Nhà ở',
      categoryIcon: '🏠',
      walletId: 'bank1',
      walletName: 'Vietcombank',
      frequency: 'monthly',
      dueDate: 5,
      isAutomatic: false,
      isActive: true,
      nextDue: '2025-11-05',
      reminderDays: 3,
      type: 'expense',
      notes: 'Tiền thuê nhà hàng tháng',
    },
    {
      id: '2',
      name: 'Lương công ty',
      amount: 25000000,
      categoryId: 'salary',
      categoryName: 'Lương',
      categoryIcon: '💰',
      walletId: 'bank1',
      walletName: 'Vietcombank',
      frequency: 'monthly',
      dueDate: 15,
      isAutomatic: true,
      isActive: true,
      nextDue: '2025-11-15',
      reminderDays: 0,
      type: 'income',
      lastPaid: '2025-10-15',
    },
    {
      id: '3',
      name: 'Netflix',
      amount: 180000,
      categoryId: 'entertainment',
      categoryName: 'Giải trí',
      categoryIcon: '🎬',
      walletId: 'momo',
      walletName: 'Momo',
      frequency: 'monthly',
      dueDate: 20,
      isAutomatic: true,
      isActive: true,
      nextDue: '2025-11-20',
      reminderDays: 1,
      type: 'expense',
      lastPaid: '2025-10-20',
    },
    {
      id: '4',
      name: 'Tiền điện',
      amount: 1200000,
      categoryId: 'utilities',
      categoryName: 'Tiện ích',
      categoryIcon: '⚡',
      walletId: 'cash',
      walletName: 'Tiền mặt',
      frequency: 'monthly',
      dueDate: 10,
      isAutomatic: false,
      isActive: true,
      nextDue: '2025-11-10',
      reminderDays: 7,
      type: 'expense',
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Form states
  const [transactionName, setTransactionName] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [dueDate, setDueDate] = useState('1');
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);
  const [notes, setNotes] = useState('');

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

  const getDaysUntilDue = (nextDue: string) => {
    const today = new Date();
    const dueDateObj = new Date(nextDue);
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusInfo = (transaction: RecurringTransaction) => {
    const daysUntil = getDaysUntilDue(transaction.nextDue);
    
    if (daysUntil < 0) {
      return { status: 'overdue', text: `Quá hạn ${Math.abs(daysUntil)} ngày`, color: '#EF4444' };
    } else if (daysUntil === 0) {
      return { status: 'due', text: 'Đến hạn hôm nay', color: '#F59E0B' };
    } else if (daysUntil <= transaction.reminderDays) {
      return { status: 'upcoming', text: `Còn ${daysUntil} ngày`, color: '#F59E0B' };
    } else {
      return { status: 'normal', text: `Còn ${daysUntil} ngày`, color: '#10B981' };
    }
  };

  const resetForm = () => {
    setTransactionName('');
    setTransactionAmount('');
    setTransactionType('expense');
    setFrequency('monthly');
    setDueDate('1');
    setIsAutomatic(false);
    setReminderDays(3);
    setNotes('');
    setEditingTransaction(null);
  };

  const handleAddTransaction = () => {
    if (!transactionName.trim() || !transactionAmount.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const amount = parseFloat(transactionAmount.replace(/,/g, ''));
    if (amount <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
      return;
    }

    // Calculate next due date based on frequency and due date
    const today = new Date();
    let nextDue: Date;
    
    if (frequency === 'weekly') {
      nextDue = new Date(today);
      const dayOfWeek = parseInt(dueDate, 10);
      const currentDay = today.getDay();
      const daysUntilNextWeek = (dayOfWeek - currentDay + 7) % 7;
      nextDue.setDate(today.getDate() + (daysUntilNextWeek === 0 ? 7 : daysUntilNextWeek));
    } else {
      nextDue = new Date(today.getFullYear(), today.getMonth(), parseInt(dueDate, 10));
      if (nextDue <= today) {
        if (frequency === 'monthly') {
          nextDue.setMonth(nextDue.getMonth() + 1);
        } else if (frequency === 'quarterly') {
          nextDue.setMonth(nextDue.getMonth() + 3);
        } else if (frequency === 'yearly') {
          nextDue.setFullYear(nextDue.getFullYear() + 1);
        }
      }
    }

    const newTransaction: RecurringTransaction = {
      id: Date.now().toString(),
      name: transactionName.trim(),
      amount,
      categoryId: transactionType === 'income' ? 'salary' : 'housing',
      categoryName: transactionType === 'income' ? 'Thu nhập' : 'Chi phí',
      categoryIcon: transactionType === 'income' ? '💰' : '🏠',
      walletId: 'default',
      walletName: 'Ví mặc định',
      frequency,
      dueDate: parseInt(dueDate, 10),
      isAutomatic,
      isActive: true,
      nextDue: nextDue.toISOString().split('T')[0],
      reminderDays,
      type: transactionType,
      notes: notes.trim() || undefined,
    };

    if (editingTransaction) {
      setTransactions(prev => prev.map(t => 
        t.id === editingTransaction.id 
          ? { ...newTransaction, id: editingTransaction.id }
          : t
      ));
    } else {
      setTransactions(prev => [...prev, newTransaction]);
    }

    setShowAddModal(false);
    resetForm();
  };

  const handleEditTransaction = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setTransactionName(transaction.name);
    setTransactionAmount(transaction.amount.toString());
    setTransactionType(transaction.type);
    setFrequency(transaction.frequency);
    setDueDate(transaction.dueDate.toString());
    setIsAutomatic(transaction.isAutomatic);
    setReminderDays(transaction.reminderDays);
    setNotes(transaction.notes || '');
    setShowAddModal(true);
  };

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      'Xóa giao dịch lặp lại',
      'Bạn có chắc chắn muốn xóa giao dịch này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => setTransactions(prev => prev.filter(t => t.id !== transactionId))
        }
      ]
    );
  };

  const handleToggleActive = (transactionId: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const handleMarkAsPaid = (transactionId: string) => {
    Alert.alert(
      'Đánh dấu đã thanh toán',
      'Xác nhận đã thanh toán giao dịch này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            setTransactions(prev => prev.map(t => {
              if (t.id === transactionId) {
                const today = new Date();
                let nextDue = new Date(t.nextDue);
                
                // Calculate next due date
                if (t.frequency === 'weekly') {
                  nextDue.setDate(nextDue.getDate() + 7);
                } else if (t.frequency === 'monthly') {
                  nextDue.setMonth(nextDue.getMonth() + 1);
                } else if (t.frequency === 'quarterly') {
                  nextDue.setMonth(nextDue.getMonth() + 3);
                } else if (t.frequency === 'yearly') {
                  nextDue.setFullYear(nextDue.getFullYear() + 1);
                }

                return {
                  ...t,
                  lastPaid: today.toISOString().split('T')[0],
                  nextDue: nextDue.toISOString().split('T')[0],
                };
              }
              return t;
            }));
          }
        }
      ]
    );
  };

  const getFilteredTransactions = () => {
    return transactions.filter(t => {
      if (filterType === 'all') return true;
      return t.type === filterType;
    }).sort((a, b) => {
      const aDays = getDaysUntilDue(a.nextDue);
      const bDays = getDaysUntilDue(b.nextDue);
      return aDays - bDays;
    });
  };

  const renderTransactionCard = (transaction: RecurringTransaction) => {
    const statusInfo = getStatusInfo(transaction);
    
    return (
      <View key={transaction.id} style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <View style={styles.transactionIcon}>
              <Text style={styles.transactionIconText}>{transaction.categoryIcon}</Text>
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionName}>{transaction.name}</Text>
              <View style={styles.transactionMeta}>
                <Text style={styles.transactionCategory}>{transaction.categoryName}</Text>
                <Text style={styles.transactionMetaSeparator}>•</Text>
                <Text style={styles.transactionWallet}>{transaction.walletName}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.transactionActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => handleEditTransaction(transaction)}
            >
              <Text style={styles.actionButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => handleDeleteTransaction(transaction.id)}
            >
              <Text style={styles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.transactionBody}>
          <View style={styles.transactionAmount}>
            <Text style={[
              styles.amountText,
              transaction.type === 'income' && styles.incomeAmountText
            ]}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
            <Text style={styles.frequencyText}>
              {FREQUENCY_OPTIONS.find(f => f.key === transaction.frequency)?.label}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
            {transaction.isAutomatic && (
              <View style={styles.automaticBadge}>
                <Text style={styles.automaticText}>🤖 Tự động</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.transactionFooter}>
          <View style={styles.transactionSettings}>
            <Text style={styles.settingsText}>
              Ngày: {transaction.dueDate} • Nhắc: {transaction.reminderDays === 0 ? 'Không' : `${transaction.reminderDays} ngày`}
            </Text>
            {transaction.notes && (
              <Text style={styles.notesText}>{transaction.notes}</Text>
            )}
          </View>

          <View style={styles.transactionControls}>
            <Switch
              value={transaction.isActive}
              onValueChange={() => handleToggleActive(transaction.id)}
              trackColor={{ false: '#374151', true: '#6366F1' }}
              thumbColor={transaction.isActive ? '#FFFFFF' : '#9CA3AF'}
            />
            {!transaction.isAutomatic && statusInfo.status !== 'normal' && (
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => handleMarkAsPaid(transaction.id)}
              >
                <Text style={styles.payButtonText}>Đã trả</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderAddModal = () => (
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
              {editingTransaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch lặp lại'}
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
              <Text style={styles.formLabel}>Tên giao dịch *</Text>
              <TextInput
                style={styles.formInput}
                value={transactionName}
                onChangeText={setTransactionName}
                placeholder="Ví dụ: Tiền nhà, Netflix, Lương..."
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Loại giao dịch *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    transactionType === 'expense' && styles.typeOptionSelected
                  ]}
                  onPress={() => setTransactionType('expense')}
                >
                  <Text style={styles.typeIcon}>📤</Text>
                  <Text style={styles.typeLabel}>Chi tiêu</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeOption,
                    transactionType === 'income' && styles.typeOptionSelected
                  ]}
                  onPress={() => setTransactionType('income')}
                >
                  <Text style={styles.typeIcon}>📥</Text>
                  <Text style={styles.typeLabel}>Thu nhập</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Số tiền *</Text>
              <TextInput
                style={styles.formInput}
                value={transactionAmount}
                onChangeText={setTransactionAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Tần suất lặp lại *</Text>
              <View style={styles.frequencySelector}>
                {FREQUENCY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.frequencyOption,
                      frequency === option.key && styles.frequencyOptionSelected
                    ]}
                    onPress={() => setFrequency(option.key as any)}
                  >
                    <Text style={styles.frequencyIcon}>{option.icon}</Text>
                    <Text style={styles.frequencyLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {frequency === 'weekly' ? 'Thứ trong tuần *' : 'Ngày trong tháng *'}
              </Text>
              <TextInput
                style={styles.formInput}
                value={dueDate}
                onChangeText={setDueDate}
                placeholder={frequency === 'weekly' ? '1-7 (1=Chủ nhật)' : '1-31'}
                keyboardType="numeric"
                placeholderTextColor="#6B7280"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nhắc nhở trước</Text>
              <View style={styles.reminderSelector}>
                {REMINDER_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.reminderOption,
                      reminderDays === option.value && styles.reminderOptionSelected
                    ]}
                    onPress={() => setReminderDays(option.value)}
                  >
                    <Text style={styles.reminderLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.formLabel}>Tự động tạo giao dịch</Text>
                <Switch
                  value={isAutomatic}
                  onValueChange={setIsAutomatic}
                  trackColor={{ false: '#374151', true: '#6366F1' }}
                  thumbColor={isAutomatic ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
              <Text style={styles.formHint}>
                {isAutomatic 
                  ? 'Giao dịch sẽ tự động được tạo khi đến hạn' 
                  : 'Bạn sẽ nhận thông báo và cần xác nhận thủ công'
                }
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Ghi chú (tùy chọn)</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Thêm ghi chú..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
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
              onPress={handleAddTransaction}
            >
              <Text style={styles.modalButtonTextPrimary}>
                {editingTransaction ? 'Cập nhật' : 'Thêm'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const filteredTransactions = getFilteredTransactions();

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
        <Text style={styles.headerTitle}>Giao dịch lặp lại</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
            Tất cả ({transactions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'expense' && styles.filterTabActive]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterTabText, filterType === 'expense' && styles.filterTabTextActive]}>
            Chi tiêu ({transactions.filter(t => t.type === 'expense').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'income' && styles.filterTabActive]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterTabText, filterType === 'income' && styles.filterTabTextActive]}>
            Thu nhập ({transactions.filter(t => t.type === 'income').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Chi tiêu/tháng</Text>
            <Text style={[styles.summaryAmount, styles.expenseAmountText]}>
              -{formatCurrency(
                transactions
                  .filter(t => t.type === 'expense' && t.frequency === 'monthly' && t.isActive)
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Thu nhập/tháng</Text>
            <Text style={[styles.summaryAmount, styles.incomeAmountText]}>
              +{formatCurrency(
                transactions
                  .filter(t => t.type === 'income' && t.frequency === 'monthly' && t.isActive)
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(renderTransactionCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📋</Text>
            <Text style={styles.emptyStateText}>Chưa có giao dịch lặp lại nào</Text>
            <Text style={styles.emptyStateSubtext}>
              Thêm hóa đơn định kỳ để theo dõi chi tiêu tự động
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.emptyStateButtonText}>Thêm ngay</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Add Modal */}
      {renderAddModal()}

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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
  },
  filterTabText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  transactionMetaSeparator: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 6,
  },
  transactionWallet: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  transactionActions: {
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
  transactionBody: {
    marginBottom: 16,
  },
  transactionAmount: {
    marginBottom: 12,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  frequencyText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  automaticBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  automaticText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366F1',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  transactionSettings: {
    flex: 1,
  },
  settingsText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  transactionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  payButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366F1',
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpace: {
    height: 100,
  },
  // Modal styles
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  frequencySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  frequencyOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  frequencyIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  frequencyLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  reminderSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  reminderOptionSelected: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  reminderLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
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
  decorativeCircle2: {
    width: 150,
    height: 150,
    backgroundColor: '#EC4899',
    bottom: -75,
    left: -75,
  },
  actionButtonPrimary: {
    backgroundColor: '#6366F1',
  },
  actionButtonDanger: {
    backgroundColor: '#EF4444',
  },
  incomeAmountText: {
    color: '#10B981',
  },
  expenseAmountText: {
    color: '#EF4444',
  },
});