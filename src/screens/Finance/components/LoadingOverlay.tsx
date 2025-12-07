import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";

interface LoadingOverlayProps {
  imageUri?: string;
}

const { width } = Dimensions.get("window");

export default function LoadingOverlay({ imageUri }: LoadingOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlayContainer}>
        {/* Semi-transparent dark background */}
        <View style={styles.backdrop} />

        {/* Loading card */}
        <View style={styles.loadingCard}>
          <Animated.View
            style={[
              styles.pulseCircle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <ActivityIndicator size={48} color="#6B7280" />
          </Animated.View>

          <Text style={styles.loadingTitle}>Đang xử lý...</Text>
          <Text style={styles.loadingSubtitle}>
            {imageUri ? "Phân tích ảnh hóa đơn" : "Xử lý ghi chú viết tay"}
          </Text>

          {/* Progress indicator */}
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  transform: [
                    {
                      scaleX: pulseAnim.interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0.3, 0.9],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>

          <Text style={styles.processingText}>Sử dụng AI để phân tích...</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  loadingCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    padding: 32,
    width: width * 0.75,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#374151",
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    textAlign: "center",
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6B7280",
    borderRadius: 2,
  },
  processingText: {
    fontSize: 12,
    color: "#4B5563",
    fontStyle: "italic",
  },
});
