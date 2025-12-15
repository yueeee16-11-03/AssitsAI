import React, { useMemo } from 'react';
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
  Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useReportStore } from '../../store/reportStore';
import { useReportData } from '../../hooks/useReportData';
import { useRecurringTransactionStore } from '../../store/recurringTransactionStore';
import { useRecurringFinancialData } from '../../hooks/useRecurringFinancialData';
// @ts-ignore: react-native-vector-icons types may be missing in this project
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ReportType, ExportFormat } from '../../types/report';


type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

export default function ReportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  
  // Fetch dữ liệu từ API sử dụng hook (tự động gọi fetchAllReportDataFromAPI)
  useReportData();
  
  // Get store state and actions
  const {
    exportFormat,
    reportType,
    transactions,
    isExporting,
    // legacy getters left but not used for display
    // getTotalIncomeAll,
    // getTotalExpenseAll,
    // getBalanceAll,
    
    // Actions
    setExportFormat,
    setReportType,
    setExporting,
    fetchReportData,
    
    // Getters
    formatCurrency,
    generateCSV,
    generateJSON,
    generateHTML,
  } = useReportStore();

  // Format VND: ensure we display like "10000 VNĐ" and remove any existing trailing 'Đ' or '₫'
  const formatVND = (val: number | null | undefined) => {
    const s = val === null || val === undefined ? '0' : formatCurrency(val);
    const cleaned = String(s).replace(/\s*[₫đĐ]+$/u, '').trim();
    // Use non-breaking space to keep the currency label with the number.
    return `${cleaned}\u00A0VNĐ`;
  };

  // Compact format for small-summary displays: 1_000 -> 1k, 1_000_000 -> 1m
  const formatVNDShort = (val: number | null | undefined) => {
    if (val === null || val === undefined) return `0\u00A0VNĐ`;
    const n = Number(val) || 0;
    const negative = n < 0;
    const abs = Math.abs(n);
    let formatted: string;
    if (abs >= 1_000_000) {
      const v = +(abs / 1_000_000).toFixed(1);
      formatted = `${v % 1 === 0 ? Math.round(v) : v}M`;
    } else if (abs >= 1_000) {
      const v = +(abs / 1_000).toFixed(1);
      formatted = `${v % 1 === 0 ? Math.round(v) : v}k`;
    } else {
      formatted = `${abs}`;
    }
    return `${negative ? '-' : ''}${formatted}\u00A0VNĐ`;
  };

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(null);
  const [categoryPeriod, setCategoryPeriod] = React.useState<string>('month');
  const [customStart, setCustomStart] = React.useState<Date>(() => { const d = new Date(); d.setDate(d.getDate()-30); return d; });
  const [customEnd, setCustomEnd] = React.useState<Date>(() => new Date());
  const [showTxDatePicker, setShowTxDatePicker] = React.useState<'start'|'end'|null>(null);
  
  // State riêng cho button đầu (Ngày/Tuần/Tháng/Năm) - hiển thị tổng thu chi
  const [summaryPeriod, setSummaryPeriod] = React.useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  
  // State riêng cho phần "Chọn khoảng thời gian" (độc lập với các phần khác)
  const [txListPeriod, setTxListPeriod] = React.useState<'all' | 'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [prevTxListPeriod, setPrevTxListPeriod] = React.useState(txListPeriod);
  const [prevCustomRange, setPrevCustomRange] = React.useState<{start: Date; end: Date}>({ start: customStart, end: customEnd });
  const [txListFilterType, setTxListFilterType] = React.useState<'all' | 'income' | 'expense'>('all');
  const [txListFilterCategory, setTxListFilterCategory] = React.useState<string | null>(null);

  // Animated indicator states for period selectors
  const [topContainerWidth, setTopContainerWidth] = React.useState(0);
  const topIndicator = React.useRef(new Animated.Value(0)).current;
  const [categoryContainerWidth, setCategoryContainerWidth] = React.useState(0);
  const categoryIndicator = React.useRef(new Animated.Value(0)).current;
  // removed txListContainerWidth and txListIndicator because dropdown UI replaces the selector
  // Dropdown visibility states for UI-only dropdowns
  const [showPeriodDropdown, setShowPeriodDropdown] = React.useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = React.useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const [monthTableWidth, setMonthTableWidth] = React.useState(0);

  // Chart tooltips
  const [trendTooltip, setTrendTooltip] = React.useState<{visible:boolean; label:string; value:number; x:number; y:number}>({visible:false, label:'', value:0, x:0, y:0});
  const [cashTooltip, setCashTooltip] = React.useState<{visible:boolean; label:string; value:number; x:number; y:number}>({visible:false, label:'', value:0, x:0, y:0});

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  React.useEffect(() => {
    if (!topContainerWidth) return;
    const idx = ['day','week','month','year'].indexOf(summaryPeriod as string);
    const border = 1;
    const width = (topContainerWidth - border * 2) / 4;
    const target = idx * width + border;
    Animated.spring(topIndicator, { toValue: target, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [summaryPeriod, topContainerWidth, topIndicator]);

  React.useEffect(() => {
    if (!categoryContainerWidth) return;
    const idx = ['day','week','month','year'].indexOf(categoryPeriod as string);
    const border = 1;
    const width = (categoryContainerWidth - border * 2) / 4;
    const target = idx * width + border;
    Animated.spring(categoryIndicator, { toValue: target, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [categoryPeriod, categoryContainerWidth, categoryIndicator]);

  // Old selector animation removed: UI now uses dropdowns

  // Ensure tooltips hide automatically after a short delay
  React.useEffect(() => {
    if (trendTooltip.visible) {
      const timer = setTimeout(() => setTrendTooltip(prev=>({...prev, visible:false})), 2500);
      return () => clearTimeout(timer);
    }
  }, [trendTooltip.visible]);

  React.useEffect(() => {
    if (cashTooltip.visible) {
      const timer = setTimeout(() => setCashTooltip(prev=>({...prev, visible:false})), 2500);
      return () => clearTimeout(timer);
    }
  }, [cashTooltip.visible]);

  // derive categories dynamically from transactions
  const categories = React.useMemo(() => {
    const map = new Map<string, { name: string; types: Set<string> }>();
    try {
      (transactions || []).forEach((tx: any) => {
        const label = (tx.category || tx.categoryName || tx.categoryId || '').toString().trim();
        const type = (tx.type || 'expense').toString().toLowerCase();
        if (!label) return;
        if (!map.has(label)) map.set(label, { name: label, types: new Set<string>() });
        map.get(label)!.types.add(type);
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } catch {
      return [] as { name: string; types: Set<string> }[];
    }
  }, [transactions]);

  const visibleCategories = React.useMemo(() => {
    if (!categories || categories.length === 0) return [] as { name: string; types: Set<string> }[];
    if (!txListFilterType || txListFilterType === 'all') return categories;
    return categories.filter(c => c.types.has(txListFilterType));
  }, [categories, txListFilterType]);

  const normalizeCategoryName = (s: any) => {
    try {
      return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    } catch {
      return String(s || '').toLowerCase().trim();
    }
  };

  // Return an icon name for a given category string.
  const mapCategoryToIcon = (category: string) => {
    const n = normalizeCategoryName(category);
    if (!n) return 'tag-outline';
    if (/(ăn|do an|food|com|meal|ăn uống|đồ ăn|ăn)/.test(n)) return 'silverware-fork-knife';
    if (/(transport|taxi|bus|vé|xe|đi lại|di chuyển|ô tô|xebus|taxi)/.test(n)) return 'car';
    if (/(shopping|mua sắm|shop|retail)/.test(n)) return 'shopping';
    if (/(grocer|market|chợ|siêu thị|grocery|thực phẩm)/.test(n)) return 'cart';
    if (/(bill|hóa đơn|hoadon|bill|thuê|bill)/.test(n)) return 'file-document-outline';
    if (/(salary|lương|thu nhập|income|pay)/.test(n)) return 'cash';
    if (/(gift|quà|qua|present)/.test(n)) return 'gift-outline';
    if (/(health|y tế|sức khỏe|bệnh|clinic)/.test(n)) return 'heart-pulse';
    if (/(education|school|học|khóa học|course)/.test(n)) return 'school';
    if (/(entertain|game|movie|nhạc|giải trí|movie|music)/.test(n)) return 'movie';
    return 'tag-outline';
  };

  // Generate a deterministic color for a category using a small palette
  const mapCategoryToColor = (category: string) => {
    const palette = ['#10B981', '#EF4444', '#F59E0B', '#6366F1', '#06B6D4', '#F97316', '#8B5CF6', '#E11D48'];
    const n = normalizeCategoryName(category);
    if (!n) return palette[0];
    let sum = 0;
    for (let i = 0; i < n.length; i++) sum += n.charCodeAt(i);
    return palette[sum % palette.length];
  };

  const hexToRgba = (hex: string, alpha = 1) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // subscribe to recurring transactions (to include in financial totals)
  const recurringTransactions = useRecurringTransactionStore((state: any) => state.recurringTransactions);
  const initRecurring = useRecurringTransactionStore((state: any) => state.initialize);

  React.useEffect(() => {
    const init = async () => {
      try {
        console.log('📊 [REPORT SCREEN] Initializing recurring transactions');
        await initRecurring();
        console.log('✅ [REPORT SCREEN] Recurring transactions initialized');
      } catch (err) {
        console.error('❌ [REPORT SCREEN] Error initializing recurring transactions:', err);
      }
    };
    init();
  }, [initRecurring]);

  // Map summary period to hook supported period ('day'|'week'|'month'|'year')
  const mappedPeriod = React.useMemo(() => {
    if (summaryPeriod === 'day') return 'day' as const;
    if (summaryPeriod === 'week') return 'week' as const;
    if (summaryPeriod === 'month') return 'month' as const;
    if (summaryPeriod === 'year') return 'year' as const;
    // Default for 'custom' => treat as 'month' for totals
    return 'month' as const;
  }, [summaryPeriod]);

  // Use the same financial calculation as Dashboard
  const financialData = useRecurringFinancialData(transactions, recurringTransactions, mappedPeriod);

  const { totalIncome: displayTotalIncome, totalExpense: displayTotalExpense, balance: displayBalance } = financialData;

  // Recalculate reportData whenever transactions change.
  // NOTE: Period/Filter UI exist but their calculation logic is intentionally paused for now.
  React.useEffect(() => {
    console.log('📊 [REPORT SCREEN] Recalculating report due to transactions change');
    fetchReportData(transactions);
  }, [transactions, fetchReportData]);

  const handleExport = async () => {
    try {
      setExporting(true);
      let content = '';
      let fileName = '';

      if (exportFormat === 'csv') {
        content = generateCSV();
        fileName = `Báo cáo-${reportType}-${new Date().getTime()}.csv`;
      } else if (exportFormat === 'json') {
        content = generateJSON();
        fileName = `Báo cáo-${reportType}-${new Date().getTime()}.json`;
      } else if (exportFormat === 'pdf' || exportFormat === 'detailed-pdf') {
        const htmlContent = generateHTML();
        
        // Chia sẻ nội dung HTML dưới dạng text
        await Share.share({
          message: 'HTML Report:\n\n' + htmlContent.substring(0, 500) + '\n...\n\nBáo cáo HTML đầy đủ được tạo. Sao chép nội dung để xem trong trình duyệt.',
          title: `Báo cáo ${reportType}`,
        });
        
        setExporting(false);
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

      setExporting(false);
      setShowExportModal(false);
      Alert.alert('Thành công', `Đã xuất báo cáo ${reportType} thành ${exportFormat.toUpperCase()}`);
    } catch (exportErr) {
      setExporting(false);
      console.log('Export error:', exportErr);
      Alert.alert('Lỗi', 'Không thể xuất báo cáo. Vui lòng thử lại');
    }
  };

  const renderDetailedCategoryReport = () => {
    if (!transactions || transactions.length === 0) return null;

    // compute date range based on selected period to filter category transactions
    const getPeriodRange = (p: string) => {
      const now = new Date();
      if (p === 'all') {
        const start = new Date(1970, 0, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear() + 100, 0, 1, 23, 59, 59, 999); // far future to include all
        return { start, end };
      }
      if (p === 'day') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start, end };
      }
      if (p === 'week') {
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      }
      if (p === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
      }
      // custom
      // custom
      if (p === 'custom') {
        const start = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate(), 0, 0, 0, 0);
        const end = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999);
        return { start, end };
      }
      // year
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    };

    const { start: catStart, end: catEnd } = getPeriodRange(categoryPeriod);

    // Group transactions by category filtered by selected period ONLY (không apply filterType, filterCategory)
    const matchesFilters = (tx: any) => {
      const txDate = tx.date?.toDate?.() || new Date(tx.date);
      if (txDate < catStart || txDate > catEnd) return false;
      // Không filter theo loại giao dịch hoặc danh mục - chỉ lọc theo thời gian
      return true;
    };

    const categoryTxMap: Record<string, any[]> = {};
    transactions.forEach(tx => {
      if (!matchesFilters(tx)) return;
      const catLabel = (tx.category || tx.categoryName || tx.categoryId || 'Khác').toString();
      if (!categoryTxMap[catLabel]) categoryTxMap[catLabel] = [];
      categoryTxMap[catLabel].push(tx);
    });

    const categoryList = Object.keys(categoryTxMap).sort((a, b) => a.localeCompare(b, 'vi'));

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}><Icon name="format-list-bulleted" size={16} color="#0F1724" />  Chi tiết theo danh mục</Text>
        </View>
        {/* Period buttons specific to category detail */}
        <View style={[styles.periodSelectorLight]} onLayout={(e) => setCategoryContainerWidth(e.nativeEvent.layout.width)}>
          {!!categoryContainerWidth && (
            <Animated.View pointerEvents="none" style={[styles.periodIndicatorLight, { width: (categoryContainerWidth - 2) / 4, transform: [{ translateX: categoryIndicator }] }]} />
          )}
          {(['day','week','month','year'] as const).map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodButtonFlex, styles.periodButtonLight, styles.periodButtonInSelector, categoryPeriod === p && styles.periodButtonActiveLight]}
              onPress={() => { setCategoryPeriod(p); setExpandedCategory(null); fetchReportData(transactions); }}
            >
              <Text style={[styles.periodButtonTextLight, categoryPeriod === p ? styles.periodButtonTextActiveLightOnBlue : {}]}>
                {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {categoryList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có giao dịch phù hợp với bộ lọc hiện tại</Text>
          </View>
        ) : null}
        {categoryList.map(category => {
          const categoryTx = categoryTxMap[category];
          const categoryTotal = categoryTx.reduce((sum, tx) => sum + (tx.amount || 0), 0);
          const isExpanded = expandedCategory === category;
          // replace emoji in display name and compute icon/color
          const displayName = (category || '').toString().replace(/\p{Extended_Pictographic}/gu, '').trim() || category;
          const iconName = mapCategoryToIcon(category);
          const color = mapCategoryToColor(category);

          return (
            <TouchableOpacity
              key={category}
              style={[styles.categoryDetailHeader, { backgroundColor: hexToRgba(color, 0.06), borderColor: hexToRgba(color, 0.12) }, isExpanded && { backgroundColor: hexToRgba(color, 0.12), borderColor: hexToRgba(color, 0.20) }]}
                onPress={() => navigation.navigate('CategoryTransactions', { category, startDate: categoryPeriod === 'custom' ? customStart.toISOString() : catStart.toISOString(), endDate: categoryPeriod === 'custom' ? customEnd.toISOString() : catEnd.toISOString() })}
              onLongPress={() => setExpandedCategory(isExpanded ? null : category)}
            >
              <View style={styles.categoryDetailTitle}>
                <View style={styles.categoryDetailRow}>
                  <View style={[styles.categoryIconContainer, { backgroundColor: color }]}> 
                    <Icon name={iconName} size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.categoryTitleTextContainer}>
                    <Text style={styles.categoryDetailName}>{displayName}</Text>
                    <Text style={styles.categoryDetailCount}>{categoryTx.length} giao dịch</Text>
                  </View>
                </View>
              </View>
              <View style={styles.categoryDetailRight}>
                <Text style={styles.categoryDetailAmount}>{formatVNDShort(categoryTotal)}</Text>
                <Icon
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={color}
                  style={styles.categoryDetailChevron}
                />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Expanded transactions inline */}
        {expandedCategory && categoryTxMap[expandedCategory] && (
          <View style={styles.categoryTransactionList}>
            <Text style={styles.categoryTransactionTitle}>Giao dịch của danh mục "{expandedCategory}"</Text>
            {(() => {
              const expandedColor = mapCategoryToColor(expandedCategory || '');
              return categoryTxMap[expandedCategory].map(tx => (
                <View key={tx.id} style={[styles.categoryTransactionItem, styles.transactionItemColoredBase, { backgroundColor: hexToRgba(expandedColor, 0.04), borderBottomColor: hexToRgba(expandedColor, 0.08), borderLeftColor: expandedColor }]}>
                <View style={styles.categoryTransactionLeft}>
                  <Text style={styles.categoryTransactionDesc}>{tx.description}</Text>
                  <Text style={styles.categoryTransactionDate}>{(tx.date?.toDate ? tx.date.toDate() : new Date(tx.date)).toLocaleDateString('vi-VN')}</Text>
                </View>
                <Text style={[styles.categoryTransactionAmount, tx.type === 'income' ? styles.incomeAmount : styles.expenseAmount]}>
                  {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                </Text>
                </View>
              ));
            })()}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyChart = (message: string) => (
    <View style={styles.emptyChart}>
      <Icon name="chart-box-outline" size={36} color="#9CA3AF" />
      <Text style={styles.emptyChartText}>{message}</Text>
    </View>
  );

  // Category breakdown removed from UI: showing detailed list and drill-down instead.

  const renderMonthComparison = () => {
    if (!transactions || transactions.length === 0) return null;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate previous month
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonth = prevDate.getMonth();
    const prevYear = prevDate.getFullYear();

    // Current month range
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    // Previous month range
    const prevMonthStart = new Date(prevYear, prevMonth, 1);
    const prevMonthEnd = new Date(prevYear, prevMonth + 1, 0);

    // Filter transactions by date ONLY (không apply filterType, filterCategory)
    const currentMonthTx = transactions.filter(tx => {
      const txDate = tx.date?.toDate?.() || new Date(tx.date);
      return txDate >= currentMonthStart && txDate <= currentMonthEnd;
    });

    const prevMonthTx = transactions.filter(tx => {
      const txDate = tx.date?.toDate?.() || new Date(tx.date);
      return txDate >= prevMonthStart && txDate <= prevMonthEnd;
    });

    // Calculate totals (transactions + recurring transactions if nextDue/lastPaid falls within range)
    const sumList = (list: any[], type: 'income' | 'expense' | 'all') =>
      list.reduce((sum, tx) => {
        if (type === 'all') return sum + (tx.amount || 0);
        return sum + (tx.type === type ? tx.amount || 0 : 0);
      }, 0);

    const sumRecurringInRange = (recs: any[], start: Date, end: Date, type: 'income' | 'expense' | 'all') => {
      if (!recs || recs.length === 0) return 0;
      return recs.reduce((sum, rec) => {
        if (type !== 'all' && rec.type !== type) return sum;
        // Không filter category - so sánh toàn bộ
        // Count recurring if nextDue or lastPaid falls in range
        const nextDueDate = rec.nextDue ? new Date(rec.nextDue) : null;
        const lastPaidDate = rec.lastPaid ? new Date(rec.lastPaid) : null;
        const inNextDue = nextDueDate && nextDueDate >= start && nextDueDate <= end;
        const inLastPaid = lastPaidDate && lastPaidDate >= start && lastPaidDate <= end;
        if (inNextDue || inLastPaid) return sum + (rec.amount || 0);
        return sum;
      }, 0);
    };

    const currentIncome = sumList(currentMonthTx, 'income') + sumRecurringInRange(recurringTransactions, currentMonthStart, currentMonthEnd, 'income');
    const currentExpense = sumList(currentMonthTx, 'expense') + sumRecurringInRange(recurringTransactions, currentMonthStart, currentMonthEnd, 'expense');
    const currentBalance = currentIncome - currentExpense;

    const prevIncome = sumList(prevMonthTx, 'income') + sumRecurringInRange(recurringTransactions, prevMonthStart, prevMonthEnd, 'income');
    const prevExpense = sumList(prevMonthTx, 'expense') + sumRecurringInRange(recurringTransactions, prevMonthStart, prevMonthEnd, 'expense');
    const prevBalance = prevIncome - prevExpense;

    // Calculate changes
    const incomeChange = currentIncome - prevIncome;
    const expenseChange = currentExpense - prevExpense;
    const balanceChange = currentBalance - prevBalance;

    const incomeChangePercent = prevIncome !== 0 ? ((incomeChange / prevIncome) * 100).toFixed(1) : 0;
    const expenseChangePercent = prevExpense !== 0 ? ((expenseChange / prevExpense) * 100).toFixed(1) : 0;

    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

    // tableInnerWidth moved to component state 'monthTableWidth'.
    // Column flex ratios mirror styles colFlexMoney (1.6) and colFlexPercent (0.6)
    const totalColFlex = 1.6 + 1.6 + 0.6;
    const col1Ratio = 1.6 / totalColFlex;
    const col2Ratio = (1.6 + 1.6) / totalColFlex;
    const colSeparatorShift = -6; // shift separators slightly left for visual gap

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><Icon name="trending-up" size={16} color="#0F1724" />  So sánh tháng</Text>

        {/* Month Headers - single outer frame around three cells */}
        <View style={[styles.tableContainer, styles.monthTable]} onLayout={(e) => setMonthTableWidth(e.nativeEvent.layout.width)}>
          {/* Vertical separators: render two lines between our 3 columns */}
          {monthTableWidth > 0 && (
            <>
              <View style={[styles.verticalSeparator, { left: monthTableWidth * col1Ratio + colSeparatorShift - 0.5 }]} />
              <View style={[styles.verticalSeparator, { left: monthTableWidth * col2Ratio + colSeparatorShift - 0.5 }]} />
            </>
          )}
          <View style={styles.monthHeaderFrame}>
          <View style={styles.monthComparisonRow}>
            <View style={[styles.colFlexMoney, styles.monthHeaderCell, styles.tableCell, styles.monthHeaderDivider]}>
              <View style={styles.monthHeaderContainer}>
                <Text style={[styles.monthHeaderTitle, styles.monthHeaderTitlePrevious]}>{monthNames[prevMonth]} {prevYear}</Text>
                <Text style={styles.monthHeaderSubtitle}>Tháng trước</Text>
              </View>
            </View>
            <View style={[styles.colFlexMoney, styles.monthHeaderCell, styles.tableCell, styles.monthHeaderDivider]}>
              <View style={styles.monthHeaderContainer}>
                <Text style={[styles.monthHeaderTitle, styles.monthHeaderTitleCurrent]}>{monthNames[currentMonth]} {currentYear}</Text>
                <Text style={styles.monthHeaderSubtitle}>Tháng này</Text>
              </View>
            </View>
            <View style={[styles.colFlexPercent, styles.monthHeaderCell, styles.tableCellNoRight]}>
              <View style={styles.monthHeaderContainer}>
                <Text style={[styles.monthHeaderTitle, styles.monthHeaderTitleCurrent]}>Thay đổi</Text>
                <Text style={styles.monthHeaderSubtitle}>%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Income */}
        <View style={[styles.monthComparisonItem, styles.tableRow, styles.monthComparisonIncomeItem]}> 
          <Text style={styles.monthComparisonItemLabel}>Thu nhập</Text>
          <View style={styles.monthComparisonRow}>
            <View style={[styles.colFlexMoney, styles.tableCell]}>
              <Text style={styles.monthComparisonSmallValuePrevious}>{formatVND(prevIncome)}</Text>
            </View>
            <View style={[styles.colFlexMoney, styles.tableCell]}>
              <Text style={styles.monthComparisonSmallValueCurrent}>{formatVND(currentIncome)}</Text>
            </View>
            <View style={[styles.colFlexPercent, styles.monthComparisonRightGroup, styles.tableCellNoRight]}>              
              <View style={[styles.percentBadgeSmall, prevIncome === 0 ? styles.percentBadgeNeutral : (incomeChange >= 0 ? styles.percentBadgePositive : styles.percentBadgeNegative)]}>              
                <Icon name={incomeChange >= 0 ? 'arrow-up' : 'arrow-down'} size={10} color={incomeChange >= 0 ? '#10B981' : '#EF4444'} />
                <Text style={[styles.percentBadgeTextSmall, prevIncome === 0 ? {} : (incomeChange >= 0 ? styles.changePositive : styles.changeNegative)]}>              
                  {prevIncome !== 0 ? `${Math.abs(Number(incomeChangePercent))}%` : 'N/A'}
                </Text>
              </View>
            </View> 
          </View>
        </View>

        {/* Expense */}
        <View style={[styles.monthComparisonItem, styles.tableRow, styles.monthComparisonExpenseItem]}> 
          <Text style={styles.monthComparisonItemLabel}>Chi tiêu</Text>
          <View style={styles.monthComparisonRow}>
            <View style={[styles.colFlexMoney, styles.tableCell]}>
              <Text style={styles.monthComparisonSmallValuePrevious}>{formatVND(prevExpense)}</Text>
            </View>
            <View style={[styles.colFlexMoney, styles.tableCell]}>
              <Text style={styles.monthComparisonSmallValueCurrent}>{formatVND(currentExpense)}</Text>
            </View>
            <View style={[styles.colFlexPercent, styles.monthComparisonRightGroup, styles.tableCellNoRight]}>              
              <View style={[styles.percentBadgeSmall, prevExpense === 0 ? styles.percentBadgeNeutral : (expenseChange >= 0 ? styles.percentBadgeNegative : styles.percentBadgePositive)]}>              
                <Icon name={expenseChange >= 0 ? 'arrow-up' : 'arrow-down'} size={10} color={expenseChange >= 0 ? '#EF4444' : '#10B981'} />
                <Text style={[styles.percentBadgeTextSmall, prevExpense === 0 ? {} : (expenseChange >= 0 ? styles.changeNegative : styles.changePositive)]}>              
                  {prevExpense !== 0 ? `${Math.abs(Number(expenseChangePercent))}%` : 'N/A'}
                </Text>
              </View>
            </View> 
          </View>
        </View>

        {/* Balance */}
        <View style={[styles.monthComparisonItem, styles.monthComparisonBalanceItem, styles.tableRow]}> 
          <Text style={styles.monthComparisonItemLabel}>Dư/Thiếu</Text>
          <View style={styles.monthComparisonRow}>
            <View style={[styles.colFlexMoney, styles.tableCell]}>
              <Text style={[styles.monthComparisonSmallValuePrevious, prevBalance >= 0 ? styles.balancePositive : styles.balanceNegative]}>{formatVND(prevBalance)}</Text>
            </View>
            <View style={[styles.colFlexMoney, styles.tableCell]}>
              <Text style={[styles.monthComparisonSmallValueCurrent, currentBalance >= 0 ? styles.balancePositive : styles.balanceNegative]}>{formatVND(currentBalance)}</Text>
            </View>
            <View style={[styles.colFlexPercent, styles.monthComparisonRightGroup, styles.tableCellNoRight]}>              
              <View style={[styles.percentBadgeSmall, prevBalance === 0 ? styles.percentBadgeNeutral : (balanceChange >= 0 ? styles.percentBadgePositive : styles.percentBadgeNegative)]}>              
                <Icon name={balanceChange >= 0 ? 'arrow-up' : 'arrow-down'} size={10} color={balanceChange >= 0 ? '#10B981' : '#EF4444'} />
                <Text style={[styles.percentBadgeTextSmall, prevBalance === 0 ? {} : (balanceChange >= 0 ? styles.changePositive : styles.changeNegative)]}>              
                  {prevBalance !== 0 ? `${Math.abs(Number(((balanceChange / Math.abs(prevBalance)) * 100).toFixed(1)))}%` : 'N/A'}
                </Text>
              </View>
            </View> 
          </View>
        </View>
        </View>
      </View>
    );
  };

  // Category breakdown section removed from UI to reduce clutter above month comparison.

  const renderSpendingTrendChart = () => {
    if (!transactions || transactions.length === 0) return null;

    // Weekly trend: aggregate transactions into 4 weekly buckets (last 4 weeks)
    const now = new Date();
    const weeks: { start: Date; end: Date; label: string }[] = [];
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i + 1) * 7 + 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(now.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      weeks.push({ start, end, label: `W${4 - i}` });
    }

    const bucketIncome = weeks.map(() => 0);
    const bucketExpense = weeks.map(() => 0);

    // Populate weekly buckets from transactions
    transactions.forEach(tx => {
      const txDate = tx.date?.toDate?.() || new Date(tx.date);
      weeks.forEach((w, idx) => {
        if (txDate >= w.start && txDate <= w.end) {
          if (tx.type === 'income') bucketIncome[idx] += tx.amount || 0;
          else bucketExpense[idx] += tx.amount || 0;
        }
      });
    });

    const labels = weeks.map(w => w.label);
    const incomeValsRaw = bucketIncome;
    const expenseValsRaw = bucketExpense;

    // Scale numbers for chart readability (k, M) but keep tooltips with full values
    const getScale = (vals: number[]) => {
      const max = Math.max(...vals, 0);
      if (max >= 1_000_000) return { factor: 1_000_000, suffix: 'M' };
      if (max >= 1_000) return { factor: 1_000, suffix: 'k' };
      return { factor: 1, suffix: '' };
    };

    const scale = getScale([...incomeValsRaw, ...expenseValsRaw]);
    const incomeVals = incomeValsRaw.map(v => +(v / scale.factor).toFixed(1));
    const expenseVals = expenseValsRaw.map(v => +(v / scale.factor).toFixed(1));

    // Empty state guard: if all values are 0, show friendly message
    if (incomeValsRaw.reduce((s, v) => s + v, 0) === 0 && expenseValsRaw.reduce((s, v) => s + v, 0) === 0) {
      return renderEmptyChart('Chưa có dữ liệu cho khoảng thời gian này');
    }

    const totalIncomePeriod = incomeValsRaw.reduce((s, v) => s + v, 0);
    const totalExpensePeriod = expenseValsRaw.reduce((s, v) => s + v, 0);
    const totalNetPeriod = totalIncomePeriod - totalExpensePeriod;

    const chartData = {
      labels: labels.slice(-7), // Last 7 entries
      datasets: [
        {
          data: incomeVals.slice(-7),
          color: (opacity = 1) => `rgba(16,185,129,${opacity})`,
          strokeWidth: 2,
        },
        {
          data: expenseVals.slice(-7),
          color: (opacity = 1) => `rgba(239,68,68,${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = Math.max(280, screenWidth - 48);
    const chartHeight = 180; // Reduced height for clearer labels

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><Icon name="chart-line" size={16} color="#0F1724" />  Xu hướng thu chi theo tuần</Text>
        

        <View style={styles.cashSummaryRow}>
          <View style={[styles.summaryCard, styles.smallSummaryCard]}> 
            <Text style={styles.summaryLabelSmall}>Tổng thu </Text>
            <Text style={[styles.summaryAmountSmall, styles.incomeText]} numberOfLines={1} ellipsizeMode="middle">{formatVNDShort(totalIncomePeriod)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.smallSummaryCard]}> 
            <Text style={styles.summaryLabelSmall}>Tổng chi </Text>
            <Text style={[styles.summaryAmountSmall, styles.expenseText]} numberOfLines={1} ellipsizeMode="middle">{formatVNDShort(totalExpensePeriod)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.smallSummaryCard]}> 
            <Text style={styles.summaryLabelSmall}>Dòng tiền ròng </Text>
            <Text style={[styles.summaryAmountSmall, totalNetPeriod >= 0 ? styles.balancePositive : styles.balanceNegative]} numberOfLines={1} ellipsizeMode="middle">{formatVNDShort(totalNetPeriod)}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chartWrapper}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={chartHeight}
              yAxisLabel={""}
              yAxisSuffix={`${scale.suffix ? scale.suffix + ' ' : ''}VNĐ`}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                color: (opacity = 1) => `rgba(31,41,55,${opacity})`,
                labelColor: (opacity = 1) => `rgba(15,23,36,${opacity})`,
                fillShadowGradient: 'rgba(0,0,0,0)',
                fillShadowGradientOpacity: 0,
                decimalPlaces: 1,
                strokeWidth: 2,
                propsForLabels: {
                  fontSize: 10,
                  fill: '#0F1724',
                },
              }}
              style={styles.chart}
              bezier
              verticalLabelRotation={0}
              formatXLabel={label => String(label).length > 6 ? String(label).slice(0,6) + '...' : String(label)}
              onDataPointClick={(d) => {
                const label = chartData.labels?.[d.index] ?? '';
                // Convert from scaled value to real value for tooltip
                const rawValue = d.value * (scale.factor || 1);
                setTrendTooltip({ visible:true, label, value: rawValue, x: d.x, y: d.y });
              }}
            />

            {trendTooltip.visible && (
              <View style={[styles.chartTooltip, { left: Math.max(8, trendTooltip.x - 40), top: Math.max(6, trendTooltip.y - 48) }]}>
                <Text style={styles.chartTooltipText}>{trendTooltip.label}</Text>
                <Text style={styles.chartTooltipValue}>{formatVND(trendTooltip.value)}</Text>
              </View>
            )}
          </View>
        </View>
        {scale.suffix !== '' && (
          <Text style={styles.chartScaleNote}>(Giá trị hiển thị đã thu nhỏ: 1{scale.suffix} = {formatVND(scale.factor)} — W = tuần (chia theo tuần trong tháng))</Text>
        )}
        <View style={styles.chartLegend}>
          <View style={styles.chartLegendItem}>
            <View style={styles.chartLegendColorIncome} />
            <Text style={styles.chartLegendLabel}>Thu nhập</Text>
          </View>
          <View style={styles.chartLegendItem}>
            <View style={styles.chartLegendColorExpense} />
            <Text style={styles.chartLegendLabel}>Chi tiêu</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCashFlowChart = () => {
    if (!transactions || transactions.length === 0) return null;

    // Daily trend: last 7 days (each day)
    const now = new Date();
    const dayLabels: string[] = [];
    const incomeValsRaw: number[] = [];
    const expenseValsRaw: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      dayLabels.push(key);
      incomeValsRaw.push(0);
      expenseValsRaw.push(0);
    }

    transactions.forEach(tx => {
      const txDate = tx.date?.toDate?.() || new Date(tx.date);
      const key = `${txDate.getDate()}/${txDate.getMonth() + 1}`;
      const idx = dayLabels.indexOf(key);
      if (idx >= 0) {
        if (tx.type === 'income') incomeValsRaw[idx] += tx.amount || 0;
        else expenseValsRaw[idx] += tx.amount || 0;
      }
    });

    const netValsRaw = incomeValsRaw.map((v, i) => v - expenseValsRaw[i]);

    const scaleCF = (vals: number[]) => {
      const max = Math.max(...vals.map(Math.abs), 0);
      if (max >= 1_000_000) return { factor: 1_000_000, suffix: 'M' };
      if (max >= 1_000) return { factor: 1_000, suffix: 'k' };
      return { factor: 1, suffix: '' };
    };

    const cfScale = scaleCF([...incomeValsRaw, ...expenseValsRaw, ...netValsRaw]);
    const incomeData = incomeValsRaw.map(v => +(v / cfScale.factor).toFixed(1));
    const expenseData = expenseValsRaw.map(v => +(v / cfScale.factor).toFixed(1));
    const netData = netValsRaw.map(v => +(v / cfScale.factor).toFixed(1));

    const chartData = {
      labels: dayLabels,
      datasets: [
        {
          data: incomeData,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: expenseData,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: netData,
          color: (opacity = 1) => `rgba(31, 41, 55, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    const screenWidth = Dimensions.get('window').width;
    const chartWidth = Math.max(280, screenWidth - 48);
    const chartHeight = 160; // Slightly smaller for daily chart clarity

    const totalIncomePeriod = incomeValsRaw.reduce((s, v) => s + v, 0);
    const totalExpensePeriod = expenseValsRaw.reduce((s, v) => s + v, 0);
    const totalNetPeriod = totalIncomePeriod - totalExpensePeriod;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}><Icon name="calendar-today" size={16} color="#0F1724" />  Xu hướng chi/thu theo ngày</Text>

        <View style={styles.cashSummaryRow}>
          <View style={[styles.summaryCard, styles.smallSummaryCard]}> 
            <Text style={styles.summaryLabelSmall}>Tổng thu (7 ngày)</Text>
            <Text style={[styles.summaryAmountSmall, styles.incomeText]} numberOfLines={1} ellipsizeMode="middle">{formatVNDShort(totalIncomePeriod)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.smallSummaryCard]}> 
            <Text style={styles.summaryLabelSmall}>Tổng chi (7 ngày)</Text>
            <Text style={[styles.summaryAmountSmall, styles.expenseText]} numberOfLines={1} ellipsizeMode="middle">{formatVNDShort(totalExpensePeriod)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.smallSummaryCard]}> 
            <Text style={styles.summaryLabelSmall}>Dòng tiền ròng (7 ngày)</Text>
            <Text style={[styles.summaryAmountSmall, totalNetPeriod >= 0 ? styles.balancePositive : styles.balanceNegative]} numberOfLines={1} ellipsizeMode="middle">{formatVNDShort(totalNetPeriod)}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
            <LineChart
            data={chartData}
            width={chartWidth}
            height={chartHeight}
              yAxisLabel={""}
              yAxisSuffix={`${cfScale.suffix ? cfScale.suffix + ' ' : ''}VNĐ`}
            chartConfig={{
              backgroundColor: '#FFFFFF',
              backgroundGradientFrom: '#FFFFFF',
              backgroundGradientTo: '#FFFFFF',
              color: (opacity = 1, datasetIndex = 0) => {
                return datasetIndex === 0 
                  ? `rgba(16, 185, 129, ${opacity})` // Green for income
                  : `rgba(239, 68, 68, ${opacity})`; // Red for expense
              },
                fillShadowGradient: 'rgba(0,0,0,0)',
                fillShadowGradientOpacity: 0,
              labelColor: (opacity = 1) => `rgba(15,23,36,${opacity})`,
              strokeWidth: 2,
              decimalPlaces: 1,
              propsForLabels: {
                fontSize: 10,
                fill: '#0F1724',
              },
            }}
            style={styles.chart}
            bezier
            verticalLabelRotation={-45}
              onDataPointClick={(d) => {
                const label = chartData.labels?.[d.index] ?? '';
                const rawValue = d.value * (cfScale.factor || 1);
                setCashTooltip({ visible:true, label, value: rawValue, x: d.x, y: d.y });
              }}
          />
            {cashTooltip.visible && (
              <View style={[styles.chartTooltip, { left: Math.max(8, cashTooltip.x - 40), top: Math.max(6, cashTooltip.y - 48) }]}>
                <Text style={styles.chartTooltipText}>{cashTooltip.label}</Text>
                <Text style={styles.chartTooltipValue}>{formatVND(cashTooltip.value)}</Text>
              </View>
            )}
        </View>
        {cfScale.suffix !== '' && (
          <Text style={styles.chartScaleNote}>(Giá trị hiển thị đã thu nhỏ: 1{cfScale.suffix} = {formatVND(cfScale.factor)})</Text>
        )}
        <View style={styles.cashFlowLegend}>
          <View style={styles.legendItem}>
            <View style={styles.legendColorIncome} />
            <Text style={styles.legendText}>Thu nhập</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendColorExpense} />
            <Text style={styles.legendText}>Chi tiêu</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendColorNet} />
            <Text style={styles.legendText}>Dòng tiền ròng</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTransactionList = () => {
    if (!transactions || transactions.length === 0) return null;

    // Get the date range for the selected period (dùng state riêng txListPeriod)
    const getPeriodRange = (p: string) => {
      const now = new Date();
      if (p === 'day') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start, end };
      }
      if (p === 'week') {
        const end = new Date(now);
        end.setHours(23, 59, 59, 999);
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return { start, end };
      }
      if (p === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
      }
      // custom
      if (p === 'custom') {
        const start = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate(), 0, 0, 0, 0);
        const end = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59, 999);
        return { start, end };
      }
      // year
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    };

    const { start: txStart, end: txEnd } = getPeriodRange(txListPeriod);

    // Filter transactions based on txListPeriod, txListFilterType, txListFilterCategory ONLY
    const filteredTransactions = transactions.filter(tx => {
      const txDate = tx.date?.toDate?.() || new Date(tx.date);
      
      // Filter by date range
      if (txDate < txStart || txDate > txEnd) return false;
      
      // Filter by type
      if (txListFilterType && txListFilterType !== 'all' && tx.type !== txListFilterType) return false;
      
      // Filter by category (normalize to handle diacritics / case and support variations)
      if (txListFilterCategory) {
        const txCat = tx.category || tx.categoryName || tx.categoryId || '';
        if (normalizeCategoryName(txCat) !== normalizeCategoryName(txListFilterCategory)) return false;
      }
      
      return true;
    });

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}><Icon name="receipt" size={16} color="#0F1724" />  Chi tiết giao dịch</Text>
          <Text style={styles.transactionCount}>{filteredTransactions.length} giao dịch</Text>
        </View>

        <FlatList
          data={filteredTransactions}
          keyExtractor={item => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const txColor = mapCategoryToColor(item.category || '');
            return (
            <View style={[styles.transactionItem, styles.transactionItemColoredBase, { backgroundColor: hexToRgba(txColor, 0.04), borderColor: hexToRgba(txColor, 0.12), borderLeftColor: txColor }]}>
              <View style={styles.transactionLeft}>
                <View style={styles.transactionCategoryRow}>
                  <View style={[styles.categoryIconSmall, { backgroundColor: mapCategoryToColor(item.category || '') }]}> 
                    <Icon name={mapCategoryToIcon(item.category || '')} size={14} color="#FFFFFF" />
                  </View>
                  <Text style={styles.transactionCategory}>{(item.category || '').toString().replace(/\p{Extended_Pictographic}/gu, '').trim() || item.category}</Text>
                </View>
                <Text style={styles.transactionDescription}>{item.description}</Text>
                <Text style={styles.transactionDate}>{(item.date?.toDate ? item.date.toDate() : new Date(item.date)).toLocaleDateString('vi-VN')}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  item.type === 'income' ? styles.incomeAmount : styles.expenseAmount,
                ]}
              >
                {item.type === 'income' ? '+' : '-'}
                {formatVND(item.amount)}
            
              </Text>
            </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có giao dịch</Text>
            </View>
          }
        />
      </View>
    );
  };

  const formatShortDate = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={18} color="#0F1724" style={styles.backButton} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}><Icon name="file-chart-outline" size={16} color="#0F1724" />  Báo cáo chi thu</Text>
        <TouchableOpacity 
          style={[styles.exportMainButton, styles.exportMainButtonOutline]}
          onPress={() => setShowExportModal(true)}
        >
          <Icon name="file-export-outline" size={16} color="#0F1724" style={styles.exportIcon} />
          <Text style={styles.exportMainButtonTextSmall}>Xuất</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Summary Cards */}
          {/* Period quick selectors above balance */}
          <View style={[styles.periodSelectorLight]} onLayout={(e) => setTopContainerWidth(e.nativeEvent.layout.width)}>
            {!!topContainerWidth && (
              <Animated.View pointerEvents="none" style={[styles.periodIndicatorLight, { width: (topContainerWidth - 2) / 4, transform: [{ translateX: topIndicator }] }]} />
            )}
            {(['day','week','month','year'] as const).map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.periodButtonFlex, styles.periodButtonLight, styles.periodButtonInSelector, summaryPeriod === p && styles.periodButtonActiveLight]}
                onPress={() => setSummaryPeriod(p)}
              >
                <Text style={[styles.periodButtonTextLight, summaryPeriod === p ? styles.periodButtonTextActiveLightOnBlue : {}]}>
                  {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* New layout: balance top, income/expense below */}
          <View style={styles.balanceTopContainer}>
            <View style={[styles.summaryCard, styles.balanceLarge]}> 
              <Text style={styles.summaryLabel}>Số dư</Text>
              <Text style={styles.balanceAmountText}>{formatVND(displayBalance)}</Text>
            </View>

            <View style={styles.incomeExpenseRow}>
              <View style={[styles.summaryCard, styles.incomeSmallCard]}>
                <Text style={styles.summaryLabel}>Thu nhập</Text>
                  <Text style={[styles.summaryAmountSmall, styles.summaryAmountSmallBlack]} numberOfLines={1} ellipsizeMode="middle"> 
                    {formatVNDShort(displayTotalIncome)}
                  </Text>
              </View>

              <View style={[styles.summaryCard, styles.expenseSmallCard]}>
                <Text style={styles.summaryLabel}>Chi tiêu</Text>
                  <Text style={[styles.summaryAmountSmall, styles.summaryAmountSmallBlack]} numberOfLines={1} ellipsizeMode="middle"> 
                    {formatVNDShort(displayTotalExpense)}
                  </Text>
              </View>
            </View>
          </View>

          {/* Period/Filter UI moved under Detailed Category Report */}

          {/* Category Breakdown removed: to declutter UI above Month Comparison */}

          {/* Month Comparison */}
          {renderMonthComparison()}

          {/* Spending Trend Chart */}
          {renderSpendingTrendChart()}

          {/* Cash Flow Chart */}
          {renderCashFlowChart()}

          {/* Detailed Category Report */}
          {renderDetailedCategoryReport()}

          {/* Period Selection & Filters: 3 dropdowns inline (UI only) */}
          <View style={styles.section}>
            <View style={styles.searchHeaderBox}>
              <Icon name="magnify" size={16} color="#0F1724" />
              <Text style={styles.searchHeaderText}>Tìm kiếm giao dịch chi tiết</Text>
            </View>
            <View style={styles.dropdownRow}>
              {/* Period dropdown */}
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton} onPress={() => { 
                    // Always toggle the dropdown menu; use the 'Tùy chọn' item to edit custom range
                    setShowPeriodDropdown(!showPeriodDropdown); 
                    setShowTypeDropdown(false); 
                    setShowCategoryDropdown(false);
                  }}>
                    <Text style={styles.dropdownButtonText} numberOfLines={1} ellipsizeMode="middle">{txListPeriod === 'all' ? 'Tất cả' : txListPeriod === 'day' ? 'Ngày' : txListPeriod === 'week' ? 'Tuần' : txListPeriod === 'month' ? 'Tháng' : txListPeriod === 'year' ? 'Năm' : `${formatShortDate(customStart)} - ${formatShortDate(customEnd)}`}</Text>
                </TouchableOpacity>
                {showPeriodDropdown && (
                  <View style={styles.dropdownMenu}>
                    {(['all','day','week','month','year','custom'] as const).map(p => (
                      <TouchableOpacity key={p} style={styles.dropdownItem} onPress={() => { setPrevTxListPeriod(txListPeriod); setPrevCustomRange({ start: customStart, end: customEnd }); setTxListPeriod(p); setShowPeriodDropdown(false); if (p === 'custom') { setShowTxDatePicker('start'); } fetchReportData(transactions); }}>
                        <Text style={styles.dropdownItemText}>{p === 'all' ? 'Tất cả' : p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : p === 'year' ? 'Năm' : `${formatShortDate(customStart)} - ${formatShortDate(customEnd)}`}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Type dropdown */}
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton} onPress={() => { setShowTypeDropdown(!showTypeDropdown); setShowPeriodDropdown(false); setShowCategoryDropdown(false); }}>
                  <Text style={styles.dropdownButtonText}>{txListFilterType === 'all' ? 'Tất cả' : txListFilterType === 'income' ? 'Thu nhập' : 'Chi tiêu'}</Text>
                </TouchableOpacity>
                {showTypeDropdown && (
                  <View style={styles.dropdownMenu}>
                    {(['all','income','expense'] as const).map(t => (
                      <TouchableOpacity key={t} style={styles.dropdownItem} onPress={() => { setTxListFilterType(t); setShowTypeDropdown(false); fetchReportData(transactions); }}>
                        <Text style={styles.dropdownItemText}>{t === 'all' ? 'Tất cả' : t === 'income' ? 'Thu nhập' : 'Chi tiêu'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Category dropdown */}
              <View style={styles.dropdownWrapper}>
                <TouchableOpacity style={styles.dropdownButton} onPress={() => { setShowCategoryDropdown(!showCategoryDropdown); setShowTypeDropdown(false); setShowPeriodDropdown(false); }}>
                  <Text style={styles.dropdownButtonText}>{txListFilterCategory || 'Tất cả'}</Text>
                </TouchableOpacity>
                {showCategoryDropdown && (
                  <View style={styles.dropdownMenuLarge}>
                    <ScrollView nestedScrollEnabled style={styles.dropdownMenuScroll}>
                      <TouchableOpacity style={styles.dropdownItem} onPress={() => { setTxListFilterCategory(null); setShowCategoryDropdown(false); fetchReportData(transactions); }}>
                        <Text style={styles.dropdownItemText}>Tất cả</Text>
                      </TouchableOpacity>
                      {visibleCategories.map(cat => (
                        <TouchableOpacity key={cat.name} style={styles.dropdownItem} onPress={() => { setTxListFilterCategory(txListFilterCategory === cat.name ? null : cat.name); setShowCategoryDropdown(false); fetchReportData(transactions); }}>
                          <Text style={styles.dropdownItemText}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Custom Date Range: display only the badge next to the period buttons; inline pickers available when tapping it. */}

          {/* Transaction List */}
          {renderTransactionList()}

          <View style={styles.spacer} />
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
        </Animated.View>
      </ScrollView>

      {/* Date range native pickers for custom period selection */}
      {showTxDatePicker && (
        <DateTimePicker
          value={showTxDatePicker === 'start' ? customStart : customEnd}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
          minimumDate={showTxDatePicker === 'end' ? customStart : undefined}
          maximumDate={showTxDatePicker === 'start' ? customEnd : undefined}
            onChange={(event: any, selected?: Date) => {
            // Android: event.type will be 'dismissed' when the picker is closed
            if (event?.type === 'dismissed') {
              setShowTxDatePicker(null);
              // revert to previous period and custom range
              setTxListPeriod(prevTxListPeriod);
              setCustomStart(prevCustomRange.start);
              setCustomEnd(prevCustomRange.end);
              return;
            }
            if (!selected) return;
            if (showTxDatePicker === 'start') {
              // ensure start is not after end
              setCustomStart(selected);
              if (selected > customEnd) setCustomEnd(selected);
              // automatically open end picker next
              setShowTxDatePicker('end');
              return;
            }
            setCustomEnd(selected);
            if (selected < customStart) setCustomStart(selected);
            setShowTxDatePicker(null);
            // maintain 'custom' period
            setTxListPeriod('custom');
            // Refresh report data for new custom date range
            fetchReportData(transactions);
          }}
        />
      )}

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
                <Icon name="close" size={22} color="rgba(255, 255, 255, 0.4)" />
              </TouchableOpacity>
            </View>

            {/* Report Type Selection */}
            <View style={styles.reportTypeSection}>
              <Text style={styles.sectionModalLabel}>Loại báo cáo</Text>
              <View style={styles.reportTypeOptions}>
                {([
                  { id: 'summary', label: 'Tổng quan', icon: 'chart-bar' },
                  { id: 'detailed', label: 'Chi tiết', icon: 'file-document-outline' },
                  { id: 'budget', label: 'Ngân sách', icon: 'wallet' },
                  { id: 'habits', label: 'Thói quen', icon: 'target' },
                  { id: 'goals', label: 'Mục tiêu', icon: 'rocket-launch' },
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
                    <Icon name={rt.icon} size={26} color={reportType === rt.id ? '#0F1724' : 'rgba(15,23,36,0.6)'} style={styles.reportTypeIcon} />
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
                  { id: 'csv', label: 'CSV File', desc: 'Mở với Excel, Google Sheets', icon: 'file-delimited' },
                  { id: 'json', label: 'JSON File', desc: 'Định dạng JSON tiêu chuẩn', icon: 'file-code' },
                  { id: 'pdf', label: 'PDF Report', desc: 'Tệp PDF chuyên nghiệp', icon: 'file-pdf-box' },
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
                      <Icon name={format.icon} size={24} color={exportFormat === format.id ? '#0F1724' : 'rgba(15,23,36,0.6)'} style={styles.exportOptionIcon} />
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
                  <ActivityIndicator color="#0F1724" size="small" />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Balance + Income/Expense layout
  balanceTopContainer: {
    marginBottom: 16,
  },
  balanceLarge: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(15,23,36,0.06)',
    borderWidth: 1,
  },
  balanceAmountText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  incomeSmallCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  expenseSmallCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  summaryAmountSmall: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryAmountSmallBlack: {
    color: '#111827',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15,23,36,0.06)',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F1724',
    flex: 1,
    textAlign: 'center',
    marginTop: -2,
  },
  exportMainButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exportMainButtonOutline: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(15,23,36,0.06)',
    borderWidth: 1,
  },
  exportIcon: {
    marginRight: 4,
    marginTop: -3,
  },
  exportMainButtonText: {
    color: '#0F1724',
    fontWeight: '700',
    fontSize: 14,
  },
  exportMainButtonTextSmall: {
    color: '#0F1724',
    fontWeight: '700',
    fontSize: 11,
    marginTop: -2,
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
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  searchHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
    marginBottom: 12,
  },
  searchHeaderText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F1724',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transactionCount: {
    fontSize: 12,
    color: 'rgba(15, 23, 36, 0.6)',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
  },
  summaryCardGray: {
    backgroundColor: '#F3F4F6',
    borderColor: 'rgba(15,23,36,0.06)'
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(15, 23, 36, 0.6)',
    marginBottom: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
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
  changePositive: {
    color: '#10B981',
  },
  changeNegative: {
    color: '#EF4444',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  periodButtonsInline: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  topPeriodRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  topPeriodButton: {
    marginRight: 8,
  },
  categoryPeriodRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
    marginBottom: 12,
  },
  periodButtonInlineSpacing: {
    marginRight: 8,
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(15,23,36,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
  },
  periodButtonActive: {
    backgroundColor: 'rgba(15,23,36,0.04)',
    borderColor: 'rgba(15,23,36,0.06)',
  },
  periodButtonText: {
    fontSize: 13,
    color: '#0F1724',
    fontWeight: '700',
  },
  periodButtonTextActive: {
    color: '#0F1724',
    fontWeight: '700',
  },
  // Light variants used for moved filter controls (white bg, black text, black border)
  periodButtonLight: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0F1724',
  },
  periodButtonActiveLight: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  periodButtonTextLight: {
    fontSize: 13,
    color: '#0F1724',
    fontWeight: '700',
    textAlign: 'center',
  },
  periodButtonTextActiveLightOnBlue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  periodButtonFlex: { flex: 1, zIndex: 1, alignItems: 'center', justifyContent: 'center' },
  periodSecondRow: { marginTop: 12, marginBottom: 12, alignItems: 'flex-start', justifyContent: 'flex-start', flexDirection: 'row' },
  periodButtonInSelector: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  periodSelectorLight: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    overflow: 'hidden',
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdownWrapper: {
    flex: 1,
    position: 'relative',
  },
  dropdownButton: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownButtonText: {
    fontSize: 13,
    color: '#0F1724',
    fontWeight: '700',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    borderRadius: 8,
    paddingVertical: 6,
    zIndex: 100,
    elevation: 10,
  },
  dropdownMenuLarge: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    borderRadius: 8,
    paddingVertical: 6,
    zIndex: 100,
    elevation: 12,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownMenuScroll: {
    maxHeight: 200,
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#111827',
  },
  periodIndicatorLight: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 0,
    backgroundColor: '#06B6D4',
    borderRadius: 8,
    zIndex: 0,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1724',
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
    backgroundColor: 'rgba(15,23,36,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(15,23,36,0.04)',
    borderColor: 'rgba(15,23,36,0.06)',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#0F1724',
    fontWeight: '700',
  },
  filterButtonTextActive: {
    color: '#0F1724',
    fontWeight: '700',
  },
  filterButtonLight: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterButtonActiveLight: {
    backgroundColor: '#E6F6EE',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  filterButtonTextLight: {
    fontSize: 13,
    color: '#0F1724',
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
    backgroundColor: 'rgba(15,23,36,0.04)',
    borderColor: 'rgba(15,23,36,0.06)',
  },
  categoryFilterText: {
    fontSize: 12,
    color: '#0F1724',
    fontWeight: '700',
  },
  categoryFilterTextActive: {
    color: '#0F1724',
    fontWeight: '700',
  },
  categoryFilterButtonLight: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  categoryFilterButtonActiveLight: {
    backgroundColor: '#E6F6EE',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  categoryFilterTextLight: {
    fontSize: 12,
    color: '#0F1724',
    fontWeight: '700',
  },
  categoryFilterTextActiveLight: {
    fontSize: 12,
    color: '#0F1724',
    fontWeight: '800',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.15)',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(15,23,36,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
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
    color: '#111827',
    marginBottom: 4,
  },
  transactionDescription: {
    fontSize: 12,
    color: 'rgba(15,23,36,0.6)',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 11,
    color: 'rgba(15,23,36,0.45)',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F1724',
    textAlign: 'right',
    minWidth: 96,
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
    color: 'rgba(15,23,36,0.45)',
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
    borderColor: 'rgba(15,23,36,0.06)',
  },
  exportOptionActive: {
    backgroundColor: 'rgba(15,23,36,0.04)',
    borderColor: 'rgba(15,23,36,0.06)',
  },
  exportOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  exportOptionIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  exportOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F1724',
    marginBottom: 4,
  },
  exportOptionDesc: {
    fontSize: 12,
    color: '#0F1724',
  },
  checkmark: {
    fontSize: 20,
    color: '#0F1724',
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
    borderColor: 'rgba(15,23,36,0.06)',
  },
  cancelButtonText: {
    color: '#0F1724',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#0F1724',
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
    borderColor: 'rgba(15,23,36,0.06)',
    alignItems: 'center',
    minWidth: '30%',
  },
  reportTypeOptionActive: {
    backgroundColor: 'rgba(15,23,36,0.04)',
    borderColor: 'rgba(15,23,36,0.06)',
  },
  reportTypeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  reportTypeLabel: {
    fontSize: 12,
    color: '#0F1724',
    fontWeight: '700',
    textAlign: 'center',
  },
  reportTypeLabelActive: {
    color: '#0F1724',
    fontWeight: '800',
  },
  exportFormatSection: {
    marginBottom: 24,
  },
  chartContainer: {
    marginVertical: 16,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  categoryListContainer: {
    marginTop: 16,
  },
  categoryDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,36,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
  },
  categoryDetailHeaderActive: {
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderColor: 'rgba(16,185,129,0.15)',
  },
  categoryDetailTitle: {
    flex: 1,
  },
  categoryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitleTextContainer: {
    marginLeft: 10,
  },
  categoryDetailName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  categoryDetailCount: {
    fontSize: 12,
    color: 'rgba(15,23,36,0.6)',
    fontWeight: '600',
  },
  categoryDetailRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  categoryDetailAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    minWidth: 96,
    textAlign: 'right',
  },
  categoryDetailChevron: {
    marginLeft: 8,
  },
  categoryTransactionList: {
    backgroundColor: 'rgba(16,185,129,0.04)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.12)',
  },
  categoryTransactionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F1724',
    marginBottom: 12,
  },
  categoryTransactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16,185,129,0.1)',
  },
  transactionItemColoredBase: {
    borderLeftWidth: 6,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 8,
  },
  categoryTransactionLeft: {
    flex: 1,
  },
  transactionCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  categoryTransactionDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  categoryTransactionDate: {
    fontSize: 11,
    color: 'rgba(15,23,36,0.45)',
  },
  categoryTransactionAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F1724',
    marginLeft: 12,
    textAlign: 'right',
    minWidth: 96,
  },
  monthComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthComparisonCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  monthComparisonColNoBorder: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  monthComparisonMonthGreen: {
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,36,0.06)',
  },
  tableCell: {
    // We use absolute separators to maintain continuous vertical borders
    borderRightWidth: 0,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tableCellNoRight: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  monthComparisonMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F1724',
    marginBottom: 4,
  },
  monthComparisonLabel: {
    fontSize: 12,
    color: 'rgba(15, 23, 36, 0.6)',
  },
  monthComparisonItem: {
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 0,
    backgroundColor: 'rgba(15, 23, 36, 0.02)',
  },
  monthComparisonIncomeItem: {
    backgroundColor: 'rgba(16,185,129,0.06)',
    borderColor: 'rgba(16,185,129,0.12)',
  },
  monthComparisonExpenseItem: {
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderColor: 'rgba(239,68,68,0.12)',
  },
  monthComparisonBalanceItem: {
    backgroundColor: 'rgba(6,182,212,0.06)',
    borderColor: 'rgba(6,182,212,0.12)',
  },
  monthComparisonItemHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  monthComparisonItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F1724',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  monthComparisonValue: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthComparisonChange: {
    fontSize: 12,
    fontWeight: '700',
  },
  cashFlowLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
    paddingVertical: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 12,
    color: '#0F1724',
    fontWeight: '600',
  },
  legendColorIncome: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  legendColorExpense: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  legendColorNet: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#1F2937',
  },
  // Chart Legend Styles
  sectionCaption: {
    marginBottom: 8,
  },
  sectionCaptionText: {
    fontSize: 12,
    color: 'rgba(15,23,36,0.6)',
    marginBottom: 6,
  },
  categoryPercentage: {
    fontSize: 12,
    color: 'rgba(15,23,36,0.6)',
    marginBottom: 6,
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 12,
    paddingVertical: 8,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartLegendColorIncome: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  chartLegendColorExpense: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  chartLegendLabel: {
    fontSize: 12,
    color: '#0F1724',
    fontWeight: '600',
  },
  monthComparisonSmallValue: {
    fontSize: 13,
    color: 'rgba(15,23,36,0.7)',
    fontWeight: '700',
    textAlign: 'center',
  },
  monthComparisonSmallValueCurrent: {
    fontSize: 13,
    color: '#0F1724',
    fontWeight: '800',
    textAlign: 'center',
  },
  monthComparisonSmallValuePrevious: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  monthComparisonRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colFlex1: {
    flex: 1,
  },
  colFlexMoney: {
    flex: 1.6,
  },
  colFlexPercent: {
    flex: 0.6,
  },
  monthComparisonRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthComparisonRightSpacing: {
    marginLeft: 8,
  },
  chartWrapper: {
    position: 'relative',
  },
  chartTooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(15,23,36,0.94)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    zIndex: 999,
  },
  chartTooltipText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chartTooltipValue: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 2,
  },
  // Small summary cards for cashflow
  cashSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  smallSummaryCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.04)'
  },
  summaryLabelSmall: {
    fontSize: 11,
    color: 'rgba(15,23,36,0.7)',
    marginBottom: 6,
    fontWeight: '700'
  },
  chartScaleNote: {
    fontSize: 11,
    color: 'rgba(15,23,36,0.6)',
    marginTop: 6,
    marginLeft: 6,
    alignSelf: 'stretch',
    textAlign: 'left',
  },
  // Custom date range UI
  customRangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    marginBottom: 12,
  },
  customDateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    alignItems: 'center',
  },
  customDateLabel: {
    fontSize: 12,
    color: 'rgba(15,23,36,0.6)',
    fontWeight: '700',
    marginBottom: 6,
  },
  customDateValue: {
    fontSize: 13,
    color: '#0F1724',
    fontWeight: '800',
  },
  customRangeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
  },
  customBadgeContainer: {
    marginTop: 6,
  },
  customRangeBadgeAlignLeft: {
    alignSelf: 'flex-start',
  },
  customRangeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartNoteContainer: {
    marginTop: 6,
  },
  chartNote: {
    fontSize: 12,
    color: 'rgba(15,23,36,0.6)',
    marginTop: 2,
  },
  emptyChart: {
    padding: 24,
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  monthButtonGreen: {
    alignItems: 'center',
  },
  monthButtonTextWhite: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  monthButtonSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 2,
  },
  monthHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  monthHeaderFrame: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 0,
    backgroundColor: '#FFFFFF',
  },
  monthHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  monthHeaderDivider: {
    borderRightWidth: 0,
    borderRightColor: 'transparent',
  },
  monthHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  monthHeaderTitleCurrent: {
    color: '#0F1724',
    fontWeight: '800',
  },
  monthHeaderTitlePrevious: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  monthHeaderSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  percentBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  percentBadgePositive: {
    backgroundColor: 'rgba(16,185,129,0.12)',
  },
  percentBadgeNegative: {
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  percentBadgeNeutral: {
    backgroundColor: 'rgba(15,23,36,0.06)',
  },
  percentBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  percentBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  tableToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    marginTop: 6,
  },
  tableToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F1724',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15,23,36,0.06)',
    marginTop: 10,
    overflow: 'hidden',
  },
  monthTable: {
    position: 'relative',
  },
  verticalSeparator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#E5E7EB',
    zIndex: 2,
    elevation: 0,
    opacity: 1,
  },
  tableToggleWrapper: {
    marginTop: 8,
  },
  tableToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableHeaderRowSmall: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15,23,36,0.02)',
  },
  tableRowSmall: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(15,23,36,0.04)',
  },
  tableCellSmall: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(15,23,36,0.06)',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F1724',
  },
  tableMetricText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1724',
  },
  tableValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1724',
  },
  periodButtonTextActiveLight: {
    color: '#0F1724',
    fontWeight: '700',
  },
  filterButtonTextActiveLight: {
    fontSize: 13,
    color: '#0F1724',
    fontWeight: '700',
  },
  
});
