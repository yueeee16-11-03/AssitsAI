import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from "react-native";

interface ErrorOverlayProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get("window");

export default function ErrorOverlay({
  error,
  onRetry,
  onCancel,
}: ErrorOverlayProps) {
  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlayContainer}>
        <View style={styles.backdrop} />

        <View style={styles.errorCard}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Lỗi xử lý</Text>
          <Text style={styles.errorMessage}>{error}</Text>

          <TouchableOpacity
            style={styles.errorRetryButton}
            onPress={onRetry}
          >
            <Text style={styles.buttonText}>Thử lại</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.errorCancelButton}
            onPress={onCancel}
          >
            <Text style={styles.errorCancelButtonText}>Huỷ</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  errorCard: {
    backgroundColor: "#E0F2F1",
    borderRadius: 20,
    padding: 28,
    width: width * 0.8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#EF4444",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
    textAlign: "center",
  },
  errorRetryButton: {
    backgroundColor: "#00897B",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  errorCancelButton: {
    borderWidth: 2,
    borderColor: "#00796B",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  errorCancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00796B",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
