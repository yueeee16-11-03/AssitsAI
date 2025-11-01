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
  Modal,
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
    onConfirm,
  } = route.params;

  const [editedDataState] = useState<ProcessedData | null>(editedData);
  const [showFullRawText, setShowFullRawText] = useState(false);

  const handleConfirm = () => {
    if (!editedDataState || !editedDataState.rawText) {
      Alert.alert("Lỗi", "Không có dữ liệu OCR để xác nhận");
      return;
    }

    const result = {
      rawText: editedDataState.rawText,
      note: editedDataState.note,
    };

    console.log('✅ [RESULT_SCREEN] User confirmed OCR data:', result);
    onConfirm?.(result);
    navigation.goBack();
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
          <Text style={styles.headerTitle}>Nội dung OCR</Text>
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
                <Text style={styles.imageLabel}>📸 Ảnh gốc</Text>
              </View>
            </View>
          )}

          {/* Raw OCR Text - Main Content */}
          {editedDataState?.rawText ? (
            <View style={styles.rawTextMainSection}>
              <View style={styles.rawTextHeader}>
                <Text style={styles.rawTextTitle}>📄 Toàn bộ nội dung OCR</Text>
                <TouchableOpacity
                  onPress={() => setShowFullRawText(true)}
                  style={styles.expandButton}
                >
                  <Text style={styles.expandButtonText}>⛶ Phóng to</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.rawTextBox}>
                <Text style={styles.rawText}>
                  {editedDataState.rawText}
                </Text>
              </View>

              <Text style={styles.textLengthInfo}>
                Tổng {editedDataState.rawText.length} ký tự
              </Text>
            </View>
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
      <Modal
        visible={showFullRawText}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFullRawText(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Toàn bộ OCR Text</Text>
              <TouchableOpacity
                onPress={() => setShowFullRawText(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.modalText}>
                {editedDataState?.rawText}
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {editedDataState?.rawText?.length || 0} ký tự
              </Text>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowFullRawText(false)}
              >
                <Text style={styles.closeModalButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Raw Text Main Section
  rawTextMainSection: {
    marginBottom: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rawTextHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rawTextTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00796B",
  },
  expandButton: {
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#00897B",
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#00796B",
  },
  rawTextBox: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#B2DFDB",
    marginBottom: 10,
    minHeight: 150,
  },
  rawText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  textLengthInfo: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    textAlign: "right",
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    flex: 0.9,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#00897B",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 137, 123, 0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F5F5F5",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 137, 123, 0.1)",
  },
  modalFooterText: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  closeModalButton: {
    backgroundColor: "#00897B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeModalButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
