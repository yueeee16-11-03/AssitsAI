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
  Image,
  Modal,
} from "react-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { Camera, useCameraPermission, useCameraDevice, useCameraFormat } from "react-native-vision-camera";
import { launchImageLibrary } from "react-native-image-picker";
// Removed unused imports - now using AIProcessingOverlay for AI processing

type Props = NativeStackScreenProps<RootStackParamList, "AddIncome">;

type TransactionType = "expense" | "income";

export default function AddIncomeScreen({ navigation }: Props) {
  // Note state
  const [note, setNote] = useState("");
  const [fontStyle, setFontStyle] = useState<"title" | "regular" | "italic">("regular");
  
  // UI state
  const [isRecording, setIsRecording] = useState(false);
  const [_isLoading, _setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const [type] = useState<TransactionType>("income"); // ✅ KHÁC: income thay vì expense
  const [isInputFocused, setIsInputFocused] = useState(false);
  // (header color now fixed to green header + white icons)
  
  // 🤖 AI Processing state - now handled by AIProcessingOverlay
  const [_processedText, _setProcessedText] = useState<string | null>(null);
  const [_rawOCRText, _setRawOCRText] = useState<string | null>(null);
  const [_processingTime, _setProcessingTime] = useState<number>(0);
  const [_aiTotalAmount, _setAiTotalAmount] = useState<number | null>(null);
  const [_aiItems, _setAiItems] = useState<any[]>([]);
  const [_aiCategory, _setAiCategory] = useState<string | null>(null);
  const [_aiDescription, _setAiDescription] = useState<string | null>(null);
  
  const { hasPermission, requestPermission } = useCameraPermission();

  // ===== 🎯 PHÉP THUẬT: Bắt processedData từ ResultScreen =====
  // Note: processedData handling removed - now handled by AIProcessingOverlay

  // Get dynamic noteInput style based on fontStyle
  const getNoteInputStyle = () => {
    return {
      fontWeight: fontStyle === "title" ? "800" as const : "500" as const,
      fontStyle: fontStyle === "italic" ? "italic" as const : "normal" as const,
    };
  };

  // Cycle font style: title -> regular -> italic -> title
  const toggleFontStyle = () => {
    setFontStyle((prev) => (prev === "title" ? "regular" : prev === "regular" ? "italic" : "title"));
  };

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

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    // TODO: Implement voice recognition
    if (!isRecording) {
      setTimeout(() => {
        // Add note about what was recorded
        const voiceNote = "[Ghi âm]: Lương tháng";
        setNote(note + (note ? "\n" : "") + voiceNote);
        setIsRecording(false);
        Alert.alert("Ghi nhận giọng nói", "Đã thêm ghi chú từ giọng nói");
      }, 2000);
    }
  };

  const handleSave = async () => {
    // 🟢 VALIDATION: Note is REQUIRED
    const hasNote = note.trim();
    
    if (!hasNote) {
      Alert.alert("Lỗi", "Vui lòng nhập ghi chú để lưu");
      return;
    }

    // 🎯 NAVIGATE TO AIProcessingOverlay for processing text note
    console.log('🎯 [SCREEN] Navigating to AIProcessingOverlay with textNote...');
    navigation.navigate('AIProcessingOverlay', {
      textNote: note,
      transactionType: type,
      imageUri: billImage || undefined,
    });
  };

  const handleTakePicture = async () => {
    // Yêu cầu quyền camera
    if (!hasPermission) {
      const permission = await requestPermission();
      if (!permission) {
        Alert.alert(
          "Quyền camera bị từ chối",
          "Vui lòng cấp quyền camera trong cài đặt thiết bị để chụp ảnh hóa đơn",
          [
            {
              text: "OK",
              onPress: () => console.log("Permission denied"),
            },
          ]
        );
        return;
      }
    }
    // Mở camera
    setIsCameraOpen(true);
  };

  const handleRemoveBillImage = () => {
    setBillImage(null);
    Alert.alert("Đã xóa", "Ảnh bill đã bị xóa");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      enabled={true}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thêm thu nhập</Text>

        <TouchableOpacity
          style={[styles.voiceButton, { backgroundColor: '#FFFFFF' }]}
          onPress={handleSave}
        >
          <MaterialCommunityIcons name="check" size={18} color="#10B981" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* ScrollView for content that scrolls */}
        <ScrollView
          style={styles.scrollViewContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Note Input */}
            <View style={styles.section}>
              <TextInput
                style={[
                  styles.fullScreenInput,
                  getNoteInputStyle(),
                ]}
                placeholder="Viết ghi chú ở đây..."
                placeholderTextColor="#BBBBBB"
                value={note}
                onChangeText={setNote}
                multiline
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
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
          </Animated.View>
        </ScrollView>

        {/* Keyboard Toolbar - Only shows when input focused, automatically pushed above keyboard */}
        {isInputFocused && (
          <View style={styles.keyboardToolbar}>
            <TouchableOpacity style={styles.toolbarButton} onPress={toggleFontStyle}>
              <MaterialCommunityIcons 
                name={fontStyle === 'title' ? 'format-bold' : fontStyle === 'regular' ? 'format-size' : 'format-italic'} 
                size={16} 
                color="#111827" 
                style={styles.iconStyle}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton} onPress={handleVoiceInput}>
              <MaterialCommunityIcons 
                name={isRecording ? 'stop-circle' : 'microphone'} 
                size={16} 
                color="#111827" 
                style={styles.iconStyle}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolbarButton} onPress={handleTakePicture}>
              <MaterialCommunityIcons 
                name="camera" 
                size={16} 
                color="#111827" 
                style={styles.iconStyle}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolbarButton}
              onPress={() => {
                if (note.trim()) navigation.navigate('AIProcessingOverlay', { textNote: note, transactionType: type });
                else Alert.alert('Lỗi', 'Vui lòng nhập ghi chú trước');
              }}
            >
              <MaterialCommunityIcons 
                name="checkbox-marked-circle" 
                size={16} 
                color="#111827" 
                style={styles.iconStyle}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Camera Modal */}
      <Modal
        visible={isCameraOpen}
        animationType="slide"
        onRequestClose={() => setIsCameraOpen(false)}
      >
        <CameraScreen
          onCapture={(imageUri: string) => {
            console.log('📷 [SCREEN] Image captured:', imageUri);
            setBillImage(imageUri);
            setIsCameraOpen(false);

            // Navigate to AI Processing Overlay with income type
            navigation.navigate("AIProcessingOverlay", {
              imageUri,
              transactionType: "income",
            });
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
  const [cameraPosition, setCameraPosition] = React.useState<"back" | "front">("back");
  const device = useCameraDevice(cameraPosition);
  const camera = React.useRef<Camera>(null);
  const [permissionRequested, setPermissionRequested] = React.useState(false);
  const [torchEnabled, setTorchEnabled] = React.useState(false);

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
          flash: cameraPosition === "back" && torchEnabled ? "on" : "off",
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

  const toggleFlash = () => {
    setTorchEnabled(!torchEnabled);
  };

  const toggleCameraPosition = () => {
    setCameraPosition(cameraPosition === "back" ? "front" : "back");
    // Disable torch when switching to front camera
    if (cameraPosition === "back") {
      setTorchEnabled(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="camera" size={80} color="#10B981" />
          <Text style={styles.permissionText}>Cần quyền truy cập camera</Text>
          <Text style={styles.permissionDescription}>
            Để chụp ảnh, vui lòng cấp quyền camera cho ứng dụng
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => requestPermission()}
          >
            <Text style={styles.permissionButtonText}>Cấp quyền camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.permissionButtonCancel}
            onPress={onClose}
          >
            <Text style={styles.permissionButtonCancelText}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.permissionContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={80} color="#F59E0B" />
          <Text style={styles.permissionText}>Không tìm thấy camera</Text>
          <Text style={styles.permissionDescription}>
            Thiết bị của bạn không có camera hoặc camera không khả dụng
          </Text>
          <TouchableOpacity
            style={styles.permissionButtonCancel}
            onPress={onClose}
          >
            <Text style={styles.permissionButtonCancelText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        format={format}
        torch={cameraPosition === "back" && torchEnabled ? "on" : "off"}
      />

      {/* Top Header with Close and Camera Flip buttons */}
      <View style={styles.cameraHeader}>
        <TouchableOpacity style={styles.cameraHeaderButton} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={18} color="#374151" />
        </TouchableOpacity>
        <View style={styles.cameraHeaderTitleWrap}>
          <MaterialCommunityIcons name="qrcode-scan" size={16} color="#6B7280" style={styles.cameraHeaderIconSpacing} />
          <Text style={styles.cameraHeaderTitle}>Quét hóa đơn thu nhập</Text>
        </View>
        <TouchableOpacity style={styles.cameraHeaderButton} onPress={toggleCameraPosition}>
          <MaterialCommunityIcons name="camera-flip" size={18} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Bill Scanning Frame */}
      <View style={styles.billScanFrame}>
        <Text style={styles.billFrameText}>Căn chỉnh ảnh vào khung</Text>
      </View>

      {/* Status Bar */}
      <View style={styles.cameraStatusBar}>
        <View style={styles.statusIndicator}>
          <Text style={styles.statusText}>
            {torchEnabled ? 'Đèn: Bật' : 'Đèn: Tắt'}
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.cameraControlsBottom}>
        <TouchableOpacity
          style={styles.galleryButton}
          onPress={handlePickFromGallery}
        >
          <MaterialCommunityIcons name="image" size={28} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cameraShootButton}
          onPress={handleTakePhoto}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={36} color="#6B7280" />
        </TouchableOpacity>

        {cameraPosition === 'back' && (
          <TouchableOpacity
            style={styles.flashButton}
            onPress={toggleFlash}
          >
            <MaterialCommunityIcons name={torchEnabled ? 'flash' : 'flash-off'} size={28} color="#6B7280" />
          </TouchableOpacity>
        )}
        {cameraPosition === 'front' && (
          <View style={styles.flashButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0,
    backgroundColor: "#10B981",
  },
  
  mainContent: {
    flex: 1,
    flexDirection: "column",
    position: 'relative',
  },
  
  scrollViewContainer: {
    flex: 1,
  },
  
  scrollContent: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,137,123,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#FFFFFF" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonActive: { backgroundColor: "#EF4444" },
  voiceIcon: { fontSize: 20, color: '#FFFFFF' },
  
  section: { marginBottom: 24 },

  // full-screen style for note input (no visible box)
  fullScreenInput: {
    flex: 1,
    padding: 16,
    fontSize: 18,
    lineHeight: 26,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 420,
  },

  keyboardToolbar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 32,
    marginBottom: 0,
    backgroundColor: '#F3F4F6',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 8,
  },
  toolbarButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 4,
  },
  iconStyle: {
    opacity: 0.95,
  },

  billImageContainer: {
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(59,130,246,0.3)",
  },
  billImage: {
    width: "100%",
    height: 250,
  },
  billRemoveButton: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  billRemoveButtonText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "700",
  },

  // Camera Screen Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 20,
  },
  permissionIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 28,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  permissionButtonCancel: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  permissionButtonCancelText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    fontWeight: "700",
  },

  cameraHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 10,
  },
  cameraHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraHeaderTitle: {
    color: "#6B7280",
    fontSize: 18,
    fontWeight: "700",
  },
  cameraHeaderTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  cameraHeaderIconSpacing: { marginRight: 8 },

  billScanFrame: {
    position: "absolute",
    left: "8%",
    right: "8%",
    top: "20%",
    height: 350,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  billFrameText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4CAF50",
    textAlign: "center",
  },

  cameraStatusBar: {
    position: "absolute",
    bottom: 180,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 12,
  },
  statusIndicator: {
    backgroundColor: "rgba(59,130,246,0.2)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.4)",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B82F6",
  },

  cameraControlsBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingBottom: 20,
    zIndex: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  cameraShootButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  flashButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },

  // 🤖 AI Processed Data Styles
  aiProcessedSection: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiProcessedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aiProcessedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1976D2",
  },
  aiProcessedTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0288D1",
  },
  aiProcessedBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(33, 150, 243, 0.2)",
  },
  aiProcessedText: {
    fontSize: 13,
    color: "#1F2937",
    lineHeight: 20,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  aiDataIndicators: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(33, 150, 243, 0.1)",
  },
  indicator: {
    alignItems: "center",
    gap: 4,
  },
  indicatorIcon: {
    fontSize: 16,
    color: "#4CAF50",
    fontWeight: "700",
  },
  indicatorText: {
    fontSize: 11,
    color: "#00796B",
    fontWeight: "600",
  },
});
