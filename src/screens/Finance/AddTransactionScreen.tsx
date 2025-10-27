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
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { Camera, useCameraPermission, useCameraDevice, useCameraFormat } from "react-native-vision-camera";
import TransactionService from "../../services/TransactionService";
import { useTransactionStore } from "../../store/transactionStore";

type Props = NativeStackScreenProps<RootStackParamList, "AddTransaction">;

type TransactionType = "expense" | "income";

interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
}

export default function AddTransactionScreen({ navigation, route }: Props) {
  // route.params may be untyped in RootStackParamList; cast safely to avoid TS errors
  const params = (route?.params ?? {}) as { defaultType?: TransactionType };
  const defaultTypeFromRoute = params.defaultType;
  const [type, setType] = useState<TransactionType>(defaultTypeFromRoute ?? "expense");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [note, setNote] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const { hasPermission, requestPermission } = useCameraPermission();

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

  const handleSave = async () => {
    // Validation
    if (!amount.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Lỗi", "Vui lòng chọn danh mục");
      return;
    }

    if (!note.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mô tả giao dịch");
      return;
    }

    setIsLoading(true);

    try {
      // Get category name from local array
      const allCategories = type === "expense" ? expenseCategories : incomeCategories;
      const selectedCategoryObj = allCategories.find(cat => cat.id === selectedCategory);
      const categoryName = selectedCategoryObj?.name || "Khác";

      // Create transaction object using Service
      const formData = {
        type,
        amount,
        categoryId: selectedCategory,
        categoryName,
        description: note,
        billImageUri: billImage,
      };

      const transactionObj = TransactionService.createTransactionObject(formData);
      
      console.log('💾 [SCREEN] Saving transaction:', transactionObj);

      // Use Store to add transaction (which uses Service internally)
      const addTransaction = useTransactionStore.getState().addTransaction;
      await addTransaction(transactionObj);

      Alert.alert("Thành công", "Đã lưu giao dịch", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setAmount("");
            setSelectedCategory("");
            setNote("");
            setBillImage(null);
            // Go back to FinanceDashboard
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Error saving transaction:", error);
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Không thể lưu giao dịch. Vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (text: string) => {
    return TransactionService.formatAmount(text);
  };

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    setAmount(cleaned);
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
          {/* Camera Button - Scan Bill */}
          {!billImage && (
            <TouchableOpacity
              style={styles.billCameraButton}
              onPress={handleTakePicture}
            >
              <View style={styles.billCameraIconWrapper}>
                <Text style={styles.cameraIconSymbol}>📸</Text>
              </View>
              <View style={styles.billCameraContent}>
                <Text style={styles.billCameraTitle}>Quét Bill</Text>
                <Text style={styles.billCameraSubtitle}>Truy cập camera để chụp ảnh hóa đơn</Text>
              </View>
              <Text style={styles.billCameraArrow}>→</Text>
            </TouchableOpacity>
          )}

          {/* Bill Image Display */}
          {billImage && (
            <View style={styles.billImageContainer}>
              <Image
                source={{ uri: billImage }}
                style={styles.billImage}
              />
              <View style={styles.billImageOverlay}>
                <Text style={styles.billImageStatus}>✓ Ảnh hóa đơn đã được quét</Text>
                <TouchableOpacity
                  style={styles.billRemoveButton}
                  onPress={handleRemoveBillImage}
                >
                  <Text style={styles.billRemoveButtonText}>✕ Xóa</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.billProcessingNote}>💡 Sẵn sàng để xử lý bằng AI khi lưu giao dịch</Text>
            </View>
          )}

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
                {parseInt(amount, 10) > 1000000
                  ? `≈ ${(parseInt(amount, 10) / 1000000).toFixed(1)} triệu đồng`
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
                  {parseInt(quickAmount, 10) >= 1000000
                    ? `${parseInt(quickAmount, 10) / 1000000}M`
                    : `${parseInt(quickAmount, 10) / 1000}K`}
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

          {/* Date and Time Display - Read Only */}
          <View style={styles.section}>
            <Text style={styles.label}>Ngày và giờ giao dịch</Text>
            <View style={styles.dateTimeDisplayCard}>
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeIcon}>📅 🕐</Text>
                <View style={styles.dateTimeTextContainer}>
                  <Text style={styles.dateTimeLabel}>Thời gian hiện tại</Text>
                  <Text style={styles.dateTimeValue}>
                    {new Date().toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}{" "}
                    · {String(new Date().getHours()).padStart(2, "0")}:
                    {String(new Date().getMinutes()).padStart(2, "0")}
                  </Text>
                </View>
              </View>
              <View style={styles.dateTimeStatus}>
                <Text style={styles.dateTimeStatusText}>✓ Tự động</Text>
              </View>
            </View>
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
              isLoading && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>Lưu giao dịch</Text>
                <Text style={styles.saveButtonIcon}>✓</Text>
              </>
            )}
          </TouchableOpacity>
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
            Alert.alert("Thành công", "Ảnh bill đã được chụp. Sẵn sàng để xử lý bằng AI");
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

  const toggleFlash = () => {
    setTorchEnabled(!torchEnabled);
  };

  if (!hasPermission) {
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionText}>Cần quyền truy cập camera</Text>
          <Text style={styles.permissionDescription}>
            Để chụp ảnh hóa đơn, vui lòng cấp quyền camera cho ứng dụng
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => requestPermission()}
          >
            <Text style={styles.permissionButtonText}>🔒 Cấp quyền camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.permissionButtonCancel}
            onPress={onClose}
          >
            <Text style={styles.permissionButtonCancelText}>✕ Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>⚠️</Text>
          <Text style={styles.permissionText}>Không tìm thấy camera</Text>
          <Text style={styles.permissionDescription}>
            Thiết bị của bạn không có camera hoặc camera không khả dụng
          </Text>
          <TouchableOpacity
            style={styles.permissionButtonCancel}
            onPress={onClose}
          >
            <Text style={styles.permissionButtonCancelText}>✕ Đóng</Text>
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
        torch={torchEnabled ? "on" : "off"}
      />

      {/* Dark overlay */}
      <View style={styles.cameraOverlay} />

      {/* Top Header */}
      <View style={styles.cameraHeader}>
        <TouchableOpacity style={styles.cameraHeaderButton} onPress={onClose}>
          <Text style={styles.cameraHeaderIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.cameraHeaderTitle}>📸 Quét Hóa Đơn</Text>
        <TouchableOpacity style={styles.cameraHeaderButton} onPress={toggleFlash}>
          <Text style={styles.cameraHeaderIcon}>
            {torchEnabled ? "�" : "�"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bill Scanning Frame */}
      <View style={styles.billScanFrame}>
        <View style={styles.billFrameCorner} />
        <View style={[styles.billFrameCorner, styles.billFrameCornerTopRight]} />
        <View style={[styles.billFrameCorner, styles.billFrameCornerBottomLeft]} />
        <View style={[styles.billFrameCorner, styles.billFrameCornerBottomRight]} />
        <Text style={styles.billFrameText}>Căn chỉnh hóa đơn vào khung</Text>
      </View>

      {/* Status Bar */}
      <View style={styles.cameraStatusBar}>
        <View style={styles.statusIndicator}>
          <Text style={styles.statusText}>
            {torchEnabled ? "� Đèn bật" : "� Đèn tắt"}
          </Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.cameraControlsBottom}>
        <TouchableOpacity
          style={styles.cameraCancelButton}
          onPress={onClose}
        >
          <Text style={styles.cameraCancelText}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cameraShootButton}
          onPress={handleTakePhoto}
        >
          <View style={styles.cameraShootInner} />
        </TouchableOpacity>

        <View style={styles.emptySpace} />
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
    marginBottom: 12,
  },
  dateIcon: { fontSize: 24, marginRight: 12 },
  dateContent: {
    flex: 1,
  },
  dateDay: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  dateFullText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "700" 
  },
  dateArrow: { 
    fontSize: 18, 
    color: "rgba(255,255,255,0.5)" 
  },
  
  // Date Time Display - Read Only
  dateTimeDisplayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(16,185,129,0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.3)",
  },
  dateTimeContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateTimeIcon: {
    fontSize: 28,
  },
  dateTimeTextContainer: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
    fontWeight: "600",
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  dateTimeStatus: {
    backgroundColor: "rgba(16,185,129,0.25)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dateTimeStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
  },
  
  // Premium Time Picker Styles (kept for reference but hidden)
  timePickerCard: {
    backgroundColor: "rgba(99,102,241,0.08)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.25)",
    overflow: "hidden",
  },
  timePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99,102,241,0.15)",
  },
  timePickerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.8)",
  },
  timeDisplay: {
    backgroundColor: "rgba(99,102,241,0.3)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  timeDisplayText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#6366F1",
  },
  timePickerBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 0,
  },
  timeSection: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  timeMinusButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.3)",
  },
  timeMinusButtonText: {
    color: "#6366F1",
    fontSize: 24,
    fontWeight: "700",
  },
  timeValueContainer: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.3)",
    paddingHorizontal: 2,
  },
  timeValueInput: {
    width: 60,
    height: 48,
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  timePlusButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(99,102,241,0.5)",
  },
  timePlusButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  timeSeparatorContainer: {
    marginHorizontal: 4,
  },
  timeSeparatorText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#6366F1",
  },
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: { color: "#fff", fontSize: 17, fontWeight: "700", marginRight: 8 },
  saveButtonIcon: { color: "#fff", fontSize: 20, fontWeight: "700" },

  // Bill Camera Styles
  billCameraButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(16,185,129,0.15)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.3)",
  },
  billCameraIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(16,185,129,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.5)",
  },
  cameraIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: "rgba(59,130,246,0.5)",
  },
  cameraIconSymbol: {
    fontSize: 28,
    color: "#10B981",
    fontWeight: "700",
  },
  billCameraContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  billCameraTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#10B981",
    marginBottom: 2,
  },
  billCameraSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
  billCameraArrow: {
    fontSize: 20,
    color: "#10B981",
    fontWeight: "700",
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
  billImageOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "rgba(59,130,246,0.2)",
  },
  billImageStatus: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3B82F6",
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
  billProcessingNote: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(59,130,246,0.1)",
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
    backgroundColor: "#0A0E27",
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

  // New Professional Camera Styles
  cameraHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  cameraHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraHeaderIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
  },
  cameraHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },

  billScanFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -120,
    marginLeft: -100,
    width: 200,
    height: 240,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59,130,246,0.05)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 5,
  },
  billFrameCorner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#3B82F6",
    top: -2,
    left: -2,
  },
  billFrameCornerTopRight: {
    top: -2,
    left: "auto",
    right: -2,
    borderLeftWidth: 0,
  },
  billFrameCornerBottomLeft: {
    top: "auto",
    bottom: -2,
    borderTopWidth: 0,
  },
  billFrameCornerBottomRight: {
    top: "auto",
    bottom: -2,
    left: "auto",
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  billFrameText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B82F6",
    textAlign: "center",
    marginTop: 8,
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

  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    pointerEvents: "none",
    zIndex: 1,
  },
  cameraFrame: {
    width: 280,
    height: 380,
    borderWidth: 2,
    borderColor: "#3B82F6",
    borderRadius: 20,
    backgroundColor: "transparent",
    shadowColor: "rgba(59,130,246,0.3)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  cameraControlsBottom: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  cameraCancelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(239,68,68,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(239,68,68,0.5)",
  },
  cameraCancelText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "700",
  },
  cameraShootButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(59,130,246,0.3)",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 12,
  },
  cameraShootInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cameraHint: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 12,
  },
  cameraHintText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  emptySpace: {
    width: 50,
  },
});
