import React, { useState, useEffect } from 'react';
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
import FamilyTransactionService, { FamilyTransaction } from '../../services/admin/FamilyTransactionService';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyPermissions'>;

export default function FamilyTransactionsScreen({ navigation }: Props) {
  const theme = useTheme();
  const styles = getStyles(theme);
  const [fadeAnim] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();
  const { currentFamily } = useFamilyStore();

  // State management
  const [transactions, setTransactions] = useState<FamilyTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FamilyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FamilyTransaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Form states
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMemberId, setFormMemberId] = useState('');
  const [formMemberName, setFormMemberName] = useState('');
  
  // Members list
  const [familyMembers, setFamilyMembers] = useState<Array<{userId: string, name: string}>>([]);

  // Fetch family members
  const fetchFamilyMembers = React.useCallback(async () => {
    try {
      if (!currentFamily?.id) return;
      
      const memberSnapshots = await require('@react-native-firebase/firestore').default()
        .collection('family_members')
        .where('familyId', '==', currentFamily.id)
        .get();
      
      const members = memberSnapshots.docs.map((doc: any) => ({
        userId: doc.data().userId,
        name: doc.data().name || 'Unknown',
      }));
      
      setFamilyMembers(members);
    } catch (err) {
      console.error('Error fetching family members:', err);
    }
  }, [currentFamily?.id]);

  // Fetch transactions
  const fetchTransactions = React.useCallback(async () => {
    try {
      setError(null);
      if (!currentFamily?.id) {
        setError('Không tìm thấy gia đình');
        setLoading(false);
        return;
      }

      const data = await FamilyTransactionService.getRecentTransactions(
        currentFamily.id,
        50
      );
      setTransactions(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Lỗi khi tải dữ liệu giao dịch'
      );
      setLoading(false);
    }
  }, [currentFamily?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = transactions;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.memberName.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, filterType]);

  // Initial load
  useEffect(() => {
    fetchTransactions();
    fetchFamilyMembers();
  }, [fetchTransactions, fetchFamilyMembers]);

  // Fade animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Pull to refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentFamily?.id) {
        const data = await FamilyTransactionService.getRecentTransactions(
          currentFamily.id,
          50
        );
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error refreshing transactions:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Calculate totals (kept for future use)
  // const totalIncome = filteredTransactions
  //   .filter((t) => t.type === 'income')
  //   .reduce((sum, t) => sum + t.amount, 0);

  // const totalExpense = filteredTransactions
  //   .filter((t) => t.type === 'expense')
  //   .reduce((sum, t) => sum + t.amount, 0);

  // Reset form
  const resetForm = () => {
    setFormType('expense');
    setFormAmount('');
    setFormCategory('');
    setFormDescription('');
    setFormMemberId('');
    setFormMemberName('');
    setSelectedTransaction(null);
  };

  // Open add modal
  const handleAddTransaction = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Open edit modal
  const handleEditTransaction = (transaction: FamilyTransaction) => {
    setSelectedTransaction(transaction);
    setFormType(transaction.type);
    setFormAmount(transaction.amount.toString());
    setFormCategory(transaction.category);
    setFormDescription(transaction.description);
    setFormMemberId(transaction.userId);
    setFormMemberName(transaction.memberName);
    setShowEditModal(true);
  };

  // Save transaction (add or edit)
  const handleSaveTransaction = async () => {
    if (!formAmount || !formCategory || !formMemberId) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    const amount = parseFloat(formAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Lỗi', 'Số tiền không hợp lệ');
      return;
    }

    try {
      setIsProcessing(true);

      if (selectedTransaction) {
        // Update existing transaction
        await FamilyTransactionService.updateTransaction(
          selectedTransaction.userId,
          selectedTransaction.id,
          {
            type: formType,
            amount,
            category: formCategory,
            description: formDescription,
          }
        );
        Alert.alert('Thành công', 'Đã cập nhật giao dịch');
      } else {
        // Add new transaction
        if (!currentFamily?.id) {
          Alert.alert('Lỗi', 'Không tìm thấy gia đình');
          return;
        }
        
        await FamilyTransactionService.addTransaction(
          currentFamily.id,
          formMemberId,
          {
            userId: formMemberId,
            memberName: formMemberName,
            type: formType,
            amount,
            category: formCategory,
            description: formDescription,
            currency: 'VND',
            date: require('@react-native-firebase/firestore').default.Timestamp.now(),
          }
        );
        Alert.alert('Thành công', 'Đã thêm giao dịch mới');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      await fetchTransactions();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu giao dịch');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (transaction: FamilyTransaction) => {
    Alert.alert(
      'Xóa giao dịch',
      `Bạn có chắc muốn xóa giao dịch "${transaction.category}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await FamilyTransactionService.deleteTransaction(
                transaction.userId,
                transaction.id
              );
              Alert.alert('Thành công', 'Đã xóa giao dịch');
              await fetchTransactions();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể xóa giao dịch');
            }
          },
        },
      ]
    );
  };

  // Format date
  const formatDate = (date: any): string => {
    try {
      if (!date) return 'N/A';
      const dateObj = date.toDate?.() || new Date(date);
      return dateObj.toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  // Get transaction icon background color - light transparent
  const getTransactionIconBg = (type: 'income' | 'expense'): string => {
    return type === 'income'
      ? theme.dark ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.5)'
      : theme.dark ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0.5)';
  };

  // Get transaction icon color
  const getTransactionIconColor = (type: 'income' | 'expense'): string => {
    return type === 'income' ? theme.colors.secondary : '#EF4444';
  };

  // Get transaction icon border color
  const getTransactionIconBorder = (type: 'income' | 'expense'): string => {
    return type === 'income' ? theme.colors.secondary : '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(8, insets.top + 4) }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Giao dịch</Text>
        <Pressable
          style={styles.addButton}
          onPress={handleAddTransaction}
        >
          <Icon name="plus" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
            />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              Đang tải dữ liệu...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon
              name="alert-circle"
              size={48}
              color={theme.colors.error}
            />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
              onPress={fetchTransactions}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.onPrimary }]}>
                Thử lại
              </Text>
            </Pressable>
            <Pressable
              style={[styles.retryButton, styles.testDataButton]}
              onPress={async () => {
                try {
                  if (currentFamily?.id) {
                    await FamilyTransactionService.createTestTransactions(currentFamily.id);
                    Alert.alert('Thành công', 'Đã tạo dữ liệu test. Hãy thử lại.');
                    await fetchTransactions();
                  }
                } catch {
                  Alert.alert('Lỗi', 'Không thể tạo dữ liệu test');
                }
              }}
            >
              <Text style={[styles.retryButtonText, { color: theme.colors.onSecondary }]}>
                Tạo dữ liệu test
              </Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Search & Filter Section */}
            <View style={styles.searchSection}>
              {/* Search Input */}
              <View style={styles.searchContainer}>
                <Icon
                  name="magnify"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={[styles.searchInput, {
                    color: searchQuery ? theme.colors.primary : theme.colors.onSurfaceVariant,
                  }]}
                  placeholder="Tìm kiếm giao dịch..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <Icon name="close" size={20} color={theme.colors.primary} />
                  </Pressable>
                ) : null}
              </View>

              {/* Filter Buttons */}
              <View style={styles.filterButtons}>
                <Pressable
                  style={[
                    styles.filterButton,
                    filterType === 'all' && styles.filterButtonActive,
                    {
                      backgroundColor: filterType === 'all' 
                        ? theme.colors.primary 
                        : theme.colors.surface,
                      borderColor: filterType === 'all'
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant,
                    }
                  ]}
                  onPress={() => setFilterType('all')}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: filterType === 'all' ? theme.colors.onPrimary : theme.colors.primary }
                  ]}>
                    Tất cả
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,
                    filterType === 'income' && styles.filterButtonActive,
                    {
                      backgroundColor: filterType === 'income' 
                        ? theme.colors.secondary 
                        : theme.colors.surface,
                      borderColor: filterType === 'income'
                        ? theme.colors.secondary
                        : theme.colors.onSurfaceVariant,
                    }
                  ]}
                  onPress={() => setFilterType('income')}
                >
                  <Icon 
                    name="plus-circle"
                    size={16}
                    color={filterType === 'income' ? theme.colors.onSecondary : theme.colors.secondary}
                    style={styles.filterIcon}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    { color: filterType === 'income' ? theme.colors.onSecondary : theme.colors.secondary }
                  ]}>
                    Thu nhập
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.filterButton,
                    filterType === 'expense' && styles.filterButtonActive,
                    filterType === 'expense' 
                      ? styles.filterButtonExpenseActive
                      : styles.filterButtonExpenseInactive
                  ]}
                  onPress={() => setFilterType('expense')}
                >
                  <Icon 
                    name="minus-circle"
                    size={16}
                    color={filterType === 'expense' ? '#FFF' : '#EF4444'}
                    style={styles.filterIcon}
                  />
                  <Text style={[
                    styles.filterButtonText,
                    filterType === 'expense' 
                      ? styles.filterButtonExpenseText
                      : styles.filterButtonExpenseTextInactive
                  ]}>
                    Chi tiêu
                  </Text>
                </Pressable>
              </View>

              {/* Summary - Only show when no filter applied */}
              {/* REMOVED: Summary card không hiển thị nữa */}
            </View>

            {/* Transactions List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Giao dịch ({filteredTransactions.length})
              </Text>
              {filteredTransactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon
                    name="file-document-outline"
                    size={48}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                    {searchQuery || filterType !== 'all' 
                      ? 'Không tìm thấy giao dịch phù hợp'
                      : 'Chưa có giao dịch nào'}
                  </Text>
                </View>
              ) : (
                filteredTransactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    style={styles.transactionCard}
                  >
                    <View
                      style={[
                        styles.transactionIcon,
                        { 
                          backgroundColor: getTransactionIconBg(transaction.type),
                          borderColor: getTransactionIconBorder(transaction.type),
                        },
                      ]}
                    >
                      <Icon
                        name={FamilyTransactionService.getTransactionIcon(
                          transaction.type,
                          transaction.category
                        )}
                        size={24}
                        color={getTransactionIconColor(transaction.type)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionCategory}>
                        {transaction.category}
                      </Text>
                      <Text style={styles.transactionMember}>
                        👤 {transaction.memberName}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.date)}
                      </Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: getTransactionIconColor(transaction.type) },
                        ]}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {FamilyTransactionService.formatCurrency(transaction.amount)}
                      </Text>
                      <View style={styles.transactionActions}>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.editBtn]}
                          onPress={() => handleEditTransaction(transaction)}
                        >
                          <Icon name="pencil" size={16} color="#3498DB" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => handleDeleteTransaction(transaction)}
                        >
                          <Icon name="trash-can" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Add/Edit Transaction Modal */}
      <Modal
        visible={showAddModal || showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              if (!isProcessing) {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
              }
            }}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch'}
              </Text>
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                disabled={isProcessing}
              >
                <Icon name="close" size={24} color={theme.colors.onSurface} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Transaction Type */}
              <Text style={styles.inputLabel}>Loại giao dịch</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formType === 'income' && styles.typeButtonIncomeActive,
                  ]}
                  onPress={() => setFormType('income')}
                  disabled={isProcessing}
                >
                  <Icon
                    name="plus-circle"
                    size={20}
                    color={formType === 'income' ? '#fff' : theme.colors.secondary}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formType === 'income' && styles.typeButtonTextActive,
                      formType === 'income' ? styles.typeButtonIncomeTextActive : styles.typeButtonIncomeTextInactive,
                    ]}
                  >
                    Thu nhập
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    formType === 'expense' && styles.typeButtonExpenseActive,
                  ]}
                  onPress={() => setFormType('expense')}
                  disabled={isProcessing}
                >
                  <Icon
                    name="minus-circle"
                    size={20}
                    color={formType === 'expense' ? '#fff' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      formType === 'expense' && styles.typeButtonTextActive,
                      formType === 'expense' ? styles.typeButtonExpenseTextActive : styles.typeButtonExpenseTextInactive,
                    ]}
                  >
                    Chi tiêu
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <Text style={styles.inputLabel}>Số tiền</Text>
              <View style={styles.inputContainer}>
                <Icon name="cash" size={20} color={theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập số tiền..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={formAmount}
                  onChangeText={setFormAmount}
                  keyboardType="numeric"
                  editable={!isProcessing}
                />
                <Text style={styles.currencyText}>₫</Text>
              </View>

              {/* Category */}
              <Text style={styles.inputLabel}>Danh mục</Text>
              <View style={styles.inputContainer}>
                <Icon name="tag" size={20} color={theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Ăn uống, Lương..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={formCategory}
                  onChangeText={setFormCategory}
                  editable={!isProcessing}
                />
              </View>

              {/* Description */}
              <Text style={styles.inputLabel}>Mô tả</Text>
              <View style={styles.inputContainer}>
                <Icon name="text" size={20} color={theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.input}
                  placeholder="Mô tả chi tiết..."
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  editable={!isProcessing}
                />
              </View>

              {/* Member Selection */}
              <Text style={styles.inputLabel}>Thành viên</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.memberScroll}
              >
                {familyMembers.map((member) => (
                  <TouchableOpacity
                    key={member.userId}
                    style={[
                      styles.memberChip,
                      formMemberId === member.userId && styles.memberChipActive,
                      {
                        backgroundColor:
                          formMemberId === member.userId
                            ? theme.colors.primary
                            : theme.colors.surface,
                        borderColor:
                          formMemberId === member.userId
                            ? theme.colors.primary
                            : theme.colors.onSurfaceVariant,
                      },
                    ]}
                    onPress={() => {
                      setFormMemberId(member.userId);
                      setFormMemberName(member.name);
                    }}
                    disabled={isProcessing}
                  >
                    <Icon
                      name="account"
                      size={16}
                      color={
                        formMemberId === member.userId
                          ? '#fff'
                          : theme.colors.primary
                      }
                    />
                    <Text
                      style={[
                        styles.memberChipText,
                        formMemberId === member.userId
                          ? styles.memberChipTextActive
                          : styles.memberChipTextInactive,
                      ]}
                    >
                      {member.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={isProcessing}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSaveTransaction}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#fff" />
                      <Text style={styles.submitButtonText}>
                        {selectedTransaction ? 'Cập nhật' : 'Thêm'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 12,
      paddingTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.dark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.05)',
      backgroundColor: theme.colors.surface,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0, 137, 123, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    spacer: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    loadingText: {
      fontSize: 14,
      marginTop: 12,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 14,
      marginTop: 12,
      textAlign: 'center',
      fontWeight: '500',
    },
    retryButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 14,
      marginTop: 12,
      fontWeight: '500',
    },
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '800',
    },
    summaryDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0, 137, 123, 0.15)',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 16,
      letterSpacing: 0.3,
    },
    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(0,0,0,0.04)',
      elevation: 3,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      borderWidth: 2,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionCategory: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    transactionMember: {
      fontSize: 12,
      color: theme.colors.onSurface,
      marginBottom: 2,
      fontWeight: '500',
    },
    transactionDate: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: '700',
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    retryButtonText: {
      fontWeight: '700',
    },
    testDataButton: {
      marginTop: 8,
      backgroundColor: theme.colors.secondary,
    },
    searchSection: {
      marginBottom: 20,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
      borderWidth: 1.5,
      borderColor: theme.dark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.05)',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
    },
    filterButtons: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    filterButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    filterButtonActive: {
      borderWidth: 0,
      elevation: 3,
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    filterButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    filterIcon: {
      marginRight: 6,
    },
    filterButtonExpenseActive: {
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
      borderWidth: 0,
    },
    filterButtonExpenseInactive: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.onSurfaceVariant,
      borderWidth: 1.5,
    },
    filterButtonExpenseText: {
      color: '#FFF',
    },
    filterButtonExpenseTextInactive: {
      color: '#EF4444',
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
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingBottom: 32,
      maxHeight: '90%',
      elevation: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
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
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.primary,
      letterSpacing: 0.5,
    },
    modalBody: {
      padding: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
      marginTop: 12,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)',
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderWidth: 1.5,
      borderColor: theme.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,137,123,0.12)',
    },
    input: {
      flex: 1,
      marginLeft: 12,
      fontSize: 15,
      color: theme.colors.onSurface,
    },
    currencyText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    },
    typeButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    typeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 2,
      backgroundColor: theme.colors.surface,
    },
    typeButtonIncomeActive: {
      backgroundColor: theme.colors.secondary,
      borderColor: theme.colors.secondary,
      elevation: 3,
      shadowColor: theme.colors.secondary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    typeButtonExpenseActive: {
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
      elevation: 3,
      shadowColor: '#EF4444',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    typeButtonTextActive: {
      color: '#fff',
    },
    typeButtonIncomeTextActive: {
      color: '#fff',
    },
    typeButtonIncomeTextInactive: {
      color: theme.colors.secondary,
    },
    typeButtonExpenseTextActive: {
      color: '#fff',
    },
    typeButtonExpenseTextInactive: {
      color: '#EF4444',
    },
    memberScroll: {
      marginBottom: 12,
    },
    memberChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1.5,
    },
    memberChipActive: {
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    memberChipText: {
      fontSize: 13,
      fontWeight: '600',
    },
    memberChipTextActive: {
      color: '#fff',
    },
    memberChipTextInactive: {
      color: theme.colors.onSurface,
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
      elevation: 4,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
    },
    submitButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
    transactionRight: {
      alignItems: 'flex-end',
    },
    transactionActions: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 6,
    },
    actionBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    editBtn: {
      backgroundColor: '#3498DB20',
      borderColor: '#3498DB60',
    },
    deleteBtn: {
      backgroundColor: '#EF444420',
      borderColor: '#EF444460',
    },
  });
