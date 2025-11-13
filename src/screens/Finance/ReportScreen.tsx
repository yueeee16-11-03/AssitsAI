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
  ActivityIndicator,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import ReportExportService from '../../services/ReportExportService';
import type { Transaction, Budget, Habit, Goal, ReportType, ExportFormat, PeriodType } from '../../types/report';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

interface ReportData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactions: Transaction[];
  categoryBreakdown: Record<string, number>;
}

export default function ReportScreen({ navigation }: Props) {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [_showDatePicker, _setShowDatePicker] = useState(false);
  const [startDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [endDate] = useState(new Date());
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
      description: 'Cà phê Trung Nguyên',
      amount: 55000,
      wallet: 'Tiền mặt',
      note: 'Sáng nay',
    } as Transaction,
    {
      id: '2',
      date: '2024-10-21',
      type: 'expense',
      category: 'Ăn uống',
      description: 'Cơm trưa ở nhà hàng',
      amount: 150000,
      wallet: 'Tiền mặt',
      note: 'Ăn cùng đồng nghiệp',
    } as Transaction,
    {
      id: '3',
      date: '2024-10-20',
      type: 'income',
      category: 'Lương',
      description: 'Lương tháng 10',
      amount: 15000000,
      wallet: 'VCB',
    } as Transaction,
    {
      id: '4',
      date: '2024-10-19',
      type: 'expense',
      category: 'Di chuyển',
      description: 'Xăng xe',
      amount: 250000,
      wallet: 'Tiền mặt',
    } as Transaction,
    {
      id: '5',
      date: '2024-10-18',
      type: 'expense',
      category: 'Nhà cửa',
      description: 'Tiền điện',
      amount: 500000,
      wallet: 'VCB',
    } as Transaction,
    {
      id: '6',
      date: '2024-10-17',
      type: 'expense',
      category: 'Mua sắm',
      description: 'Quần áo',
      amount: 800000,
      wallet: 'Tiền mặt',
    } as Transaction,
    {
      id: '7',
      date: '2024-10-16',
      type: 'income',
      category: 'Việc phụ',
      description: 'Tiền thưởng',
      amount: 2000000,
      wallet: 'VCB',
    } as Transaction,
  ], []);

  const budgets = useMemo((): Budget[] => [
    { id: '1', category: 'Ăn uống', amount: 3000000, spent: 2800000 },
    { id: '2', category: 'Di chuyển', amount: 1500000, spent: 1200000 },
    { id: '3', category: 'Mua sắm', amount: 2000000, spent: 2100000 },
    { id: '4', category: 'Nhà cửa', amount: 5000000, spent: 4500000 },
  ], []);

  const habits = useMemo((): Habit[] => [
    { id: '1', name: 'Tập thể dục', completionRate: 85, totalCheckIns: 17, longestStreak: 12 },
    { id: '2', name: 'Đọc sách', completionRate: 70, totalCheckIns: 14, longestStreak: 8 },
    { id: '3', name: 'Thiền định', completionRate: 90, totalCheckIns: 18, longestStreak: 18 },
  ], []);

  const goals = useMemo((): Goal[] => [
    { id: '1', name: 'Du lịch Nhật Bản', targetAmount: 50000000, amountSaved: 35000000, targetDate: '2025-12-31' },
    { id: '2', name: 'Mua xe', targetAmount: 200000000, amountSaved: 85000000, targetDate: '2026-06-30' },
    { id: '3', name: 'Quỹ khẩn cấp', targetAmount: 30000000, amountSaved: 28000000, targetDate: '2025-12-31' },
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
    return ReportExportService.formatCurrency(value);
  };

  const getPeriodLabel = () => {
    return ReportExportService.getPeriodLabel(period, startDate, endDate);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      let content = '';
      let fileName = '';

      if (exportFormat === 'csv') {
        content = generateCSV();
        fileName = `Báo cáo-${reportType}-${new Date().getTime()}.csv`;
      } else if (exportFormat === 'json') {
        content = generateJSON();
        fileName = `Báo cáo-${reportType}-${new Date().getTime()}.json`;
      } else if (exportFormat === 'pdf' || exportFormat === 'detailed-pdf') {
        const htmlContent = getHTMLForReport();
        
        // Chia sẻ nội dung HTML dưới dạng text
        await Share.share({
          message: 'HTML Report:\n\n' + htmlContent.substring(0, 500) + '\n...\n\nBáo cáo HTML đầy đủ được tạo. Sao chép nội dung để xem trong trình duyệt.',
          title: `Báo cáo ${reportType}`,
        });
        
        setIsExporting(false);
        setShowExportModal(false);
        Alert.alert('Thành công', 'Báo cáo đã được xuất. Bạn có thể sao chép nội dung HTML để xem trong trình duyệt hoặc Excel.');
        return;
      }

      // Chia sẻ CSV hoặc JSON
      await Share.share({
        message: content,
        title: fileName,
        url: Platform.OS === 'ios' ? undefined : 'file://' + fileName,
      });

      setIsExporting(false);
      setShowExportModal(false);
      Alert.alert('Thành công', `Đã xuất báo cáo ${reportType} thành ${exportFormat.toUpperCase()}`);
    } catch (error) {
      setIsExporting(false);
      console.log('Export error:', error);
      Alert.alert('Lỗi', 'Không thể xuất báo cáo. Vui lòng thử lại');
    }
  };

  const generateCSV = () => {
    return ReportExportService.generateCSV(
      reportType,
      reportData,
      budgets,
      habits,
      goals,
      getPeriodLabel()
    );
  };

  const generateJSON = () => {
    return ReportExportService.generateJSON(
      reportType,
      reportData,
      budgets,
      habits,
      goals,
      getPeriodLabel()
    );
  };

  const getHTMLForReport = () => {
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #6366F1; border-bottom: 2px solid #6366F1; padding-bottom: 10px; }
        h2 { color: #6366F1; margin-top: 20px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th { background-color: #6366F1; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:hover { background-color: #f0f0f0; }
        .summary-card { 
          display: inline-block; 
          width: 30%; 
          margin: 10px 1.5%; 
          padding: 15px; 
          background-color: #f5f5f5; 
          border-radius: 5px;
          text-align: center;
        }
        .summary-label { font-size: 12px; color: #666; }
        .summary-amount { font-size: 24px; font-weight: bold; color: #6366F1; }
        .income { color: #10B981; }
        .expense { color: #EF4444; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    `;

    let htmlContent = `<html><head><meta charset="utf-8">${styles}</head><body>`;

    if (reportType === 'detailed') {
      htmlContent += `
        <h1>📝 Báo cáo Chi tiết Giao dịch</h1>
        <p>Khoảng thời gian: <strong>${getPeriodLabel()}</strong></p>
        <p>Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}</p>
        
        <h2>Bảng giao dịch</h2>
        <table>
          <tr>
            <th>Ngày</th>
            <th>Mô tả</th>
            <th>Danh mục</th>
            <th>Loại</th>
            <th>Số tiền</th>
            <th>Tài khoản</th>
          </tr>
          ${reportData.transactions.map(t => `
            <tr>
              <td>${t.date}</td>
              <td>${t.description}</td>
              <td>${t.category}</td>
              <td>${t.type === 'income' ? '✓ Thu nhập' : '✗ Chi tiêu'}</td>
              <td class="${t.type === 'income' ? 'income' : 'expense'}">
                ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
              </td>
              <td>${t.wallet}</td>
            </tr>
          `).join('')}
        </table>
        
        <h2>Tóm tắt</h2>
        <div class="summary-card">
          <div class="summary-label">Thu nhập</div>
          <div class="summary-amount income">${formatCurrency(reportData.totalIncome)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Chi tiêu</div>
          <div class="summary-amount expense">${formatCurrency(reportData.totalExpense)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Dòng tiền</div>
          <div class="summary-amount">${formatCurrency(reportData.balance)}</div>
        </div>
      `;
    } else if (reportType === 'budget') {
      htmlContent += `
        <h1>💰 Báo cáo Ngân sách</h1>
        <p>Khoảng thời gian: <strong>${getPeriodLabel()}</strong></p>
        <table>
          <tr>
            <th>Danh mục</th>
            <th>Ngân sách</th>
            <th>Đã chi</th>
            <th>Còn lại</th>
            <th>Tỷ lệ</th>
          </tr>
          ${budgets.map(b => {
            const remaining = b.amount - b.spent;
            const percentage = ((b.spent / b.amount) * 100).toFixed(1);
            return `
            <tr>
              <td>${b.category}</td>
              <td>${formatCurrency(b.amount)}</td>
              <td class="expense">${formatCurrency(b.spent)}</td>
              <td>${remaining > 0 ? '✓ ' : '✗ '}${formatCurrency(Math.abs(remaining))}</td>
              <td>${percentage}%</td>
            </tr>
          `;
          }).join('')}
        </table>
      `;
    } else if (reportType === 'habits') {
      htmlContent += `
        <h1>🎯 Báo cáo Thói quen</h1>
        <table>
          <tr>
            <th>Tên Thói quen</th>
            <th>Tỷ lệ Hoàn thành</th>
            <th>Tổng Check-ins</th>
            <th>Chuỗi Dài nhất</th>
          </tr>
          ${habits.map(h => `
            <tr>
              <td>${h.name}</td>
              <td>${h.completionRate}%</td>
              <td>${h.totalCheckIns}</td>
              <td>${h.longestStreak}</td>
            </tr>
          `).join('')}
        </table>
      `;
    } else if (reportType === 'goals') {
      htmlContent += `
        <h1>🚀 Báo cáo Mục tiêu</h1>
        <table>
          <tr>
            <th>Tên Mục tiêu</th>
            <th>Mục tiêu</th>
            <th>Đã tiết kiệm</th>
            <th>Còn lại</th>
            <th>Tiến độ</th>
            <th>Thời hạn</th>
          </tr>
          ${goals.map(g => {
            const remaining = g.targetAmount - g.amountSaved;
            const progress = ((g.amountSaved / g.targetAmount) * 100).toFixed(1);
            return `
            <tr>
              <td>${g.name}</td>
              <td>${formatCurrency(g.targetAmount)}</td>
              <td class="income">${formatCurrency(g.amountSaved)}</td>
              <td>${formatCurrency(remaining)}</td>
              <td>${progress}%</td>
              <td>${g.targetDate}</td>
            </tr>
          `;
          }).join('')}
        </table>
      `;
    } else {
      htmlContent += `
        <h1>📊 Báo cáo Tài chính Tổng quan</h1>
        <p>Khoảng thời gian: <strong>${getPeriodLabel()}</strong></p>
        <p>Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}</p>
        
        <h2>Tóm tắt Tài chính</h2>
        <div class="summary-card">
          <div class="summary-label">Tổng Thu nhập</div>
          <div class="summary-amount income">${formatCurrency(reportData.totalIncome)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Tổng Chi tiêu</div>
          <div class="summary-amount expense">${formatCurrency(reportData.totalExpense)}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Dòng tiền ròng</div>
          <div class="summary-amount">${formatCurrency(reportData.balance)}</div>
        </div>
        
        <h2>Chi tiêu theo Danh mục</h2>
        <table>
          <tr>
            <th>Danh mục</th>
            <th>Số tiền</th>
            <th>Tỷ lệ (%)</th>
          </tr>
          ${Object.entries(reportData.categoryBreakdown).map(([cat, amount]) => {
            const percentage = reportData.totalExpense > 0 ? ((amount / reportData.totalExpense) * 100).toFixed(1) : 0;
            return `
            <tr>
              <td>${cat}</td>
              <td>${formatCurrency(amount)}</td>
              <td>${percentage}%</td>
            </tr>
          `;
          }).join('')}
        </table>
      `;
    }

    htmlContent += `
      <div class="footer">
        <p>Báo cáo này được tạo tự động bởi Assist AI</p>
        <p>Vui lòng liên hệ hỗ trợ nếu có bất kỳ câu hỏi nào</p>
      </div>
      </body></html>
    `;

    return htmlContent;
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
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📥 Xuất Báo cáo</Text>
        <TouchableOpacity 
          style={styles.exportMainButton}
          onPress={() => setShowExportModal(true)}
        >
          <Text style={styles.exportMainButtonText}>Xuất</Text>
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
        onRequestClose={() => !isExporting && setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn loại & định dạng báo cáo</Text>
              <TouchableOpacity 
                onPress={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Report Type Selection */}
            <View style={styles.reportTypeSection}>
              <Text style={styles.sectionModalLabel}>Loại báo cáo</Text>
              <View style={styles.reportTypeOptions}>
                {([
                  { id: 'summary', label: 'Tổng quan', icon: '📊' },
                  { id: 'detailed', label: 'Chi tiết', icon: '📝' },
                  { id: 'budget', label: 'Ngân sách', icon: '💰' },
                  { id: 'habits', label: 'Thói quen', icon: '🎯' },
                  { id: 'goals', label: 'Mục tiêu', icon: '🚀' },
                ] as { id: ReportType; label: string; icon: string }[]).map(rt => (
                  <TouchableOpacity
                    key={rt.id}
                    style={[
                      styles.reportTypeOption,
                      reportType === rt.id && styles.reportTypeOptionActive,
                    ]}
                    onPress={() => setReportType(rt.id)}
                    disabled={isExporting}
                  >
                    <Text style={styles.reportTypeIcon}>{rt.icon}</Text>
                    <Text
                      style={[
                        styles.reportTypeLabel,
                        reportType === rt.id && styles.reportTypeLabelActive,
                      ]}
                    >
                      {rt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Export Format Selection */}
            <View style={styles.exportFormatSection}>
              <Text style={styles.sectionModalLabel}>Định dạng xuất</Text>
              <View style={styles.exportOptions}>
                {([
                  { id: 'csv', label: 'CSV File', desc: 'Mở với Excel, Google Sheets', icon: '📄' },
                  { id: 'json', label: 'JSON File', desc: 'Định dạng JSON tiêu chuẩn', icon: '📋' },
                  { id: 'pdf', label: 'PDF Report', desc: 'Tệp PDF chuyên nghiệp', icon: '📑' },
                ] as { id: ExportFormat; label: string; desc: string; icon: string }[]).map(format => (
                  <TouchableOpacity
                    key={format.id}
                    style={[
                      styles.exportOption,
                      exportFormat === format.id && styles.exportOptionActive,
                    ]}
                    onPress={() => setExportFormat(format.id)}
                    disabled={isExporting}
                  >
                    <View style={styles.exportOptionContent}>
                      <Text style={styles.exportOptionIcon}>{format.icon}</Text>
                      <View>
                        <Text style={styles.exportOptionTitle}>{format.label}</Text>
                        <Text style={styles.exportOptionDesc}>{format.desc}</Text>
                      </View>
                    </View>
                    {exportFormat === format.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, isExporting && styles.confirmButtonDisabled]}
                onPress={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Xuất {exportFormat.toUpperCase()}
                  </Text>
                )}
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
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  exportMainButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  exportMainButtonText: {
    color: '#6366F1',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
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
    gap: 10,
    flexWrap: 'wrap',
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  periodButtonText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  filterButtonText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  categoryFilterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  categoryFilterText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '700',
  },
  categoryFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.15)',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
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
    fontWeight: '800',
    color: '#FFFFFF',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.12)',
  },
  transactionLeft: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  modalClose: {
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    padding: 8,
  },
  exportOptions: {
    marginBottom: 20,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  exportOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
  },
  exportOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  exportOptionIcon: {
    fontSize: 28,
  },
  exportOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exportOptionDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkmark: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: '800',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  reportTypeSection: {
    marginBottom: 24,
  },
  sectionModalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  reportTypeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reportTypeOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    minWidth: '30%',
  },
  reportTypeOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  reportTypeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  reportTypeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    textAlign: 'center',
  },
  reportTypeLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  exportFormatSection: {
    marginBottom: 24,
  },
});
