/**
 * Màn hình Lịch sử Giao dịch (Ghi chú)
 *
 * UI được refactor thành dạng List (Danh sách) thay vì Grid (Lưới).
 * - Đã xóa Dimensions import không dùng.
 * - Đã xóa imageOverlay gây mờ ảnh.
 * - Đã thay nút Xóa bằng onLongPress (nhấn giữ để xóa).
 * - Toàn bộ logic với Zustand store (fetch, delete, update) được giữ nguyên.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Image,
  // Dimensions đã được xóa khỏi đây vì không còn dùng
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useTransactionStore } from "../../store/transactionStore";
import { useRecurringTransactionStore } from "../../store/recurringTransactionStore";
import TransactionHistoryService from "../../services/TransactionHistoryService";

type Props = NativeStackScreenProps<RootStackParamList, "TransactionHistory">;

interface Transaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  description: string;
  category: string;
  categoryId: string;
  date?: any;
  time?: string;
  createdAt?: any;
  billImageUri?: string | null;
}

interface TransactionWithTitle extends Transaction {
  displayTitle: string;
  hasImage: boolean;
}

export default function TransactionHistoryScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const theme = useTheme();
  const styles = getStyles(theme);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // ✅ Subscribe to Store - transactions từ Store
  const transactions = useTransactionStore((state) => state.transactions);

  // ⭐ RECURRING: Subscribe to recurring transaction store
  const recurringTransactions = useRecurringTransactionStore((state: any) => state.recurringTransactions);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadTransactions();
  }, [fadeAnim]);

  // ✅ useFocusEffect để fetch fresh data khi quay lại screen
  useFocusEffect(
    React.useCallback(() => {
      console.log("📄 [HISTORY-SCREEN] Screen focused - fetching fresh transactions");
      loadTransactions();
    }, [])
  );

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      console.log("📄 [HISTORY-SCREEN] Loading transactions from Store");
      // ✅ Gọi Store để fetch fresh data từ Firebase
      await useTransactionStore.getState().fetchTransactions();
      console.log("✅ [HISTORY-SCREEN] Transactions loaded from Store");
      
      // ⭐ Also fetch recurring transactions
      console.log("📄 [HISTORY-SCREEN] Loading recurring transactions from Store");
      await (useRecurringTransactionStore.getState() as any).fetchRecurringTransactions();
      console.log("✅ [HISTORY-SCREEN] Recurring transactions loaded from Store");
    } catch (error) {
      console.error("❌ [HISTORY-SCREEN] Error loading transactions:", error);
      Alert.alert("Lỗi", "Không thể tải lịch sử giao dịch");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log("🔄 [HISTORY-SCREEN] Refreshing transactions");
      // ✅ Pull-to-refresh - fetch fresh data từ Store
      await useTransactionStore.getState().fetchTransactions();
      console.log("✅ [HISTORY-SCREEN] Transactions refreshed");
      
      // ⭐ Also refresh recurring transactions
      console.log("🔄 [HISTORY-SCREEN] Refreshing recurring transactions");
      await (useRecurringTransactionStore.getState() as any).fetchRecurringTransactions();
      console.log("✅ [HISTORY-SCREEN] Recurring transactions refreshed");
    } catch (error) {
      console.error("❌ [HISTORY-SCREEN] Error refreshing transactions:", error);
      Alert.alert("Lỗi", "Không thể làm mới danh sách");
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditTitle = (transaction: TransactionWithTitle) => {
    // Navigate to EditTransaction screen
    navigation.navigate("EditTransaction" as any, { transaction });
  };



  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa giao dịch "${transaction.description}" (${transaction.amount.toLocaleString(
        "vi-VN"
      )} VNĐ)?`,
      [
        {
          text: "Hủy",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              console.log("🗑️ [HISTORY-SCREEN] Starting delete for:", transaction.id);
              console.log("🗑️ [HISTORY-SCREEN] Deleting from Store...");
              // ✅ Xóa từ Store
              await useTransactionStore.getState().deleteTransaction(transaction.id);
              
              console.log("✅ [HISTORY-SCREEN] Delete successful");
              Alert.alert("Thành công", "Đã xóa giao dịch");
            } catch (error) {
              console.error("❌ [HISTORY-SCREEN] Error deleting transaction:", error);
              Alert.alert("Lỗi", "Không thể xóa giao dịch");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const groupedTransactions = TransactionHistoryService.groupTransactionsByDate(
    // ⭐ COMBINE: Merge regular transactions with recurring transactions
    // Convert recurring transactions to match transaction format (use nextDue as date)
    [
      ...(transactions || []),
      ...(recurringTransactions || []).map((rt: any) => ({
        ...rt,
        date: rt.nextDue, // Use nextDue as the date for sorting/grouping
        isRecurring: true, // Mark as recurring for visual distinction
      })),
    ]
  ) as Record<string, Transaction[]>;
  
  // 🎯 Tính tổng thu nhập, chi tiêu, balance từ tất cả transactions ⭐ NOW INCLUDING RECURRING
  const allTransactions = [
    ...(transactions || []),
    ...(recurringTransactions || []).map((rt: any) => ({
      ...rt,
      isRecurring: true,
    })),
  ];

  const totalIncome = allTransactions
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  
  const totalExpense = allTransactions
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
  
  const balance = totalIncome - totalExpense;
  const savingRate = totalIncome > 0 
    ? (((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)
    : '0.0';

  console.log(`📊 [HISTORY-CALC] ⭐ Total with RECURRING: Income=${totalIncome}, Expense=${totalExpense}, Balance=${balance}, SavingRate=${savingRate}%`);
  
  // 🔧 SỬA LỖI 1: Sắp xếp dateKeys + LOGGING CHI TIẾT
  const dateKeys: string[] = Object.keys(groupedTransactions).sort((a, b) => {
    const transactionsA = groupedTransactions[a] || [];
    const transactionsB = groupedTransactions[b] || [];
    
    if (transactionsA.length === 0 || transactionsB.length === 0) return 0;
    
    // 🔍 DEBUG: Lấy raw date objects
    const rawDateA = transactionsA[0].date || transactionsA[0].createdAt;
    const rawDateB = transactionsB[0].date || transactionsB[0].createdAt;
    
    console.log(`🔍 [DATEKEYS] Key A: "${a}", type:`, typeof rawDateA, rawDateA);
    console.log(`🔍 [DATEKEYS] Key B: "${b}", type:`, typeof rawDateB, rawDateB);
    
    // ✅ Xử lý an toàn: Thử .toDate() trước, nếu không thì new Date()
    let dateA = 0;
    let dateB = 0;
    
    try {
      if (rawDateA && typeof rawDateA.toDate === 'function') {
        dateA = rawDateA.toDate().getTime();
        console.log(`✅ [DATEKEYS] A used .toDate(): ${dateA}`);
      } else if (rawDateA) {
        dateA = new Date(rawDateA).getTime();
        console.log(`✅ [DATEKEYS] A used new Date(): ${dateA}`);
      }
    } catch (e) {
      console.warn(`⚠️ [DATEKEYS] Failed to parse A:`, e);
      dateA = new Date().getTime();
    }
    
    try {
      if (rawDateB && typeof rawDateB.toDate === 'function') {
        dateB = rawDateB.toDate().getTime();
        console.log(`✅ [DATEKEYS] B used .toDate(): ${dateB}`);
      } else if (rawDateB) {
        dateB = new Date(rawDateB).getTime();
        console.log(`✅ [DATEKEYS] B used new Date(): ${dateB}`);
      }
    } catch (e) {
      console.warn(`⚠️ [DATEKEYS] Failed to parse B:`, e);
      dateB = new Date().getTime();
    }
    
    if (isNaN(dateA) || isNaN(dateB)) {
      console.warn(`⚠️ [DATEKEYS] NaN detected! A: ${dateA}, B: ${dateB}`);
      return 0;
    }
    
    return dateB - dateA; // Mới nhất ở trên
  });

  console.log("📋 Total transactions:", transactions.length);
  console.log("📋 Date keys (sorted):", dateKeys);
  console.log("📋 First date transactions:", dateKeys.length > 0 ? groupedTransactions[dateKeys[0]]?.length : 0);

  /**
   * 🎨 [BANKING UI REDESIGN]
   * Render item dưới dạng List giống ngân hàng - Sáng, tinh tế, chuyên nghiệp
   */
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isExpense = item.type === "expense";
    const hasImage = !!item.billImageUri;
    const getCategoryIcon = (categoryId: string) => {
      const map: Record<string, { name: string; color: string }> = {
        "1": { name: "food", color: "#EF4444" },
        "2": { name: "car", color: "#F97316" },
        "3": { name: "shopping", color: "#EC4899" },
        "4": { name: "gamepad-variant", color: "#8B5CF6" },
        "5": { name: "hospital-box", color: "#EF4444" },
        "6": { name: "book", color: "#3B82F6" },
        "7": { name: "home", color: "#10B981" },
        "8": { name: "dots-horizontal", color: "#6B7280" },
        "9": { name: "briefcase", color: "#10B981" },
        "10": { name: "gift", color: "#F59E0B" },
        "11": { name: "chart-line", color: "#10B981" },
        "12": { name: "cash", color: "#6366F1" },
      };
      return map[categoryId] || { name: 'wallet', color: '#6B7280' };
    };
    const categoryIcon = getCategoryIcon(item.categoryId);
    // Display transaction name if recurring, otherwise description or category
    const displayTitle = (item as any).isRecurring && (item as any).name 
      ? (item as any).name 
      : item.description || item.category;

    // 🔧 FIX: Xử lý Firebase Timestamp + LOGGING CHI TIẾT
    let date: Date;
    try {
      console.log(`🎫 [ITEM-${item.id}] Parsing date...`);
      console.log(`  - item.date:`, item.date, `(type: ${typeof item.date})`);
      console.log(`  - item.createdAt:`, item.createdAt, `(type: ${typeof item.createdAt})`);
      
      // Priority 1: item.date.toDate()
      if (item.date && typeof item.date.toDate === 'function') {
        try {
          date = item.date.toDate();
          console.log(`✅ [ITEM-${item.id}] Used item.date.toDate():`, date);
        } catch (e) {
          console.warn(`⚠️ [ITEM-${item.id}] item.date.toDate() failed:`, e);
          throw e;
        }
      }
      // Priority 2: item.createdAt.toDate()
      else if (item.createdAt && typeof item.createdAt.toDate === 'function') {
        try {
          date = item.createdAt.toDate();
          console.log(`✅ [ITEM-${item.id}] Used item.createdAt.toDate():`, date);
        } catch (e) {
          console.warn(`⚠️ [ITEM-${item.id}] item.createdAt.toDate() failed:`, e);
          throw e;
        }
      }
      // Priority 3: Parse string
      else if (typeof item.date === 'string') {
        date = new Date(item.date);
        console.log(`✅ [ITEM-${item.id}] Parsed item.date as string:`, date);
      }
      else if (typeof item.createdAt === 'string') {
        date = new Date(item.createdAt);
        console.log(`✅ [ITEM-${item.id}] Parsed item.createdAt as string:`, date);
      }
      // Fallback
      else {
        console.warn(`⚠️ [ITEM-${item.id}] No valid date found, using today`);
        date = new Date();
      }
      
      // Final check
      if (isNaN(date.getTime())) {
        console.warn(`⚠️ [ITEM-${item.id}] Date is Invalid! Resetting to today`);
        date = new Date();
      }
      
      console.log(`✅ [ITEM-${item.id}] Final date: ${date.toISOString()}`);
    } catch (error) {
      console.error(`❌ [ITEM-${item.id}] Critical error:`, error);
      date = new Date();
    }

    const timeStr = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString("vi-VN");

    console.log(`🎫 [RENDER-${item.id}] ${displayTitle} => ${timeStr} • ${dateStr} (${item.type}) ${item.amount} VNĐ`);

    return (
      <TouchableOpacity
        style={styles.bankListItem}
        activeOpacity={0.6}
        onPress={() => handleEditTitle({ ...item, displayTitle, hasImage } as TransactionWithTitle)}
        onLongPress={() => handleDelete(item)}
      >
        {/* Icon Container (Bên trái - Tròn sáng) */}
        <View style={[styles.bankIconBox, isExpense ? styles.bankIconExpense : styles.bankIconIncome]}>
          {hasImage && item.billImageUri ? (
            <Image
              source={{ uri: item.billImageUri }}
              style={styles.bankIconImage}
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons name={categoryIcon.name} size={28} color={categoryIcon.color} />
          )}
        </View>
        
        {/* Thông tin giữa */}
        <View style={styles.bankInfoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.bankItemTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
            {/* ⭐ RECURRING BADGE */}
            {(item as any).isRecurring && (
              <View style={styles.recurringBadge}>
                <MaterialCommunityIcons name="repeat" size={10} color={theme.colors.primary} style={styles.recurringBadgeIcon} />
                <Text style={styles.recurringBadgeText}>Lặp lại</Text>
              </View>
            )}
          </View>
          <Text style={styles.bankItemDateTime}>
            {timeStr} • {dateStr}
          </Text>
        </View>

        {/* Số tiền bên phải */}
        <View style={styles.bankAmountContainer}>
          <Text
            style={[
              styles.bankItemAmount,
              isExpense ? styles.bankAmountExpense : styles.bankAmountIncome,
            ]}
            numberOfLines={1}
          >
            {isExpense ? "-" : "+"} {Math.abs(item.amount || 0).toLocaleString("vi-VN")} VNĐ
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * 🎨 [UI REFACTOR]
   * Render Header (Hôm nay...) và List (Danh sách)
   */
  const renderDateSection = ({ item: dateKey }: { item: string }) => {
    let dayTransactions = groupedTransactions[dateKey] || [];
    
    // 🔧 SỬA LỖI 2: Sắp xếp giao dịch trong ngày + LOGGING CHI TIẾT
    console.log(`📅 [DAYTX-SORT] Sorting ${dayTransactions.length} transactions for "${dateKey}"...`);
    
    dayTransactions = dayTransactions.sort((a: Transaction, b: Transaction) => {
      // 🔍 DEBUG: Lấy raw date objects
      const rawDateA = a.date || a.createdAt;
      const rawDateB = b.date || b.createdAt;
      
      let timeA = 0;
      let timeB = 0;
      
      try {
        if (rawDateA && typeof rawDateA.toDate === 'function') {
          timeA = rawDateA.toDate().getTime();
          console.log(`  ✅ A (${a.description}): ${timeA}`);
        } else if (rawDateA) {
          timeA = new Date(rawDateA).getTime();
          console.log(`  ✅ A (${a.description}): ${timeA} [from new Date]`);
        }
      } catch (e) {
        console.warn(`  ⚠️ A failed:`, e);
        timeA = new Date().getTime();
      }
      
      try {
        if (rawDateB && typeof rawDateB.toDate === 'function') {
          timeB = rawDateB.toDate().getTime();
          console.log(`  ✅ B (${b.description}): ${timeB}`);
        } else if (rawDateB) {
          timeB = new Date(rawDateB).getTime();
          console.log(`  ✅ B (${b.description}): ${timeB} [from new Date]`);
        }
      } catch (e) {
        console.warn(`  ⚠️ B failed:`, e);
        timeB = new Date().getTime();
      }
      
      if (isNaN(timeA) || isNaN(timeB)) {
        console.warn(`  ⚠️ NaN! A: ${timeA}, B: ${timeB}`);
        return 0;
      }
      
      return timeB - timeA;
    });
    
    console.log(`✅ [DAYTX-SORT] Done sorting`);

    return (
      <View style={styles.dateSection}>
        {/* Date Header (Giữ nguyên, rất tốt) */}
        <View style={styles.dateHeader}>
          <View>
            <Text style={styles.dateText}>{dateKey}</Text>
            <Text style={styles.dateSubText}>{dayTransactions.length} giao dịch</Text>
          </View>

          {/* Daily Summary (Giữ nguyên, rất tốt) */}
          <View style={styles.dailySummary}>
            {dayTransactions.some((t: Transaction) => t.type === "expense") && (
              <View style={styles.summaryItem}>
                <View style={styles.summaryRow}>
                  <MaterialCommunityIcons name="cash-minus" size={14} color="#DC2626" style={styles.summaryIconMargin} />
                  <Text style={styles.summaryLabel}>Chi</Text>
                </View>
                <Text style={styles.summaryAmount}>
                  {dayTransactions
                    .filter((t: Transaction) => t.type === "expense")
                    .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
                    .toLocaleString("vi-VN")} VNĐ
                </Text>
              </View>
            )}
            {dayTransactions.some((t: Transaction) => t.type === "income") && (
              <View style={styles.summaryItem}>
                <View style={styles.summaryRow}>
                  <MaterialCommunityIcons name="cash-plus" size={14} color="#00897B" style={styles.summaryIconMargin} />
                  <Text style={styles.summaryLabel}>Thu</Text>
                </View>
                <Text style={[styles.summaryAmount, styles.summaryAmountIncome]}>
                  {dayTransactions
                    .filter((t: Transaction) => t.type === "income")
                    .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
                    .toLocaleString("vi-VN")} VNĐ
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 🎨 [UI REFACTOR] Bỏ Grid, thay bằng List container */}
        <View style={styles.listContainer}>
          {dayTransactions.map((transaction: Transaction, index: number) => (
            <View key={`${dateKey}-${index}-${transaction.id}`}>
              {renderTransactionItem({ item: transaction })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header (Giữ nguyên) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* Loading (Giữ nguyên) */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
        
      /* Empty State (Giữ nguyên) */
      ) : transactions.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="tray" size={64} color="#9CA3AF" style={styles.emptyIcon} />
          <Text style={styles.emptyText}>Chưa có ghi chú nào</Text>
          <Text style={styles.emptySubText}>Hãy thêm ghi chú mới để bắt đầu</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddTransaction" as any)}
          >
            <Text style={styles.addButtonText}>+ Thêm ghi chú</Text>
          </TouchableOpacity>
        </View>
        
      /* FlatList (Giữ nguyên) */
      ) : (
        <View style={styles.fullContainer}>
          {/* Transaction List */}
          <FlatList
            data={dateKeys}
            renderItem={renderDateSection}
            keyExtractor={(item) => item}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            scrollEnabled={true}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(120, insets.bottom + TAB_BAR_HEIGHT) }]}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}

      {/* Floating Add Button (Giữ nguyên) */}
      {transactions.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate("AddTransaction" as any)}
        >
          <Text style={styles.floatingButtonText}>+</Text>
        </TouchableOpacity>
      )}


    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getStyles(theme: any) {
  const { surface, onSurface, onSurfaceVariant, outline, primary } = theme.colors;
  
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: surface },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 4,
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: outline,
      backgroundColor: surface,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    backIcon: { fontSize: 18, color: onSurface },
    headerTitle: { fontSize: 18, fontWeight: "800", color: onSurface },
    placeholderButton: { width: 40, height: 40 },

    /* Center Container (Loading/Empty) */
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: surface,
    },
    loadingText: {
      color: onSurface,
      marginTop: 12,
      fontSize: 13,
    },
    emptyIcon: { fontSize: 64, marginBottom: 16, color: onSurfaceVariant },
    emptyText: {
      fontSize: 16,
      fontWeight: "700",
      color: onSurface,
      marginBottom: 8,
    },
    emptySubText: {
      fontSize: 12,
      color: onSurfaceVariant,
      marginBottom: 24,
    },
    addButton: {
      backgroundColor: primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    addButtonText: { color: surface, fontWeight: "700", fontSize: 13 },

    /* List Layout */
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 120,
      paddingTop: 10,
    },

    /* Date Section */
    dateSection: {
      marginBottom: 24,
    },
    dateHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    dateText: {
      fontSize: 15,
      fontWeight: "800",
      color: onSurface,
      marginBottom: 4,
    },
    dateSubText: {
      fontSize: 11,
      color: onSurface,
      fontWeight: "600",
      opacity: 0.85,
    },

    /* Daily Summary */
    dailySummary: {
      alignItems: "flex-end",
    },
    summaryItem: {
      alignItems: "flex-end",
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    summaryIconMargin: {
      marginRight: 8,
    },
    summaryLabel: {
      fontSize: 10,
      color: onSurface,
      fontWeight: "600",
      marginBottom: 2,
    },
    summaryAmount: {
      fontSize: 12,
      fontWeight: "800",
      color: "#DC2626", // Red
    },
    summaryAmountIncome: {
      color: "#00897B", // Teal
    },

    /* 🎨 [NEW] List Item kiểu NGÂN HÀNG - Sáng, tinh tế */
    bankListItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: surface,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: outline,
      shadowColor: "rgba(0,150,136,0.1)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    
    /* 🎨 [NEW] Icon Box - Tròn, sáng, theo loại giao dịch */
    bankIconBox: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
      overflow: "hidden",
    },
    bankIconExpense: {
      backgroundColor: "#FFF0F0", // light red (expense)
    },
    bankIconIncome: {
      backgroundColor: "#E6F9EE", // light green (income)
    },
    bankIconImage: {
      width: "100%",
      height: "100%",
    },
    bankIconEmoji: {
      fontSize: 28,
    },
    
    /* 🎨 [NEW] Info Container - Giữa (Tiêu đề + Ngày giờ) */
    bankInfoContainer: {
      flex: 1,
      justifyContent: "center",
      paddingRight: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    recurringBadgeIcon: {
      marginRight: 6,
    },
    bankItemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: onSurface,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    bankItemDateTime: {
      fontSize: 11,
      fontWeight: "500",
      color: onSurface,
    },

    /* ⭐ [NEW] Recurring Badge */
    recurringBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 6,
    },
    recurringBadgeText: {
      fontSize: 9,
      fontWeight: '600',
      color: '#6366F1',
    },
    
    /* 🎨 [NEW] Amount Container - Bên phải (Số tiền) */
    bankAmountContainer: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
    bankItemAmount: {
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    bankAmountExpense: {
      color: "#DC2626",
    },
    bankAmountIncome: {
      color: "#00897B",
    },

    /* 🎨 [NEW] List Container */
    listContainer: {
    },

    /* Floating Button (Giữ nguyên) */
    floatingButton: {
      position: "absolute",
      bottom: 24,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: primary,
      alignItems: "center",
      justifyContent: "center",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    floatingButtonText: {
      color: "#fff",
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 28,
    },

    /* 🎨 [NEW] Summary Stats Header */
    fullContainer: {
      flex: 1,
    },
    summaryStatsHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: `${onSurface}08`,
      borderBottomWidth: 1,
      borderBottomColor: `${onSurface}14`,
    },
    statBox: {
      flex: 1,
      minWidth: "48%",
      backgroundColor: surface,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: outline,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: onSurfaceVariant,
      marginBottom: 6,
    },
    statValue: {
      fontSize: 13,
      fontWeight: "800",
      color: onSurface,
    },
    statValueIncome: {
      fontSize: 13,
      fontWeight: "800",
      color: "#10B981",
    },
    statValueExpense: {
      fontSize: 13,
      fontWeight: "800",
      color: "#EF4444",
    },
    statValuePercent: {
      fontSize: 13,
      fontWeight: "800",
      color: "#F59E0B",
    },
    statValueGreen: {
      color: "#10B981",
    },
    statValueRed: {
      color: "#EF4444",
    },
  });
}