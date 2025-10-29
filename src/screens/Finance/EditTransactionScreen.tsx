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
  Image,
  Modal,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useTransactionStore } from "../../store/transactionStore";
import { Camera, useCameraPermission, useCameraDevice, useCameraFormat } from "react-native-vision-camera";
import { launchImageLibrary } from "react-native-image-picker";

type Props = NativeStackScreenProps<RootStackParamList, "EditTransaction">;

export default function EditTransactionScreen({ navigation, route }: Props) {
  const { transaction } = route.params;
  const [note, setNote] = useState(transaction.description || "");
  const [fontSize, setFontSize] = useState(16);
  const [billImage, setBillImage] = useState<string | null>(transaction.billImageUri || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const { hasPermission, requestPermission } = useCameraPermission();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

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
  }, [fadeAnim, isRecording, pulseAnim]);

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        const voiceNote = "� [Ghi âm]: Sửa ghi chú";
        setNote(note + (note ? "\n" : "") + voiceNote);
        setIsRecording(false);
        Alert.alert("Ghi nhận giọng nói", "Đã thêm ghi chú từ giọng nói");
      }, 2000);
    }
  };

  const handleTakePicture = async () => {
    if (!hasPermission) {
      const permission = await requestPermission();
      if (!permission) {
        Alert.alert("Quyền camera bị từ chối", "Vui lòng cấp quyền camera");
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const handleRemoveBillImage = () => {
    setBillImage(null);
    Alert.alert("Đã xóa", "Ảnh bill đã bị xóa");
  };


  const handleSave = async () => {
    // ✅ Validation: ghi chú hoặc ảnh (hoặc cả hai)
    if (!note.trim() && !billImage) {
      Alert.alert("Lỗi", "Vui lòng nhập ghi chú hoặc chụp/chọn ảnh");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Cập nhật chỉ description & billImageUri (note-style)
      const updateData = {
        description: note.trim() || (billImage ? "📸 Ảnh" : ""),
        billImageUri: billImage,
      };

      console.log('✏️ [EDIT-SCREEN] Updating transaction:', updateData);
      await useTransactionStore.getState().updateTransaction(transaction.id, updateData);
      console.log('✅ [EDIT-SCREEN] Update successful');

      Alert.alert("Thành công", "Đã cập nhật ghi chú", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("❌ [EDIT-SCREEN] Error updating transaction:", error);
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Không thể cập nhật. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa ghi chú "${transaction.description}"?`,
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
              console.log("🗑️ [EDIT-SCREEN] Starting delete:", transaction.id);
              await useTransactionStore.getState().deleteTransaction(transaction.id);
              console.log("✅ [EDIT-SCREEN] Delete completed successfully");

              Alert.alert("Thành công", "Đã xóa ghi chú", [
                {
                  text: "OK",
                  onPress: () => {
                    navigation.goBack();
                  },
                },
              ]);
            } catch (error) {
              console.error("❌ [EDIT-SCREEN] Error deleting transaction:", error);
              Alert.alert("Lỗi", "Không thể xóa ghi chú. Vui lòng thử lại");
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
        <Text style={styles.headerTitle}>Sửa ghi chú</Text>
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
          {/* Note Input with Toolbar */}
          <View style={styles.section}>
            <View style={styles.noteHeader}>
              <Text style={styles.label}>📝 Ghi chú</Text>
              <View style={styles.fontSizeControl}>
                <TouchableOpacity
                  style={[styles.fontButton, fontSize === 14 && styles.fontButtonActive]}
                  onPress={() => setFontSize(14)}
                >
                  <Text style={styles.fontButtonSmall}>A</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fontButton, fontSize === 16 && styles.fontButtonActive]}
                  onPress={() => setFontSize(16)}
                >
                  <Text style={styles.fontButtonMedium}>A</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.fontButton, fontSize === 18 && styles.fontButtonActive]}
                  onPress={() => setFontSize(18)}
                >
                  <Text style={styles.fontButtonLarge}>A</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={[styles.noteInput, { fontSize }]}
              placeholder="Nhập ghi chú sửa đổi..."
              placeholderTextColor="#999"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={6}
            />

            {/* Note Toolbar */}
            <View style={styles.noteToolbar}>
              <TouchableOpacity style={styles.toolbarButton} onPress={handleVoiceInput}>
                <Text style={styles.toolbarIcon}>{isRecording ? "⏹" : "🎤"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toolbarButton} onPress={handleTakePicture}>
                <Text style={styles.toolbarIcon}>📷</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bill Image Display */}
          {billImage && (
            <View style={styles.section}>
              <View style={styles.billImageContainer}>
                <Image
                  source={{ uri: billImage }}
                  style={styles.billImage}
                />
                <TouchableOpacity
                  style={styles.billRemoveButton}
                  onPress={handleRemoveBillImage}
                >
                  <Text style={styles.billRemoveButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Original Transaction Info */}
          <View style={styles.section}>
            <Text style={styles.infoLabel}>📋 Thông tin gốc</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                {transaction.type === "expense" ? "💸 Chi tiêu" : "💰 Thu nhập"}
              </Text>
              {transaction.amount > 0 && (
                <Text style={styles.infoAmount}>
                  ₫ {transaction.amount.toLocaleString("vi-VN")}
                </Text>
              )}
              <Text style={styles.infoDate}>
                {new Date(transaction.createdAt?.toDate?.() || transaction.createdAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
          </View>

          {/* Delete & Save Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#EF4444" />
              ) : (
                <Text style={styles.deleteButtonText}>🗑️ Xóa ghi chú</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveButton,
                styles.saveButtonDefault,
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

      {/* Camera Modal */}
      <Modal
        visible={isCameraOpen}
        animationType="slide"
        onRequestClose={() => setIsCameraOpen(false)}
      >
        <CameraScreen
          onCapture={(imageUri: string) => {
            setBillImage(imageUri);
            setIsCameraOpen(false);
            Alert.alert("Thành công", "Ảnh đã được cập nhật");
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Camera Screen Component
function CameraScreen({ onCapture, onClose }: { onCapture: (uri: string) => void; onClose: () => void }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const camera = React.useRef<Camera>(null);
  const [permissionRequested, setPermissionRequested] = React.useState(false);
  const [torchEnabled, setTorchEnabled] = React.useState(false);
  const [showOptions, setShowOptions] = React.useState(true);

  const format = useCameraFormat(device, [
    { videoStabilizationMode: "cinematic" },
  ]);

  React.useEffect(() => {
    const requestCameraPermission = async () => {
      if (!hasPermission && !permissionRequested) {
        setPermissionRequested(true);
        try {
          const result = await requestPermission();
          console.log("Camera permission result:", result);
        } catch (error) {
          console.error("Error requesting camera permission:", error);
        }
      }
    };

    requestCameraPermission();
  }, [hasPermission, requestPermission, permissionRequested]);

  const handleTakePhoto = async () => {
    if (camera.current) {
      try {
        const photo = await camera.current.takePhoto({
          flash: torchEnabled ? "on" : "auto",
        });
        if (photo.path) {
          onCapture("file://" + photo.path);
        }
      } catch (error) {
        console.error("Error taking photo:", error);
        Alert.alert("Lỗi", "Không thể chụp ảnh");
      }
    }
  };

  const handlePickFromGallery = async () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        maxWidth: 1000,
        maxHeight: 1000,
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          console.log("User cancelled image picker");
        } else if (response.errorMessage) {
          Alert.alert("Lỗi", "Không thể lấy hình ảnh: " + response.errorMessage);
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          if (asset.uri) {
            onCapture(asset.uri);
          }
        }
      }
    );
  };

  if (!device) {
    return (
      <View style={styles.cameraError}>
        <Text style={styles.cameraErrorText}>📷 Camera không khả dụng</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.cameraError}>
        <Text style={styles.cameraErrorText}>🔒 Cần cấp quyền camera</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (showOptions) {
    return (
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowOptions(false)}>
          <Text style={styles.optionIcon}>📷</Text>
          <Text style={styles.optionTitle}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={handlePickFromGallery}>
          <Text style={styles.optionIcon}>🖼️</Text>
          <Text style={styles.optionTitle}>Từ thư viện</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButtonCancel} onPress={onClose}>
          <Text style={styles.optionTitle}>✕ Hủy</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        format={format}
      />
      <View style={styles.cameraHeader}>
        <TouchableOpacity onPress={() => setShowOptions(true)}>
          <Text style={styles.cameraHeaderText}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cameraFooter}>
        <TouchableOpacity style={styles.torchButton} onPress={() => setTorchEnabled(!torchEnabled)}>
          <Text style={styles.torchText}>{torchEnabled ? "⚡" : "💡"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto} />
        <View style={styles.spacer} />
      </View>
    </View>
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
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonActive: {
    backgroundColor: "rgba(99,102,241,0.3)",
  },
  voiceIcon: { fontSize: 18 },
  content: { padding: 16, paddingBottom: 80 },
  section: { marginBottom: 24 },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },
  fontSizeControl: {
    flexDirection: "row",
    gap: 8,
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  fontButtonActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  fontButtonSmall: { fontSize: 12, fontWeight: "700", color: "#fff" },
  fontButtonMedium: { fontSize: 14, fontWeight: "700", color: "#fff" },
  fontButtonLarge: { fontSize: 16, fontWeight: "700", color: "#fff" },
  noteInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    textAlignVertical: "top",
    minHeight: 120,
  },
  noteToolbar: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  toolbarButton: {
    flex: 1,
    backgroundColor: "rgba(99,102,241,0.2)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  toolbarIcon: { fontSize: 20 },
  billImageContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  billImage: {
    width: "100%",
    height: 250,
    borderRadius: 16,
  },
  billRemoveButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(239,68,68,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  billRemoveButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 8,
  },
  infoBox: {
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.2)",
  },
  infoText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 4,
  },
  infoAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  infoDate: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  deleteButton: {
    backgroundColor: "rgba(239,68,68,0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  deleteButtonText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "700",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDefault: {
    backgroundColor: "#6366F1",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  saveButtonIcon: { color: "#fff", fontSize: 18, fontWeight: "700" },
  buttonDisabled: { opacity: 0.6 },

  /* Camera Styles */
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  cameraHeader: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  cameraHeaderText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cameraFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 40,
    zIndex: 10,
  },
  torchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  torchText: { fontSize: 24 },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fff",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  spacer: { width: 50 },
  cameraError: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraErrorText: { color: "#fff", fontSize: 16, marginBottom: 20, fontWeight: "700" },
  closeButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  closeButtonText: { color: "#fff", fontWeight: "700" },
  optionsContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 24,
  },
  optionButton: {
    width: "100%",
    backgroundColor: "rgba(99,102,241,0.2)",
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.3)",
  },
  optionButtonCancel: {
    width: "100%",
    backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  optionIcon: { fontSize: 48, marginBottom: 12 },
  optionTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
