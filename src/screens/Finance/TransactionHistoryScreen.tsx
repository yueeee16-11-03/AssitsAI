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
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import transactionApi from "../../api/transactionApi";
import { useTransactionStore } from "../../store/transactionStore";

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
}

export default function TransactionHistoryScreen({ navigation, route }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const { newTransaction } = route.params || {};

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    loadTransactions();
  }, [fadeAnim]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await transactionApi.getTransactions();
      setTransactions(data as Transaction[]);
    } catch (error) {
      console.error("Error loading transactions:", error);
      Alert.alert("Lỗi", "Không thể tải lịch sử giao dịch");
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await transactionApi.getTransactions();
      setTransactions(data as Transaction[]);
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    navigation.push("EditTransaction", { transaction });
  };

  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa giao dịch "${transaction.description}" (${transaction.amount.toLocaleString("vi-VN")}đ)?`,
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
              await transactionApi.deleteTransaction(transaction.id);
              await useTransactionStore.getState().deleteTransaction(transaction.id);
              setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));
              Alert.alert("Thành công", "Đã xóa giao dịch");
            } catch (error) {
              console.error("Error deleting transaction:", error);
              Alert.alert("Lỗi", "Không thể xóa giao dịch");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const formatDate = (dateObj: any) => {
    try {
      const date = dateObj?.toDate?.() || new Date(dateObj);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Hôm nay";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Hôm qua";
      } else {
        return date.toLocaleDateString("vi-VN");
      }
    } catch {
      return "Không xác định";
    }
  };

  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: Transaction[] } = {};

    transactions.forEach((transaction) => {
      const date = transaction.date || transaction.createdAt;
      const dateKey = formatDate(date);

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate();
  const dateKeys = Object.keys(groupedTransactions);

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isExpense = item.type === "expense";
    const categoryEmoji = getCategoryEmoji(item.categoryId);

    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity
          style={styles.transactionItem}
          onLongPress={() => handleEdit(item)}
          activeOpacity={0.7}
        >
          <View style={styles.transactionLeft}>
            <Text style={styles.transactionEmoji}>{categoryEmoji}</Text>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionCategory}>{item.category}</Text>
              <Text style={styles.transactionDescription}>{item.description}</Text>
              <Text style={styles.transactionTime}>
                {item.time || formatDate(item.date || item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.transactionRight}>
            <Text
              style={[
                styles.transactionAmount,
                isExpense
                  ? styles.transactionAmountExpense
                  : styles.transactionAmountIncome,
              ]}
            >
              {isExpense ? "-" : "+"} ₫ {Math.abs(item.amount).toLocaleString("vi-VN")}
            </Text>
            <TouchableOpacity
              style={styles.deleteIconButton}
              onPress={() => handleDelete(item)}
            >
              <Text style={styles.deleteIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const getCategoryEmoji = (categoryId: string) => {
    const emojiMap: { [key: string]: string } = {
      "1": "🍔", // Ăn uống
      "2": "🚗", // Di chuyển
      "3": "🛍️", // Mua sắm
      "4": "🎮", // Giải trí
      "5": "💊", // Sức khỏe
      "6": "📚", // Giáo dục
      "7": "🏠", // Nhà cửa
      "8": "📦", // Khác (expense)
      "9": "💼", // Lương
      "10": "🎁", // Thưởng
      "11": "📈", // Đầu tư
      "12": "💰", // Khác (income)
    };
    return emojiMap[categoryId] || "💳";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        <View style={styles.placeholderButton} />
      </View>

      {/* New Transaction Highlight */}
      {newTransaction && (
        <Animated.View
          style={[
            styles.newTransactionBanner,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.newTransactionIcon}>✨</Text>
          <View style={styles.newTransactionInfo}>
            <Text style={styles.newTransactionLabel}>Giao dịch mới được lưu</Text>
            <Text style={styles.newTransactionDetails}>
              {newTransaction.description} • ₫{newTransaction.amount.toLocaleString("vi-VN")}
            </Text>
          </View>
        </Animated.View>
      )}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
          <Text style={styles.emptySubText}>Hãy thêm giao dịch mới để bắt đầu</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate("AddTransaction")}
          >
            <Text style={styles.addButtonText}>+ Thêm giao dịch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={dateKeys}
          renderItem={({ item: dateKey, index: dateIndex }) => (
            <View key={`date-${dateIndex}`} style={styles.dateSection}>
              <View style={styles.dateHeader}>
                <Text style={styles.dateText}>{dateKey}</Text>
                <View style={styles.dateSummary}>
                  {groupedTransactions[dateKey].some((t) => t.type === "expense") && (
                    <Text style={styles.dateSummaryText}>
                      💸 ₫
                      {groupedTransactions[dateKey]
                        .filter((t) => t.type === "expense")
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString("vi-VN")}
                    </Text>
                  )}
                  {groupedTransactions[dateKey].some((t) => t.type === "income") && (
                    <Text
                      style={[
                        styles.dateSummaryText,
                        styles.dateSummaryTextIncome,
                      ]}
                    >
                      💰 ₫
                      {groupedTransactions[dateKey]
                        .filter((t) => t.type === "income")
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString("vi-VN")}
                    </Text>
                  )}
                </View>
              </View>
              <View>
                {groupedTransactions[dateKey].map((transaction, transactionIndex) => (
                  <View key={`${dateIndex}-${transactionIndex}-${transaction.id}`}>
                    {renderTransactionItem({ item: transaction })}
                  </View>
                ))}
              </View>
            </View>
          )}
          keyExtractor={(item) => item}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Bottom Add Button */}
      {transactions.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate("AddTransaction")}
        >
          <Text style={styles.floatingButtonText}>+ Thêm giao dịch</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0E27" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#fff" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  placeholderButton: { width: 40, height: 40 },
  newTransactionBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(99,102,241,0.15)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  newTransactionIcon: { fontSize: 24, marginRight: 12 },
  newTransactionInfo: { flex: 1 },
  newTransactionLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    marginBottom: 4,
  },
  newTransactionDetails: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 12,
    fontSize: 14,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  dateSection: { marginTop: 20 },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  dateText: { fontSize: 14, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
  dateSummary: { flexDirection: "row", gap: 16 },
  dateSummaryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  dateSummaryTextIncome: { color: "#10B981" },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  transactionLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  transactionEmoji: { fontSize: 32, marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionCategory: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  transactionTime: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  transactionRight: { alignItems: "flex-end", gap: 4 },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  transactionAmountExpense: { color: "#EF4444" },
  transactionAmountIncome: { color: "#10B981" },
  deleteIconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(239,68,68,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: { fontSize: 14 },
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 16,
    left: 16,
    backgroundColor: "#6366F1",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
