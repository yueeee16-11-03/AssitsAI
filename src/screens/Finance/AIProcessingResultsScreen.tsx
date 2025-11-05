import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import type { ProcessedData } from "../../hooks/useAIProcessing";
import TransactionService from "../../services/TransactionService";
import { useTransactionStore } from "../../store/transactionStore";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "AIProcessingResults"
>;

const { height } = Dimensions.get("window");

export default function AIProcessingResultsScreen({
  route,
  navigation,
}: Props) {
  const {
    imageUri,
    editedData,
    transactionType = 'expense', // 🟢 MẶC ĐỊNH expense, nhưng có thể là income
  } = route.params;

  const [editedDataState] = useState<ProcessedData | null>(editedData);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const handleConfirm = () => {
    // 🟢 VALIDATION: Cho phép cả TEXT (rawText) và IMAGE (processedText)
    const hasTextData = editedDataState?.rawText;
    const hasImageData = editedDataState?.processedText;
    const hasAIExtractedData = editedDataState?.totalAmount !== undefined;
    
    if (!editedDataState || (!hasTextData && !hasImageData && !hasAIExtractedData)) {
      Alert.alert("Lỗi", "Không có dữ liệu để xác nhận");
      return;
    }

    // ✅ Chuẩn bị dữ liệu để gửi về (bao gồm cả amount, items, category từ AI)
    const processedData = {
      note: editedDataState.description || editedDataState.rawText, // 🟢 Gửi note để AddTransactionScreen dùng
      rawOCRText: editedDataState.rawText,
      processedText: editedDataState.processedText,
      totalAmount: editedDataState.totalAmount || 0,
      items: editedDataState.items || [],
      category: editedDataState.category,
      description: editedDataState.description, // 🟢 Gửi description để AddTransactionScreen dùng
      processingTime: editedDataState.processingTime || 0,
    };

    console.log('✅ [RESULT_SCREEN] Confirming with data:', processedData);
    console.log('📊 [RESULT_SCREEN] Transaction type:', transactionType);
    
    // 🟢 CHỌN SCREEN DỰA VÀO LOẠI GIAO DỊCH
    const screenName = transactionType === 'income' ? 'AddIncome' : 'AddTransaction';
    console.log('🏃 [RESULT_SCREEN] Navigating to:', screenName);
    
    navigation.navigate(screenName, {
      processedData: processedData,
    });
  };

  // 🟢 AUTO-SAVE: Tự động lưu transaction mà không cần quay về AddTransactionScreen
  const handleAutoSave = async () => {
    if (!editedDataState) {
      Alert.alert("Lỗi", "Không có dữ liệu để lưu");
      return;
    }

    setIsAutoSaving(true);
    try {
      const formData = {
        type: transactionType,
        description: editedDataState.description || editedDataState.rawText || "📝 Ghi chú từ AI",
        billImageUri: null,
        amount: editedDataState.totalAmount || 0,
        category: editedDataState.category || "📝 Ghi chú",
        items: editedDataState.items || [],
        totalAmount: editedDataState.totalAmount || 0,
        processedText: editedDataState.processedText,
        rawOCRText: editedDataState.rawText,
        processingTime: editedDataState.processingTime || 0,
        hasAIProcessing: true,
      };

      console.log('💾 [RESULT_SCREEN] Auto-saving with formData:', formData);

      const transactionObj = TransactionService.createTransactionObject(formData);
      const addTransaction = useTransactionStore.getState().addTransaction;
      await addTransaction(transactionObj);

      console.log('💾 [RESULT_SCREEN] Transaction auto-saved successfully');

      Alert.alert("Thành công", "Đã lưu giao dịch", [
        {
          text: "OK",
          onPress: () => {
            // Quay về FinanceDashboard
            navigation.navigate("FinanceDashboard");
          },
        },
      ]);
    } catch (error) {
      console.error("❌ [RESULT_SCREEN] Error saving transaction:", error);
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Không thể lưu. Vui lòng thử lại");
    } finally {
      setIsAutoSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Quay lại</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {transactionType === 'income' ? '💰 THÔNG TIN THU NHẬP' : '📊 THÔNG TIN CHI TIÊU'}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageLabel}>
                  📸 {transactionType === 'income' ? 'Bill thu nhập' : 'Bill chi tiêu'}
                </Text>
              </View>
            </View>
          )}

          {/* Processed Text by Gemini AI - Main Content */}
          {editedDataState?.rawText ? (
            editedDataState?.processedText ? (
              <View style={styles.processedTextSection}>
                <View style={styles.processedTextHeader}>
                  <Text style={styles.processedTextTitle}>🤖 Thông tin giao dịch</Text>
                </View>
                
                {/* Display formatted AI data (not raw JSON) */}
                <View style={styles.aiDataContainer}>
                  {/* Total Amount */}
                  {editedDataState.totalAmount !== undefined && editedDataState.totalAmount > 0 && (
                    <View style={styles.aiDataRow}>
                      <Text style={styles.aiDataLabel}>💰 Tổng tiền:</Text>
                      <Text style={styles.aiDataValue}>
                        ₫ {editedDataState.totalAmount.toLocaleString("vi-VN")}
                      </Text>
                    </View>
                  )}

                  {/* Category */}
                  {editedDataState.category && (
                    <View style={styles.aiDataRow}>
                      <Text style={styles.aiDataLabel}>📦 Danh mục:</Text>
                      <Text style={styles.aiDataValue}>{editedDataState.category}</Text>
                    </View>
                  )}

                  {/* Description */}
                  {editedDataState.description && (
                    <View style={styles.aiDataRow}>
                      <Text style={styles.aiDataLabel}>📝 Mô tả:</Text>
                      <Text style={styles.aiDataValue}>{editedDataState.description}</Text>
                    </View>
                  )}

                  {/* Items Breakdown */}
                  {editedDataState.items && editedDataState.items.length > 0 && (
                    <View style={styles.itemsBreakdownSection}>
                      <Text style={styles.itemsBreakdownTitle}>📋 Chi tiết các mục:</Text>
                      {editedDataState.items.map((item: any, index: number) => (
                        <View key={index} style={styles.itemBreakdownRow}>
                          <Text style={styles.itemBreakdownName}>• {item.item}</Text>
                          <Text style={styles.itemBreakdownAmount}>
                            {item.amount?.toLocaleString("vi-VN") || "0"} ₫
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Confidence */}
                  {editedDataState.confidence && (
                    <View style={styles.confidenceRow}>
                      <Text style={styles.aiDataLabel}>✓ Độ chắc chắn:</Text>
                      <Text style={[styles.aiDataValue, styles.confidenceBadge]}>
                        {editedDataState.confidence === 'high' ? '✓ Cao' : editedDataState.confidence === 'medium' ? '≈ Trung bình' : '? Thấp'}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.processingTimeInfo}>
                  ⏱️ Thời gian xử lý: {editedDataState.processingTime || 0}ms
                </Text>
              </View>
            ) : (
              <View style={styles.noDataSection}>
                <Text style={styles.noDataText}>⏳ Đang xử lý...</Text>
                <Text style={styles.noDataSubtext}>
                  Vui lòng chờ AI xử lý dữ liệu
                </Text>
              </View>
            )
          ) : (
            <View style={styles.noDataSection}>
              <Text style={styles.noDataText}>❌ Không có dữ liệu OCR</Text>
              <Text style={styles.noDataSubtext}>
                Vui lòng chụp/chọn ảnh để trích xuất text
              </Text>
            </View>
          )}

          <View style={styles.spacer} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              Alert.alert("Huỷ xử lý", "Bạn có chắc muốn huỷ?", [
                { text: "Không", onPress: () => {} },
                { text: "Có", onPress: () => navigation.goBack() },
              ]);
            }}
            disabled={isAutoSaving}
          >
            <Text style={styles.cancelButtonText}>Huỷ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleConfirm}
            disabled={isAutoSaving}
          >
            <Text style={styles.editButtonText}>✏️ Chỉnh sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isAutoSaving && styles.confirmButtonDisabled]}
            onPress={handleAutoSave}
            disabled={isAutoSaving}
          >
            {isAutoSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmButtonText}>✓ Lưu ngay</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Fullscreen Raw Text Modal */}
      {/* Modal này được giữ lại nhưng không hiển thị vì không cần OCR text */}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#00897B",
    paddingTop: Platform.OS === "ios" ? 60 : 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Image Preview
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  previewImage: {
    width: "100%",
    height: height * 0.25,
    backgroundColor: "rgba(0, 137, 123, 0.05)",
  },
  imageOverlay: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0, 137, 123, 0.1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 137, 123, 0.2)",
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00796B",
  },

  // Processed Text by AI
  processedTextSection: {
    marginBottom: 20,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  processedTextHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  processedTextTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E40AF",
  },
  aiDataContainer: {
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    marginBottom: 10,
  },
  aiDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(59, 130, 246, 0.1)",
  },
  aiDataLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284C7",
    flex: 1,
  },
  aiDataValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    flex: 1.5,
    textAlign: "right",
  },
  itemsBreakdownSection: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  itemsBreakdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 8,
  },
  itemBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  itemBreakdownName: {
    fontSize: 12,
    color: "#555555",
    flex: 1,
  },
  itemBreakdownAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00796B",
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  confidenceBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    color: "#10B981",
  },
  processedTextBox: {
    backgroundColor: "rgba(59, 130, 246, 0.05)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    marginBottom: 10,
    minHeight: 150,
  },
  processedText: {
    fontSize: 13,
    color: "#1F2937",
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  processingTimeInfo: {
    fontSize: 12,
    color: "#0284C7",
    fontStyle: "italic",
    textAlign: "right",
    fontWeight: "600",
  },

  // No Data Section
  noDataSection: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#999",
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#BBB",
  },

  // Action Buttons
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 137, 123, 0.1)",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#00796B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00796B",
  },
  editButton: {
    flex: 1,
    backgroundColor: "#FFA500",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#00897B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  spacer: {
    height: 20,
  },
});
