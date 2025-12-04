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
  ActivityIndicator,
} from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useFocusEffect } from '@react-navigation/native';
import NotificationService from '../../services/NotificationService';
import { useRecurringTransactionStore } from '../../store/recurringTransactionStore';

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
  { key: 'weekly', label: 'Hàng tuần', icon: 'calendar-week' },
  { key: 'monthly', label: 'Hàng tháng', icon: 'calendar-month' },
  { key: 'quarterly', label: 'Hàng quý', icon: 'chart-box' },
  { key: 'yearly', label: 'Hàng năm', icon: 'calendar-star' },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'Không nhắc' },
  { value: 1, label: '1 ngày trước' },
  { value: 3, label: '3 ngày trước' },
  { value: 7, label: '7 ngày trước' },
];

export default function RecurringTransactionsScreen({ navigation }: Props) {
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // Store hooks
  const recurringTransactions = useRecurringTransactionStore((state: any) => state.recurringTransactions);
  const isLoading = useRecurringTransactionStore((state: any) => state.isLoading);
  const fetchRecurringTransactions = useRecurringTransactionStore((state: any) => state.fetchRecurringTransactions);
  const addRecurringTransaction = useRecurringTransactionStore((state: any) => state.addRecurringTransaction);
  const updateRecurringTransaction = useRecurringTransactionStore((state: any) => state.updateRecurringTransaction);
  const deleteRecurringTransaction = useRecurringTransactionStore((state: any) => state.deleteRecurringTransaction);
  const initialize = useRecurringTransactionStore((state: any) => state.initialize);

  // Initialize on mount
  useEffect(() => {
    (async () => {
      try {
        await initialize();
      } catch (err) {
        console.error('Failed to initialize:', err);
      }
    })();
  }, [initialize]);

  // Fetch on focus
  useFocusEffect(
    React.useCallback(() => {
      fetchRecurringTransactions().catch((err: any) => {
        console.error('Error fetching:', err);
      });
    }, [fetchRecurringTransactions])
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<RecurringTransaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [_isSubmitting, _setIsSubmitting] = useState(false);

  // Form states
  const [transactionName, setTransactionName] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('weekly');
  const [dueDate, setDueDate] = useState('1');
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [reminderDays, setReminderDays] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Schedule reminders for active transactions when list changes
  useEffect(() => {
    (async () => {
      for (const t of recurringTransactions) {
        if (!t.isActive) {
          try { await NotificationService.cancelReminder(`recurring-${t.id}`); } catch { }
          continue;
        }

        if (t.reminderDays && t.reminderDays > 0) {
          try {
            await NotificationService.scheduleRecurringTransactionReminder(t, { hour: 9, minute: 0 });
          } catch (err) {
            console.warn('Failed to schedule reminder:', err);
          }
        }
      }
    })();
  }, [recurringTransactions]);

  const formatCurrency = (amount: number) => {
    // Format without currency symbol and append ' VNĐ'
    return new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: 0,
    }).format(amount) + ' VNĐ';
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

  const handleAddTransaction = async () => {
    if (!transactionName.trim() || !transactionAmount.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const amount = parseFloat(transactionAmount.replace(/,/g, ''));
    if (amount <= 0) {
      Alert.alert('Lỗi', 'Số tiền phải lớn hơn 0');
      return;
    }

    // Calculate next due date
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
      id: editingTransaction?.id || Date.now().toString(),
      name: transactionName.trim(),
      amount,
      categoryId: transactionType === 'income' ? 'salary' : 'housing',
      categoryName: transactionType === 'income' ? 'Thu nhập' : 'Chi phí',
      categoryIcon: transactionType === 'income' ? 'cash' : 'home',
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

    try {
      if (editingTransaction?.id) {
        await updateRecurringTransaction(editingTransaction.id, newTransaction);
        Alert.alert('Thành công', 'Cập nhật thành công');
      } else {
        await addRecurringTransaction(newTransaction);
        Alert.alert('Thành công', 'Thêm thành công');
      }
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể lưu giao dịch');
    }
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
          onPress: async () => {
            try {
              // Step 1: Cancel reminder
              try {
                await NotificationService.cancelReminder(`recurring-${transactionId}`);
              } catch (e) {
                console.warn('Failed to cancel reminder:', e);
              }

              // Step 2: Delete from Firebase with retry logic
              console.log('🗑️ [SCREEN] Starting deletion of:', transactionId);
              let deleteSuccess = false;
              let retries = 0;
              const maxRetries = 3;

              while (!deleteSuccess && retries < maxRetries) {
                try {
                  await deleteRecurringTransaction(transactionId);
                  console.log('✅ [SCREEN] Delete action executed');
                  deleteSuccess = true;
                } catch (deleteError) {
                  retries++;
                  console.error(`❌ [SCREEN] Delete failed (retry ${retries}/${maxRetries}):`, deleteError);
                  if (retries < maxRetries) {
                    await new Promise((resolve: any) => setTimeout(resolve, 500));
                  }
                }
              }

              if (!deleteSuccess) {
                throw new Error('Không thể xóa sau 3 lần thử');
              }

              // Step 3: Wait for Firestore propagation
              console.log('⏳ [SCREEN] Waiting for Firestore sync...');
              await new Promise((resolve: any) => setTimeout(resolve, 1000));

              // Step 4: Fetch fresh data and verify deletion
              console.log('🔄 [SCREEN] Fetching fresh data to verify deletion...');
              let verifyAttempts = 0;
              const maxVerifyAttempts = 5;
              let isDeleted = false;
              let lastFetchedList: any[] = [];

              while (verifyAttempts < maxVerifyAttempts) {
                try {
                  // Fetch directly from service to get fresh data (not from state)
                  lastFetchedList = await fetchRecurringTransactions();
                  console.log(`🔍 [SCREEN] Verify attempt ${verifyAttempts + 1}: Fetched ${lastFetchedList.length} items`);
                  
                  // Check if ID still in the fetched list
                  const stillExists = lastFetchedList.some((t: any) => t.id === transactionId);
                  console.log(`   → Transaction still exists? ${stillExists}`);
                  
                  if (!stillExists) {
                    isDeleted = true;
                    console.log('✅ [SCREEN] Deletion verified in Firebase');
                    break; // Exit loop on success
                  }
                } catch (fetchErr: any) {
                  console.error(`❌ [SCREEN] Fetch attempt ${verifyAttempts + 1} failed:`, fetchErr?.message);
                }

                verifyAttempts++;
                if (verifyAttempts < maxVerifyAttempts) {
                  console.log(`⏳ [SCREEN] Retrying verification in 500ms (attempt ${verifyAttempts}/${maxVerifyAttempts})...`);
                  await new Promise((resolve: any) => setTimeout(resolve, 500));
                }
              }

              if (!isDeleted) {
                console.error(`❌ [SCREEN] Deletion verification failed after ${maxVerifyAttempts} attempts`);
                console.error(`   → Last fetched list count: ${lastFetchedList.length}`);
                console.error(`   → Looking for ID: ${transactionId}`);
                throw new Error('Không thể xác nhận xóa trên Firebase. Vui lòng thử lại.');
              }

              // Step 5: Show success alert only after verification
              Alert.alert('Thành công', 'Xóa giao dịch thành công');
              console.log('✅ [SCREEN] Deletion complete and verified');
            } catch (error: any) {
              console.error('❌ [SCREEN] Deletion error:', error?.message);
              Alert.alert('Lỗi xóa', error?.message || 'Không thể xóa giao dịch. Vui lòng kiểm tra kết nối mạng.');
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (transactionId: string) => {
    try {
      const transaction = recurringTransactions.find((t: any) => t.id === transactionId);
      if (transaction) {
        await updateRecurringTransaction(transactionId, {
          ...transaction,
          isActive: !transaction.isActive
        });
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.message || 'Không thể cập nhật');
    }
  };

  const handleMarkAsPaid = (transactionId: string) => {
    Alert.alert(
      'Đánh dấu đã thanh toán',
      'Xác nhận đã thanh toán giao dịch này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              const transaction = recurringTransactions.find((t: any) => t.id === transactionId);
              if (transaction) {
                const today = new Date();
                let nextDue = new Date(transaction.nextDue);
                
                if (transaction.frequency === 'weekly') {
                  nextDue.setDate(nextDue.getDate() + 7);
                } else if (transaction.frequency === 'monthly') {
                  nextDue.setMonth(nextDue.getMonth() + 1);
                } else if (transaction.frequency === 'quarterly') {
                  nextDue.setMonth(nextDue.getMonth() + 3);
                } else if (transaction.frequency === 'yearly') {
                  nextDue.setFullYear(nextDue.getFullYear() + 1);
                }

                await updateRecurringTransaction(transactionId, {
                  ...transaction,
                  lastPaid: today.toISOString().split('T')[0],
                  nextDue: nextDue.toISOString().split('T')[0],
                });
                Alert.alert('Thành công', 'Đánh dấu đã thanh toán');
              }
            } catch (error: any) {
              Alert.alert('Lỗi', error?.message || 'Không thể đánh dấu');
            }
          }
        }
      ]
    );
  };

  const getFilteredTransactions = () => {
    return recurringTransactions.filter((t: any) => {
      if (filterType === 'all') return true;
      return t.type === filterType;
    }).sort((a: any, b: any) => {
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
              <Icon name={transaction.categoryIcon as any} size={22} color="#374151" />
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
              <Icon name="pencil" size={14} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => handleDeleteTransaction(transaction.id)}
            >
              <Icon name="trash-can-outline" size={14} color="#374151" />
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
                <View style={styles.automaticBadgeRow}>
                <Icon name="robot" size={12} color="#6366F1" />
                <Text style={[styles.automaticText, styles.automaticTextSpacing]}>Tự động</Text>
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
              trackColor={{ false: '#374151', true: '#10B981' }}
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
      transparent={false}
      onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalFullHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowAddModal(false);
              resetForm();
            }}
          >
            <Text style={styles.modalBackButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.modalFullTitle}>
            {editingTransaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch lặp lại'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView style={styles.modalFullBody}>
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
                <Icon name="cash-minus" size={20} color={transactionType === 'expense' ? '#FFFFFF' : '#374151'} style={styles.typeIconIcon} />
                <Text style={styles.typeLabel}>Chi tiêu</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  transactionType === 'income' && styles.typeOptionSelected
                ]}
                onPress={() => setTransactionType('income')}
              >
                <Icon name="cash-plus" size={20} color={transactionType === 'income' ? '#FFFFFF' : '#374151'} style={styles.typeIconIcon} />
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
                  <Icon name={option.icon as any} size={16} color={frequency === option.key ? '#FFFFFF' : '#111827'} />
                    <Text style={[styles.frequencyLabel, frequency === option.key ? styles.frequencyLabelSelected : undefined]}>{option.label}</Text>
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
                  <Text style={[styles.reminderLabel, reminderDays === option.value ? styles.reminderLabelSelected : undefined]}>{option.label}</Text>
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
          <View style={styles.bottomSpace} />
        </ScrollView>

        <View style={styles.modalFullFooter}>
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
          <Text style={[styles.backButtonText, styles.backButtonTextDark]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitleText}>Giao dịch lặp lại</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
            Tất cả ({recurringTransactions.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'expense' && styles.filterTabActive]}
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.filterTabText, filterType === 'expense' && styles.filterTabTextActive]}>
            Chi tiêu ({recurringTransactions.filter((t: any) => t.type === 'expense').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'income' && styles.filterTabActive]}
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.filterTabText, filterType === 'income' && styles.filterTabTextActive]}>
            Thu nhập ({recurringTransactions.filter((t: any) => t.type === 'income').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#6366F1" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Chi tiêu</Text>
              <Text style={[styles.summaryAmount, styles.expenseAmountText]}>
                -{formatCurrency(
                  recurringTransactions
                    .filter((t: any) => t.type === 'expense' && t.isActive)
                    .reduce((sum: number, t: any) => sum + t.amount, 0)
                )}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Thu nhập</Text>
              <Text style={[styles.summaryAmount, styles.incomeAmountText]}>
                +{formatCurrency(
                  recurringTransactions
                    .filter((t: any) => t.type === 'income' && t.isActive)
                    .reduce((sum: number, t: any) => sum + t.amount, 0)
                )}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map(renderTransactionCard)
        ) : (
          <View style={styles.emptyState}>
            <Icon name="clipboard-text-outline" size={48} color="#111827" style={styles.emptyStateIcon} />
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowAddModal(true);
        }}
      >
        <Icon name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Decorative Elements */}
      <View style={[styles.decorativeCircle, styles.decorativeCircle1]} />
      <View style={[styles.decorativeCircle, styles.decorativeCircle2]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitleWrapper: {
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerPlaceholder: {
    width: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: 'bold',
  },
  addButtonTextDark: { color: '#111827' },
  backButtonTextDark: { color: '#111827' },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#9CA3AF',
  },
  filterTabText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#111827',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    color: '#111827',
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionMetaSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
    marginHorizontal: 6,
  },
  transactionWallet: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#374151',
  },
  transactionBody: {
    marginBottom: 16,
  },
  transactionAmount: {
    marginBottom: 12,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  frequencyText: {
    fontSize: 12,
    color: '#6B7280',
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
  automaticBadgeRow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  automaticText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366F1',
  },
  automaticTextSpacing: {
    marginLeft: 8,
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
    color: '#6B7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  payButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
    color: '#111827',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  bottomSpace: {
    height: 100,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalFullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalBackButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalFullTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  modalFullBody: {
    flex: 1,
    padding: 20,
  },
  modalFullFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
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
    color: '#111827',
  },
  modalClose: {
    fontSize: 24,
    color: 'rgba(0,0,0,0.6)',
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
    color: '#111827',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#D1D5DB',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  typeOptionSelected: {
    borderColor: '#9CA3AF',
    backgroundColor: '#E5E7EB',
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  typeIconIcon: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    color: '#111827',
    textAlign: 'center',
    fontWeight: '600',
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  frequencyOptionSelected: {
    borderColor: '#9CA3AF',
    backgroundColor: '#E5E7EB',
  },
  frequencyIcon: {
    marginRight: 6,
  },
  frequencyLabel: {
    fontSize: 12,
    color: '#111827',
  },
  frequencyLabelSelected: {
    color: '#111827',
    fontWeight: '600',
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reminderOptionSelected: {
    borderColor: '#9CA3AF',
    backgroundColor: '#E5E7EB',
  },
  reminderLabel: {
    fontSize: 12,
    color: '#111827',
  },
  reminderLabelSelected: {
    color: '#111827',
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonPrimary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  modalButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonDanger: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  incomeAmountText: {
    color: '#10B981',
  },
  expenseAmountText: {
    color: '#EF4444',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});