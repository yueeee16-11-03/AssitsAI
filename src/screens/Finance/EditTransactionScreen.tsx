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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";
import { useTransactionStore } from "../../store/transactionStore";
import { Camera, useCameraPermission, useCameraDevice, useCameraFormat } from "react-native-vision-camera";
import { launchImageLibrary } from "react-native-image-picker";

type Props = NativeStackScreenProps<RootStackParamList, "EditTransaction">;

export default function EditTransactionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 70;
  const { transaction } = route.params;
  const [billImage, setBillImage] = useState<string | null>(transaction.billImageUri || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  // Editable AI-extracted fields
  const [aiTotalAmount, setAiTotalAmount] = useState<string>(
    transaction.totalAmount !== undefined ? String(transaction.totalAmount) : ""
  );
  const [aiCategory, setAiCategory] = useState<string>(transaction.category || "");
  const [aiItems, setAiItems] = useState<Array<{ item: string; amount: string }>>(
    (transaction.items || []).map((it: any) => ({ item: it.item || "", amount: it.amount ? String(it.amount) : "" }))
  );
  // Camera permissions handled inside CameraScreen component

  // Helpers
  const stripEmoji = (s: string) => s?.replace(/([\u{1F300}-\u{1F6FF}\u{2600}-\u{27BF}\u{1F900}-\u{1F9FF}]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF])/gu, "") || "";
  const getCategoryIcon = (cat?: string) => {
    const c = (cat || "").toLowerCase();
    if (c.includes("ăn") || c.includes("food") || c.includes("ăn uống") || c.includes("đồ ăn")) return "silverware-fork-knife";
    if (c.includes("mua") || c.includes("shop") || c.includes("đồ")) return "cart-outline";
    if (c.includes("xăng") || c.includes("petrol") || c.includes("gas")) return "fuel";
    if (c.includes("taxi") || c.includes("bus") || c.includes("xe")) return "bus";
    if (c.includes("thuê") || c.includes("service") || c.includes("dịch vụ")) return "cog-outline";
    return "tag-outline";
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  

  // Camera modal is opened directly via state elsewhere (no toolbar trigger)

  const handleRemoveBillImage = () => {
    setBillImage(null);
    Alert.alert("Đã xóa", "Ảnh bill đã bị xóa");
  };


  const handleSave = async () => {
    // ✅ Validation: cần có mô tả cũ hoặc ảnh bill
    if (!transaction.description && !billImage) {
      Alert.alert("Lỗi", "Vui lòng có ghi chú gốc hoặc chụp/chọn ảnh");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Cập nhật chỉ description & billImageUri (note-style)
      const updateData: any = {
        description: transaction.description || (billImage ? "Ảnh" : ""),
        billImageUri: billImage,
      };

      // include AI edits
      if (aiCategory) updateData.category = aiCategory;
      if (aiTotalAmount) {
        const num = Number(aiTotalAmount.replace(/[^0-9.-]/g, ""));
        if (!isNaN(num)) updateData.totalAmount = num;
      }
      if (aiItems && aiItems.length > 0) {
        updateData.items = aiItems.map((it) => ({ item: it.item, amount: Number(it.amount) || 0 }));
      }

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backIcon, { color: '#111827' }]}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa ghi chú</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(16, insets.bottom + TAB_BAR_HEIGHT) }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Note input removed per request */}

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
                  <MaterialCommunityIcons name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Original Transaction Info */}
          <View style={styles.section}>
            <View style={styles.headerRow}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color="#111827" style={styles.iconMargin} />
              <Text style={styles.infoLabel}>Thông tin gốc</Text>
            </View>
            <View style={styles.infoBox}>
              <View style={styles.aiItemRow}>
                <Text style={styles.aiItemLabel}>Loại giao dịch:</Text>
                <View style={styles.iconRowRight}>
                  <MaterialCommunityIcons name={transaction.type === "expense" ? "cash-minus" : "cash-plus"} size={14} color={transaction.type === "expense" ? "#DC2626" : "#10B981"} style={styles.iconMarginSmall} />
                  <Text style={styles.aiItemValue}>{transaction.type === "expense" ? "Chi tiêu" : "Thu nhập"}</Text>
                </View>
              </View>
              {transaction.amount > 0 && (
                <View style={styles.aiItemRow}>
                  <Text style={styles.aiItemLabel}>Số tiền:</Text>
                  <Text style={styles.aiItemValue}>
                    ₫ {transaction.amount.toLocaleString("vi-VN")}
                  </Text>
                </View>
              )}
              {transaction.category && (
                <View style={styles.aiItemRow}>
                  <Text style={styles.aiItemLabel}>Danh mục:</Text>
                  <Text style={styles.aiItemValue}>{transaction.category}</Text>
                </View>
              )}
              <View style={styles.aiItemRowLast}>
                <Text style={styles.aiItemLabel}>Ngày:</Text>
                <Text style={styles.aiItemValue}>
                  {new Date(transaction.createdAt?.toDate?.() || transaction.createdAt).toLocaleDateString("vi-VN")}
                </Text>
              </View>
            </View>
          </View>

          {/* AI Extracted Data */}
          {(transaction.totalAmount !== undefined || transaction.items?.length > 0 || transaction.category) && (
            <View style={styles.section}>
              <View style={styles.headerRow}>
                <MaterialCommunityIcons name="robot" size={18} color="#111827" style={styles.iconMargin} />
                <Text style={styles.infoLabel}>Thông tin xử lý AI</Text>
              </View>
              <View style={styles.aiSection}>
                {/* Editable Total Amount */}
                <View style={styles.aiItemRow}>
                  <Text style={styles.aiItemLabel}>Tổng tiền (AI):</Text>
                  <TextInput
                    style={styles.aiInput}
                    value={aiTotalAmount}
                    onChangeText={setAiTotalAmount}
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                {/* Editable Category (pill + icon) */}
                <View style={styles.aiItemRow}>
                  <Text style={styles.aiItemLabel}>Danh mục (AI):</Text>
                  <View style={styles.categoryPill}>
                    <TextInput
                      style={styles.aiInputInner}
                      value={stripEmoji(aiCategory)}
                      onChangeText={(t) => setAiCategory(stripEmoji(t))}
                      placeholder="Nhập danh mục"
                      underlineColorAndroid="transparent"
                    />
                    <MaterialCommunityIcons
                      name={getCategoryIcon(aiCategory)}
                      size={18}
                      color="#00897B"
                      style={styles.categoryIcon}
                    />
                  </View>
                </View>

                {/* Editable Items */}
                <View style={styles.itemsBreakdown}>
                  <View style={styles.headerRow}>
                    <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#111827" style={styles.iconMargin} />
                    <Text style={styles.itemsTitle}>Chi tiết các mục</Text>
                  </View>
                  {aiItems.map((it, idx) => (
                    <View key={idx} style={styles.itemInputRow}>
                      <TextInput
                        style={styles.itemInput}
                        value={it.item}
                        onChangeText={(text) => {
                          const copy = [...aiItems];
                          copy[idx] = { ...copy[idx], item: text };
                          setAiItems(copy);
                        }}
                        placeholder="Mục"
                      />
                      <TextInput
                        style={styles.itemAmountInput}
                        value={it.amount}
                        onChangeText={(text) => {
                          const copy = [...aiItems];
                          copy[idx] = { ...copy[idx], amount: text };
                          setAiItems(copy);
                        }}
                        placeholder="0"
                        keyboardType="numeric"
                      />
                      <TouchableOpacity
                        style={styles.itemRemoveButton}
                        onPress={() => {
                          const copy = aiItems.filter((_, i) => i !== idx);
                          setAiItems(copy);
                        }}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#111827" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[styles.addItemButton, styles.addItemButtonRow]}
                    onPress={() => setAiItems([...aiItems, { item: "", amount: "" }])}
                  >
                    <MaterialCommunityIcons name="plus-circle-outline" size={16} color="#00897B" style={styles.iconMargin} />
                    <Text style={styles.addItemText}>Thêm mục</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

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
                <View style={styles.iconRow}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#111827" style={styles.iconMargin} />
                  <Text style={styles.deleteButtonText}>Xóa ghi chú</Text>
                </View>
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
                <View style={styles.iconRow}>
                  <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
                  <MaterialCommunityIcons name="check" size={16} color="#fff" style={styles.iconMargin} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
        <View style={{ height: insets.bottom + TAB_BAR_HEIGHT }} />
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
    </SafeAreaView>
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
        <View style={styles.iconRow}>
          <MaterialCommunityIcons name="camera-off" size={20} color="#fff" style={styles.iconMargin} />
          <Text style={styles.cameraErrorText}>Camera không khả dụng</Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.cameraError}>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons name="lock" size={20} color="#fff" style={styles.iconMargin} />
          <Text style={styles.cameraErrorText}>Cần cấp quyền camera</Text>
        </View>
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
          <MaterialCommunityIcons name="camera" size={48} color="#fff" style={styles.optionIcon} />
          <Text style={styles.optionTitle}>Chụp ảnh</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={handlePickFromGallery}>
          <MaterialCommunityIcons name="image" size={48} color="#fff" style={styles.optionIcon} />
          <Text style={styles.optionTitle}>Từ thư viện</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButtonCancel} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={18} color="#fff" style={styles.iconMargin} />
          <Text style={styles.optionTitle}>Hủy</Text>
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
          <MaterialCommunityIcons name={torchEnabled ? "flash" : "lightbulb"} size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto} />
        <View style={styles.spacer} />
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
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#111827" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  placeholderButton: { width: 40, height: 40 },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 137, 123, 0.2)",
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
    color: "#00796B",
  },
  fontSizeControl: {
    flexDirection: "row",
    gap: 8,
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(0, 137, 123, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 137, 123, 0.15)",
  },
  fontButtonActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  fontButtonSmall: { fontSize: 12, fontWeight: "700", color: "#00796B" },
  fontButtonMedium: { fontSize: 14, fontWeight: "700", color: "#00796B" },
  fontButtonLarge: { fontSize: 16, fontWeight: "700", color: "#00796B" },
  noteInput: {
    backgroundColor: "rgba(0, 137, 123, 0.06)",
    borderRadius: 16,
    padding: 16,
    color: "#00796B",
    borderWidth: 1,
    borderColor: "rgba(0, 137, 123, 0.15)",
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
    backgroundColor: "rgba(0, 137, 123, 0.06)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 137, 123, 0.15)",
  },
  toolbarIcon: { fontSize: 20 },
  billImageContainer: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0, 137, 123, 0.06)",
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
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 0,
  },
  infoBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  infoText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00796B",
    marginBottom: 4,
  },
  infoAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: "#00796B",
    marginBottom: 4,
  },
  infoDate: {
    fontSize: 12,
    color: "#999999",
  },
  aiSection: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 12,
  },
  aiItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(99, 102, 241, 0.1)",
  },
  aiItemRowLast: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0,
  },
  aiItemLabel: {
    fontSize: 12,
    color: "#111827",
  },
  aiItemValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  itemsBreakdown: {
    backgroundColor: "rgba(99, 102, 241, 0.08)",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  aiInput: {
    minWidth: 120,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    color: "#111827",
    textAlign: "right",
  },
  itemInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  itemInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    marginRight: 8,
  },
  itemAmountInput: {
    width: 100,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    textAlign: "right",
    marginRight: 8,
  },
  addItemButton: {
    marginTop: 8,
    alignItems: "center",
  },
  addItemText: { color: "#00897B", fontWeight: "700" },
  addItemButtonRow: { flexDirection: 'row', alignItems: 'center' },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    minWidth: 140,
  },
  aiInputInner: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 6,
    color: '#111827',
  },
  categoryIcon: { marginLeft: 8 },
  itemRemoveButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginLeft: 8,
  },
  itemsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366F1",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  itemName: {
    fontSize: 12,
    color: "#111827",
  },
  itemAmount: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  deleteButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  deleteButtonText: {
    color: "#111827",
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
    backgroundColor: "#00897B",
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
  iconRow: { flexDirection: 'row', alignItems: 'center' },
  iconMargin: { marginRight: 8 },
  iconMarginSmall: { marginRight: 6 },
  iconRowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
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
