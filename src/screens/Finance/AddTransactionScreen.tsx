import React, { useState } from "react";
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
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "AddTransaction">;

type TransactionType = "expense" | "income";

interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export default function AddTransactionScreen({ navigation }: Props) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [note, setNote] = useState("");
  const [date, _setDate] = useState(new Date());
  const [isRecording, setIsRecording] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  React.useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

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

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recognition
    if (!isRecording) {
      setTimeout(() => {
        setAmount("50000");
        setNote("Ăn trưa tại quán cơm");
        setSelectedCategory("1");
        setIsRecording(false);
        Alert.alert("Ghi nhận giọng nói", "Đã chuyển đổi: 50,000đ - Ăn trưa");
      }, 2000);
    }
  };

  const handleSave = () => {
    if (!amount || !selectedCategory) {
      Alert.alert("Thông báo", "Vui lòng nhập đầy đủ số tiền và danh mục");
      return;
    }

    // TODO: Save transaction to database
    Alert.alert("Thành công", "Đã lưu giao dịch", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  const formatAmount = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    if (cleaned) {
      return parseInt(cleaned).toLocaleString("vi-VN");
    }
    return "";
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setAmount(cleaned);
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
        <Text style={styles.headerTitle}>Thêm giao dịch</Text>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.voiceButton, isRecording && styles.voiceButtonActive]}
            onPress={handleVoiceInput}
          >
            <Text style={styles.voiceIcon}>{isRecording ? "⏹" : "🎤"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
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
                {parseInt(amount) > 1000000
                  ? `≈ ${(parseInt(amount) / 1000000).toFixed(1)} triệu đồng`
                  : `${formatAmount(amount)} đồng`}
              </Text>
            )}
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {["10000", "20000", "50000", "100000", "200000", "500000"].map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={styles.quickButton}
                onPress={() => setAmount(quickAmount)}
              >
                <Text style={styles.quickButtonText}>
                  {parseInt(quickAmount) >= 1000000
                    ? `${parseInt(quickAmount) / 1000000}M`
                    : `${parseInt(quickAmount) / 1000}K`}
                </Text>
              </TouchableOpacity>
            ))}
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

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Ngày giao dịch</Text>
            <TouchableOpacity style={styles.dateButton}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>
                {date.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
              <Text style={styles.dateArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* AI Suggestions */}
          {amount && selectedCategory && (
            <View style={styles.aiSuggestion}>
              <Text style={styles.aiSuggestionIcon}>💡</Text>
              <View style={styles.aiSuggestionContent}>
                <Text style={styles.aiSuggestionTitle}>Gợi ý từ AI</Text>
                <Text style={styles.aiSuggestionText}>
                  {type === "expense"
                    ? "Chi tiêu này cao hơn 20% so với trung bình. Bạn có thể cân nhắc giảm chi phí."
                    : "Thu nhập tốt! Hãy cân nhắc tiết kiệm 20% cho quỹ dự phòng."}
                </Text>
              </View>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              type === "expense" ? styles.saveButtonExpense : styles.saveButtonIncome,
            ]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Lưu giao dịch</Text>
            <Text style={styles.saveButtonIcon}>✓</Text>
          </TouchableOpacity>
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
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonActive: { backgroundColor: "#EF4444" },
  voiceIcon: { fontSize: 20 },
  content: { padding: 16 },
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
  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  quickButton: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  quickButtonText: { color: "rgba(255,255,255,0.8)", fontWeight: "700", fontSize: 13 },
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
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  dateIcon: { fontSize: 20, marginRight: 12 },
  dateText: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "700" },
  dateArrow: { fontSize: 16, color: "rgba(255,255,255,0.5)" },
  aiSuggestion: {
    flexDirection: "row",
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
  },
  aiSuggestionIcon: { fontSize: 24, marginRight: 12 },
  aiSuggestionContent: { flex: 1 },
  aiSuggestionTitle: { fontSize: 14, fontWeight: "800", color: "#F59E0B", marginBottom: 4 },
  aiSuggestionText: { fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 18 },
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
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700", marginRight: 8 },
  saveButtonIcon: { color: "#fff", fontSize: 20, fontWeight: "700" },
});
