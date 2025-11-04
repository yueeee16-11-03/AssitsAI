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
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import type { ProcessedData } from "../../hooks/useAIProcessing";

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

  const handleConfirm = () => {
    if (!editedDataState || !editedDataState.rawText) {
      Alert.alert("Lỗi", "Không có dữ liệu OCR để xác nhận");
      return;
    }

    // ✅ Chuẩn bị dữ liệu để gửi về
    const processedData = {
      rawOCRText: editedDataState.rawText,
      processedText: editedDataState.processedText,
      note: editedDataState.note,
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
                  <Text style={styles.processedTextTitle}>Thông tin giao dịch</Text>
                </View>
                
                <View style={styles.processedTextBox}>
                  <Text style={styles.processedText}>
                    {editedDataState.processedText}
                  </Text>
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
          >
            <Text style={styles.cancelButtonText}>Huỷ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>✓ Xác nhận & Lưu</Text>
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
  confirmButton: {
    flex: 1,
    backgroundColor: "#00897B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
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
