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
// DateTimePicker removed - inline selection no longer used
import TransactionService from '../../services/TransactionService';
import firestore from '@react-native-firebase/firestore';
import { useTransactionStore } from "../../store/transactionStore";
import { launchImageLibrary } from "react-native-image-picker";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";

type Props = NativeStackScreenProps<RootStackParamList, "AddTransaction">;

type TransactionType = "expense" | "income";

export default function AddTransactionScreen({ navigation }: Props) {
  // Note state
  const [note, setNote] = useState("");
  const [fontStyle, setFontStyle] = useState<"title" | "regular" | "italic">("regular");
  
  // Voice recognition hook
  const { isRecording, isProcessing, transcript, startRecording, stopRecording, clearTranscript } = useVoiceRecognition();
  
  // UI state
  const [_isLoading, _setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [billImage, setBillImage] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [successBannerAnim] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);
  const [successText, setSuccessText] = useState('');
  const [type] = useState<TransactionType>("expense"); // Default type for note-style
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [_recordingDuration, _setRecordingDuration] = useState(0);
  // (header color now fixed to green header + white icons)
  
  // Manual form state
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  // Date/time pickers removed: selectedTime will be auto-populated when opening the form
  // (Previously hourScrollRef removed -- we now use native time spinner)
  const [merchant, setMerchant] = useState<string>("");
  
  // 🤖 AI Processing state - now handled by AIProcessingOverlay
  const [_processedText, _setProcessedText] = useState<string | null>(null);
  const [_rawOCRText, _setRawOCRText] = useState<string | null>(null);
  const [_processingTime, _setProcessingTime] = useState<number>(0);
  const [_aiTotalAmount, _setAiTotalAmount] = useState<number | null>(null);
  const [_aiItems, _setAiItems] = useState<any[]>([]);
  const [_aiCategory, _setAiCategory] = useState<string | null>(null);
  const [_aiDescription, _setAiDescription] = useState<string | null>(null);
  
  const { hasPermission, requestPermission } = useCameraPermission();
  const transactions = useTransactionStore((s) => s.transactions);
  // Only use expense transactions for templates (exclude income templates)
  const expenseTemplates = (transactions || []).filter((tx: any) => String(tx.type || '').toLowerCase() === 'expense');
  const fetchTransactions = useTransactionStore((s) => s.fetchTransactions);
  const addTransaction = useTransactionStore((s) => s.addTransaction);

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

  // No hourScrollRef: time will be auto-selected when opening the manual form.
  // Fade animation
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Setup Voice recognition listeners on component mount - REMOVED
  // Voice functionality no longer used

  // 🎤 Lắng nghe kết quả phiên âm từ hook
  React.useEffect(() => {
    if (transcript && !isRecording && !isProcessing) {
      // Tự động thêm transcript vào note
      setNote(prevNote => {
        const newNote = prevNote + (prevNote ? "\n" : "") + transcript;
        setSuccessText(`Đã thêm: "${transcript}"`);
        setShowSuccess(true);
        Animated.timing(successBannerAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        setTimeout(() => {
          Animated.timing(successBannerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setShowSuccess(false));
        }, 2000);
        clearTranscript();
        return newNote;
      });
    }
  }, [transcript, isRecording, isProcessing, clearTranscript, successBannerAnim]);

  // Voice input removed - only icon remains
  
  /**
   * 🤖 Xử lý NOTE với TextAIProcessingService
   * (Hàm này đã được sửa lại trong onPress của nút ✨)
   */
  // const handleProcessNoteWithAI = ... (Đã chuyển logic vào onPress)

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

  // Handle voice recording toggle
  const handleVoiceButton = async () => {
    if (isRecording) {
      // Stop recording and get transcript
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
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
          <MaterialCommunityIcons name="arrow-left" size={20} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Thêm chi tiêu</Text>

        <TouchableOpacity
          style={styles.saveButtonHeader}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonHeaderText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {showSuccess && (
          <Animated.View style={[styles.successBanner, { opacity: successBannerAnim }]}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#065F46" />
            <View style={styles.successBannerContent}>
              <Text style={styles.successBannerTitle}>Thành công</Text>
              <Text style={styles.successBannerText}>{successText}</Text>
            </View>
          </Animated.View>
        )}
        <ScrollView
          style={styles.scrollViewContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Recording Status Indicator */}
            {(isRecording || isProcessing) && (
              <View style={styles.recordingIndicator}>
                <MaterialCommunityIcons
                  name={isRecording ? 'microphone' : 'progress-clock'}
                  size={18}
                  color="#065F46"
                />
                <Text style={styles.recordingText}>
                  {isRecording ? 'Đang ghi âm...' : 'Đang xử lý...'}
                </Text>
              </View>
            )}

            {/* Transcript Preview */}
            {transcript && !isRecording && !isProcessing && (
              <View style={styles.transcriptPreview}>
                <View style={styles.rowCenter}>
                  <MaterialCommunityIcons name="file-document-outline" size={16} color="#1F2937" />
                  <Text style={[styles.transcriptPreviewTitle, styles.transcriptTitleMargin]}>Kết quả phiên âm:</Text>
                </View>
                <Text style={styles.transcriptPreviewText}>{transcript}</Text>
                <TouchableOpacity
                  style={styles.clearTranscriptButton}
                  onPress={() => {
                    clearTranscript();
                  }}
                >
                  <Text style={styles.clearTranscriptButtonText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Note Input */}
            <View style={styles.section}>
              <TextInput
                style={[styles.fullScreenInput, getNoteInputStyle()]}
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
                    <MaterialCommunityIcons name="close" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Floating Form Toggle Button - Bottom Right */}
        <TouchableOpacity
          style={styles.floatingFormButton}
          onPress={() => {
            if (!showManualForm) {
              const now = new Date();
              const formatted = `${now.toLocaleDateString('vi-VN')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
              setSelectedTime(formatted);
            }
            setShowManualForm(!showManualForm);
          }}
        >
          <MaterialCommunityIcons
            name={showManualForm ? "close" : "plus"}
            size={28}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Keyboard Toolbar - Only shows when input focused, automatically pushed above keyboard */}
        {isInputFocused && (
          <View style={styles.keyboardToolbar}>
            <TouchableOpacity onPress={toggleFontStyle}>
              <MaterialCommunityIcons 
                name={fontStyle === 'title' ? 'format-bold' : fontStyle === 'regular' ? 'format-size' : 'format-italic'} 
                size={28} 
                color="#6B7280" 
                style={styles.iconStyle}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleVoiceButton}>
              <MaterialCommunityIcons 
                name={isRecording ? "stop-circle" : "microphone-outline"} 
                size={28} 
                color={isRecording ? "#EF4444" : "#6B7280"} 
                style={styles.iconStyle}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleTakePicture}>
              <MaterialCommunityIcons 
                name="camera-outline" 
                size={28} 
                color="#6B7280" 
                style={styles.iconStyle}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (note.trim()) navigation.navigate('AIProcessingOverlay', { textNote: note, transactionType: type });
                else Alert.alert('Lỗi', 'Vui lòng nhập ghi chú trước');
              }}
            >
              <MaterialCommunityIcons 
                name="check-circle-outline" 
                size={28} 
                color="#6B7280" 
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

            // Navigate to AI Processing Overlay with expense type (same as HomeScreen)
            navigation.navigate("AIProcessingOverlay", {
              imageUri,
              transactionType: "expense",
            });
          }}
          onClose={() => setIsCameraOpen(false)}
        />
      </Modal>

      {/* Manual Entry Form - Full Screen Modal */}
      <Modal
        visible={showManualForm}
        animationType="slide"
        onRequestClose={() => setShowManualForm(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowManualForm(false)}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thêm Chi Tiêu</Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Template (Mẫu giao dịch) Toggle */}
            <TouchableOpacity
              style={[
                styles.aiToggleButton,
                showTemplateForm && styles.aiToggleButtonActive,
              ]}
              onPress={() => {
                if (showTemplateForm) {
                  // Closing template form - reset
                  setManualAmount("");
                  setSelectedCategory(null);
                  setSelectedTime(null);
                  setMerchant("");
                } else {
                  // Open template form and fetch recent transactions
                  fetchTransactions().catch(() => {});
                }
                setShowTemplateForm(!showTemplateForm);
              }}
            >
              <MaterialCommunityIcons
                name={showTemplateForm ? "file-document" : "file-document-outline"}
                size={16}
                color={showTemplateForm ? "#FFFFFF" : "#6B7280"}
              />
              <Text
                style={[
                  styles.aiToggleText,
                  showTemplateForm && styles.aiToggleTextActive,
                ]}
              >
                {showTemplateForm ? "Sử dụng mẫu: Bật" : "Sử dụng mẫu: Tắt"}
              </Text>
            </TouchableOpacity>

            {/* Template (Mẫu) Form Display */}
            {showTemplateForm && (
              <View style={styles.aiSuggestionsBox}>
                <View style={styles.aiSuggestionsHeader}>
                  <MaterialCommunityIcons name="clipboard-text" size={18} color="#6366F1" />
                  <Text style={[styles.aiSuggestionsTitle, styles.templateTitle]}>Mẫu giao dịch</Text>
                  <MaterialCommunityIcons name="file" size={18} color="#10B981" />
                </View>
                <View style={[styles.aiSuggestionsContent, styles.templateContent]}> 
                  <Text style={styles.suggestionLabel}>Chọn mẫu từ giao dịch gần đây:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                    {expenseTemplates && expenseTemplates.slice(0, 8).map((tx: any) => (
                      <TouchableOpacity
                        key={tx.id}
                        style={[styles.suggestionCard, styles.templateCard]}
                        onPress={() => {
                          // Prefill fields from selected transaction
                          setMerchant(tx.description || '');
                          setManualAmount(String(tx.amount || ''));
                          setSelectedCategory(tx.categoryId || tx.category || null);
                          try {
                            const d = tx.date?.toDate ? tx.date.toDate() : new Date(tx.date || tx.createdAt);
                            setSelectedTime(`${d.toLocaleDateString('vi-VN')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                          } catch (e) {
                            console.warn('Failed to parse transaction date', e);
                            setSelectedTime(null);
                          }
                        }}
                      >
                        <Text style={styles.suggestionName}>{tx.description || 'Giao dịch'}</Text>
                        <Text style={styles.suggestionValue}>{(tx.amount || 0).toLocaleString('vi-VN')} VNĐ</Text>
                        <Text style={styles.suggestionLabel}>{tx.category || tx.categoryId || ''}</Text>
                      </TouchableOpacity>
                    ))}
                    {(!expenseTemplates || expenseTemplates.length === 0) && (
                      <View style={styles.templateEmptyContainer}>
                        <Text style={styles.templateEmptyText}>Không có mẫu chi tiêu gần đây</Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* Template-specific merchant input removed; merchant field shown below */}
                </View>
              </View>
            )}

            {/* Amount Input */}
            {/* Merchant / Description Input */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Mô tả (Merchant)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Đi chơi, ăn uống..."
                placeholderTextColor="#D1D5DB"
                value={merchant}
                onChangeText={setMerchant}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Số tiền</Text>
              <View style={styles.amountInputField}>
                <Text style={styles.currencyPrefix}>VNĐ</Text>
                <TextInput
                  style={styles.amountFieldInput}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                  value={manualAmount}
                  onChangeText={setManualAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Category Selector */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Danh mục</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {[
                  { id: "1", name: "Ăn uống", icon: "food" },
                  { id: "2", name: "Xe cộ", icon: "car" },
                  { id: "3", name: "Mua sắm", icon: "shopping-bag" },
                  { id: "4", name: "Giải trí", icon: "gamepad-variant" },
                  { id: "5", name: "Y tế", icon: "hospital-box" },
                  { id: "6", name: "Học tập", icon: "book" },
                  { id: "7", name: "Nhà ở", icon: "home" },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryPill,
                      selectedCategory === category.id && styles.categoryPillActive,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={16}
                      color={selectedCategory === category.id ? "#FFFFFF" : "#6B7280"}
                    />
                    <Text
                      style={[
                        styles.categoryPillText,
                        selectedCategory === category.id && styles.categoryPillTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Time Selector (read-only) */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Thời gian</Text>
              <View style={[
                styles.timePickerButton,
                selectedTime && styles.timePickerButtonActive,
              ]}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={18}
                  color={selectedTime ? "#FFFFFF" : "#6B7280"}
                />
                <Text
                  style={[
                    styles.timePickerButtonText,
                    selectedTime && styles.timePickerButtonTextActive,
                  ]}
                >
                  {selectedTime || "Tự động chọn giờ hiện tại"}
                </Text>
              </View>
            </View>


          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowManualForm(false)}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, showTemplateForm && styles.submitButtonTemplateActive]}
              onPress={async () => {
                if (manualAmount && selectedCategory) {
                  const categoryMap = [
                    { id: "1", name: "Ăn uống" },
                    { id: "2", name: "Xe cộ" },
                    { id: "3", name: "Mua sắm" },
                    { id: "4", name: "Giải trí" },
                    { id: "5", name: "Y tế" },
                    { id: "6", name: "Học tập" },
                    { id: "7", name: "Nhà ở" },
                  ];
                  const categoryName = categoryMap.find((c) => c.id === selectedCategory)?.name || "";

                  const formData: any = {
                    type: 'expense',
                    amount: String(manualAmount),
                    description: merchant || note || `[${categoryName}] ${manualAmount} VNĐ`,
                    categoryId: selectedCategory,
                    categoryName,
                    billImageUri: billImage || null,
                  };

                  // Parse selectedTime (if present) - format: DD/MM/YYYY HH:mm
                  if (selectedTime) {
                    try {
                      const [datePart, timePart] = selectedTime.split(' ');
                      const [d, m, y] = datePart.split('/');
                      const [hh, min] = (timePart || '00:00').split(':');
                      const parsed = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), parseInt(hh, 10), parseInt(min, 10));
                      formData.date = firestore.Timestamp.fromDate(parsed);
                    } catch (e) {
                      console.warn('Failed to parse selectedTime', e);
                    }
                  }

                  try {
                    const txObj = TransactionService.createTransactionObject(formData);
                    await addTransaction(txObj);

                    // Clear inputs
                    setManualAmount("");
                    setSelectedCategory(null);
                    setMerchant("");
                    setShowManualForm(false);

                    // Navigate back to Home screen
                    navigation.navigate('Home');

                    Alert.alert('Thành công', 'Đã lưu giao dịch (chi tiêu)');
                  } catch (err) {
                    console.error('Error saving transaction:', err);
                    Alert.alert('Lỗi', 'Không thể lưu giao dịch: ' + (((err as any)?.message) || 'Không xác định'));
                  }
                } else {
                  Alert.alert('Lỗi', 'Vui lòng nhập số tiền và chọn danh mục');
                }
              }}
            >
              <Text style={[styles.submitButtonText, showTemplateForm && styles.submitButtonTextTemplateActive]}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

        {/* Date/time pickers removed — selectedTime is auto-set on opening the form */}


    </KeyboardAvoidingView>
  );
}

// ... (Toàn bộ component CameraScreen và styles giữ nguyên)

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
            Để chụp ảnh hóa đơn, vui lòng cấp quyền camera cho ứng dụng
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
          <Text style={styles.cameraHeaderTitle}>Quét hóa đơn chi tiêu</Text>
        </View>
        <TouchableOpacity style={styles.cameraHeaderButton} onPress={toggleCameraPosition}>
          <MaterialCommunityIcons name="camera-flip" size={18} color="#374151" />
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

// ... (Toàn bộ styles giữ nguyên)
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
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: "#FFFFFF",
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
  
  // Options Screen Styles
  optionsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#E0F2F1",
  },
  optionsTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00796B",
    marginBottom: 30,
    textAlign: "center",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,137,123,0.1)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: "rgba(0,137,123,0.3)",
    width: "100%",
  },
  optionButtonCancel: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: "rgba(239,68,68,0.3)",
    marginTop: 20,
  },
  optionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionButtonTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#00796B",
    marginBottom: 2,
  },
  optionButtonDesc: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
  },
  optionArrow: {
    fontSize: 20,
    color: "#00897B",
    marginLeft: 10,
  },
  
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: { fontSize: 20, color: "#111827" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  saveButtonHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
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
    color: "#00796B",
    marginBottom: 12,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "#B2DFDB",
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00897B",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: "#00897B",
    paddingVertical: 14,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    color: "#111827",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    textAlignVertical: "top",
    minHeight: 100,
  },

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

  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  fontStyleControl: {
    flexDirection: "row",
    gap: 8,
  },
  fontButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#B2DFDB",
  },
  fontButtonActive: {
    backgroundColor: "#00897B",
    borderColor: "#00897B",
  },
  fontButtonText: {
    fontWeight: "700",
    color: "#00796B",
    fontSize: 12,
  },
  fontButtonTextActive: {
    color: "#fff",
  },
  fontButtonBold: {
    fontWeight: "800",
  },
  fontButtonItalic: {
    fontStyle: "italic",
  },
  noteToolbar: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,           // reduced to lift the icon row slightly
    paddingTop: 8,
    marginBottom: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
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
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "#FFFBF0",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 4,
  },
  toolbarButtonProcessing: {
    backgroundColor: "rgba(99,102,241,0.2)",
    borderColor: "#6366F1",
  },
  toolbarIcon: {
    fontSize: 14,
    fontWeight: "700",
  },
  iconStyle: {
    opacity: 0.95,
  },
  checklistInputContainer: {
    flexDirection: "row",
    gap: 8,
  },
  checklistInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  addChecklistButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  addChecklistButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 10,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#6366F1",
  },
  checkboxText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  checklistItemText: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  checklistItemTextChecked: {
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "line-through",
  },
  deleteChecklistButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  deleteChecklistText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "700",
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
  saveButtonDefault: {
    backgroundColor: "#00897B",
    shadowColor: "#00897B",
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

  // New Professional Camera Styles
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
  cameraHeaderIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
  },
  cameraHeaderTitle: {
    color: "#6B7280",
    fontSize: 18,
    fontWeight: "700",
  },
  cameraHeaderTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  cameraHeaderSide: { width: 40 },
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
  billFrameCorner: {
    display: "none",
  },
  billFrameCornerTopRight: {
    display: "none",
  },
  billFrameCornerBottomLeft: {
    display: "none",
  },
  billFrameCornerBottomRight: {
    display: "none",
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
    backgroundColor: "#FFFFFF",
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
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

  // small placeholder for header balance
  headerPlaceholder: {
    width: 40,
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

  // AI Extracted Data Styles
  aiExtractedDataSection: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiExtractedHeader: {
    marginBottom: 12,
  },
  aiExtractedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
  },
  aiExtractedBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  aiExtractedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  aiExtractedLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  aiExtractedValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  aiExtractedValueTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#059669",
  },
  aiExtractedDivider: {
    height: 1,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    marginVertical: 8,
  },
  aiExtractedNote: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  aiExtractedNoteText: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },

  // Manual Form Styles
  floatingFormButton: {
    position: "absolute",
    bottom: 120,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  headerIconsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "absolute",
    right: 16,
    top: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(99,102,241,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceButtonWhite: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },

  manualFormSection: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 16,
  },
  formField: {
    gap: 8,
  },
  aiToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFDF6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  aiToggleButtonActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  aiToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  aiToggleTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  amountInputField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
    marginRight: 6,
  },
  amountFieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  categoryScroll: {
    flexGrow: 0,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  addToNoteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  addToNoteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
    textAlign: "center",
  },
  modalContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  timeModalContainer: { justifyContent: 'center', alignItems: 'center' },
  timeModalContent: { width: '95%', maxWidth: 520 },
  timeModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center' },
  timeModalSection: { paddingVertical: 8 },
  // hourList styles removed; using native DateTimePicker instead
  timeModalPickerMargin: { marginTop: 8 },
  timePickerButtonSmall: { marginTop: 8 },
  timePickerLabelMargin: { marginLeft: 8 },
  timeModalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  inlinePickerContainer: { marginHorizontal: 16, marginBottom: 12 },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  submitButtonTemplateActive: {
    backgroundColor: "#DFF7EA",
    borderColor: "#C4F0DB",
  },
  submitButtonTextTemplateActive: {
    color: "#065F46",
  },
  descriptionInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
    minHeight: 100,
  },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
    minHeight: 80,
  },
  aiSuggestionsBox: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    overflow: "hidden",
    marginTop: 8,
  },
  aiSuggestionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245, 158, 11, 0.2)",
    backgroundColor: "#FFFDF6",
  },
  aiSuggestionsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F59E0B",
  },
  aiSuggestionsContent: {
    padding: 12,
    gap: 10,
  },
  templateTitle: { color: '#6366F1' },
  templateContent: { paddingVertical: 8 },
  templateScroll: { maxHeight: 140, marginBottom: 8 },
  templateCard: { marginRight: 12, minWidth: 160, width: 170, minHeight: 120, backgroundColor: "#FFFDF6" },
  suggestionItem: {
    gap: 4,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  suggestionValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#FFFDF6",
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestionTapText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F59E0B",
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  templateEmptyContainer: { paddingHorizontal: 12, paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
  templateEmptyText: { color: '#6B7280', fontSize: 13 },
  suggestionCard: { minWidth: 160, width: 170, minHeight: 120, backgroundColor: "#FFFDF6", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E7EB", alignItems: 'flex-start', justifyContent: 'space-between' },
  suggestionName: { fontSize: 13, fontWeight: "800", color: "#111827", marginBottom: 4, flexShrink: 1, flexWrap: 'wrap' },
  input: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 12, color: "#111827", fontSize: 16, borderWidth: 1, borderColor: "#E5E7EB" },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 48,
  },
  timePickerButtonActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  timePickerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    flex: 1,
  },
  timePickerButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Recording Indicator Styles
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#065F46",
  },
  recordingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#065F46",
  },

  // Transcript Preview Styles
  transcriptPreview: {
    backgroundColor: "#F0F4FF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5F5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  transcriptPreviewTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transcriptTitleMargin: {
    marginLeft: 8,
  },
  transcriptPreviewText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 10,
  },
  successBanner: {
    position: 'absolute',
    top: 70,
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#10B981',
    shadowColor: '#065F46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successBannerText: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '600',
  },
  successBannerContent: {
    marginLeft: 10,
  },
  successBannerTitle: {
    color: '#065F46',
    fontWeight: '800',
    fontSize: 14,
  },
  clearTranscriptButton: {
    alignSelf: "flex-end",
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  clearTranscriptButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E40AF",
  },
});
