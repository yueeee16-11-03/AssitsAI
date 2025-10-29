import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import type { ProcessedData } from "../../../hooks/useAIProcessing";

interface ResultsOverlayProps {
  imageUri?: string;
  processedData: ProcessedData | null;
  editedData: ProcessedData | null;
  selectedItems: number[];
  onToggleItem: (index: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const { width, height } = Dimensions.get("window");

export default function ResultsOverlay({
  imageUri,
  processedData,
  editedData,
  selectedItems,
  onToggleItem,
  onConfirm,
  onCancel,
}: ResultsOverlayProps) {
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlayContainer}>
          <View style={styles.backdrop} />

          <View style={styles.resultsCard}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>✓ Xử lý thành công</Text>
              <Text style={styles.headerSubtitle}>
                Độ chính xác:{" "}
                {((processedData?.confidence || 0.94) * 100).toFixed(0)}%
              </Text>
            </View>

            {/* Image preview */}
            {imageUri && (
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            {/* Results Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Items List */}
              <Text style={styles.sectionTitle}>Chi tiết giao dịch</Text>
              {editedData?.items && editedData.items.length > 0 ? (
                <View style={styles.itemsContainer}>
                  {editedData.items.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.itemCard,
                        selectedItems.includes(index) &&
                          styles.itemCardSelected,
                      ]}
                      onPress={() => onToggleItem(index)}
                    >
                      <View style={styles.itemLeftContent}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        {item.category && (
                          <Text style={styles.itemCategory}>
                            {item.category}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.itemAmount}>
                        {item.amount.toLocaleString("vi-VN")}{" "}
                        {editedData.currency}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noDataText}>Không có dữ liệu</Text>
              )}

              {/* Total */}
              {editedData?.items && editedData.items.length > 0 && (
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Tổng cộng</Text>
                  <Text style={styles.totalAmount}>
                    {editedData.items
                      .reduce((sum, item) => sum + item.amount, 0)
                      .toLocaleString("vi-VN")}{" "}
                    {editedData.currency}
                  </Text>
                </View>
              )}

              {/* Note */}
              {editedData?.note && (
                <View style={styles.noteSection}>
                  <Text style={styles.sectionTitle}>Ghi chú</Text>
                  <Text style={styles.noteText}>{editedData.note}</Text>
                </View>
              )}

              {/* Raw OCR text if available */}
              {editedData?.rawText && (
                <View style={styles.rawTextSection}>
                  <Text style={styles.sectionTitle}>Nội dung gốc</Text>
                  <View style={styles.rawTextBox}>
                    <Text style={styles.rawText}>{editedData.rawText}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onConfirm}
              >
                <Text style={styles.confirmButtonText}>✓ Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  resultsCard: {
    backgroundColor: "#E0F2F1",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    width: width,
    overflow: "hidden",
    flexDirection: "column",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 137, 123, 0.1)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#00796B",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#00897B",
  },
  previewImage: {
    width: "100%",
    height: height * 0.25,
    backgroundColor: "rgba(0, 137, 123, 0.05)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00796B",
    marginBottom: 12,
    marginTop: 12,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemCardSelected: {
    borderColor: "#00897B",
    backgroundColor: "rgba(0, 137, 123, 0.1)",
  },
  itemLeftContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 11,
    color: "#00897B",
    fontStyle: "italic",
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00796B",
  },
  noDataText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    paddingVertical: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 137, 123, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#00897B",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#00796B",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#00796B",
  },
  noteSection: {
    marginBottom: 16,
  },
  noteText: {
    fontSize: 13,
    color: "#333",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: 12,
    borderRadius: 12,
    lineHeight: 20,
  },
  rawTextSection: {
    marginBottom: 24,
  },
  rawTextBox: {
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#B2DFDB",
  },
  rawText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 137, 123, 0.1)",
  },
  cancelButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#00796B",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
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
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
