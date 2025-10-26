import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import transactionApi from "../../api/transactionApi";
import { useTransactionStore } from "../../store/transactionStore";

type Props = NativeStackScreenProps<RootStackParamList, "EditTransaction">;

type TransactionType = "expense" | "income";

interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export default function EditTransactionScreen({ navigation, route }: Props) {
  const { transaction } = route.params;
  const [type, setType] = useState<TransactionType>(transaction.type || "expense");
  const [amount, setAmount] = useState(transaction.amount?.toString() || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(transaction.categoryId || "");
  const [note, setNote] = useState(transaction.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const expenseCategories: Category[] = [
    { id: "1", name: "Ăn uống", icon: "🍔", type: "expense" },
    { id: "2", name: "Di chuyển", icon: "🚗", type: "expense" },
    { id: "3", name: "Mua sắm", icon: "🛍️", type: "expense" },
    { id: "4", name: "Giải trí", icon: "🎮", type: "expense" },
    { id: "5", name: "Sức khỏe", icon: "💊", type: "expense" },
    { id: "6", name: "Giáo dục", icon: "📚", type: "expense" },
    { id: "7", name: "Nhà cửa", icon: "🏠", type: "expense" },
    { id: "8", name: "Khác", icon: "📦", type: "expense" },
  ];

  const incomeCategories: Category[] = [
    { id: "9", name: "Lương", icon: "💼", type: "income" },
    { id: "10", name: "Thưởng", icon: "🎁", type: "income" },
    { id: "11", name: "Đầu tư", icon: "📈", type: "income" },
    { id: "12", name: "Khác", icon: "💰", type: "income" },
  ];

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  const formatAmount = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned) {
      return parseInt(cleaned, 10).toLocaleString("vi-VN");
    }
    return "";
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setAmount(cleaned);
  };

  const handleSave = async () => {
    // Validation
    if (!amount.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục");
      return;
    }

    if (!note.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mô tả giao dịch");
      return;
    }

    setIsLoading(true);

    try {
      // Get category name
      const allCategories =
        type === "expense"
          ? expenseCategories
          : incomeCategories;
      const selectedCategoryObj = allCategories.find(
        (cat) => cat.id === selectedCategory
      );
      const categoryName = selectedCategoryObj?.name || "Khác";

      const updateData = {
        type,
        amount: parseInt(amount, 10),
        description: note,
        category: categoryName,
        categoryId: selectedCategory,
      };

      // Cập nhật giao dịch
      await transactionApi.updateTransaction(transaction.id, updateData);

      // Cập nhật store
      await useTransactionStore.getState().updateTransaction(transaction.id, updateData);

      Alert.alert("Thành công", "Đã cập nhật giao dịch", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Error updating transaction:", error);
      Alert.alert("Lỗi", "Không thể cập nhật giao dịch. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa giao dịch này?",
      [
        {
          text: "Hủy",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: async () => {
            setIsLoading(true);
            try {
              await transactionApi.deleteTransaction(transaction.id);
              await useTransactionStore.getState().deleteTransaction(transaction.id);

              Alert.alert("Thành công", "Đã xóa giao dịch", [
                {
                  text: "OK",
                  onPress: () => {
                    navigation.goBack();
                  },
                },
              ]);
            } catch (error) {
              console.error("Error deleting transaction:", error);
              Alert.alert("Lỗi", "Không thể xóa giao dịch. Vui lòng thử lại");
              setIsLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
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
        <Text style={styles.headerTitle}>Chỉnh sửa giao dịch</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Transaction Info Display */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Giao dịch gốc</Text>
            <Text style={styles.infoText}>
              {transaction.type === "expense" ? "💸 Chi tiêu" : "💰 Thu nhập"}
            </Text>
            <Text style={styles.infoAmount}>
              ₫ {transaction.amount?.toLocaleString("vi-VN")}
            </Text>
            <Text style={styles.infoDate}>
              {new Date(transaction.createdAt?.toDate?.() || transaction.createdAt).toLocaleDateString("vi-VN")}
            </Text>
          </View>

          {/* Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, type === "expense" && styles.typeButtonExpense]}
              onPress={() => {
                setType("expense");
                setSelectedCategory("");
              }}
            >
              <Text style={styles.typeIcon}>💸</Text>
              <Text style={[styles.typeText, type === "expense" && styles.typeTextActive]}>
                Chi tiêu
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, type === "income" && styles.typeButtonIncome]}
              onPress={() => {
                setType("income");
                setSelectedCategory("");
              }}
            >
              <Text style={styles.typeIcon}>💰</Text>
              <Text style={[styles.typeText, type === "income" && styles.typeTextActive]}>
                Thu nhập
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <View style={styles.amountSection}>
            <Text style={styles.label}>Số tiền</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₫</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#999"
                value={formatAmount(amount)}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
              />
            </View>
            {amount && (
              <Text style={styles.amountWords}>
                {parseInt(amount, 10) > 1000000
                  ? `≈ ${(parseInt(amount, 10) / 1000000).toFixed(1)} triệu đồng`
                  : `${formatAmount(amount)} đồng`}
              </Text>
            )}
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Danh mục</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardActive,
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {selectedCategory === category.id && (
                    <View style={styles.checkMark}>
                      <Text style={styles.checkMarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Thêm ghi chú cho giao dịch..."
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteButtonText}>🗑️ Xóa giao dịch</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                type === "expense" ? styles.saveButtonExpense : styles.saveButtonIncome,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                  <Text style={styles.saveButtonIcon}>✓</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
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
  placeholderButton: {
    width: 40,
    height: 40,
  },
  content: { padding: 16 },
  infoCard: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.3)",
  },
  infoLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
    fontWeight: "600",
  },
  infoText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "700",
    marginBottom: 4,
  },
  infoAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  infoDate: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeButtonExpense: {
    borderColor: "#EF4444",
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  typeButtonIncome: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16,185,129,0.1)",
  },
  typeIcon: { fontSize: 24, marginRight: 8 },
  typeText: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.6)" },
  typeTextActive: { color: "#fff" },
  amountSection: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "800",
    color: "#6366F1",
    marginRight: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    paddingVertical: 16,
  },
  amountWords: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 8,
    marginLeft: 4,
  },
  section: { marginBottom: 24 },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    width: "22%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
  },
  categoryCardActive: {
    borderColor: "#6366F1",
    backgroundColor: "rgba(99,102,241,0.1)",
  },
  categoryIcon: { fontSize: 28, marginBottom: 6 },
  categoryName: { fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: "600", textAlign: "center" },
  checkMark: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkMarkText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  noteInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    textAlignVertical: "top",
    minHeight: 80,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  deleteButton: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.5)",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonExpense: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
  },
  saveButtonIncome: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700", marginRight: 8 },
  saveButtonIcon: { color: "#fff", fontSize: 20, fontWeight: "700" },
});
