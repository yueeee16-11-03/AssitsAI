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
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useTransactionStore } from "../../store/transactionStore";
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
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  // ✅ Subscribe to Store - transactions từ Store
  const transactions = useTransactionStore((state) => state.transactions);

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
      )}đ)?`,
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
    transactions
  ) as Record<string, Transaction[]>;
  const dateKeys: string[] = Object.keys(groupedTransactions).sort((a, b) => {
    // Sắp xếp từ mới nhất (sau) đến cũ nhất (trước)
    const dateA = new Date(a).getTime();
    const dateB = new Date(b).getTime();
    return dateB - dateA; // Giảm dần (mới nhất ở trên)
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
    const categoryEmoji = TransactionHistoryService.getCategoryEmoji(item.categoryId);
    const hasImage = !!item.billImageUri;
    const displayTitle = item.description || item.category;

    const date = new Date(item.date?.toDate?.() || item.createdAt?.toDate?.());
    const timeStr = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateStr = date.toLocaleDateString("vi-VN");

    console.log(`🎫 Item: ${displayTitle}, hasImage: ${hasImage}, type: ${item.type}, amount: ${item.amount}`);

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
            <Text style={styles.bankIconEmoji}>{categoryEmoji}</Text>
          )}
        </View>
        
        {/* Thông tin giữa */}
        <View style={styles.bankInfoContainer}>
          <Text style={styles.bankItemTitle} numberOfLines={1}>
            {displayTitle}
          </Text>
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
            {isExpense ? "-" : "+"} ₫{Math.abs(item.amount).toLocaleString("vi-VN")}
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
    
    // ✅ Sắp xếp giao dịch từ mới nhất đến cũ nhất trong ngày
    dayTransactions = dayTransactions.sort((a: Transaction, b: Transaction) => {
      const timeA = new Date(a.date?.toDate?.() || a.createdAt?.toDate?.()).getTime();
      const timeB = new Date(b.date?.toDate?.() || b.createdAt?.toDate?.()).getTime();
      return timeB - timeA; // Giảm dần
    });

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
                <Text style={styles.summaryLabel}>💸 Chi</Text>
                <Text style={styles.summaryAmount}>
                  ₫
                  {dayTransactions
                    .filter((t: Transaction) => t.type === "expense")
                    .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
                    .toLocaleString("vi-VN")}
                </Text>
              </View>
            )}
            {dayTransactions.some((t: Transaction) => t.type === "income") && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>💰 Thu</Text>
                <Text style={[styles.summaryAmount, styles.summaryAmountIncome]}>
                  ₫
                  {dayTransactions
                    .filter((t: Transaction) => t.type === "income")
                    .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0)
                    .toLocaleString("vi-VN")}
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ghi chú</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* Loading (Giữ nguyên) */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
        
      /* Empty State (Giữ nguyên) */
      ) : transactions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
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
        <FlatList
          data={dateKeys}
          renderItem={renderDateSection}
          keyExtractor={(item) => item}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E0F2F1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
    backgroundColor: "#E0F2F1",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(76,175,80,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#1F2937" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  placeholderButton: { width: 40, height: 40 },

  /* Center Container (Loading/Empty) */
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2F1",
  },
  loadingText: {
    color: "#00796B",
    marginTop: 12,
    fontSize: 14,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#00897B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  /* List Layout */
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 12,
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
    fontSize: 16,
    fontWeight: "800",
    color: "#00796B",
    marginBottom: 4,
  },
  dateSubText: {
    fontSize: 12,
    color: "#00796B",
    fontWeight: "600",
    opacity: 0.7,
  },

  /* Daily Summary */
  dailySummary: {
    gap: 12,
    alignItems: "flex-end",
  },
  summaryItem: {
    alignItems: "flex-end",
  },
  summaryLabel: {
    fontSize: 11,
    color: "#00796B",
    fontWeight: "600",
    marginBottom: 2,
  },
  summaryAmount: {
    fontSize: 13,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#B2DFDB",
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
    backgroundColor: "#FFEBEE", // Red light
  },
  bankIconIncome: {
    backgroundColor: "#E0F2F1", // Teal light
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
  bankItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  bankItemDateTime: {
    fontSize: 12,
    fontWeight: "500",
    color: "#00796B",
  },
  
  /* 🎨 [NEW] Amount Container - Bên phải (Số tiền) */
  bankAmountContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  bankItemAmount: {
    fontSize: 16,
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
    gap: 2,
  },

  /* Floating Button (Giữ nguyên) */
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#00897B",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 32,
  },


});