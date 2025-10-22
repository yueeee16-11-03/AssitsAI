import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Alert,
  Share,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  wallet: string;
  note?: string;
}

interface ReportData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactions: Transaction[];
  categoryBreakdown: Record<string, number>;
}

type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'custom';

export default function ReportScreen({ navigation }: Props) {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [_showDatePicker, _setShowDatePicker] = useState(false);
  const [startDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate] = useState(new Date());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [showExportModal, setShowExportModal] = useState(false);

  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Mock data
  const allTransactions = useMemo((): Transaction[] => [
    {
      id: '1',
      date: '2024-10-21',
      type: 'expense',
      category: 'Ăn uống',
      description: 'Cơm trưa ở nhà hàng',
      amount: 150000,
      wallet: 'Ví tiền mặt',
      note: 'Ăn cùng đồng nghiệp',
    } as Transaction,
    {
      id: '2',
      date: '2024-10-20',
      type: 'income',
      category: 'Lương',
      description: 'Lương tháng 10',
      amount: 15000000,
      wallet: 'Ngân hàng',
    } as Transaction,
    {
      id: '3',
      date: '2024-10-19',
      type: 'expense',
      category: 'Di chuyển',
      description: 'Xăng xe',
      amount: 250000,
      wallet: 'Ví tiền mặt',
    } as Transaction,
    {
      id: '4',
      date: '2024-10-18',
      type: 'expense',
      category: 'Nhà cửa',
      description: 'Tiền điện',
      amount: 500000,
      wallet: 'Ngân hàng',
    } as Transaction,
    {
      id: '5',
      date: '2024-10-17',
      type: 'expense',
      category: 'Mua sắm',
      description: 'Quần áo',
      amount: 800000,
      wallet: 'Ví tiền mặt',
    } as Transaction,
    {
      id: '6',
      date: '2024-10-16',
      type: 'income',
      category: 'Bổ sung',
      description: 'Tiền thưởng',
      amount: 2000000,
      wallet: 'Ngân hàng',
    } as Transaction,
  ], []);

  const categories = ['Ăn uống', 'Di chuyển', 'Nhà cửa', 'Mua sắm', 'Lương', 'Bổ sung'];

  // Filter transactions based on period and date range
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(t => {
      const transDate = new Date(t.date);
      const dateInRange = transDate >= startDate && transDate <= endDate;
      const categoryMatch = !filterCategory || t.category === filterCategory;
      const typeMatch = filterType === 'all' || t.type === filterType;
      return dateInRange && categoryMatch && typeMatch;
    });
  }, [startDate, endDate, filterCategory, filterType, allTransactions]);

  // Calculate report data
  const reportData = useMemo<ReportData>(() => {
    const categoryBreakdown: Record<string, number> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }

      if (!categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] = 0;
      }
      categoryBreakdown[t.category] += t.amount;
    });

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactions: filteredTransactions,
      categoryBreakdown,
    };
  }, [filteredTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Tuần này';
      case 'month':
        return 'Tháng này';
      case 'quarter':
        return 'Quý này';
      case 'year':
        return 'Năm này';
      case 'custom':
        return `${startDate.toLocaleDateString('vi-VN')} - ${endDate.toLocaleDateString('vi-VN')}`;
      default:
        return '';
    }
  };

  const handleExport = async () => {
    try {
      let content = '';

      if (exportFormat === 'csv') {
        content = generateCSV();
      } else if (exportFormat === 'json') {
        content = generateJSON();
      } else if (exportFormat === 'pdf') {
        Alert.alert('PDF Export', 'Tính năng PDF export sẽ được cập nhật sớm');
        return;
      }

      await Share.share({
        message: content,
        title: `Báo cáo tài chính - ${getPeriodLabel()}`,
      });

      Alert.alert('Thành công', `Đã xuất báo cáo thành ${exportFormat.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error) {
      console.log('Export error:', error);
      Alert.alert('Lỗi', 'Không thể xuất báo cáo');
    }
  };

  const generateCSV = () => {
    let csv = 'Ngày,Loại,Danh mục,Mô tả,Số tiền,Ví\n';
    reportData.transactions.forEach(t => {
      csv += `"${t.date}","${t.type}","${t.category}","${t.description}",${t.amount},"${t.wallet}"\n`;
    });
    csv += `\nTổng cộng,,,,\n`;
    csv += `"Thu nhập",,,,${reportData.totalIncome}\n`;
    csv += `"Chi tiêu",,,,${reportData.totalExpense}\n`;
    csv += `"Số dư",,,,${reportData.balance}\n`;
    return csv;
  };

  const generateJSON = () => {
    return JSON.stringify(
      {
        period: getPeriodLabel(),
        summary: {
          totalIncome: reportData.totalIncome,
          totalExpense: reportData.totalExpense,
          balance: reportData.balance,
        },
        transactions: reportData.transactions,
        categoryBreakdown: reportData.categoryBreakdown,
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    );
  };

  const renderCategoryBreakdown = () => {
    const categoryEntries = Object.entries(reportData.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Chi tiêu theo danh mục</Text>
        {categoryEntries.map(([category, amount]) => {
          const percentage = (amount / reportData.totalExpense) * 100;
          return (
            <TouchableOpacity
              key={category}
              style={styles.categoryRow}
              onPress={() => setFilterCategory(filterCategory === category ? null : category)}
            >
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category}</Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percentage}%` },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTransactionList = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📝 Chi tiết giao dịch</Text>
          <Text style={styles.transactionCount}>{filteredTransactions.length} giao dịch</Text>
        </View>

        <FlatList
          data={filteredTransactions}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionCategory}>{item.category}</Text>
                <Text style={styles.transactionDescription}>{item.description}</Text>
                <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString('vi-VN')}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  item.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                ]}
              >
                {item.type === 'income' ? '+' : '-'}
                {formatCurrency(item.amount)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có giao dịch trong khoảng thời gian này</Text>
            </View>
          }
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo tài chính</Text>
        <TouchableOpacity onPress={() => setShowExportModal(true)}>
          <Text style={styles.exportButton}>📥 Xuất</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Thu nhập</Text>
              <Text style={[styles.summaryAmount, styles.incomeText]}>
                {formatCurrency(reportData.totalIncome)}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Chi tiêu</Text>
              <Text style={[styles.summaryAmount, styles.expenseText]}>
                {formatCurrency(reportData.totalExpense)}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Số dư</Text>
              <Text
                style={[
                  styles.summaryAmount,
                  reportData.balance >= 0 ? styles.balancePositive : styles.balanceNegative,
                ]}
              >
                {formatCurrency(reportData.balance)}
              </Text>
            </View>
          </View>

          {/* Period Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Chọn khoảng thời gian</Text>
            <View style={styles.periodButtons}>
              {(['week', 'month', 'quarter', 'year', 'custom'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodButton, period === p && styles.periodButtonActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      period === p && styles.periodButtonTextActive,
                    ]}
                  >
                    {p === 'week'
                      ? 'Tuần'
                      : p === 'month'
                      ? 'Tháng'
                      : p === 'quarter'
                      ? 'Quý'
                      : p === 'year'
                      ? 'Năm'
                      : 'Tùy chọn'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filter Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔍 Lọc</Text>

            {/* Filter by Type */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Loại giao dịch</Text>
              <View style={styles.filterButtons}>
                {(['all', 'income', 'expense'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterButton,
                      filterType === type && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        filterType === type && styles.filterButtonTextActive,
                      ]}
                    >
                      {type === 'all' ? 'Tất cả' : type === 'income' ? 'Thu nhập' : 'Chi tiêu'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filter by Category */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Danh mục</Text>
              <View style={styles.categoryFilter}>
                <TouchableOpacity
                  style={[
                    styles.categoryFilterButton,
                    !filterCategory && styles.categoryFilterButtonActive,
                  ]}
                  onPress={() => setFilterCategory(null)}
                >
                  <Text
                    style={[
                      styles.categoryFilterText,
                      !filterCategory && styles.categoryFilterTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryFilterButton,
                      filterCategory === cat && styles.categoryFilterButtonActive,
                    ]}
                    onPress={() => setFilterCategory(filterCategory === cat ? null : cat)}
                  >
                    <Text
                      style={[
                        styles.categoryFilterText,
                        filterCategory === cat && styles.categoryFilterTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Category Breakdown */}
          {reportData.totalExpense > 0 && renderCategoryBreakdown()}

          {/* Transaction List */}
          {renderTransactionList()}

          <View style={styles.spacer} />
        </Animated.View>
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn định dạng xuất</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.exportOptions}>
              {(['csv', 'json', 'pdf'] as const).map(format => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.exportOption,
                    exportFormat === format && styles.exportOptionActive,
                  ]}
                  onPress={() => setExportFormat(format)}
                >
                  <View style={styles.exportOptionContent}>
                    <Text style={styles.exportOptionIcon}>
                      {format === 'csv' ? '📄' : format === 'json' ? '📋' : '📑'}
                    </Text>
                    <View>
                      <Text style={styles.exportOptionTitle}>
                        {format.toUpperCase()} File
                      </Text>
                      <Text style={styles.exportOptionDesc}>
                        {format === 'csv'
                          ? 'Mở với Excel, Google Sheets'
                          : format === 'json'
                          ? 'Định dạng JSON tiêu chuẩn'
                          : 'Tệp PDF chuyên nghiệp'}
                      </Text>
                    </View>
                  </View>
                  {exportFormat === format && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleExport}
              >
                <Text style={styles.confirmButtonText}>Xuất {exportFormat.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E27',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exportButton: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  incomeText: {
    color: '#10B981',
  },
  expenseText: {
    color: '#EF4444',
  },
  balancePositive: {
    color: '#10B981',
  },
  balanceNegative: {
    color: '#EF4444',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  periodButtonText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#6366F1',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  filterButtonText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#6366F1',
  },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryFilterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  categoryFilterText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  categoryFilterTextActive: {
    color: '#6366F1',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  incomeAmount: {
    color: '#10B981',
  },
  expenseAmount: {
    color: '#EF4444',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A0E27',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  exportOptions: {
    marginBottom: 20,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exportOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
  },
  exportOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportOptionIcon: {
    fontSize: 28,
  },
  exportOptionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exportOptionDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  checkmark: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
