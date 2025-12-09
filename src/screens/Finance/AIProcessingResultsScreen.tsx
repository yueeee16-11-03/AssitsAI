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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import type { ProcessedData } from "../../hooks/useAIProcessing";
import TransactionService from "../../services/TransactionService";
import IncomeService from "../../services/IncomeService";
import { useTransactionStore } from "../../store/transactionStore";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "AIProcessingResults"
>;

const { height } = Dimensions.get("window");

// Helper component để render icon + label
const DataRow = ({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}) => (
  <View style={styles.aiDataRow}>
    <View style={styles.labelWithIcon}>
      <MaterialCommunityIcons name={icon} size={18} color={iconColor} style={styles.icon} />
      <Text style={styles.aiDataLabel}>{label}</Text>
    </View>
    <Text style={styles.aiDataValue}>{value}</Text>
  </View>
);

export default function AIProcessingResultsScreen({
  route,
  navigation,
}: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
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
      merchant: editedDataState.merchant,
      date: editedDataState.date,
      confidence: editedDataState.confidence,
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
        category: editedDataState.category || (transactionType === 'income' ? "💰 Thu nhập" : "📝 Ghi chú"),
        items: editedDataState.items || [],
        totalAmount: editedDataState.totalAmount || 0,
        merchant: editedDataState.merchant,
        date: editedDataState.date,
        confidence: editedDataState.confidence,
        processedText: editedDataState.processedText,
        rawOCRText: editedDataState.rawText,
        processingTime: editedDataState.processingTime || 0,
        hasAIProcessing: true,
      };

      console.log('💾 [RESULT_SCREEN] Auto-saving with formData:', formData);
      console.log('📊 [RESULT_SCREEN] Transaction type:', transactionType);

      // 🟢 CHỌN SERVICE DỰA VÀO LOẠI GIAO DỊCH
      if (transactionType === 'income') {
        console.log('💰 [RESULT_SCREEN] Saving as INCOME using IncomeService...');
        const incomeObj = IncomeService.createIncomeObject(formData);
        await IncomeService.addIncome(incomeObj);
        console.log('💾 [RESULT_SCREEN] Income auto-saved successfully');
      } else {
        console.log('💸 [RESULT_SCREEN] Saving as EXPENSE using TransactionService...');
        const transactionObj = TransactionService.createTransactionObject(formData);
        const addTransaction = useTransactionStore.getState().addTransaction;
        await addTransaction(transactionObj);
        console.log('💾 [RESULT_SCREEN] Transaction auto-saved successfully');
      }

      Alert.alert("Thành công", transactionType === 'income' ? "Đã lưu thu nhập" : "Đã lưu giao dịch", [
        {
          text: "OK",
          onPress: () => {
            // Quay về FinanceDashboard
            navigation.navigate("FinanceDashboard");
          },
        },
      ]);
    } catch (error) {
      console.error("❌ [RESULT_SCREEN] Error saving:", error);
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Không thể lưu. Vui lòng thử lại");
    } finally {
      setIsAutoSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButtonIcon}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <MaterialCommunityIcons 
                name={transactionType === 'income' ? 'cash-multiple' : 'shopping'} 
                size={28} 
                color="#111827" 
              />
              <Text style={styles.headerTitle}>
                {transactionType === 'income' ? 'THU NHẬP' : 'CHI TIÊU'}
              </Text>
            </View>
            
            <View style={styles.headerPlaceholder} />
          </View>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]} showsVerticalScrollIndicator={false}>
          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <MaterialCommunityIcons name="camera" size={16} color="#00796B" style={styles.smallIcon} />
                <Text style={styles.imageLabel}>
                  {transactionType === 'income' ? 'Bill thu nhập' : 'Bill chi tiêu'}
                </Text>
              </View>
            </View>
          )}

          {/* Processed Text by Gemini AI - Main Content */}
          {editedDataState?.rawText ? (
            editedDataState?.processedText ? (
              <View style={styles.processedTextSection}>
                <View style={styles.processedTextHeader}>
                  <MaterialCommunityIcons name="robot" size={20} color="#1E40AF" style={styles.mediumIcon} />
                  <Text style={styles.processedTextTitle}>Thông tin giao dịch</Text>
                </View>
                
                {/* Display formatted AI data (not raw JSON) */}
                <View style={styles.aiDataContainer}>
                  {/* Merchant */}
                  {editedDataState.merchant && (
                    <DataRow
                      icon="store"
                      iconColor="#DC2626"
                      label="Cửa hàng:"
                      value={editedDataState.merchant}
                    />
                  )}

                  {/* Date */}
                  {editedDataState.date && (
                    <DataRow
                      icon="calendar-clock"
                      iconColor="#2563EB"
                      label="Ngày giờ:"
                      value={editedDataState.date}
                    />
                  )}

                  {/* Total Amount */}
                  {editedDataState.totalAmount !== undefined && editedDataState.totalAmount > 0 && (
                    <DataRow
                      icon="cash"
                      iconColor="#059669"
                      label="Tổng tiền:"
                      value={`₫ ${editedDataState.totalAmount.toLocaleString("vi-VN")}`}
                    />
                  )}

                  {/* Category */}
                  {editedDataState.category && (
                    <DataRow
                      icon="tag"
                      iconColor="#7C3AED"
                      label="Danh mục:"
                      value={editedDataState.category}
                    />
                  )}

                  {/* Description */}
                  {editedDataState.description && (
                    <DataRow
                      icon="note-text"
                      iconColor="#0891B2"
                      label="Mô tả:"
                      value={editedDataState.description}
                    />
                  )}

                  {/* Items Breakdown */}
                  {editedDataState.items && editedDataState.items.length > 0 && (
                    <View style={styles.itemsBreakdownSection}>
                      <View style={styles.itemsBreakdownTitleRow}>
                        <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#6366F1" style={styles.mediumIcon} />
                        <Text style={styles.itemsBreakdownTitle}>Chi tiết các mục</Text>
                      </View>
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

                  {/* Categories from Items */}
                  {editedDataState.items && editedDataState.items.length > 0 && (
                    <View style={styles.categoriesSection}>
                      <View style={styles.categoriesTitleRow}>
                        <MaterialCommunityIcons name="folder-multiple" size={16} color="#6366F1" style={styles.mediumIcon} />
                        <Text style={styles.categoriesTitle}>Danh mục sản phẩm</Text>
                      </View>
                      <View style={styles.categoriesList}>
                        {Array.from(new Set(
                          editedDataState.items
                            .filter((item: any) => item.category)
                            .map((item: any) => item.category)
                        )).map((category: string, index: number) => (
                          <View key={index} style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{category}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.processingTimeRow}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#0284C7" style={styles.smallIcon} />
                  <Text style={styles.processingTimeInfo}>
                    Thời gian xử lý: {editedDataState.processingTime || 0}ms
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.noDataSection}>
                <MaterialCommunityIcons name="progress-clock" size={48} color="#D1D5DB" />
                <Text style={styles.noDataText}>Đang xử lý...</Text>
                <Text style={styles.noDataSubtext}>
                  Vui lòng chờ AI xử lý dữ liệu
                </Text>
              </View>
            )
          ) : (
            <View style={styles.noDataSection}>
              <MaterialCommunityIcons name="image-not-found" size={48} color="#D1D5DB" />
              <Text style={styles.noDataText}>Không có dữ liệu OCR</Text>
              <Text style={styles.noDataSubtext}>
                Vui lòng chụp/chọn ảnh để trích xuất text
              </Text>
            </View>
          )}
          <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
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
            <MaterialCommunityIcons name="close" size={18} color="#1F2937" />
            <Text style={styles.cancelButtonText}>Huỷ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleConfirm}
            disabled={isAutoSaving}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Chỉnh sửa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isAutoSaving && styles.confirmButtonDisabled]}
            onPress={handleAutoSave}
            disabled={isAutoSaving}
          >
            {isAutoSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Lưu ngay</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Fullscreen Raw Text Modal */}
      {/* Modal này được giữ lại nhưng không hiển thị vì không cần OCR text */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 44 : 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  headerPlaceholder: {
    width: 44,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    backgroundColor: "#F3F4F6",
  },

  // Image Preview
  imageContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewImage: {
    width: "100%",
    height: height * 0.25,
    backgroundColor: "#F3F4F6",
  },
  imageOverlay: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F3F4F6",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },
  imageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },

  // Processed Text by AI
  processedTextSection: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  processedTextHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  processedTextTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  aiDataContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
    marginBottom: 10,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  smallIcon: {
    marginRight: 6,
  },
  mediumIcon: {
    marginRight: 8,
  },
  aiDataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  aiDataLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
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
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#6366F1",
  },
  itemsBreakdownTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemsBreakdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4B5563",
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
    color: "#059669",
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 12,
  },
  categoriesSection: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 0,
  },
  categoriesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  categoriesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
    marginLeft: 6,
  },
  categoriesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#A5B4FC",
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
  processingTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  processingTimeInfo: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
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
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#9CA3AF",
    marginBottom: 8,
    marginTop: 12,
  },
  noDataSubtext: {
    fontSize: 14,
    color: "#B4B8BF",
  },

  // Action Buttons
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: "#F3F4F6",
    borderTopWidth: 0,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#F9FAFB",
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  editButton: {
    flex: 1,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    elevation: 2,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#059669",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    elevation: 3,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  spacer: {
    height: 20,
  },
});
